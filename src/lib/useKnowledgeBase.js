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
 * Split a string into overlapping chunks of roughly chunkSize characters,
 * breaking on paragraph ('\n\n') then sentence ('. ') boundaries where
 * possible rather than mid-word.
 */
function chunkText(text, chunkSize = 1000, overlap = 100) {
  if (!text || typeof text !== "string") return [];
  if (text.length <= chunkSize) return [text];

  // Step 1: split into paragraphs; split long paragraphs into sentences;
  // split very long sentences into word-boundary pieces.
  const paragraphs = text.split(/\n\n+/);
  const pieces = [];
  for (const para of paragraphs) {
    if (para.length <= chunkSize) {
      pieces.push(para);
      continue;
    }
    const sentences = para.split(/\. /);
    let buffer = "";
    for (let i = 0; i < sentences.length; i++) {
      const sentence = i === sentences.length - 1 ? sentences[i] : `${sentences[i]}.`;
      if (sentence.length > chunkSize) {
        // Hard split very long sentences on word boundaries
        if (buffer) { pieces.push(buffer); buffer = ""; }
        const words = sentence.split(/\s+/);
        let wbuf = "";
        for (const w of words) {
          const cand = wbuf ? `${wbuf} ${w}` : w;
          if (cand.length <= chunkSize) wbuf = cand;
          else { if (wbuf) pieces.push(wbuf); wbuf = w; }
        }
        if (wbuf) pieces.push(wbuf);
      } else {
        const cand = buffer ? `${buffer} ${sentence}` : sentence;
        if (cand.length <= chunkSize) buffer = cand;
        else { if (buffer) pieces.push(buffer); buffer = sentence; }
      }
    }
    if (buffer) pieces.push(buffer);
  }

  // Step 2: group pieces into overlapping chunks of roughly chunkSize
  const chunks = [];
  let i = 0;
  while (i < pieces.length) {
    let current = "";
    let j = i;
    while (j < pieces.length) {
      const candidate = current ? `${current}\n\n${pieces[j]}` : pieces[j];
      if (candidate.length > chunkSize && current) break;
      current = candidate;
      j++;
    }
    if (!current) {
      // Single piece longer than chunkSize — push as-is and advance
      current = pieces[j];
      j++;
    }
    chunks.push(current);
    if (j >= pieces.length) break;
    // Advance with overlap: step back so the next chunk begins ~overlap
    // characters before the end of the current one
    if (overlap > 0 && current.length > overlap) {
      let next = j;
      let acc = 0;
      while (next > i + 1 && acc + pieces[next - 1].length + 2 < overlap) {
        acc += pieces[next - 1].length + 2;
        next--;
      }
      i = next;
    } else {
      i = j;
    }
  }

  return chunks;
}

function scoreText(text, keywords) {
  if (keywords.length === 0) return 0;
  const lower = text.toLowerCase();
  return keywords.reduce((acc, kw) => acc + (lower.includes(kw) ? 1 : 0), 0);
}

/**
 * Build a library context block to prepend to AI prompts.
 * Chunks each entry's content, scores every chunk across all entries by
 * keyword relevance, and selects the top 8 highest-scoring chunks overall.
 */
export function buildLibraryContext(entries, tradeKeywords = []) {
  if (!entries || entries.length === 0) return "";

  const keywords = tradeKeywords.map(k => k.toLowerCase());

  // Build candidate chunks from all entries
  const candidates = []; // { entry, text, score, kind, chunkIndex }
  for (const e of entries) {
    const meta = `${e.title} ${(e.tags || []).join(" ")}`;
    // Summary stays un-chunked (already short) — score with entry metadata
    if (e.summary) {
      const summaryText = `${e.title}\n${e.summary}`;
      const score = scoreText(`${meta} ${e.summary}`, keywords);
      candidates.push({ entry: e, text: summaryText, score, kind: "summary", chunkIndex: -1 });
    }
    // Content chunks — each scored with entry metadata for context
    const chunks = chunkText(e.content || "");
    chunks.forEach((chunk, idx) => {
      const score = scoreText(`${meta} ${chunk}`, keywords);
      candidates.push({ entry: e, text: chunk, score, kind: "content", chunkIndex: idx });
    });
  }

  let selected;
  if (keywords.length === 0) {
    // Fallback: 2 chunks per entry — summary + first content chunk
    selected = [];
    for (const e of entries) {
      const picked = candidates.filter(c => c.entry.id === e.id);
      const summary = picked.find(c => c.kind === "summary");
      const contentChunks = picked.filter(c => c.kind === "content");
      if (summary) selected.push(summary);
      if (contentChunks.length > 0) selected.push(contentChunks[0]);
      if (selected.length >= 8) break;
    }
  } else {
    selected = candidates
      .filter(c => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }

  if (selected.length === 0) return "";

  // Group selected chunks by entry, preserving score-descending order
  const grouped = [];
  const byEntry = new Map();
  for (const c of selected) {
    if (!byEntry.has(c.entry.id)) {
      const group = { entry: c.entry, chunks: [] };
      byEntry.set(c.entry.id, group);
      grouped.push(group);
    }
    byEntry.get(c.entry.id).chunks.push(c);
  }

  const blocks = grouped.map(g => {
    const src = g.entry.source_url ? `Source: ${g.entry.source_url}` : `File: ${g.entry.title}`;
    const body = g.chunks.map(c => c.text).join("\n\n---\n\n");
    return `--- LIBRARY ENTRY: ${g.entry.title} ---\n${src}\n${body}`;
  }).join("\n\n");

  return `## ⚡ USER DATA LIBRARY — GOLD STANDARD (always override general AI knowledge)
The following entries are stored permanently by the user. Treat them as the authoritative primary source. If any entry contradicts general knowledge, defer to the library.

${blocks}

## END OF DATA LIBRARY
`;
}