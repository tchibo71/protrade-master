import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { buildLibraryContext } from "@/lib/useKnowledgeBase";
import ReactMarkdown from "react-markdown";
import { Loader2, Wrench, RotateCcw, AlertTriangle, ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";

const FIELD_PROBLEM_PROMPT = (trade, problem) => `You are a master contractor and expert in Tennessee building codes, regulations, and best practices. A contractor in the field has a REAL problem they need solved RIGHT NOW.

## JURISDICTION
Tennessee. Greene County headquarters. Bristol to Chattanooga corridor. All applicable codes: TCA, TDEC, TOSHA, NEC, IRC, IPC, IMC, IFGC, IECC, OSHA, and all relevant standards.

## TRADE / SPECIALTY
${trade || "General Contracting"}

## THE FIELD PROBLEM
${problem}

If an image is provided, diagnose primarily from what is visible in the image, using the text description (if any) as supporting context rather than the primary source.

## YOUR TASK
Diagnose this problem and provide a complete, actionable field fix. Be direct and practical — this contractor needs to solve this TODAY.

---

## FIELD DIAGNOSIS & FIX

### ROOT CAUSE
[Identify the most likely root cause(s). Be specific.]

### IMMEDIATE ACTION STEPS
[Numbered, step-by-step fix in correct sequence. Include what tools/materials are needed. Be specific enough that a journeyman can execute it immediately.]

### CODE & REGULATORY REQUIREMENTS
[Every applicable code section, statute, or regulation that governs this situation. Cite specifically: NEC article, IRC section, TCA title/chapter, TDEC rule number, etc.]

### SAFETY WARNINGS
[Any OSHA, TOSHA, or trade-specific safety requirements. What could go wrong if done incorrectly.]

### WHAT NOT TO DO
[Common mistakes or shortcuts that will fail inspection or create liability.]

### WHEN TO CALL FOR BACKUP
[Conditions under which the contractor should stop and consult a specialist, engineer, or inspector.]

### PRO TIPS
[1–3 field-tested tips specific to this type of problem in Tennessee conditions.]`;

export default function FieldProblemAnalyzer({ libraryEntries, onBack }) {
  const [trade, setTrade] = useState("");
  const [problem, setProblem] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [problemImage, setProblemImage] = useState(null); // base64 data URL

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProblemImage(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleAnalyze = async () => {
    if (!problem.trim() && !problemImage) return;
    setLoading(true);
    setResult("");

    const libraryContext = buildLibraryContext(libraryEntries, trade ? [trade] : []);
    const problemText = problem.trim() || "(No text description provided — diagnose from the attached image.)";
    const prompt = `${libraryContext}${FIELD_PROBLEM_PROMPT(trade, problemText)}`;

    const res = await base44.integrations.Core.InvokeLLM({
      prompt,
      model: "claude_sonnet_4_6",
      file_urls: problemImage ? [problemImage] : undefined,
    });
    setResult(res);
    setLoading(false);
  };

  const reset = () => {
    setProblem("");
    setResult("");
    setTrade("");
    setProblemImage(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-orange-500/20 border border-orange-500/40 rounded-xl p-2">
          <Wrench className="w-6 h-6 text-orange-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Field Problem Analyzer</h1>
          <p className="text-gray-400 text-sm">Describe your real job problem — get an immediate diagnosis and fix.</p>
        </div>
      </div>

      {!result && (
        <div className="bg-gray-900 border border-orange-500/30 rounded-xl p-5 space-y-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
            <p className="text-xs text-orange-300">This tool gives you an immediate AI-powered field fix. Be as specific as possible about the problem, conditions, and what you've already tried.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Trade / Specialty (optional)</label>
            <input
              type="text"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-orange-400"
              placeholder="e.g. Septic Systems, Electrical, Plumbing, Drainage..."
              value={trade}
              onChange={e => setTrade(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Describe Your Problem {problemImage && <span className="text-gray-500 font-normal">(optional with photo)</span>}
            </label>

            {problemImage && (
              <div className="relative inline-block mb-3">
                <img src={problemImage} alt="Problem preview" className="max-h-40 rounded-lg border border-gray-700" />
                <button
                  onClick={() => setProblemImage(null)}
                  className="absolute -top-2 -right-2 bg-gray-800 border border-gray-600 rounded-full p-1 text-gray-300 hover:text-red-400 hover:border-red-500 transition-colors"
                  aria-label="Remove image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <textarea
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm resize-none focus:outline-none focus:border-orange-400 min-h-[160px]"
              placeholder={problemImage
                ? "Optional: add any details not visible in the photo (when it started, what's already been tried, etc.)"
                : "Be specific: What is happening? What did you find? What have you already tried? What are the site conditions (soil type, slope, age of system, etc.)? What's the customer complaint?"}
              value={problem}
              onChange={e => setProblem(e.target.value)}
            />

            {!problemImage && (
              <label className="flex items-center gap-2 w-fit cursor-pointer mt-2 px-3 py-2 rounded-lg text-sm font-medium border border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-orange-500/50 transition-colors">
                <ImagePlus className="w-4 h-4" />
                Attach a Photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
              </label>
            )}
          </div>

          <button
            onClick={handleAnalyze}
            disabled={(!problem.trim() && !problemImage) || loading}
            className={cn(
              "w-full py-3 rounded-xl font-bold text-base transition-colors flex items-center justify-center gap-2",
              (problem.trim() || problemImage) && !loading
                ? "bg-orange-500 hover:bg-orange-400 text-white"
                : "bg-gray-800 text-gray-600 cursor-not-allowed"
            )}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wrench className="w-5 h-5" />}
            {loading ? "Analyzing..." : "Analyze & Get Fix"}
          </button>
        </div>
      )}

      {loading && !result && (
        <div className="bg-gray-900 border border-orange-500/30 rounded-xl p-6 flex items-center gap-4">
          <Loader2 className="w-6 h-6 text-orange-400 animate-spin shrink-0" />
          <div>
            <p className="text-white font-medium">Diagnosing the problem...</p>
            <p className="text-gray-400 text-sm">Checking codes, regulations, and best practices for Tennessee...</p>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-orange-500/40 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-800">
              <Wrench className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-semibold text-orange-300">Field Diagnosis & Fix</span>
              {trade && <span className="text-xs text-gray-500">· {trade}</span>}
            </div>
            <div className="prose prose-invert prose-sm max-w-none text-gray-200">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={reset}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> New Problem
            </button>
            <button
              onClick={onBack}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border border-gray-700"
            >
              Back to Training
            </button>
          </div>
        </div>
      )}
    </div>
  );
}