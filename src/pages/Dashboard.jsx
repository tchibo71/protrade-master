import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { LEVELS, LEVEL_ORDER } from "@/lib/constants";
import { BookOpen, Search, TrendingUp, Award, Flame, AlertTriangle } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import SkillProficiency from "@/components/dashboard/SkillProficiency";

export default function Dashboard() {
  const [sessions, setSessions] = useState([]);
  const [progressRecords, setProgressRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.TrainingSession.list("-created_date", 200),
      base44.entities.UserProgress.list()
    ]).then(([s, p]) => {
      setSessions(s);
      setProgressRecords(p);
      setLoading(false);
    });
  }, []);

  const totalSessions = sessions.length;
  const avgScore = totalSessions > 0
    ? Math.round(sessions.reduce((a, b) => a + (b.score_total || 0), 0) / totalSessions)
    : 0;

  const streak = (() => {
    let count = 0;
    for (const s of [...sessions].sort((a, b) => new Date(b.created_date) - new Date(a.created_date))) {
      if ((s.score_total || 0) >= 80) count++;
      else break;
    }
    return count;
  })();

  const unlockedLevel = (() => {
    let highest = "Novice";
    for (const p of progressRecords) {
      if (p.unlocked && LEVEL_ORDER[p.level] >= LEVEL_ORDER[highest]) {
        highest = p.level;
      }
    }
    return highest;
  })();

  const categoryAvgs = [
    { category: "Safety", score: avg(sessions, "score_safety") },
    { category: "Code", score: avg(sessions, "score_code") },
    { category: "Workmanship", score: avg(sessions, "score_workmanship") },
    { category: "Completeness", score: avg(sessions, "score_completeness") },
    { category: "Judgment", score: avg(sessions, "score_judgment") },
  ];

  const weakAreas = categoryAvgs.filter(c => c.score > 0 && c.score < 14);
  const recentSessions = sessions.slice(0, 5);

  function avg(arr, key) {
    const valid = arr.filter(s => s[key] != null);
    if (!valid.length) return 0;
    return Math.round(valid.reduce((a, b) => a + (b[key] || 0), 0) / valid.length);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Tennessee Jurisdiction · Greene County HQ</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={<BookOpen className="w-5 h-5 text-blue-400" />} label="Total Sessions" value={totalSessions} />
        <StatCard icon={<TrendingUp className="w-5 h-5 text-green-400" />} label="Avg Score" value={avgScore ? `${avgScore}/100` : "—"} />
        <StatCard icon={<Flame className="w-5 h-5 text-orange-400" />} label="Current Streak" value={`${streak} 80+`} />
        <StatCard icon={<Award className="w-5 h-5 text-yellow-400" />} label="Current Level" value={unlockedLevel} small />
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link to="/training" className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 rounded-xl p-5 flex items-center gap-4 transition-colors group">
          <BookOpen className="w-8 h-8 shrink-0" />
          <div>
            <div className="font-bold text-lg">Start Training</div>
            <div className="text-sm opacity-70">Generate a new scenario</div>
          </div>
        </Link>
        <Link to="/code-lookup" className="bg-gray-800 hover:bg-gray-700 text-white rounded-xl p-5 flex items-center gap-4 transition-colors border border-gray-700">
          <Search className="w-8 h-8 shrink-0 text-blue-400" />
          <div>
            <div className="font-bold text-lg">Code Lookup</div>
            <div className="text-sm text-gray-400">Search codes, regs, statutes</div>
          </div>
        </Link>
      </div>

      <SkillProficiency sessions={sessions} />

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Radar Chart */}
        {totalSessions > 0 && (
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <h2 className="font-semibold text-white mb-4">Category Breakdown (avg /20)</h2>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={categoryAvgs}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="category" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                <Radar dataKey="score" stroke="#facc15" fill="#facc15" fillOpacity={0.2} />
                <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", color: "#fff" }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Weak Areas */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-3">
          <h2 className="font-semibold text-white">Focus Areas</h2>
          {weakAreas.length === 0 && totalSessions === 0 && (
            <p className="text-gray-500 text-sm">Complete scenarios to see your weak areas.</p>
          )}
          {weakAreas.length === 0 && totalSessions > 0 && (
            <p className="text-green-400 text-sm">No weak areas — all categories above 70%.</p>
          )}
          {weakAreas.map(a => (
            <div key={a.category} className="flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{a.category}</div>
                <div className="w-full bg-gray-800 rounded-full h-1.5 mt-1">
                  <div className="bg-red-400 h-1.5 rounded-full" style={{ width: `${(a.score / 20) * 100}%` }} />
                </div>
              </div>
              <span className="text-xs text-gray-400">{a.score}/20</span>
            </div>
          ))}

          {/* Recent sessions */}
          {recentSessions.length > 0 && (
            <>
              <h2 className="font-semibold text-white pt-2">Recent Sessions</h2>
              {recentSessions.map(s => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-300 truncate max-w-[60%]">{s.level} · {s.trade || (s.trades || []).join(", ")}</span>
                  <span className={`font-bold ${(s.score_total || 0) >= 80 ? "text-green-400" : (s.score_total || 0) >= 60 ? "text-yellow-400" : "text-red-400"}`}>
                    {s.score_total ?? "—"}/100
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, small }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-2">
      {icon}
      <div className={`font-bold text-white ${small ? "text-base" : "text-2xl"}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}