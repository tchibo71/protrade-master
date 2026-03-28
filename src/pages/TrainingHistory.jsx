import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { LEVELS, TRADES } from "@/lib/constants";
import { ChevronRight, Search, Filter, Award, Calendar, Layers } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

function ScoreBadge({ score }) {
  const color =
    score >= 90 ? "text-green-400 bg-green-900/40" :
    score >= 80 ? "text-blue-400 bg-blue-900/40" :
    score >= 70 ? "text-yellow-400 bg-yellow-900/40" :
    score >= 60 ? "text-orange-400 bg-orange-900/40" :
    "text-red-400 bg-red-900/40";
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>{score}/100</span>
  );
}

export default function TrainingHistory() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterTrade, setFilterTrade] = useState("all");

  useEffect(() => {
    base44.entities.TrainingSession.list("-created_date", 500).then(s => {
      setSessions(s);
      setLoading(false);
    });
  }, []);

  const filtered = sessions.filter(s => {
    const tradeStr = (s.trades || [s.trade] || []).join(", ").toLowerCase();
    const matchSearch = !search || s.scenario_text?.toLowerCase().includes(search.toLowerCase()) || tradeStr.includes(search.toLowerCase());
    const matchLevel = filterLevel === "all" || s.level === filterLevel;
    const matchTrade = filterTrade === "all" || tradeStr.includes(filterTrade.toLowerCase());
    return matchSearch && matchLevel && matchTrade;
  });

  // Chart data: last 20 sessions chronologically
  const chartData = [...sessions]
    .filter(s => s.score_total != null)
    .slice(-20)
    .map((s, i) => ({
      name: `#${sessions.length - [...sessions].reverse().indexOf(s)}`,
      score: s.score_total,
      date: s.session_date || s.created_date?.split("T")[0],
    }));

  if (loading) return <div className="p-6 text-gray-400">Loading history...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Training History</h1>
        <p className="text-gray-400 text-sm mt-1">{sessions.length} sessions recorded</p>
      </div>

      {/* Score Trend Chart */}
      {chartData.length > 1 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-semibold text-white mb-4">Score Trend (last {chartData.length} sessions)</h2>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fill: "#9ca3af", fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", color: "#fff" }} />
              <Line type="monotone" dataKey="score" stroke="#facc15" strokeWidth={2} dot={{ fill: "#facc15", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            className="bg-transparent text-sm text-white focus:outline-none w-full placeholder-gray-600"
            placeholder="Search scenarios or trades..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
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
      </div>

      {/* Session List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-gray-500 text-sm py-8 text-center">No sessions found.</div>
        )}
        {filtered.map(s => (
          <Link
            key={s.id}
            to={`/training-history/${s.id}`}
            className="flex items-center gap-4 bg-gray-900 border border-gray-800 hover:border-yellow-400/40 rounded-xl px-4 py-3 transition-colors group"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-gray-400 bg-gray-800 px-2 py-0.5 rounded">{s.level}</span>
                <span className="text-xs text-gray-500">{(s.trades || [s.trade]).filter(Boolean).join(", ")}</span>
                {s.is_personal_scenario && (
                  <span className="text-xs text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded">Field Problem</span>
                )}
              </div>
              <p className="text-sm text-gray-300 mt-1 truncate">{s.scenario_text?.slice(0, 120)}...</p>
              <div className="flex items-center gap-3 mt-1">
                <Calendar className="w-3 h-3 text-gray-600" />
                <span className="text-xs text-gray-600">{s.session_date || s.created_date?.split("T")[0]}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {s.score_total != null && <ScoreBadge score={s.score_total} />}
              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-yellow-400 transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}