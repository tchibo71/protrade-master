import ReactMarkdown from "react-markdown";
import { Loader2, Eye, RotateCcw, RefreshCw, Printer } from "lucide-react";
import ChallengeEvaluationPanel from "@/components/training/ChallengeEvaluationPanel";
import FollowupComplicationPanel from "@/components/training/FollowupComplicationPanel";

const handlePrint = (scenario, userAnswer, evaluation, idealAnswer) => {
  const win = window.open("", "_blank");
  win.document.write(`
    <html>
      <head>
        <title>Evaluation Report</title>
        <style>
          body { font-family: sans-serif; max-width: 800px; margin: 40px auto; color: #111; line-height: 1.6; }
          h1 { font-size: 1.4rem; border-bottom: 2px solid #ccc; padding-bottom: 8px; }
          h2 { font-size: 1.1rem; margin-top: 32px; color: #333; }
          pre { background: #f4f4f4; padding: 12px; border-radius: 6px; white-space: pre-wrap; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ccc; padding: 6px 12px; text-align: left; }
          th { background: #f0f0f0; }
        </style>
      </head>
      <body>
        <h1>Evaluation Report</h1>
        <h2>Original Scenario</h2>
        <pre>${scenario || ""}</pre>
        <h2>Your Answer</h2>
        <pre>${userAnswer || ""}</pre>
        <h2>Evaluation</h2>
        <pre>${evaluation || ""}</pre>
        ${idealAnswer ? `<h2>Ideal Answer</h2><pre>${idealAnswer}</pre>` : ""}
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
};

export default function EvaluationView({ evaluation, idealAnswer, loadingIdeal, onShowIdeal, onTryAgain, onNewScenario, step, scenario, params, userAnswer, libraryEntries, followupComplication, sessionId, omittedFact, redHerring }) {
  return (
    <div className="space-y-6 mt-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-lg font-bold text-white mb-4">Evaluation</h2>
        <div className="prose prose-invert prose-sm max-w-none text-gray-200">
          <ReactMarkdown>{evaluation}</ReactMarkdown>
        </div>
      </div>

      {/* Scenario Design Notes (revealed after scoring) */}
      {(omittedFact || redHerring) && (
        <details className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
          <summary className="cursor-pointer text-sm font-semibold text-gray-400 hover:text-white select-none">
            Scenario Design Notes
          </summary>
          <div className="mt-3 space-y-2 text-sm text-gray-300">
            {omittedFact && (
              <p><span className="text-gray-500 font-medium">Omitted fact:</span> {omittedFact}</p>
            )}
            {redHerring && (
              <p><span className="text-gray-500 font-medium">Red herring:</span> {redHerring}</p>
            )}
          </div>
        </details>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {step !== "ideal" && (
          <button
            onClick={onShowIdeal}
            disabled={loadingIdeal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {loadingIdeal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
            Show Ideal Answer
          </button>
        )}
        <button
          onClick={onTryAgain}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border border-gray-700"
        >
          <RotateCcw className="w-4 h-4" /> Try Again
        </button>
        <button
          onClick={onNewScenario}
          className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> New Scenario
        </button>
        <button
          onClick={() => handlePrint(scenario, userAnswer, evaluation, idealAnswer)}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border border-gray-700"
        >
          <Printer className="w-4 h-4" /> Print
        </button>
      </div>

      {/* Follow-up Complication */}
      {followupComplication && (
        <FollowupComplicationPanel
          complication={followupComplication}
          scenario={scenario}
          params={params}
          userAnswer={userAnswer}
          evaluation={evaluation}
          libraryEntries={libraryEntries}
          sessionId={sessionId}
        />
      )}

      {/* Challenge Panel */}
      <ChallengeEvaluationPanel
        scenario={scenario}
        params={params}
        userAnswer={userAnswer}
        evaluation={evaluation}
        libraryEntries={libraryEntries}
      />

      {/* Ideal Answer */}
      {(loadingIdeal || idealAnswer) && (
        <div className="bg-gray-900 border border-blue-800 rounded-xl p-5">
          <h2 className="text-lg font-bold text-blue-300 mb-4">Ideal Answer</h2>
          {loadingIdeal && !idealAnswer ? (
            <div className="flex items-center gap-3 text-gray-400 py-4">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Generating ideal answer...</span>
            </div>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none text-gray-200">
              <ReactMarkdown>{idealAnswer}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}