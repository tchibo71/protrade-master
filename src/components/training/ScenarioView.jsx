import ReactMarkdown from "react-markdown";
import { Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ScenarioView({ scenario, loading, userAnswer, setUserAnswer, onSubmit, onNewScenario, step, submitting }) {
  const answerSubmitted = step === "evaluation" || step === "ideal";

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