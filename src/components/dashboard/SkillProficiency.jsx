import { TRADES } from "@/lib/constants";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const CATEGORIES = [
  { key: "score_safety", label: "Safety" },
  { key: "score_code", label: "Code" },
  { key: "score_workmanship", label: "Workmanship" },
  { key: "score_completeness", label: "Completeness" },
  { key: "score_judgment", label: "Judgment" },
];

function ProficiencyBar({ label, score, max = 20, trend }) {
  const pct = Math.round((score / max) * 100);
  const color = pct >= 80 ? "bg-green-400" : pct >= 60 ? "bg-yellow-400" : "bg-red-400";
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? "text-green-400" : trend < 0 ? "text-red-400" : "text-gray-500";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-300">{label}</span>
        <div className="flex items-center gap-1">
          <TrendIcon className={`w-3 h-3 ${trendColor}`} />
          <span className="text-gray-400">{pct}%</span>
        </div>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function SkillProficiency({ sessions }) {
  if (!sessions || sessions.length === 0) return null;

  // Split sessions into first half and second half to calculate trend
  const mid = Math.floor(sessions.length / 2);
  const earlier = sessions.slice(0, mid);
  const recent = sessions.slice(mid);

  function avgCat(arr, key) {
    const valid = arr.filter(s => s[key] != null);
    if (!valid.length) return 0;
    return valid.reduce((a, b) => a + (b[key] || 0), 0) / valid.length;
  }

  // Per-category proficiency
  const catProficiency = CATEGORIES.map(({ key, label }) => {
    const avg = avgCat(sessions, key);
    const earlierAvg = avgCat(earlier, key);
    const recentAvg = avgCat(recent, key);
    const trend = recent.length > 0 ? recentAvg - earlierAvg : 0;
    return { label, avg, trend };
  });

  // Per-trade proficiency (top 5 by session count)
  const tradeProficiency = TRADES.map(trade => {
    const tradeSessions = sessions.filter(s => (s.trades || [s.trade]).includes(trade));
    if (tradeSessions.length === 0) return null;
    const avg = tradeSessions.reduce((a, b) => a + (b.score_total || 0), 0) / tradeSessions.length;
    const earlier = tradeSessions.slice(0, Math.floor(tradeSessions.length / 2));
    const recent = tradeSessions.slice(Math.floor(tradeSessions.length / 2));
    const trend = recent.length > 0 && earlier.length > 0
      ? (recent.reduce((a, b) => a + (b.score_total || 0), 0) / recent.length) -
        (earlier.reduce((a, b) => a + (b.score_total || 0), 0) / earlier.length)
      : 0;
    return { trade, avg, count: tradeSessions.length, trend };
  }).filter(Boolean).sort((a, b) => b.count - a.count).slice(0, 5);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-5">
      <h2 className="font-semibold text-white">Skill Proficiency Analysis</h2>

      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">By Category</p>
        <div className="space-y-3">
          {catProficiency.map(({ label, avg, trend }) => (
            <ProficiencyBar key={label} label={label} score={avg} trend={trend} />
          ))}
        </div>
      </div>

      {tradeProficiency.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">By Trade (avg /100)</p>
          <div className="space-y-2">
            {tradeProficiency.map(({ trade, avg, count, trend }) => {
              const pct = Math.round(avg);
              const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
              const trendColor = trend > 0 ? "text-green-400" : trend < 0 ? "text-red-400" : "text-gray-500";
              const scoreColor = pct >= 80 ? "text-green-400" : pct >= 60 ? "text-yellow-400" : "text-red-400";
              return (
                <div key={trade} className="flex items-center gap-3">
                  <span className="text-xs text-gray-300 flex-1 truncate">{trade}</span>
                  <span className="text-xs text-gray-600">{count} sessions</span>
                  <TrendIcon className={`w-3 h-3 ${trendColor}`} />
                  <span className={`text-xs font-bold ${scoreColor} w-10 text-right`}>{pct}/100</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-600 italic">Trend arrows compare earlier vs. recent sessions.</p>
    </div>
  );
}