import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import { ChevronLeft, ChevronRight, RotateCcw, Eye, EyeOff, Filter, Award } from "lucide-react";
import { LEVELS, TRADES } from "@/lib/constants";

function ScoreBadge({ score }) {
  const color = score >= 80 ? "text-green-400" : score >= 60 ? "text-yellow-400" : "text-red-400";
  return <span className={`font-bold text-sm ${color}`}>{score}/100</span>;
}

export default function ReviewMode() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showEval, setShowEval] = useState(false);
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterTrade, setFilterTrade] = useState("all");
  const [filterScore, setFilterScore] = useState("all");

  useEffect(() => {
    base44.entities.TrainingSession.list("-created_date", 500).then(s => {
      setSessions(s);
      setLoading(false);
    });
  }, []);

  const filtered = sessions.filter(s => {
    const tradeStr = (s.trades || [s.trade] || []).join(", ");
    const matchLevel = filterLevel === "all" || s.level === filterLevel;
    const matchTrade = filterTrade === "all" || tradeStr.includes(filterTrade);
    const matchScore =
      filterScore === "all" ? true :
      filterScore === "high" ? (s.score_total || 0) >= 80 :
      filterScore === "mid" ? (s.score_total || 0) >= 60 && (s.score_total || 0) < 80 :
      (s.score_total || 0) < 60;
    return matchLevel && matchTrade && matchScore;
  });

  const current = filtered[index];

  const goNext = () => {
    setIndex(i => Math.min(i + 1, filtered.length - 1));
    setShowAnswer(false);
    setShowEval(false);
  };

  const goPrev = () => {
    setIndex(i => Math.max(i - 1, 0));
    setShowAnswer(false);
    setShowEval(false);
  };

  const resetFilters = () => {
    setFilterLevel("all");
    setFilterTrade("all");
    setFilterScore("all");
    setIndex(0);
    setShowAnswer(false);
    setShowEval(false);
  };

  // Reset index when filters change
  useEffect(() => { setIndex(0); setShowAnswer(false); setShowEval(false); }, [filterLevel, filterTrade, filterScore]);

  if (loading) return <div className="p-6 text-gray-400">Loading sessions...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Review Mode</h1>
        <p className="text-gray-400 text-sm mt-1">Revisit past scenarios and self-test your recall</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-gray-500" />
        <select
          value={filterLevel}
          onChange={e => setFilterLevel(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none"
        >
          <option value="all">All Levels</option>
          {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select
          value={filterTrade}
          onChange={e => setFilterTrade(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none"
        >
          <option value="all">All Trades</option>
          {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={filterScore}
          onChange={e => setFilterScore(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none"
        >
          <option value="all">All Scores</option>
          <option value="high">High (80+)</option>
          <option value="mid">Mid (60–79)</option>
          <option value="low">Low (&lt;60)</option>
        </select>
        <button onClick={resetFilters} className="flex items-center gap-1 text-xs text-gray-500 hover:text-white px-2 py-1.5 rounded transition-colors">
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
        <span className="ml-auto text-xs text-gray-500">{filtered.length} sessions</span>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center text-gray-500">
          No sessions match these filters.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Card Header */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded">{current.level}</span>
                <span className="text-xs text-gray-400">{(current.trades || [current.trade]).filter(Boolean).join(", ")}</span>
                <span className="text-xs text-gray-600">{current.session_date}</span>
              </div>
              <div className="flex items-center gap-2">
                {current.score_total != null && (
                  <div className="flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-yellow-400" />
                    <ScoreBadge score={current.score_total} />
                  </div>
                )}
                <span className="text-xs text-gray-600">{index + 1} / {filtered.length}</span>
              </div>
            </div>

            {/* Scenario */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Scenario</p>
              <div className="prose prose-invert prose-sm max-w-none text-gray-200">
                <ReactMarkdown>{current.scenario_text}</ReactMarkdown>
              </div>
            </div>

            {/* Reveal Your Answer */}
            <button
              onClick={() => setShowAnswer(a => !a)}
              className="flex items-center gap-2 text-sm text-yellow-400 hover:text-yellow-300 transition-colors"
            >
              {showAnswer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showAnswer ? "Hide Your Answer" : "Reveal Your Answer"}
            </button>

            {showAnswer && (
              <div className="border-t border-gray-800 pt-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Your Past Answer</p>
                <p className="text-gray-200 text-sm whitespace-pre-wrap leading-relaxed">{current.user_answer}</p>
              </div>
            )}

            {/* Reveal Evaluation */}
            {showAnswer && (
              <button
                onClick={() => setShowEval(e => !e)}
                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                {showEval ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showEval ? "Hide Evaluation" : "Reveal AI Evaluation"}
              </button>
            )}

            {showEval && (
              <div className="border-t border-gray-800 pt-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">AI Evaluation</p>
                <div className="prose prose-invert prose-sm max-w-none text-gray-200">
                  <ReactMarkdown>{current.evaluation_text}</ReactMarkdown>
                </div>
                {current.ideal_answer_text && (
                  <div className="mt-4 border-t border-blue-900/40 pt-4">
                    <p className="text-xs text-blue-400 uppercase tracking-wide mb-2">Ideal Answer</p>
                    <div className="prose prose-invert prose-sm max-w-none text-gray-200">
                      <ReactMarkdown>{current.ideal_answer_text}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={goPrev}
              disabled={index === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button
              onClick={goNext}
              disabled={index === filtered.length - 1}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}