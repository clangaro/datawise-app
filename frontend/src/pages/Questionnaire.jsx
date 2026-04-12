import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Scale, Link2, Target, BarChart3, Ruler, Medal, Tag,
  Users, Repeat, Shuffle, Hash, Sparkles, ArrowLeft, ArrowRight, Zap,
} from "lucide-react";
import { Card, Btn, Pill, OptionCard, Spinner, Input, C } from "../components/ui.jsx";
import DecisionTreeViz from "../components/DecisionTreeViz.jsx";
import { useAnalysis } from "../context/AnalysisContext.jsx";
import { getRecommendation } from "../api/client.js";

const TREE_LABEL_FOR_STEP = {
  research_question_type: "Question Type",
  measurement_level:      "Signal Type",
  design:                 "Protocol",
  n_groups:               "Group Count",
  sample_size:            "Sample Size",
};

function labelForAnswer(allSteps, key, rawValue) {
  if (key === "sample_size") return `N = ${rawValue}`;
  const step = allSteps.find(s => s.key === key);
  const opt = step?.options?.find(o => o.value === rawValue);
  return (opt?.label || String(rawValue)).toUpperCase();
}

const ICON = { size: 22, strokeWidth: 1.6 };

const Q_STEPS = [
  {
    key: "research_question_type",
    title: "Define mission parameters",
    subtitle: "Selects the analysis pathway through the decision tree.",
    options: [
      { value: "comparison",  label: "Comparison",  icon: <Scale {...ICON} />,     desc: "Are groups different on some outcome?" },
      { value: "correlation", label: "Correlation", icon: <Link2 {...ICON} />,     desc: "Are two variables related?" },
      { value: "prediction",  label: "Prediction",  icon: <Target {...ICON} />,    desc: "Can I predict one variable from others?" },
      { value: "description", label: "Description", icon: <BarChart3 {...ICON} />, desc: "Summarise and describe my data only" },
    ],
    colors: [C.coral, C.teal, C.purple, C.yellow],
  },
  {
    key: "measurement_level",
    title: "Outcome signal type",
    subtitle: "Measurement level of your dependent variable.",
    options: [
      { value: "interval_ratio", label: "Continuous",  icon: <Ruler {...ICON} />, desc: "Height, reaction time, test score, biomarkers" },
      { value: "ordinal",        label: "Ordinal",     icon: <Medal {...ICON} />, desc: "Likert scales, ranked severity" },
      { value: "nominal",        label: "Categorical", icon: <Tag {...ICON} />,   desc: "Yes/No, species, treatment group" },
    ],
    colors: [C.teal, C.purple, C.coral],
  },
  {
    key: "design",
    title: "Study protocol",
    subtitle: "How were subjects assigned to conditions?",
    options: [
      { value: "independent", label: "Independent groups", icon: <Users {...ICON} />,   desc: "Different people in each condition" },
      { value: "paired",      label: "Repeated / paired",  icon: <Repeat {...ICON} />,  desc: "Same people across conditions or time" },
      { value: "mixed",       label: "Mixed",              icon: <Shuffle {...ICON} />, desc: "Both between and within factors" },
    ],
    colors: [C.coral, C.yellow, C.purple],
    skip: (a) => a.research_question_type !== "comparison",
  },
  {
    key: "n_groups",
    title: "Group count",
    subtitle: "Number of conditions or groups being compared.",
    options: [
      { value: 2, label: "2 groups",  icon: <Hash {...ICON} />, desc: "e.g. treatment vs. control" },
      { value: 3, label: "3 groups",  icon: <Hash {...ICON} />, desc: "One-way ANOVA territory" },
      { value: 4, label: "4+ groups", icon: <Hash {...ICON} />, desc: "Multi-condition design" },
    ],
    colors: [C.teal, C.coral, C.purple],
    skip: (a) => a.research_question_type !== "comparison",
  },
  {
    key: "sample_size",
    title: "Sample size",
    subtitle: "Central Limit Theorem kicks in around n = 30.",
    kind: "number",
    placeholder: "60",
  },
];

export default function Questionnaire() {
  const navigate = useNavigate();
  const { setProfile, setRecommendation, setAlpha } = useAnalysis();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ alpha: 0.05 });
  const [submitting, setSubmitting] = useState(false);

  const visibleSteps = Q_STEPS.filter(s => !s.skip || !s.skip(answers));
  const current = visibleSteps[step];
  const total = visibleSteps.length;
  const selected = answers[current?.key];
  const progress = ((step) / total) * 100;

  const handleSelect = (val) => setAnswers(a => ({ ...a, [current.key]: val }));

  const handleSubmit = async () => {
    const profile = {
      research_question_type: answers.research_question_type,
      research_question_text: "",
      measurement_level:      answers.measurement_level,
      binary_outcome:         false,
      n_groups:               Number(answers.n_groups || 2),
      n_predictors:           1,
      design:                 answers.design || "independent",
      sample_size:            Number(answers.sample_size || 30),
      sampling_method:        "random",
      has_covariates:         false,
      covariates:             "",
      alpha:                  0.05,
      multiple_comparisons:   false,
    };

    setSubmitting(true);
    try {
      const rec = await getRecommendation(profile);
      setProfile(profile);
      setRecommendation(rec);
      setAlpha(profile.alpha);
      toast.success(`Recommended: ${rec.primary.name}`);
      navigate("/upload");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.detail || "Could not get recommendation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (step < total - 1) setStep(s => s + 1);
    else handleSubmit();
  };

  const canProceed = current?.kind === "number"
    ? selected !== undefined && selected !== "" && Number(selected) > 0
    : selected !== undefined;

  if (submitting) {
    return (
      <div style={{ maxWidth: 560, margin: "80px auto 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <Spinner size={54} />
        <div style={{
          fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: 16,
          color: C.ink, textTransform: "uppercase", letterSpacing: "0.16em",
          textShadow: `0 0 16px ${C.coral}66`,
        }}>
          Routing Decision Tree
        </div>
        <div style={{
          fontFamily: "JetBrains Mono, monospace", color: C.coral,
          fontSize: 11, letterSpacing: "0.18em",
        }}>
          {">> ANALYZING DESIGN PROFILE..."}
        </div>
      </div>
    );
  }

  const treeSteps = visibleSteps.map(s => ({ key: s.key, label: TREE_LABEL_FOR_STEP[s.key] || s.key }));
  const treeValues = Object.fromEntries(
    treeSteps
      .filter(s => answers[s.key] !== undefined && answers[s.key] !== "")
      .map(s => [s.key, labelForAnswer(Q_STEPS, s.key, answers[s.key])])
  );

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)", gap: 36, alignItems: "flex-start" }}>
      <div>
        <div style={{ marginBottom: 28 }}>
          <div style={{
            display: "flex", justifyContent: "space-between", marginBottom: 8,
            fontFamily: "JetBrains Mono, monospace", fontSize: 10,
            letterSpacing: "0.18em", textTransform: "uppercase",
          }}>
            <span style={{ color: C.muted }}>QUERY {String(step + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
            <span style={{ color: C.coral }}>{Math.round(progress)}% COMPLETE</span>
          </div>
          <div style={{ height: 3, background: C.border, overflow: "hidden" }}>
            <motion.div
              animate={{ width: `${progress}%` }}
              style={{
                height: "100%",
                background: `linear-gradient(90deg, ${C.coral}, ${C.purple})`,
                boxShadow: `0 0 12px ${C.coral}`,
              }}
            />
          </div>
        </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
          <Card>
            <div style={{
              fontFamily: "JetBrains Mono, monospace", fontSize: 10,
              color: C.coral, letterSpacing: "0.2em", marginBottom: 6,
            }}>
              {">> QUERY_" + String(step + 1).padStart(3, "0")}
            </div>
            <h2 style={{
              fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: 22,
              color: C.ink, margin: "0 0 6px",
              textTransform: "uppercase", letterSpacing: "0.06em",
            }}>{current.title}</h2>
            <p style={{
              fontFamily: "Rajdhani, sans-serif", fontSize: 14,
              color: C.muted, margin: "0 0 24px",
            }}>{current.subtitle}</p>

            {current.kind === "number" ? (
              <Input
                type="number"
                min={2}
                placeholder={current.placeholder}
                value={selected ?? ""}
                onChange={(v) => handleSelect(v)}
                style={{ fontSize: 18 }}
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {current.options.map((opt, i) => (
                  <OptionCard
                    key={String(opt.value)}
                    label={opt.label}
                    desc={opt.desc}
                    icon={opt.icon}
                    selected={selected === opt.value}
                    onClick={() => handleSelect(opt.value)}
                    color={current.colors[i]}
                  />
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
          <Btn color={C.navy} outline onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>
            <ArrowLeft size={14} /> Back
          </Btn>
          <Btn onClick={handleNext} disabled={!canProceed}>
            {step < total - 1
              ? <>Next <ArrowRight size={14} /></>
              : <><Sparkles size={14} /> Generate Recommendation</>
            }
          </Btn>
        </div>
      </div>

      {/* Right column — live decision tree */}
      <div style={{ position: "sticky", top: 96 }}>
        <DecisionTreeViz
          steps={treeSteps}
          values={treeValues}
          activeIndex={step}
          width={360}
        />
      </div>
    </div>
  );
}
