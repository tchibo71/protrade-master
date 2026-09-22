import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { FOLLOWUP_EVALUATOR_PROMPT, FOLLOWUP_EVALUATOR_RESPONSE_SCHEMA } from "@/lib/constants";
import { buildLibraryContext } from "@/lib/useKnowledgeBase";
import ReactMarkdown from "react-markdown";
import { Loader2, MessageCircle, SkipForward, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const VERDICT_META = {
  handled_well: { label: "Handled Well", icon: CheckCircle2, color: "text-emerald-400", border: "border-emerald-500/40", bg: "bg-emerald-500/10" },
  partially_handled: { label: "Partially Handled", icon: AlertCircle, color: "text-amber-400", border: "border-amber-500/40", bg: "bg-amber-500/10" },
  missed_the_point: { label: "Missed the Point", icon: XCircle, color: "text-red-400", border: "border-red-500/40", bg: "bg-red-500/10" },
};

export default function FollowupComplicationPanel({ complication, scenario, params, userAnswer, evaluation, libraryEntries, sessionId }) {
  const [followupAnswer, setFollowupAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { verdict, feedback }
  const [skipped, setSkipped] = useState(false);

  const handleSubmit = async () => {
    if (!followupAnswer.trim() || submitting) return;
    setSubmitting(true);
    setResult(null);

    const libraryContext = buildLibraryContext(libraryEntries, params?.trades || []);
    const prompt = `${libraryContext}${FOLLOWUP_EVALUATOR_PROMPT}

## ORIGINAL SCENARIO
${scenario}

## TRAINEE LEVEL
${params?.level || "Unknown"}

## TRAINEE'S INITIAL ANSWER
${userAnswer}

## INITIAL EVALUATION
${evaluation}

## COMPLICATION RAISED
${complication}

## TRAINEE'S FOLLOW-UP RESPONSE
${followupAnswer}`;

    const res = await base44.integrations.Core.InvokeLLM({
      prompt,
      model: "claude_sonnet_4_6",
      response_json_schema: FOLLOWUP_EVALUATOR_RESPONSE_SCHEMA,
    });

    const verdict = res.followup_verdict;
    const feedback = res.followup_feedback || "";
    setResult({ verdict, feedback });
    setSubmitting(false);

    if (sessionId) {
      await base44.entities.TrainingSession.update(sessionId, {
        followup_answer: followupAnswer,
        followup_verdict: verdict,
        followup_feedback: feedback,
      });
    }
  };

  const handleSkip = () => {
    setSkipped(true);
    if (sessionId) {
      base44.entities.TrainingSession.update(sessionId, { followup_answer: "" }).catch(() => {});
    }
  };

  // Already responded or skipped — show outcome
  if (result) {
    const meta = VERDICT_META[result.verdict] || VERDICT_META.partially_handled;
    const Icon = meta.icon;
    return (
      <div className={cn("border rounded-xl p-5", meta.border, meta.bg)}>
        <div className="flex items-center gap-2 mb-3">
          <Icon className={cn("w-5 h-5", meta.color)} />
          <span className={cn("text-sm font-bold uppercase tracking-wide", meta.color)}>{meta.label}</span>
        </div>
        <div className="prose prose-invert prose-sm max-w-none text-gray-200">
          <ReactMarkdown>{result.feedback}</ReactMarkdown>
        </div>
      </div>
    );
  }

  if (skipped) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-sm text-gray-500">Follow-up complication skipped.</p>
      </div>
    );
  }

  // Show complication + response form
  return (
    <div className="bg-gray-900 border border-blue-700/50 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-blue-400 shrink-0" />
        <h3 className="text-sm font-bold text-blue-300 uppercase tracking-wide">One More Thing...</h3>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <p className="text-sm text-gray-200 leading-relaxed italic">"{complication}"</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">Your Response</label>
        <textarea
          className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm resize-none focus:outline-none focus:border-blue-400 min-h-[120px]"
          placeholder="How would you adapt your approach to address this pushback on site?"
          value={followupAnswer}
          onChange={e => setFollowupAnswer(e.target.value)}
          disabled={submitting}
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={submitting || !followupAnswer.trim()}
          className={cn(
            "flex-1 py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2",
            followupAnswer.trim() && !submitting
              ? "bg-blue-600 hover:bg-blue-500 text-white"
              : "bg-gray-800 text-gray-600 cursor-not-allowed"
          )}
        >
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Evaluating...</> : "Submit Response"}
        </button>
        <button
          onClick={handleSkip}
          disabled={submitting}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors"
        >
          <SkipForward className="w-4 h-4" /> Skip
        </button>
      </div>
    </div>
  );
}