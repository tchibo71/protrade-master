import ReactMarkdown from "react-markdown";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

function AnalysisProgressBar({ active }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!active) { setProgress(0); return; }
    setProgress(0);
    // Simulate progress: ramp quickly to ~70%, then slow crawl toward 95%
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev < 70) return prev + 2.5;
        if (prev < 92) return prev + 0.3;
        return prev;
      });
    }, 400);
    return () => clearInterval(interval);
  }, [active]);

  if (!active) return null;

  const stages = [
    { label: "Reading answer", threshold: 15 },
    { label: "Checking codes & statutes", threshold: 35 },
    { label: "Scoring categories", threshold: 60 },
    { label: "Writing feedback", threshold: 80 },
    { label: "Finalizing evaluation", threshold: 92 },
  ];
  const currentStage = [...stages].reverse().find(s => progress >= s.threshold) || stages[0];

  return (
    <div className="bg-gray-900 border border-yellow-400/30 rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-yellow-400 font-semibold flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Analyzing your answer...
        </span>
        <span className="text-gray-400 text-xs">{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
        <div
          className="h-2.5 rounded-full bg-yellow-400 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 italic">{currentStage.label}...</p>
    </div>
  );
}

const RUBRIC_LABELS = {
  safety: "Safety",
  code: "Code Compliance",
  workmanship: "Workmanship",
  completeness: "Completeness",
  judgment: "Professional Judgment",
};

export default function ScenarioView({ scenario, loading, userAnswer, setUserAnswer, onSubmit, onNewScenario, step, submitting, rubricScope, emphasisNote }) {
  const answerSubmitted = step === "evaluation" || step === "ideal";
  const showProgressBar = submitting;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Scenario</h2>
        <button
          onClick={onNewScenario}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> New Scenario
        </button>
      </div>

      {/* Scenario Text */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        {loading ? (
          <div className="flex items-center gap-3 text-gray-400 py-8 justify-center">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Generating scenario...</span>
          </div>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none text-gray-200">
            <ReactMarkdown>{scenario}</ReactMarkdown>
          </div>
        )}
      </div>

      {/* Performance-informed emphasis note */}
      {!loading && emphasisNote && (
        <p className="text-xs text-yellow-400/80 italic flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> {emphasisNote}
        </p>
      )}

      {/* Rubric Scope Badges */}
      {!loading && rubricScope && rubricScope.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-400">Graded on:</span>
          {rubricScope.map(cat => (
            <span key={cat} className="px-2 py-0.5 rounded-full bg-yellow-400/15 border border-yellow-400/30 text-yellow-400 text-xs font-medium">
              {RUBRIC_LABELS[cat] || cat}
            </span>
          ))}
        </div>
      )}

      {/* Answer Box */}
      {!loading && (
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Your Answer</label>
          <textarea
            className={cn(
              "w-full bg-gray-900 border rounded-xl p-4 text-white text-sm resize-none focus:outline-none min-h-[200px]",
              answerSubmitted
                ? "border-gray-700 opacity-70 cursor-not-allowed"
                : "border-gray-700 focus:border-yellow-400"
            )}
            placeholder="Write your complete answer here. Address all aspects of the scenario..."
            value={userAnswer}
            onChange={e => !answerSubmitted && setUserAnswer(e.target.value)}
            readOnly={answerSubmitted}
          />

          <AnalysisProgressBar active={showProgressBar} />

          {!answerSubmitted && (
            <button
              onClick={onSubmit}
              disabled={!userAnswer.trim() || submitting}
              className={cn(
                "mt-3 w-full py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2",
                userAnswer.trim() && !submitting
                  ? "bg-yellow-400 hover:bg-yellow-300 text-gray-900"
                  : "bg-gray-800 text-gray-600 cursor-not-allowed"
              )}
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Evaluating...</>
              ) : "Submit for Evaluation"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}