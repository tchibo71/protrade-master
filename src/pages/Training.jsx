import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { TRADES, LEVELS, SCENARIO_TYPES, SETTINGS, LEVEL_ORDER, SCENARIO_GENERATOR_PROMPT, EVALUATOR_PROMPT, IDEAL_ANSWER_PROMPT } from "@/lib/constants";
import ScenarioSetup from "@/components/training/ScenarioSetup";
import ScenarioView from "@/components/training/ScenarioView";
import EvaluationView from "@/components/training/EvaluationView";

const STEPS = ["setup", "scenario", "evaluation", "ideal"];

export default function Training() {
  const [step, setStep] = useState("setup");
  const [params, setParams] = useState(null);
  const [scenario, setScenario] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [evaluation, setEvaluation] = useState(null);
  const [idealAnswer, setIdealAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [progressRecords, setProgressRecords] = useState([]);

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
    const prompt = `${SCENARIO_GENERATOR_PROMPT}

## INPUT PARAMETERS
TRADE: ${tradeText}
LEVEL: ${selectedParams.level}
SCENARIO TYPE: ${selectedParams.scenarioType}
CONTEXT: ${selectedParams.setting}
${selectedParams.isPersonal ? `\nPERSONAL CONTEXT FROM USER: ${selectedParams.personalDescription}` : ""}`;

    const result = await base44.integrations.Core.InvokeLLM({ prompt, model: "claude_sonnet_4_6" });
    setScenario(result);
    setLoading(false);
  };

  const submitAnswer = async () => {
    if (!userAnswer.trim()) return;
    setLoading(true);
    setStep("evaluation");

    const prompt = `${EVALUATOR_PROMPT}

## ORIGINAL SCENARIO
${scenario}

## TRAINEE LEVEL
${params.level}

## TRAINEE'S ANSWER
${userAnswer}`;

    const evalText = await base44.integrations.Core.InvokeLLM({ prompt, model: "claude_sonnet_4_6" });
    setEvaluation(evalText);

    // Parse scores from evaluation
    const scores = parseScores(evalText);

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

    const prompt = `${IDEAL_ANSWER_PROMPT}

## ORIGINAL SCENARIO
${scenario}

## LEVEL
${params.level}

## TRAINEE'S ANSWER (for context only — do not repeat evaluation)
${userAnswer}`;

    const result = await base44.integrations.Core.InvokeLLM({ prompt, model: "claude_sonnet_4_6" });
    setIdealAnswer(result);

    if (sessionId) {
      await base44.entities.TrainingSession.update(sessionId, { ideal_answer_text: result });
    }
    setLoading(false);
  };

  const reset = () => {
    setStep("setup");
    setParams(null);
    setScenario("");
    setUserAnswer("");
    setEvaluation(null);
    setIdealAnswer("");
    setSessionId(null);
  };

  const tryAgain = () => {
    setUserAnswer("");
    setEvaluation(null);
    setIdealAnswer("");
    setSessionId(null);
    setStep("scenario");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {step === "setup" && (
        <ScenarioSetup
          onGenerate={generateScenario}
          progressRecords={progressRecords}
          isLevelUnlocked={isLevelUnlocked}
        />
      )}
      {(step === "scenario" || step === "evaluation" || step === "ideal") && (
        <ScenarioView
          scenario={scenario}
          loading={loading && step === "scenario"}
          userAnswer={userAnswer}
          setUserAnswer={setUserAnswer}
          onSubmit={submitAnswer}
          onNewScenario={reset}
          step={step}
          submitting={loading && step === "evaluation"}
        />
      )}
      {step === "evaluation" && !loading && (
        <EvaluationView
          evaluation={evaluation}
          idealAnswer={idealAnswer}
          loadingIdeal={loading && step === "ideal"}
          onShowIdeal={showIdealAnswer}
          onTryAgain={tryAgain}
          onNewScenario={reset}
          step={step}
        />
      )}
      {step === "ideal" && (
        <EvaluationView
          evaluation={evaluation}
          idealAnswer={idealAnswer}
          loadingIdeal={loading}
          onShowIdeal={showIdealAnswer}
          onTryAgain={tryAgain}
          onNewScenario={reset}
          step={step}
        />
      )}
    </div>
  );
}

function parseScores(evalText) {
  const extract = (label) => {
    const regex = new RegExp(`${label}\\s*\\|\\s*(\\d+)`, "i");
    const match = evalText.match(regex);
    return match ? parseInt(match[1]) : 0;
  };
  const safety = extract("Safety");
  const code = extract("Code Compliance");
  const workmanship = extract("Quality of Workmanship");
  const completeness = extract("Completeness");
  const judgment = extract("Professional Judgment");
  const totalMatch = evalText.match(/\*\*TOTAL\*\*\s*\|\s*\*\*(\d+)/);
  const total = totalMatch ? parseInt(totalMatch[1]) : safety + code + workmanship + completeness + judgment;
  return { safety, code, workmanship, completeness, judgment, total };
}