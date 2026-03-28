import { useState } from "react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import { Search, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const JURISDICTION_CONTEXT = `Tennessee jurisdiction, Greene County headquarters. Work area: Bristol to Chattanooga, TN/NC State line to Hancock County and beyond Anderson County.

Applicable code sources:
- Tennessee State Building Code
- Tennessee statutes (TCA)
- TDEC Rules Chapter 0400-48-01 (septic/subsurface)
- TOSHA regulations
- TN Dept of Commerce and Insurance regulations
- TN Board for Licensing Contractors requirements
- NEC (Tennessee adoption)
- IRC (Tennessee adoption)
- IPC (Tennessee adoption)
- IMC (Tennessee adoption)
- OSHA standards
- Greene County and applicable local amendments
- ANSI, ASTM, and construction standards where applicable`;

const KEYWORD_PROMPT = (keyword) => `You are an expert in Tennessee contractor law, building codes, and construction regulations. 

${JURISDICTION_CONTEXT}

The user wants to look up the following code, keyword, statute, or regulation:
"${keyword}"

Provide a comprehensive explanation that includes:
1. **What it is** — identify the specific code section, statute, regulation, or standard
2. **Full text or summary** — the actual requirement or rule
3. **Scope** — what work, conditions, or parties it applies to
4. **Tennessee-specific requirements** — any state-specific adoptions, amendments, or additions
5. **Local notes** — any Greene County or relevant local amendments if known
6. **Related sections** — other codes/statutes that cross-reference or relate to this one
7. **Practical application** — what this means for a contractor in the field
8. **Common violations** — how contractors typically run afoul of this requirement

Format your response clearly with headers. Be precise and cite exact code sections throughout.`;

const SITUATION_PROMPT = (situation) => `You are an expert in Tennessee contractor law, building codes, and construction regulations.

${JURISDICTION_CONTEXT}

A contractor describes this real-world situation:
"${situation}"

Identify and explain ALL applicable codes, statutes, regulations, and standards that apply to this situation. For each:
1. **Citation** — exact code/statute/regulation reference
2. **Requirement** — what it requires
3. **Why it applies** — how it connects to this specific situation
4. **Tennessee-specific** — any TN state adoptions or amendments
5. **Compliance steps** — what the contractor must do to comply

Organize by trade/discipline (electrical, plumbing, structural, etc.) if multiple apply.
Be comprehensive — do not omit any applicable requirement.
Flag any requirements that are particularly strict, commonly missed, or frequently violated in this type of work.`;

export default function CodeLookup() {
  const [mode, setMode] = useState("keyword");
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastQuery, setLastQuery] = useState("");

  const handleSearch = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResult("");
    setLastQuery(input);

    const prompt = mode === "keyword" ? KEYWORD_PROMPT(input) : SITUATION_PROMPT(input);
    const res = await base44.integrations.Core.InvokeLLM({ prompt, model: "claude_sonnet_4_6", add_context_from_internet: false });
    setResult(res);
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Code Lookup</h1>
        <p className="text-gray-400 text-sm mt-1">Tennessee jurisdiction · Greene County · All applicable codes & statutes</p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
        <button
          onClick={() => setMode("keyword")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            mode === "keyword" ? "bg-yellow-400 text-gray-900" : "text-gray-400 hover:text-white"
          )}
        >
          <Search className="w-4 h-4" /> Keyword / Code Section
        </button>
        <button
          onClick={() => setMode("situation")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            mode === "situation" ? "bg-yellow-400 text-gray-900" : "text-gray-400 hover:text-white"
          )}
        >
          <FileText className="w-4 h-4" /> Situation-Based Lookup
        </button>
      </div>

      {/* Input */}
      <div className="space-y-3">
        {mode === "keyword" ? (
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Enter code section, keyword, or statute
            </label>
            <input
              type="text"
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-yellow-400"
              placeholder="e.g. NEC 210.52, TDEC 0400-48-01, TCA 62-6-102, IRC R302..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Describe your situation
            </label>
            <textarea
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white text-sm resize-none focus:outline-none focus:border-yellow-400"
              rows={5}
              placeholder="Describe what you're doing, what the job involves, what the conditions are... e.g. 'I'm installing a septic system on a sloped lot in Greene County, residential new construction, within 50 feet of a creek...'"
              value={input}
              onChange={e => setInput(e.target.value)}
            />
          </div>
        )}

        <button
          onClick={handleSearch}
          disabled={!input.trim() || loading}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-colors",
            input.trim() && !loading
              ? "bg-yellow-400 hover:bg-yellow-300 text-gray-900"
              : "bg-gray-800 text-gray-600 cursor-not-allowed"
          )}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {loading ? "Looking up..." : "Search"}
        </button>
      </div>

      {/* Result */}
      {(loading || result) && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          {lastQuery && (
            <div className="text-xs text-gray-500 mb-4 pb-3 border-b border-gray-800">
              Query: <span className="text-gray-300">{lastQuery}</span>
            </div>
          )}
          {loading && !result ? (
            <div className="flex items-center gap-3 text-gray-400 py-6 justify-center">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Searching codes and regulations...</span>
            </div>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none text-gray-200">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}