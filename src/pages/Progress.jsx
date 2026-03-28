import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { LEVELS, TRADES } from "@/lib/constants";
import { Trash2, RefreshCw, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function Progress() {
  const [sessions, setSessions] = useState([]);
  const [progressRecords, setProgressRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedReset, setExpandedReset] = useState(false);
  const [confirmReset, setConfirmReset] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [s, p] = await Promise.all([
      base44.entities.TrainingSession.list("-created_date", 500),
      base44.entities.UserProgress.list()
    ]);
    setSessions(s);
    setProgressRecords(p);
    setLoading(false);
  };

  // Per-trade stats
  const tradeStats = TRADES.map(trade => {
    const tradeSessions = sessions.filter(s => s.trade === trade || (s.trades || []).includes(trade));
    const avg = tradeSessions.length > 0
      ? Math.round(tradeSessions.reduce((a, b) => a + (b.score_total || 0), 0) / tradeSessions.length)
      : null;
    return { trade, count: tradeSessions.length, avg };
  }).filter(t => t.count > 0);

  // Per-level stats
  const levelStats = LEVELS.map(level => {
    const lvlSessions = sessions.filter(s => s.level === level);
    const avg = lvlSessions.length > 0
      ? Math.round(lvlSessions.reduce((a, b) => a + (b.score_total || 0), 0) / lvlSessions.length)
      : null;
    const record = progressRecords.find(p => p.level === level);
    return { level, count: lvlSessions.length, avg, consec: record?.consecutive_80_plus || 0, unlocked: record?.unlocked || level === "Novice" };
  });

  // Category averages
  const catAvgs = [
    { name: "Safety", value: avg(sessions, "score_safety"), max: 20 },
    { name: "Code", value: avg(sessions, "score_code"), max: 20 },
    { name: "Workmanship", value: avg(sessions, "score_workmanship"), max: 20 },
    { name: "Completeness", value: avg(sessions, "score_completeness"), max: 20 },
    { name: "Judgment", value: avg(sessions, "score_judgment"), max: 20 },
  ];

  function avg(arr, key) {
    const valid = arr.filter(s => s[key] != null);
    if (!valid.length) return 0;
    return Math.round(valid.reduce((a, b) => a + (b[key] || 0), 0) / valid.length);
  }

  // Reset handlers
  const doReset = async (type, target) => {
    setConfirmReset(null);
    if (type === "all_scores_history") {
      const ids = sessions.map(s => s.id);
      for (const id of ids) await base44.entities.TrainingSession.delete(id);
    } else if (type === "all_unlocks") {
      for (const r of progressRecords) {
        await base44.entities.UserProgress.update(r.id, { consecutive_80_plus: 0, total_scenarios_at_level: 0, avg_score_at_level: 0, unlocked: r.level === "Novice" });
      }
    } else if (type === "all") {
      const ids = sessions.map(s => s.id);
      for (const id of ids) await base44.entities.TrainingSession.delete(id);
      for (const r of progressRecords) {
        await base44.entities.UserProgress.update(r.id, { consecutive_80_plus: 0, total_scenarios_at_level: 0, avg_score_at_level: 0, unlocked: r.level === "Novice" });
      }
    } else if (type === "level_scores" && target) {
      const toDelete = sessions.filter(s => s.level === target);
      for (const s of toDelete) await base44.entities.TrainingSession.delete(s.id);
    } else if (type === "level_unlock" && target) {
      const record = progressRecords.find(p => p.level === target);
      if (record) {
        await base44.entities.UserProgress.update(record.id, { consecutive_80_plus: 0, unlocked: target === "Novice" });
      }
    } else if (type === "trade_scores" && target) {
      const toDelete = sessions.filter(s => s.trade === target || (s.trades || []).includes(target));
      for (const s of toDelete) await base44.entities.TrainingSession.delete(s.id);
    }
    await fetchAll();
  };

  const ResetButton = ({ type, target, label, danger }) => (
    confirmReset?.type === type && confirmReset?.target === target ? (
      <div className="flex items-center gap-2">
        <span className="text-xs text-red-400">Confirm?</span>
        <button onClick={() => doReset(type, target)} className="text-xs bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded">Yes, reset</button>
        <button onClick={() => setConfirmReset(null)} className="text-xs text-gray-400 hover:text-white px-2 py-1">Cancel</button>
      </div>
    ) : (
      <button
        onClick={() => setConfirmReset({ type, target })}
        className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${danger ? "bg-red-900/40 hover:bg-red-900/70 text-red-300" : "bg-gray-800 hover:bg-gray-700 text-gray-400"}`}
      >
        <Trash2 className="w-3 h-3" /> {label}
      </button>
    )
  );

  if (loading) {
    return <div className="p-6 text-gray-400">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Progress & Settings</h1>
        <p className="text-gray-400 text-sm mt-1">{sessions.length} total sessions recorded</p>
      </div>

      {/* Category Bar Chart */}
      {sessions.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-semibold text-white mb-4">Average Scores by Category (out of 20)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={catAvgs} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 12 }} />
              <YAxis domain={[0, 20]} tick={{ fill: "#9ca3af", fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", color: "#fff" }} />
              <Bar dataKey="value" fill="#facc15" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Level Progress */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="font-semibold text-white mb-4">Level Progress</h2>
        <div className="space-y-3">
          {levelStats.map(({ level, count, avg, consec, unlocked }) => (
            <div key={level} className="flex items-center gap-4 flex-wrap">
              <div className="w-36 text-sm text-gray-300">{level}</div>
              <div className={`text-xs px-2 py-0.5 rounded-full ${unlocked ? "bg-green-900/50 text-green-400" : "bg-gray-800 text-gray-500"}`}>
                {unlocked ? "Unlocked" : `${consec}/5 streak`}
              </div>
              <div className="text-xs text-gray-500">{count} sessions</div>
              {avg != null && count > 0 && <div className="text-xs font-bold text-yellow-400">Avg: {avg}/100</div>}
              <div className="ml-auto flex gap-2">
                <ResetButton type="level_scores" target={level} label="Reset scores" />
                {level !== "Novice" && <ResetButton type="level_unlock" target={level} label="Reset unlock" danger />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trade Stats */}
      {tradeStats.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-semibold text-white mb-4">Performance by Trade</h2>
          <div className="space-y-2">
            {tradeStats.map(({ trade, count, avg }) => (
              <div key={trade} className="flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-[140px] text-sm text-gray-300">{trade}</div>
                <div className="text-xs text-gray-500">{count} sessions</div>
                {avg != null && (
                  <div className={`text-xs font-bold ${avg >= 80 ? "text-green-400" : avg >= 60 ? "text-yellow-400" : "text-red-400"}`}>
                    Avg: {avg}/100
                  </div>
                )}
                <ResetButton type="trade_scores" target={trade} label="Reset" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Global Resets */}
      <div className="bg-gray-900 border border-red-900/40 rounded-xl p-5">
        <button
          className="flex items-center gap-2 text-sm font-semibold text-red-400 w-full"
          onClick={() => setExpandedReset(!expandedReset)}
        >
          <AlertTriangle className="w-4 h-4" />
          Global Reset Options
          {expandedReset ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
        </button>
        {expandedReset && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-300">
              <span>Reset all scores & session history</span>
              <ResetButton type="all_scores_history" label="Reset scores & history" danger />
            </div>
            <div className="flex items-center justify-between text-sm text-gray-300">
              <span>Reset all level unlocks (keep scores)</span>
              <ResetButton type="all_unlocks" label="Reset all unlocks" danger />
            </div>
            <div className="flex items-center justify-between text-sm text-gray-300">
              <span>Full reset — everything</span>
              <ResetButton type="all" label="Full reset" danger />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}