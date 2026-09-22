import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { TRADES, LEVELS, SCENARIO_TYPES, SETTINGS, LEVEL_ORDER, SCENARIO_GENERATOR_PROMPT, SCENARIO_GENERATOR_RESPONSE_SCHEMA, EVALUATOR_PROMPT, IDEAL_ANSWER_PROMPT, EVALUATOR_RESPONSE_SCHEMA, IDEAL_ANSWER_RESPONSE_SCHEMA, FOLLOWUP_EVALUATOR_PROMPT, FOLLOWUP_EVALUATOR_RESPONSE_SCHEMA } from "@/lib/constants";
import { useKnowledgeBase, buildLibraryContext } from "@/lib/useKnowledgeBase";
import ScenarioSetup from "@/components/training/ScenarioSetup";
import ScenarioView from "@/components/training/ScenarioView";
import EvaluationView from "@/components/training/EvaluationView";
import FieldProblemAnalyzer from "@/components/training/FieldProblemAnalyzer";
import { BookOpen, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["setup", "scenario", "evaluation", "ideal"];

const STORAGE_KEY = "training_session_draft";

function loadDraft() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveDraft(state) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

function clearDraft() {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
}

const CATEGORY_LABELS = {
  safety: "Safety",
  code: "Code Compliance",
  workmanship: "Quality of Workmanship",
  completeness: "Completeness",
  judgment: "Professional Judgment",
};

// Returns { category, label } for the lowest-averaging score category across
// recent sessions, or null if there isn't enough data to judge.
function computeWeakestCategory(sessions) {
  if (!sessions || sessions.length < 3) return null;
  const cats = ["safety", "code", "workmanship", "completeness", "judgment"];
  const sums = { safety: 0, code: 0, workmanship: 0, completeness: 0, judgment: 0 };
  const counts = { safety: 0, code: 0, workmanship: 0, completeness: 0, judgment: 0 };
  sessions.forEach(s => {
    cats.forEach(c => {
      const v = s[`score_${c}`];
      if (typeof v === "number" && !isNaN(v)) { sums[c] += v; counts[c] += 1; }
    });
  });
  let weakest = null;
  let lowest = Infinity;
  cats.forEach(c => {
    if (counts[c] > 0) {
      const avg = sums[c] / counts[c];
      if (avg < lowest) { lowest = avg; weakest = c; }
    }
  });
  return weakest ? { category: weakest, label: CATEGORY_LABELS[weakest] } : null;
}

export default function Training() {
  const { entries: libraryEntries } = useKnowledgeBase();

  const draft = loadDraft();
  const [step, setStep] = useState(draft?.step ?? "setup");
  const [params, setParams] = useState(draft?.params ?? null);
  const [scenario, setScenario] = useState(draft?.scenario ?? "");
  const [userAnswer, setUserAnswer] = useState(draft?.userAnswer ?? "");
  const [evaluation, setEvaluation] = useState(draft?.evaluation ?? null);
  const [idealAnswer, setIdealAnswer] = useState(draft?.idealAnswer ?? "");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(draft?.sessionId ?? null);
  const [rubricScope, setRubricScope] = useState(draft?.rubricScope ?? []);
  const [followupComplication, setFollowupComplication] = useState(draft?.followupComplication ?? null);
  const [progressRecords, setProgressRecords] = useState([]);
  const [mode, setMode] = useState(draft?.mode ?? "training"); // "training" | "field"
  const [emphasisNote, setEmphasisNote] = useState(draft?.emphasisNote ?? "");

  // Persist draft on every meaningful state change
  useEffect(() => {
    if (step === "setup" && !scenario) { clearDraft(); return; }
    saveDraft({ step, params, scenario, userAnswer, evaluation, idealAnswer, sessionId, mode, rubricScope, followupComplication, emphasisNote });
  }, [step, params, scenario, userAnswer, evaluation, idealAnswer, sessionId, mode, emphasisNote]);

  useEffect(() => {
    base44.entities.UserProgress.list().then(setProgressRecords);
  }, []);

  const isLevelUnlocked = (level) => {
    if (level === "Novice") return true;
    const levelIdx = LEVEL_ORDER[level];
    // Check if any level below this one is "current" and has enough progress
    // A level is unlocked if the previous level is unlocked and user has met criteria
    const prevLevel = LEVELS[levelIdx - 1];
    const prevRecord = progressRecords.find(p => p.level === prevLevel);
    if (!prevRecord) return levelIdx === 0;
    return prevRecord.unlocked || prevRecord.consecutive_80_plus >= 5;
  };

  const generateScenario = async (selectedParams) => {
    setParams(selectedParams);
    setLoading(true);
    setStep("scenario");

    const tradeText = selectedParams.trades.join(", ");
    const libraryContext = buildLibraryContext(libraryEntries, selectedParams.trades);

    // Performance-informed emphasis: lean the scenario toward the trainee's
    // weakest scoring category based on recent sessions at this level.
    // Skipped for personal (real-job) scenarios so they match what was asked.
    let emphasisBlock = "";
    let weakest = null;
    if (!selectedParams.isPersonal) {
      try {
        const recent = await base44.entities.TrainingSession.filter({ level: selectedParams.level }, "-created_date", 10);
        weakest = computeWeakestCategory(recent);
        if (weakest) {
          emphasisBlock = `\n## PERFORMANCE-INFORMED EMPHASIS\nThis trainee's average score in ${weakest.label} at this level has been notably lower than their other categories across recent sessions. Where it fits naturally within the requested SCENARIO TYPE and TRADE, lean the scenario's task toward testing ${weakest.label} specifically — without making it feel forced or obviously targeted.\n`;
        }
      } catch {}
    }

    const prompt = `${libraryContext}${emphasisBlock}${SCENARIO_GENERATOR_PROMPT}

## INPUT PARAMETERS
TRADE: ${tradeText}
LEVEL: ${selectedParams.level}
SCENARIO TYPE: ${selectedParams.scenarioType}
CONTEXT: ${selectedParams.setting}
${selectedParams.isPersonal ? `\nPERSONAL CONTEXT FROM USER: ${selectedParams.personalDescription}` : ""}`;

    const result = await base44.integrations.Core.InvokeLLM({ prompt, model: "claude_sonnet_4_6", response_json_schema: SCENARIO_GENERATOR_RESPONSE_SCHEMA });
    let scope = result.rubric_scope || [];
    if (weakest && !scope.includes(weakest.category)) {
      scope = [...scope, weakest.category];
    }
    setScenario(result.scenario_markdown);
    setRubricScope(scope);
    setParams(prev => ({ ...prev, rubric_scope: scope }));
    setEmphasisNote(weakest ? `This scenario leans toward ${weakest.label} based on recent sessions` : "");
    setLoading(false);
  };

  const submitAnswer = async () => {
    if (!userAnswer.trim()) return;
    setLoading(true);
    setStep("evaluation");

    const libraryContext = buildLibraryContext(libraryEntries, params.trades);
    const rubricScopeBlock = `## RUBRIC SCOPE FOR THIS SCENARIO\nOnly the following categories were part of what this task asked the trainee to address: ${params.rubric_scope?.join(', ') || 'all categories'}. For any category NOT in this list, score it 20/20 by default (full credit — it wasn't part of what was asked) rather than penalizing its absence, but you may still note relevant observations about it in WORKMANSHIP NOTES or SUMMARY if genuinely relevant.\n\n`;
    const prompt = `${libraryContext}${rubricScopeBlock}${EVALUATOR_PROMPT}

## ORIGINAL SCENARIO
${scenario}

## TRAINEE LEVEL
${params.level}

## TRAINEE'S ANSWER
${userAnswer}`;

    const evalResult = await base44.integrations.Core.InvokeLLM({ prompt, model: "claude_sonnet_4_6", response_json_schema: EVALUATOR_RESPONSE_SCHEMA });
    const evalText = evalResult.evaluation_markdown;
    setEvaluation(evalText);
    setFollowupComplication(evalResult.followup_complication || null);

    // Read scores directly from structured response
    const scores = {
      safety: evalResult.score_safety,
      code: evalResult.score_code,
      workmanship: evalResult.score_workmanship,
      completeness: evalResult.score_completeness,
      judgment: evalResult.score_judgment,
      total: evalResult.score_total,
    };

    // Save session
    const sessionData = {
      trades: params.trades,
      trade: params.trades[0],
      level: params.level,
      scenario_type: params.scenarioType,
      setting: params.setting,
      scenario_text: scenario,
      user_answer: userAnswer,
      evaluation_text: evalText,
      score_safety: scores.safety,
      score_code: scores.code,
      score_workmanship: scores.workmanship,
      score_completeness: scores.completeness,
      score_judgment: scores.judgment,
      score_total: scores.total,
      is_personal_scenario: params.isPersonal || false,
      personal_description: params.personalDescription || "",
      rubric_scope: params.rubric_scope || rubricScope || [],
      followup_complication: evalResult.followup_complication || "",
      session_date: new Date().toISOString().split("T")[0]
    };
    const saved = await base44.entities.TrainingSession.create(sessionData);
    setSessionId(saved.id);

    // Update progress
    await updateProgress(params.level, scores.total);
    setLoading(false);
  };

  const updateProgress = async (level, totalScore) => {
    const existing = progressRecords.find(p => p.level === level);
    const is80Plus = totalScore >= 80;

    if (existing) {
      const newConsec = is80Plus ? (existing.consecutive_80_plus || 0) + 1 : 0;
      const newTotal = (existing.total_scenarios_at_level || 0) + 1;
      const newAvg = ((existing.avg_score_at_level || 0) * (newTotal - 1) + totalScore) / newTotal;
      const shouldUnlock = newConsec >= 5;

      await base44.entities.UserProgress.update(existing.id, {
        consecutive_80_plus: newConsec,
        total_scenarios_at_level: newTotal,
        avg_score_at_level: Math.round(newAvg),
        unlocked: existing.unlocked || shouldUnlock
      });

      // Unlock next level if criteria met
      if (shouldUnlock) {
        const nextLevelIdx = LEVEL_ORDER[level] + 1;
        if (nextLevelIdx < LEVELS.length) {
          const nextLevel = LEVELS[nextLevelIdx];
          const nextExisting = progressRecords.find(p => p.level === nextLevel);
          if (nextExisting) {
            await base44.entities.UserProgress.update(nextExisting.id, { unlocked: true });
          } else {
            await base44.entities.UserProgress.create({ level: nextLevel, unlocked: true, consecutive_80_plus: 0, total_scenarios_at_level: 0, avg_score_at_level: 0 });
          }
        }
      }

      const updated = await base44.entities.UserProgress.list();
      setProgressRecords(updated);
    } else {
      const newConsec = is80Plus ? 1 : 0;
      const isNovice = level === "Novice";
      const created = await base44.entities.UserProgress.create({
        level,
        unlocked: isNovice,
        consecutive_80_plus: newConsec,
        total_scenarios_at_level: 1,
        avg_score_at_level: totalScore
      });
      const updated = await base44.entities.UserProgress.list();
      setProgressRecords(updated);
    }
  };

  const showIdealAnswer = async () => {
    setLoading(true);
    setStep("ideal");

    const libraryContext = buildLibraryContext(libraryEntries, params.trades);
    const prompt = `${libraryContext}${IDEAL_ANSWER_PROMPT}

## ORIGINAL SCENARIO
${scenario}

## LEVEL
${params.level}

## TRAINEE'S ANSWER (for context only — do not repeat evaluation)
${userAnswer}`;

    const result = await base44.integrations.Core.InvokeLLM({ prompt, model: "claude_sonnet_4_6", response_json_schema: IDEAL_ANSWER_RESPONSE_SCHEMA });
    const idealText = result.ideal_answer_markdown;
    setIdealAnswer(idealText);

    if (sessionId) {
      await base44.entities.TrainingSession.update(sessionId, { ideal_answer_text: idealText });
    }
    setLoading(false);
  };

  const reset = () => {
    clearDraft();
    setStep("setup");
    setParams(null);
    setScenario("");
    setUserAnswer("");
    setEvaluation(null);
    setIdealAnswer("");
    setSessionId(null);
    setRubricScope([]);
    setFollowupComplication(null);
    setEmphasisNote("");
  };

  const tryAgain = () => {
    setUserAnswer("");
    setEvaluation(null);
    setIdealAnswer("");
    setSessionId(null);
    setStep("scenario");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Mode Toggle — only show on setup screen or field mode */}
      {(step === "setup" || mode === "field") && (
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
          <button
            onClick={() => { setMode("training"); reset(); }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              mode === "training" ? "bg-yellow-400 text-gray-900" : "text-gray-400 hover:text-white"
            )}
          >
            <BookOpen className="w-4 h-4" /> Training Scenarios
          </button>
          <button
            onClick={() => { setMode("field"); reset(); }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              mode === "field" ? "bg-orange-500 text-white" : "text-gray-400 hover:text-white"
            )}
          >
            <Wrench className="w-4 h-4" /> Field Problem Analyzer
          </button>
        </div>
      )}

      {mode === "field" && (
        <FieldProblemAnalyzer
          libraryEntries={libraryEntries}
          onBack={() => { setMode("training"); reset(); }}
        />
      )}

      {mode === "training" && step === "setup" && (
        <ScenarioSetup
          onGenerate={generateScenario}
          progressRecords={progressRecords}
          isLevelUnlocked={isLevelUnlocked}
        />
      )}
      {mode === "training" && (step === "scenario" || step === "evaluation" || step === "ideal") && (
        <ScenarioView
          scenario={scenario}
          loading={loading && step === "scenario"}
          userAnswer={userAnswer}
          setUserAnswer={setUserAnswer}
          onSubmit={submitAnswer}
          onNewScenario={reset}
          step={step}
          submitting={loading && step === "evaluation"}
          rubricScope={rubricScope}
          emphasisNote={emphasisNote}
        />
      )}
      {mode === "training" && step === "evaluation" && !loading && (
        <EvaluationView
          evaluation={evaluation}
          idealAnswer={idealAnswer}
          loadingIdeal={loading && step === "ideal"}
          onShowIdeal={showIdealAnswer}
          onTryAgain={tryAgain}
          onNewScenario={reset}
          step={step}
          scenario={scenario}
          params={params}
          userAnswer={userAnswer}
          libraryEntries={libraryEntries}
          followupComplication={followupComplication}
          sessionId={sessionId}
        />
      )}
      {mode === "training" && step === "ideal" && (
        <EvaluationView
          evaluation={evaluation}
          idealAnswer={idealAnswer}
          loadingIdeal={loading}
          onShowIdeal={showIdealAnswer}
          onTryAgain={tryAgain}
          onNewScenario={reset}
          step={step}
          scenario={scenario}
          params={params}
          userAnswer={userAnswer}
          libraryEntries={libraryEntries}
          followupComplication={followupComplication}
          sessionId={sessionId}
        />
      )}
    </div>
  );
}