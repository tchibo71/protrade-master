import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useKnowledgeBase } from "@/lib/useKnowledgeBase";
import ReactMarkdown from "react-markdown";
import {
  Library, Link, Upload, Trash2, RefreshCw, CheckCircle2,
  AlertCircle, Loader2, Globe, FileText, ChevronDown, ChevronUp, Plus
} from "lucide-react";

export default function DataLibrary() {
  const { entries, loading, refresh } = useKnowledgeBase();
  const [mode, setMode] = useState("url"); // "url" | "file"
  const [urlInput, setUrlInput] = useState("");
  const [fileInput, setFileInput] = useState(null);
  const [titleInput, setTitleInput] = useState("");
  const [focusInput, setFocusInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [allEntries, setAllEntries] = useState([]);
  const [loadingAll, setLoadingAll] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoadingAll(true);
    const data = await base44.entities.KnowledgeBase.list("-created_date", 200);
    setAllEntries(data);
    setLoadingAll(false);
  };

  const handleAddUrl = async () => {
    const url = urlInput.trim();
    if (!url) return;
    setProcessing(true);

    // Create a pending entry
    const entry = await base44.entities.KnowledgeBase.create({
      title: titleInput.trim() || url,
      source_type: "url",
      source_url: url,
      focus_scope: focusText || "",
      status: "processing",
    });

    setAllEntries(prev => [entry, ...prev]);
    setUrlInput("");
    setTitleInput("");
    const focusText = focusInput.trim();
    setFocusInput("");

    // Fetch and extract content via LLM
    const focusInstruction = focusText
      ? `\n\nIMPORTANT — USER FOCUS SCOPE: The user only wants information about: "${focusText}". Ignore all other sections, topics, or regulations that are outside this scope. Extract ONLY content relevant to this focus area.`
      : "";

    const extractPrompt = `You are a regulatory research assistant. A user has provided the following URL: ${url}${focusInstruction}

Your task:
1. Extract and summarize the key rules, regulations, codes, requirements, and important text from this page${focusText ? ` — specifically focused on: ${focusText}` : ""}.
2. If it's a building code or trade regulation page, capture every relevant section number, requirement, measurement, and standard.
3. Produce a comprehensive structured summary with section headings.
4. Then list the raw key content verbatim where possible.

Output format:
SUMMARY:
[Detailed structured summary of key rules and regulations]

KEY CONTENT:
[Most important verbatim text, rules, measurements, and requirements]`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: extractPrompt,
      add_context_from_internet: true,
      model: "gemini_3_flash"
    });

    // Split into summary and content
    const summaryMatch = result.match(/SUMMARY:\s*([\s\S]*?)(?=KEY CONTENT:|$)/i);
    const contentMatch = result.match(/KEY CONTENT:\s*([\s\S]*)/i);

    const summary = summaryMatch ? summaryMatch[1].trim() : result.slice(0, 1000);
    const content = contentMatch ? contentMatch[1].trim() : result;

    // Generate tags
    const tagPrompt = `Based on this content summary, list 5-10 relevant topic tags (trade names, regulation types, jurisdictions). Return only a comma-separated list:\n\n${summary.slice(0, 500)}`;
    const tagResult = await base44.integrations.Core.InvokeLLM({ prompt: tagPrompt });
    const tags = tagResult.split(",").map(t => t.trim()).filter(Boolean);

    await base44.entities.KnowledgeBase.update(entry.id, {
      content,
      summary,
      tags,
      status: "ready"
    });

    setProcessing(false);
    await loadAll();
    refresh();
  };

  const handleAddFile = async () => {
    if (!fileInput) return;
    setProcessing(true);

    const { file_url } = await base44.integrations.Core.UploadFile({ file: fileInput });

    const entry = await base44.entities.KnowledgeBase.create({
      title: titleInput.trim() || fileInput.name,
      source_type: "file",
      file_url,
      status: "processing",
    });

    setAllEntries(prev => [entry, ...prev]);
    setFileInput(null);
    setTitleInput("");

    // Extract content from file
    const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: {
        type: "object",
        properties: {
          full_text: { type: "string" },
          key_rules: { type: "array", items: { type: "string" } },
          summary: { type: "string" }
        }
      }
    });

    let content = "";
    let summary = "";
    let tags = [];

    if (extracted.status === "success" && extracted.output) {
      content = extracted.output.full_text || JSON.stringify(extracted.output);
      summary = extracted.output.summary || "";
      const tagPrompt = `Based on this content, list 5-10 topic tags. Return only comma-separated:\n\n${summary.slice(0, 500)}`;
      const tagResult = await base44.integrations.Core.InvokeLLM({ prompt: tagPrompt });
      tags = tagResult.split(",").map(t => t.trim()).filter(Boolean);
    }

    await base44.entities.KnowledgeBase.update(entry.id, {
      content,
      summary,
      tags,
      status: extracted.status === "success" ? "ready" : "error"
    });

    setProcessing(false);
    await loadAll();
    refresh();
  };

  const handleDelete = async (id) => {
    await base44.entities.KnowledgeBase.delete(id);
    setAllEntries(prev => prev.filter(e => e.id !== id));
    refresh();
  };

  const statusIcon = (status) => {
    if (status === "ready") return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    if (status === "processing") return <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />;
    return <AlertCircle className="w-4 h-4 text-red-400" />;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Library className="w-6 h-6 text-yellow-400" />
          <h1 className="text-2xl font-bold text-white">Data Library</h1>
        </div>
        <p className="text-gray-400 text-sm">
          Your permanent knowledge base. All entries are automatically used as the <span className="text-yellow-400 font-semibold">Gold Standard</span> in every scenario, evaluation, and code lookup — no prompting required.
        </p>
      </div>

      {/* Add Entry Panel */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-white">Add to Library</h2>

        {/* Mode tabs */}
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1 w-fit">
          <button
            onClick={() => setMode("url")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${mode === "url" ? "bg-yellow-400 text-gray-900" : "text-gray-400 hover:text-white"}`}
          >
            <Globe className="w-3.5 h-3.5" /> URL / Link
          </button>
          <button
            onClick={() => setMode("file")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${mode === "file" ? "bg-yellow-400 text-gray-900" : "text-gray-400 hover:text-white"}`}
          >
            <Upload className="w-3.5 h-3.5" /> Upload File
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Title / Label (optional)</label>
            <input
              type="text"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-yellow-400"
              placeholder="e.g. Greene County Drainage Code, TN NEC Amendments..."
              value={titleInput}
              onChange={e => setTitleInput(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Focus / Scope <span className="text-gray-600">(optional — tell the AI what to extract and what to ignore)</span>
            </label>
            <textarea
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white text-sm resize-none focus:outline-none focus:border-yellow-400"
              rows={2}
              placeholder='e.g. "Only septic system installation requirements — ignore solid waste, air quality, and water supply sections"'
              value={focusInput}
              onChange={e => setFocusInput(e.target.value)}
            />
          </div>

          {mode === "url" ? (
            <div>
              <label className="block text-xs text-gray-400 mb-1">URL</label>
              <input
                type="url"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-yellow-400"
                placeholder="https://..."
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs text-gray-400 mb-1">File (PDF, DOCX, CSV, TXT, etc.)</label>
              <input
                type="file"
                accept=".pdf,.docx,.doc,.txt,.csv,.xlsx,.html"
                className="w-full text-sm text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-yellow-400 file:text-gray-900 hover:file:bg-yellow-300 cursor-pointer"
                onChange={e => setFileInput(e.target.files[0] || null)}
              />
            </div>
          )}

          <button
            onClick={mode === "url" ? handleAddUrl : handleAddFile}
            disabled={processing || (mode === "url" ? !urlInput.trim() : !fileInput)}
            className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 disabled:bg-gray-700 disabled:text-gray-500 text-gray-900 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {processing ? "Processing..." : mode === "url" ? "Fetch & Store URL" : "Upload & Extract"}
          </button>
        </div>
      </div>

      {/* Library Entries */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-white">
            Library Entries <span className="text-gray-500 font-normal text-sm">({allEntries.length})</span>
          </h2>
          <button onClick={loadAll} className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>

        {loadingAll ? (
          <div className="text-gray-500 text-sm flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading library...
          </div>
        ) : allEntries.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500 text-sm">
            No entries yet. Add a URL or upload a file to get started.
          </div>
        ) : (
          allEntries.map(entry => (
            <div key={entry.id} className={`bg-gray-900 border rounded-xl overflow-hidden ${entry.status === "ready" ? "border-gray-700" : entry.status === "processing" ? "border-yellow-600/40" : "border-red-700/40"}`}>
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="shrink-0">
                  {entry.source_type === "url" ? <Globe className="w-4 h-4 text-blue-400" /> : <FileText className="w-4 h-4 text-purple-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {statusIcon(entry.status)}
                    <span className="text-sm font-medium text-white truncate">{entry.title}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {entry.source_url && <span className="text-xs text-gray-500 truncate max-w-xs">{entry.source_url}</span>}
                    {(entry.tags || []).slice(0, 4).map(tag => (
                      <span key={tag} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full border border-gray-700">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {entry.status === "ready" && (
                    <button
                      onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                      className="text-gray-500 hover:text-white transition-colors"
                    >
                      {expandedId === entry.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="text-gray-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {expandedId === entry.id && entry.summary && (
                <div className="border-t border-gray-800 px-4 py-4 space-y-3">
                  {entry.focus_scope && (
                    <div className="bg-gray-800 border border-yellow-400/20 rounded-lg px-3 py-2">
                      <p className="text-xs text-yellow-400 font-semibold uppercase tracking-wide mb-1">Focus Scope</p>
                      <p className="text-xs text-gray-300">{entry.focus_scope}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-yellow-400 font-semibold uppercase tracking-wide mb-2">AI Summary</p>
                    <div className="prose prose-invert prose-sm max-w-none text-gray-300">
                      <ReactMarkdown>{entry.summary}</ReactMarkdown>
                    </div>
                  </div>
                  {entry.content && (
                    <details className="group">
                      <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-300 transition-colors">Show raw extracted content</summary>
                      <pre className="mt-2 text-xs text-gray-400 whitespace-pre-wrap max-h-60 overflow-y-auto bg-gray-950 rounded-lg p-3">{entry.content.slice(0, 3000)}</pre>
                    </details>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}