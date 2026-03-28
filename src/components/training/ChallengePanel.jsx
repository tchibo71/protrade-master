import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import { Scale, Send, Loader2, X, ChevronDown, ChevronUp } from "lucide-react";

const CHALLENGE_SYSTEM_PROMPT = `You are a master contractor trainer and instructor operating in Tennessee. A student is reviewing an AI-generated evaluation of their answer to a training scenario and wants to challenge, question, or discuss a portion of it.

YOUR ROLE:
- Be instructive, encouraging, and Socratic. Never condescending, insulting, or dismissive.
- Prefer guided questioning and hints to help the student discover the correct answer themselves — UNLESS the student says "I don't know", "just tell me", "I give up", or a similar phrase, in which case explain directly and clearly.
- If the student has a VALID point that the original evaluation missed or got wrong, acknowledge it honestly and correct the record. Academic integrity matters.
- If the student's challenge is incorrect, guide them toward understanding WHY through questions and hints rather than blunt correction.
- Always cite specific code sections, statutes, or standards when relevant (Tennessee jurisdiction: TCA, TDEC, TOSHA, NEC/NFPA 70, IRC, IBC, IPC, IMC, IFGC, NFPA standards, OSHA 29 CFR, etc.).
- Keep responses focused and conversational — this is a back-and-forth dialogue, not a lecture.
- End responses with a follow-up question when appropriate to keep the student engaged.`;

export default function ChallengePanel({ session, context }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    if (open && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const contextBlock = `
## SESSION CONTEXT
Trade(s): ${(session.trades || [session.trade]).filter(Boolean).join(", ")}
Level: ${session.level}
Score: ${session.score_total}/100

## THE SCENARIO
${session.scenario_text}

## STUDENT'S ANSWER
${session.user_answer}

## AI EVALUATION
${session.evaluation_text}

## WHAT THE STUDENT IS CHALLENGING (context tab: ${context})
`;

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const history = newMessages.map(m => `${m.role === "user" ? "STUDENT" : "TRAINER"}: ${m.content}`).join("\n\n");

    const prompt = `${CHALLENGE_SYSTEM_PROMPT}

${contextBlock}
${newMessages.length === 1 ? "" : "## CONVERSATION SO FAR\n" + history.split("\n\n").slice(0, -1).join("\n\n")}

## STUDENT'S LATEST MESSAGE
${text}

Respond as the trainer. Be concise, instructive, and Socratic unless the student says they don't know.`;

    const reply = await base44.integrations.Core.InvokeLLM({ prompt, model: "claude_sonnet_4_6" });
    setMessages(prev => [...prev, { role: "trainer", content: reply }]);
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="mt-4 border border-orange-500/30 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-orange-950/40 hover:bg-orange-950/60 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-semibold text-orange-300">Challenge / Discuss This Evaluation</span>
          <span className="text-xs text-orange-500/70 hidden sm:block">— Question a score, challenge a ruling, or ask for clarification</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-orange-400" /> : <ChevronDown className="w-4 h-4 text-orange-400" />}
      </button>

      {open && (
        <div className="bg-gray-950 border-t border-orange-500/20">
          {/* Chat history */}
          <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
            {messages.length === 0 && (
              <p className="text-xs text-gray-500 italic">
                Ask anything about this evaluation — challenge a score, question a code citation, or explore a point you disagree with. The trainer will guide you through it.
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "trainer" && (
                  <div className="w-7 h-7 rounded-full bg-orange-900/60 border border-orange-500/40 flex items-center justify-center shrink-0 mt-0.5">
                    <Scale className="w-3.5 h-3.5 text-orange-400" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${
                    m.role === "user"
                      ? "bg-gray-800 text-gray-100"
                      : "bg-gray-900 border border-gray-800 text-gray-200"
                  }`}
                >
                  {m.role === "trainer" ? (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-7 h-7 rounded-full bg-orange-900/60 border border-orange-500/40 flex items-center justify-center shrink-0">
                  <Scale className="w-3.5 h-3.5 text-orange-400" />
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center gap-2 text-gray-400 text-sm">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-800 p-3 flex gap-2">
            <textarea
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-orange-500 min-h-[42px] max-h-32"
              placeholder="Type your challenge or question... (Enter to send, Shift+Enter for new line)"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="bg-orange-500 hover:bg-orange-400 disabled:bg-gray-800 disabled:text-gray-600 text-white px-3 py-2 rounded-lg transition-colors shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}