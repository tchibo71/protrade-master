import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

// Global cache so library is fetched once per session and shared across all components
let _cache = null;
let _loading = false;
let _listeners = [];

function notify() {
  _listeners.forEach(fn => fn(_cache));
}

export function useKnowledgeBase() {
  const [entries, setEntries] = useState(_cache || []);
  const [loading, setLoading] = useState(!_cache);

  useEffect(() => {
    const update = (data) => {
      setEntries(data);
      setLoading(false);
    };
    _listeners.push(update);

    if (!_cache && !_loading) {
      _loading = true;
      base44.entities.KnowledgeBase.filter({ status: "ready" }).then(data => {
        _cache = data;
        _loading = false;
        notify();
      });
    } else if (_cache) {
      setEntries(_cache);
      setLoading(false);
    }

    return () => {
      _listeners = _listeners.filter(fn => fn !== update);
    };
  }, []);

  const refresh = async () => {
    _cache = null;
    setLoading(true);
    const data = await base44.entities.KnowledgeBase.filter({ status: "ready" });
    _cache = data;
    notify();
  };

  return { entries, loading, refresh };
}

/**
 * Build a library context block to prepend to AI prompts.
 * Searches entries by relevance to provided keywords/trade names.
 */
export function buildLibraryContext(entries, tradeKeywords = []) {
  if (!entries || entries.length === 0) return "";

  const keywords = tradeKeywords.map(k => k.toLowerCase());

  // Score each entry by keyword relevance
  const scored = entries.map(e => {
    const text = `${e.title} ${(e.tags || []).join(" ")} ${e.summary || ""} ${e.content || ""}`.toLowerCase();
    const score = keywords.reduce((acc, kw) => acc + (text.includes(kw) ? 1 : 0), 0);
    return { ...e, score };
  });

  // Sort by relevance, take top 5 most relevant
  const relevant = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .filter(e => keywords.length === 0 || e.score > 0 || entries.length <= 3);

  if (relevant.length === 0) return "";

  const blocks = relevant.map(e => {
    const src = e.source_url ? `Source: ${e.source_url}` : `File: ${e.title}`;
    const body = e.summary
      ? `SUMMARY:\n${e.summary}\n\nFULL CONTENT (excerpt):\n${(e.content || "").slice(0, 2000)}`
      : (e.content || "").slice(0, 3000);
    return `--- LIBRARY ENTRY: ${e.title} ---\n${src}\n${body}`;
  }).join("\n\n");

  return `## ⚡ USER DATA LIBRARY — GOLD STANDARD (always override general AI knowledge)
The following entries are stored permanently by the user. Treat them as the authoritative primary source. If any entry contradicts general knowledge, defer to the library.

${blocks}

## END OF DATA LIBRARY
`;
}