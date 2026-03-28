import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { TRADES } from "@/lib/constants";
import { Plus, Trash2, ToggleLeft, ToggleRight, CheckCircle2 } from "lucide-react";

export default function TradeManager() {
  const [customTrades, setCustomTrades] = useState([]);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.CustomTrade.list("-created_date", 200).then(setCustomTrades);
  }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    const created = await base44.entities.CustomTrade.create({
      name: newName.trim(),
      description: newDesc.trim(),
      active: true,
    });
    setCustomTrades(prev => [created, ...prev]);
    setNewName("");
    setNewDesc("");
    setAdding(false);
    setSaving(false);
  };

  const toggleActive = async (trade) => {
    await base44.entities.CustomTrade.update(trade.id, { active: !trade.active });
    setCustomTrades(prev => prev.map(t => t.id === trade.id ? { ...t, active: !t.active } : t));
  };

  const handleDelete = async (trade) => {
    await base44.entities.CustomTrade.delete(trade.id);
    setCustomTrades(prev => prev.filter(t => t.id !== trade.id));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Trade Manager</h1>
        <p className="text-gray-400 text-sm mt-1">
          {TRADES.length} built-in trades · {customTrades.filter(t => t.active).length} active custom trades
        </p>
      </div>

      {/* Add Custom Trade */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-white">Add Custom Trade</h2>
          {!adding && (
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Trade
            </button>
          )}
        </div>

        {adding && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Trade Name *</label>
              <input
                type="text"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-yellow-400"
                placeholder="e.g. Fire Suppression Contractor, Solar Panel Installer..."
                value={newName}
                onChange={e => setNewName(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Description (optional)</label>
              <input
                type="text"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-yellow-400"
                placeholder="Brief description of scope..."
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={!newName.trim() || saving}
                className="bg-yellow-400 hover:bg-yellow-300 disabled:bg-gray-700 disabled:text-gray-500 text-gray-900 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
              >
                {saving ? "Saving..." : "Save Trade"}
              </button>
              <button
                onClick={() => { setAdding(false); setNewName(""); setNewDesc(""); }}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Custom Trades List */}
      {customTrades.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-white">Custom Trades</h2>
          {customTrades.map(trade => (
            <div
              key={trade.id}
              className={`flex items-center gap-4 bg-gray-900 border rounded-xl px-4 py-3 transition-colors ${trade.active ? "border-gray-700" : "border-gray-800 opacity-50"}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{trade.name}</span>
                  {trade.active && <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />}
                </div>
                {trade.description && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{trade.description}</p>
                )}
              </div>
              <button
                onClick={() => toggleActive(trade)}
                className="text-gray-400 hover:text-yellow-400 transition-colors"
                title={trade.active ? "Deactivate" : "Activate"}
              >
                {trade.active
                  ? <ToggleRight className="w-5 h-5 text-green-400" />
                  : <ToggleLeft className="w-5 h-5" />}
              </button>
              <button
                onClick={() => handleDelete(trade)}
                className="text-gray-600 hover:text-red-400 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Built-in Trades Reference */}
      <div className="space-y-3">
        <h2 className="font-semibold text-white">Built-in Trades <span className="text-gray-500 font-normal text-sm">({TRADES.length} total)</span></h2>
        <div className="flex flex-wrap gap-2">
          {TRADES.map(t => (
            <span key={t} className="text-xs bg-gray-800 text-gray-300 px-2.5 py-1 rounded-full border border-gray-700">{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}