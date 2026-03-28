import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Download, Loader2, FileText, MessageSquare, Star, Lightbulb } from "lucide-react";
import jsPDF from "jspdf";
import ChallengePanel from "@/components/training/ChallengePanel";

function ScoreRow({ label, score, max = 20 }) {
  const pct = (score / max) * 100;
  const color = pct >= 80 ? "bg-green-400" : pct >= 60 ? "bg-yellow-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-300 w-44 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-800 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-bold text-white w-12 text-right">{score}/{max}</span>
    </div>
  );
}

export default function TrainingSessionDetail() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState("scenario");

  const sessionId = window.location.pathname.split("/").pop();

  useEffect(() => {
    base44.entities.TrainingSession.filter({ id: sessionId }).then(results => {
      setSession(results[0] || null);
      setLoading(false);
    });
  }, [sessionId]);

  const exportPDF = async () => {
    setExporting(true);

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 18;
    const contentW = pageW - margin * 2;
    let y = margin;

    const addText = (text, fontSize, isBold = false, color = [30, 30, 30], lineGap = 2) => {
      pdf.setFontSize(fontSize);
      pdf.setFont("helvetica", isBold ? "bold" : "normal");
      pdf.setTextColor(...color);
      const lines = pdf.splitTextToSize(String(text || ""), contentW);
      lines.forEach(line => {
        if (y + fontSize * 0.352 + lineGap > pageH - margin) {
          pdf.addPage();
          y = margin;
        }
        pdf.text(line, margin, y);
        y += fontSize * 0.352 + lineGap;
      });
      y += 2; // extra spacing after block
    };

    const addSection = (title, body) => {
      y += 3;
      addText(title, 13, true, [180, 130, 0]);
      addText(body, 10, false, [40, 40, 40], 1.8);
    };

    const stripMarkdown = (md) =>
      (md || "")
        .replace(/#{1,6}\s*/g, "")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/`{1,3}[^`]*`{1,3}/g, "")
        .replace(/^\s*[-*+]\s+/gm, "• ")
        .replace(/^\s*\d+\.\s+/gm, (m) => m.trim() + " ")
        .replace(/\|.*\|/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

    // Title
    addText("TN Contractor Trainer — Session Report", 18, true, [20, 20, 20]);
    addText(`${session.session_date || ""} · ${session.level || ""} · ${trades}`, 10, false, [100, 100, 100]);

    // Scores
    if (session.score_total != null) {
      y += 4;
      addText(`Total Score: ${session.score_total}/100`, 13, true, [20, 20, 20]);
      addText(
        `Safety: ${session.score_safety}/20  ·  Code: ${session.score_code}/20  ·  Workmanship: ${session.score_workmanship}/20  ·  Completeness: ${session.score_completeness}/20  ·  Judgment: ${session.score_judgment}/20`,
        9, false, [80, 80, 80], 1.5
      );
    }

    addSection("Scenario", stripMarkdown(session.scenario_text));
    addSection("Your Answer", session.user_answer || "(no answer recorded)");
    addSection("AI Evaluation", stripMarkdown(session.evaluation_text));
    if (session.ideal_answer_text) {
      addSection("Ideal Answer", stripMarkdown(session.ideal_answer_text));
    }

    pdf.save(`training-session-${session.session_date || "export"}.pdf`);
    setExporting(false);
  };

  if (loading) return <div className="p-6 text-gray-400">Loading session...</div>;
  if (!session) return <div className="p-6 text-red-400">Session not found.</div>;

  const tabs = [
    { id: "scenario", label: "Scenario", icon: FileText },
    { id: "answer", label: "Your Answer", icon: MessageSquare },
    { id: "evaluation", label: "Evaluation", icon: Star },
    ...(session.ideal_answer_text ? [{ id: "ideal", label: "Ideal Answer", icon: Lightbulb }] : []),
  ];

  const trades = (session.trades || [session.trade]).filter(Boolean).join(", ");

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link to="/training-history" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-3 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to History
          </Link>
          <h1 className="text-xl font-bold text-white">Session Detail</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded">{session.level}</span>
            <span className="text-xs text-gray-400">{trades}</span>
            <span className="text-xs text-gray-600">{session.session_date}</span>
            {session.is_personal_scenario && (
              <span className="text-xs text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded">Field Problem</span>
            )}
          </div>
        </div>
        <button
          onClick={exportPDF}
          disabled={exporting}
          className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Export PDF
        </button>
      </div>

      {/* Score Summary */}
      {session.score_total != null && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-white">Scores</h2>
            <span className={`text-xl font-bold ${session.score_total >= 80 ? "text-green-400" : session.score_total >= 60 ? "text-yellow-400" : "text-red-400"}`}>
              {session.score_total}/100
            </span>
          </div>
          <ScoreRow label="Safety" score={session.score_safety} />
          <ScoreRow label="Code Compliance" score={session.score_code} />
          <ScoreRow label="Quality of Workmanship" score={session.score_workmanship} />
          <ScoreRow label="Completeness" score={session.score_completeness} />
          <ScoreRow label="Professional Judgment" score={session.score_judgment} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 flex-wrap">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === id ? "bg-yellow-400 text-gray-900" : "text-gray-400 hover:text-white"
            }`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        {activeTab === "scenario" && (
          <div className="prose prose-invert prose-sm max-w-none text-gray-200">
            <ReactMarkdown>{session.scenario_text}</ReactMarkdown>
          </div>
        )}
        {activeTab === "answer" && (
          <>
            <div className="text-gray-200 text-sm whitespace-pre-wrap leading-relaxed">
              {session.user_answer || <span className="text-gray-500 italic">No answer recorded.</span>}
            </div>
            <ChallengePanel session={session} context="Your Answer" />
          </>
        )}
        {activeTab === "evaluation" && (
          <>
            <div className="prose prose-invert prose-sm max-w-none text-gray-200">
              <ReactMarkdown>{session.evaluation_text}</ReactMarkdown>
            </div>
            <ChallengePanel session={session} context="Evaluation" />
          </>
        )}
        {activeTab === "ideal" && (
          <div className="prose prose-invert prose-sm max-w-none text-gray-200">
            <ReactMarkdown>{session.ideal_answer_text}</ReactMarkdown>
          </div>
        )}
      </div>


    </div>
  );
}