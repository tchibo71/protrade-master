import { useState } from "react";
import { TRADES, LEVELS, SCENARIO_TYPES, SETTINGS, LEVEL_ORDER } from "@/lib/constants";
import { Lock, Unlock, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ScenarioSetup({ onGenerate, progressRecords, isLevelUnlocked }) {
  const [trades, setTrades] = useState([]);
  const [level, setLevel] = useState("Novice");
  const [scenarioType, setScenarioType] = useState(SCENARIO_TYPES[0]);
  const [setting, setSetting] = useState(SETTINGS[0]);
  const [isPersonal, setIsPersonal] = useState(false);
  const [personalDescription, setPersonalDescription] = useState("");

  const toggleTrade = (trade) => {
    setTrades(prev =>
      prev.includes(trade) ? prev.filter(t => t !== trade) : [...prev, trade]
    );
  };

  const canGenerate = trades.length > 0 && isLevelUnlocked(level) && (!isPersonal || personalDescription.trim());

  const handleGenerate = () => {
    if (!canGenerate) return;
    onGenerate({ trades, level, scenarioType, setting, isPersonal, personalDescription });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Training Setup</h1>
        <p className="text-gray-400 text-sm mt-1">Configure your scenario parameters</p>
      </div>

      {/* Personal Scenario Toggle */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isPersonal}
            onChange={e => setIsPersonal(e.target.checked)}
            className="w-4 h-4 accent-yellow-400"
          />
          <div>
            <span className="font-medium text-white">Field Problem Mode</span>
            <p className="text-xs text-gray-400 mt-0.5">Have a real job issue? Describe it for a tailored scenario.</p>
          </div>
        </label>
        {isPersonal && (
          <textarea
            className="mt-3 w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm resize-none focus:outline-none focus:border-yellow-400"
            rows={4}
            placeholder="Describe the real-world problem or situation you're dealing with on the job..."
            value={personalDescription}
            onChange={e => setPersonalDescription(e.target.value)}
          />
        )}
      </div>

      {/* Trade Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-3">
          Trade(s) <span className="text-gray-500 font-normal">(select one or more)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {TRADES.map(trade => (
            <button
              key={trade}
              onClick={() => toggleTrade(trade)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm border transition-colors",
                trades.includes(trade)
                  ? "bg-yellow-400 text-gray-900 border-yellow-400 font-medium"
                  : "bg-gray-900 text-gray-300 border-gray-700 hover:border-gray-500"
              )}
            >
              {trade}
            </button>
          ))}
        </div>
      </div>

      {/* Level Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-3">Experience Level</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {LEVELS.map(lvl => {
            const unlocked = isLevelUnlocked(lvl);
            const record = progressRecords.find(p => p.level === lvl);
            const consec = record?.consecutive_80_plus || 0;
            return (
              <button
                key={lvl}
                onClick={() => unlocked && setLevel(lvl)}
                disabled={!unlocked}
                className={cn(
                  "relative px-3 py-2.5 rounded-lg text-sm border transition-colors text-left",
                  level === lvl && unlocked
                    ? "bg-yellow-400 text-gray-900 border-yellow-400 font-medium"
                    : unlocked
                    ? "bg-gray-900 text-gray-300 border-gray-700 hover:border-gray-500"
                    : "bg-gray-950 text-gray-600 border-gray-800 cursor-not-allowed"
                )}
              >
                <div className="flex items-center justify-between">
                  <span>{lvl}</span>
                  {!unlocked ? (
                    <Lock className="w-3.5 h-3.5" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5 opacity-40" />
                  )}
                </div>
                {!unlocked && (
                  <div className="text-xs mt-1 opacity-60">
                    {5 - consec} more 80+ needed
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scenario Type */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Scenario Type</label>
          <select
            value={scenarioType}
            onChange={e => setScenarioType(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-yellow-400"
          >
            {SCENARIO_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Setting</label>
          <select
            value={setting}
            onChange={e => setSetting(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-yellow-400"
          >
            {SETTINGS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={!canGenerate}
        className={cn(
          "w-full py-3 rounded-xl font-bold text-base transition-colors",
          canGenerate
            ? "bg-yellow-400 hover:bg-yellow-300 text-gray-900"
            : "bg-gray-800 text-gray-600 cursor-not-allowed"
        )}
      >
        Generate Scenario
      </button>
    </div>
  );
}