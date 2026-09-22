import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { EVALUATOR_PROMPT } from "@/lib/constants";
import { buildLibraryContext } from "@/lib/useKnowledgeBase";
import ReactMarkdown from "react-markdown";
import { MessageSquareWarning, Upload, Loader2, ChevronDown, ChevronUp, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const CHALLENGE_SYSTEM = (scenario, level, originalAnswer, originalEval) => `You are a master contractor trainer and evaluator in Tennessee. A trainee is CHALLENGING their evaluation. They believe the original score was unfair or incomplete, and they are providing additional explanation and/or supporting documentation.

Your job:
1. Read the original scenario, the trainee's original answer, and the original evaluation.
2. Read the trainee's challenge explanation and any uploaded supporting documents carefully.
3. Re-evaluate the trainee's answer WITH FULL CONSIDERATION of their challenge and any supporting evidence.
4. If the challenge reveals that the original evaluation missed something or was too harsh, adjust the scores accordingly and explain WHY.
5. If the challenge does not change your assessment, maintain the scores and explain clearly why the original evaluation stands.
6. Be fair, direct, and cite specific code sections or evidence.

## ORIGINAL SCENARIO
${scenario}

## TRAINEE LEVEL
${level}

## TRAINEE'S ORIGINAL ANSWER
${originalAnswer}

## ORIGINAL EVALUATION
${originalEval}

---

Now produce a REVISED EVALUATION using the exact same scoring table format as the original evaluation (Safety, Code Compliance, Quality of Workmanship, Completeness, Professional Judgment, TOTAL). Start with a "CHALLENGE RESPONSE" section explaining what changed and why (or why nothing changed), then provide the full revised scoring table and detailed feedback.`;

export default function ChallengeEvaluationPanel({ scenario, params, userAnswer, evaluation, libraryEntries, onRevisionComplete }) {
  const [open, setOpen] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]); // [{name, url}]
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [revisedEval, setRevisedEval] = useState("");

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const results = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      results.push({ name: file.name, url: file_url });
    }
    setUploadedFiles(prev => [...prev, ...results]);
    setUploading(false);
    e.target.value = "";
  };

  const removeFile = (idx) => setUploadedFiles(prev => prev.filter((_, i) => i !== idx));

  const handleChallenge = async () => {
    if (!explanation.trim() && uploadedFiles.length === 0) return;
    setLoading(true);
    setRevisedEval("");

    const fileUrls = uploadedFiles.map(f => f.url);

    const challengePrompt = `${CHALLENGE_SYSTEM(scenario, params?.level || "Unknown", userAnswer, evaluation)}

## TRAINEE'S CHALLENGE EXPLANATION
${explanation.trim() || "(No written explanation provided — see uploaded documents.)"}

${uploadedFiles.length > 0 ? `## SUPPORTING DOCUMENTS\nThe trainee has uploaded ${uploadedFiles.length} document(s) for you to review. They are attached to this request.` : ""}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: challengePrompt,
      model: "claude_sonnet_4_6",
      file_urls: fileUrls.length > 0 ? fileUrls : undefined,
    });

    setRevisedEval(result);
    setLoading(false);
    if (onRevisionComplete) onRevisionComplete(result);
  };

  return (
    <div className="bg-gray-900 border border-orange-700/50 rounded-xl overflow-hidden mt-4">
      {/* Header toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <MessageSquareWarning className="w-5 h-5 text-orange-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-white">Challenge This Evaluation</p>
            <p className="text-xs text-gray-400">Explain your reasoning or upload supporting docs for a revised score</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-gray-800">
          {/* Explanation */}
          <div className="pt-4">
            <label className="block text-sm font-semibold text-gray-300 mb-2">Your Challenge / Explanation</label>
            <textarea
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm resize-none focus:outline-none focus:border-orange-400 min-h-[120px]"
              placeholder="Explain why you believe the evaluation missed something, was too harsh, or why your approach was correct. Cite specific codes, methods, or reasoning..."
              value={explanation}
              onChange={e => setExplanation(e.target.value)}
              disabled={loading || !!revisedEval}
            />
          </div>

          {/* Upload */}
          {!revisedEval && (
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Supporting Documents (optional)</label>
              <label className={cn(
                "flex items-center gap-2 w-fit cursor-pointer px-3 py-2 rounded-lg text-sm font-medium border transition-colors",
                uploading ? "border-gray-700 text-gray-500 cursor-not-allowed" : "border-orange-600/50 text-orange-300 hover:bg-orange-900/20"
              )}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? "Uploading..." : "Upload Document"}
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.doc,.txt,.csv,.xlsx,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading || loading}
                />
              </label>
              <p className="text-xs text-gray-500 mt-1">PDF, Word, images, spreadsheets — old evaluations, code references, site photos, etc.</p>

              {uploadedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {uploadedFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300">
                      <FileText className="w-4 h-4 text-orange-400 shrink-0" />
                      <span className="flex-1 truncate">{f.name}</span>
                      <button onClick={() => removeFile(i)} className="text-gray-500 hover:text-red-400 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Submit */}
          {!revisedEval && (
            <button
              onClick={handleChallenge}
              disabled={loading || (!explanation.trim() && uploadedFiles.length === 0)}
              className={cn(
                "w-full py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2",
                (explanation.trim() || uploadedFiles.length > 0) && !loading
                  ? "bg-orange-500 hover:bg-orange-400 text-white"
                  : "bg-gray-800 text-gray-600 cursor-not-allowed"
              )}
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Re-evaluating...</> : "Submit Challenge & Get Revised Score"}
            </button>
          )}

          {/* Revised Evaluation Result */}
          {revisedEval && (
            <div className="bg-gray-800 border border-orange-500/40 rounded-xl p-5">
              <p className="text-xs text-orange-400 font-semibold uppercase tracking-wide mb-3">Revised Evaluation</p>
              <div className="prose prose-invert prose-sm max-w-none text-gray-200">
                <ReactMarkdown>{revisedEval}</ReactMarkdown>
              </div>
              <button
                onClick={() => { setRevisedEval(""); setExplanation(""); setUploadedFiles([]); }}
                className="mt-4 text-xs text-gray-500 hover:text-white transition-colors underline"
              >
                Submit another challenge
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}