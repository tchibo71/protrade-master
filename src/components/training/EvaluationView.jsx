import ReactMarkdown from "react-markdown";
import { Loader2, Eye, RotateCcw, RefreshCw } from "lucide-react";

export default function EvaluationView({ evaluation, idealAnswer, loadingIdeal, onShowIdeal, onTryAgain, onNewScenario, step }) {
  return (
    <div className="space-y-6 mt-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-lg font-bold text-white mb-4">Evaluation</h2>
        <div className="prose prose-invert prose-sm max-w-none text-gray-200">
          <ReactMarkdown>{evaluation}</ReactMarkdown>
        </div>
      </div>

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
      </div>

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