import { useState, useCallback } from "react";

// ─── MODEL DATA ──────────────────────────────────────────────

const MODELS = {
  opus: {
    name: "Claude 4.5 Opus",
    color: "#7C3AED",
    bg: "#EDE9FE",
    cost: "$0.44/task",
    costLevel: "Highest (5x Sonnet)",
    context: "200k",
    speed: "Slower, but most thorough",
    badge: "Premium",
    strengths: ["Complex debugging", "Architecture decisions", "Novel problems", "Terminal-heavy ops"],
    swe: "74.4%",
    aider: "High",
  },
  sonnet: {
    name: "Claude 4.5 Sonnet",
    color: "#2563EB",
    bg: "#DBEAFE",
    cost: "$0.30/task",
    costLevel: "Best value-to-performance",
    context: "200k (1M in Max Mode)",
    speed: "2x faster than Opus",
    badge: "Default",
    strengths: ["90% of daily dev work", "Features & refactors", "Writing", "Large codebases"],
    swe: "70.6%",
    aider: "82.4%",
  },
  gpt: {
    name: "GPT-5.2 / Codex",
    color: "#059669",
    bg: "#D1FAE5",
    cost: "Medium-high",
    costLevel: "Medium-high",
    context: "272k",
    speed: "Fast",
    badge: "Reasoning",
    strengths: ["Math & abstract reasoning", "Multi-language editing", "100% AIME 2025", "Algorithms"],
    swe: "69-71.8%",
    aider: "88%",
  },
  geminiPro: {
    name: "Gemini 3 Pro",
    color: "#D97706",
    bg: "#FEF3C7",
    cost: "$0.22/task",
    costLevel: "Half of Opus",
    context: "200k / 1M",
    speed: "Fast",
    badge: "Value",
    strengths: ["Frontend development", "Budget-conscious projects", "General development"],
    swe: "74.2%",
    aider: "Good",
  },
  flash: {
    name: "Gemini 3 Flash",
    color: "#DC2626",
    bg: "#FEE2E2",
    cost: "$0.08/task",
    costLevel: "Cheapest",
    context: "200k / 1M",
    speed: "Extremely fast",
    badge: "Speed",
    strengths: ["Quick edits", "Boilerplate", "High-volume tasks", "Documentation"],
    swe: "63.8%",
    aider: "Good",
  },
  sonnet1m: {
    name: "Claude 4.5 Sonnet (1M Max)",
    color: "#4F46E5",
    bg: "#E0E7FF",
    cost: "$0.30/task + context",
    costLevel: "Moderate (context costs extra)",
    context: "1M tokens",
    speed: "2x faster than Opus",
    badge: "Large Context",
    strengths: ["Enterprise monorepos", "Legacy codebases", "Multi-file refactors", "Codebase migrations"],
    swe: "70.6%",
    aider: "82.4%",
  },
};

// ─── COST CALCULATOR DATA ────────────────────────────────────

const COST_NUMERIC = {
  opus: 0.44,
  sonnet: 0.30,
  gpt: 0.35,
  geminiPro: 0.22,
  flash: 0.08,
  sonnet1m: 0.40,
};

const TASK_CATEGORIES = [
  { key: "simpleEdits", label: "Simple Edits", desc: "Quick fixes, boilerplate, configs", icon: "\u26A1", recommended: "flash" },
  { key: "routineCoding", label: "Routine Coding", desc: "Features, APIs, CRUD, tests", icon: "\u{1F4BB}", recommended: "sonnet" },
  { key: "debugging", label: "Debugging", desc: "Bug fixes, error investigation", icon: "\u{1F41B}", recommended: "sonnet" },
  { key: "architecture", label: "Architecture", desc: "System design, tech decisions", icon: "\u{1F3D7}\uFE0F", recommended: "opus" },
  { key: "math", label: "Math / Reasoning", desc: "Algorithms, calculations", icon: "\u{1F9EE}", recommended: "gpt" },
  { key: "writing", label: "Writing", desc: "Docs, marketing, creative", icon: "\u270D\uFE0F", recommended: "sonnet" },
];

// ─── BENCHMARK DATA ──────────────────────────────────────────

const BENCHMARKS = {
  swe: {
    name: "SWE-bench Verified",
    short: "SWE-bench",
    description: "Real-world GitHub issue resolution",
    detail: "Models are given actual resolved GitHub issues from popular open-source projects and must produce working patches. Measures the ability to understand issue context, trace through code, identify root causes, and implement correct fixes across real codebases.",
    weight: "High \u2014 directly reflects real development work",
    scoring: "Percentage of issues correctly resolved end-to-end",
    scores: { opus: 74.4, sonnet: 70.6, gpt: 70.4, geminiPro: 74.2, flash: 63.8, sonnet1m: 70.6 },
  },
  aider: {
    name: "Aider Benchmark",
    short: "Aider",
    description: "Multi-language code editing performance",
    detail: "Tests models on end-to-end code editing tasks across Python, JavaScript, TypeScript, and other languages. Models must make coherent, targeted changes to existing code while preserving surrounding context and functionality.",
    weight: "High \u2014 reflects actual daily editing work",
    scoring: "Percentage of edits that produce correct, working code",
    scores: { opus: 78, sonnet: 82.4, gpt: 88, geminiPro: 75, flash: 70, sonnet1m: 82.4 },
  },
  terminal: {
    name: "Terminal-Bench 2.0",
    short: "Terminal",
    description: "Terminal and bash operation capability",
    detail: "Evaluates the ability to write and debug shell scripts, manage file systems, and work with CLI tools. Important for DevOps tasks, infrastructure setup, and any workflow that involves terminal-heavy operations.",
    weight: "Medium \u2014 relevant for DevOps and infrastructure work",
    scoring: "Success rate on terminal operation challenges",
    scores: { opus: 90, sonnet: 82, gpt: 75, geminiPro: 72, flash: 65, sonnet1m: 82 },
  },
  aime: {
    name: "AIME 2025",
    short: "AIME",
    description: "Advanced mathematical reasoning",
    detail: "The American Invitational Mathematics Examination tests contest-level mathematical problem solving. Problems require multi-step reasoning, creative insight, and precise calculation. GPT-5.2 achieved a perfect 100%, making it the standout for math-heavy work.",
    weight: "Medium \u2014 only relevant for math-heavy tasks",
    scoring: "Percentage of contest problems solved correctly",
    scores: { opus: 85, sonnet: 72, gpt: 100, geminiPro: 65, flash: 48, sonnet1m: 72 },
  },
};

const BENCHMARK_ORDER = ["swe", "aider", "terminal", "aime"];
const CALC_MODELS = ["opus", "sonnet", "gpt", "geminiPro", "flash"];

// ─── DECISION TREE ───────────────────────────────────────────

const TREE = {
  start: {
    question: "What kind of work are you doing?",
    subtitle: "Select the category that best matches your current task",
    options: [
      { label: "Writing Code", desc: "Features, APIs, refactoring", icon: "\u{1F4BB}", next: "coding_type" },
      { label: "Debugging", desc: "Finding and fixing bugs", icon: "\u{1F41B}", next: "debug_complexity" },
      { label: "Architecture & Design", desc: "System design, tech decisions", icon: "\u{1F3D7}\uFE0F", next: "result:architecture" },
      { label: "Math & Reasoning", desc: "Algorithms, calculations", icon: "\u{1F9EE}", next: "result:math" },
      { label: "Writing Content", desc: "Docs, marketing, creative", icon: "\u270D\uFE0F", next: "writing_type" },
      { label: "Quick Edits / Boilerplate", desc: "Configs, small changes", icon: "\u26A1", next: "result:quick" },
      { label: "Large Codebase (1M+)", desc: "Enterprise monorepos", icon: "\u{1F4E6}", next: "large_codebase" },
      { label: "Multi-Agent Planning", desc: "Assign models to agent roles", icon: "\u{1F916}", next: "multiagent" },
    ],
  },
  coding_type: {
    question: "What type of coding work?",
    subtitle: "Helps determine the right balance of power vs. cost",
    options: [
      { label: "Routine Development", desc: "Standard features, APIs, CRUD, tests", icon: "\u{1F527}", next: "budget_coding" },
      { label: "Complex / Novel Problems", desc: "New patterns, unfamiliar territory", icon: "\u{1F9E9}", next: "result:complex_coding" },
      { label: "High-Volume / Batch", desc: "Many similar tasks at scale", icon: "\u{1F4CA}", next: "result:batch_coding" },
    ],
  },
  budget_coding: {
    question: "Is budget a primary concern?",
    subtitle: "This may shift the recommendation to a more cost-effective option",
    options: [
      { label: "Quality First", desc: "Best results, cost is secondary", icon: "\u{1F3AF}", next: "result:routine_coding" },
      { label: "Budget-Conscious", desc: "Good results, minimize cost", icon: "\u{1F4B0}", next: "result:budget_coding" },
    ],
  },
  debug_complexity: {
    question: "How complex is the bug?",
    subtitle: "Be honest \u2014 escalating early saves more time than you'd think",
    options: [
      { label: "Simple", desc: "Clear error message, stack trace, obvious fix", icon: "\u{1F7E2}", next: "result:debug_simple" },
      { label: "Medium", desc: "Multi-file, state issues, async problems", icon: "\u{1F7E1}", next: "result:debug_medium" },
      { label: "Complex / Stuck", desc: "Race conditions, memory leaks, stuck 30+ min", icon: "\u{1F534}", next: "result:debug_complex" },
    ],
  },
  writing_type: {
    question: "What kind of writing?",
    subtitle: "Different writing tasks benefit from different model strengths",
    options: [
      { label: "Technical Documentation", desc: "README, API docs, comments, specs", icon: "\u{1F4DD}", next: "docs_depth" },
      { label: "Creative / Marketing", desc: "Blog posts, copy, emails, social", icon: "\u{1F3A8}", next: "result:creative_writing" },
      { label: "Fiction Writing", desc: "Stories, worldbuilding, dialogue, narrative", icon: "\u{1F4D6}", next: "fiction_depth" },
    ],
  },
  docs_depth: {
    question: "How comprehensive are the docs?",
    subtitle: "Quick inline comments vs. full architecture documentation",
    options: [
      { label: "Quick / Simple", desc: "Inline comments, basic README", icon: "\u{1F4CB}", next: "result:docs_simple" },
      { label: "Comprehensive", desc: "Full API docs, architecture guides", icon: "\u{1F4DA}", next: "result:docs_comprehensive" },
    ],
  },
  fiction_depth: {
    question: "What kind of fiction work?",
    subtitle: "Longer and more complex narratives benefit from deeper reasoning",
    options: [
      { label: "Short-Form", desc: "Short stories, scenes, dialogue snippets", icon: "\u{1F4C4}", next: "result:fiction_short" },
      { label: "Long-Form / Complex", desc: "Novels, multi-chapter, deep worldbuilding", icon: "\u{1F4DA}", next: "result:fiction_long" },
    ],
  },
  large_codebase: {
    question: "Does it also involve complex architecture?",
    subtitle: "Large repos sometimes need deep architectural reasoning too",
    options: [
      { label: "Standard Work in Large Repo", desc: "Features, refactors, migrations", icon: "\u{1F4C1}", next: "result:large_standard" },
      { label: "Complex Architecture + Large Repo", desc: "Deep design issues in big codebase", icon: "\u{1F3DB}\uFE0F", next: "result:large_complex" },
    ],
  },
  multiagent: {
    question: "What agent role are you assigning?",
    subtitle: "Match model capability to agent responsibility",
    options: [
      { label: "Orchestrator / Planner", desc: "Coordinates agents, strategic decisions", icon: "\u{1F3AF}", next: "result:agent_orchestrator" },
      { label: "Worker / Executor", desc: "Implements features, routine coding", icon: "\u2699\uFE0F", next: "result:agent_worker" },
      { label: "Quick Task Runner", desc: "Boilerplate, configs, simple ops", icon: "\u26A1", next: "result:agent_quick" },
      { label: "Research / Analysis", desc: "Deep analysis, algorithms, profiling", icon: "\u{1F52C}", next: "result:agent_research" },
    ],
  },
};

// ─── RESULTS ─────────────────────────────────────────────────

const RESULTS = {
  architecture: {
    model: "opus",
    title: "Architecture & Design",
    why: "Opus excels at system-level thinking, producing clean and minimalist designs with fewer moving parts. Worth the premium for decisions that affect your entire project.",
    cases: ["System architecture", "Database schema design", "Evaluating trade-offs", "Microservice patterns", "Design pattern selection"],
    tip: "Use Opus for the initial design, then hand off implementation to Sonnet.",
    alts: [{ model: "gpt", note: "Good alternative for systems with heavy mathematical/algorithmic components" }],
  },
  math: {
    model: "gpt",
    title: "Math & Reasoning",
    why: "GPT-5.2 scored 100% on AIME 2025 and 88% on multi-language editing. Superior abstract reasoning capabilities.",
    cases: ["Algorithm implementation", "Complex calculations", "Data structure optimization", "Computational geometry", "Statistical analysis"],
    tip: "For pure math, GPT-5.2 is the clear winner. For math within a larger coding context, consider pairing with Sonnet.",
    alts: [{ model: "opus", note: "Strong reasoning too, better if math is embedded in complex architecture" }],
  },
  quick: {
    model: "flash",
    title: "Quick Edits & Boilerplate",
    why: "At $0.08/task and extremely fast speeds, Flash is perfect for straightforward tasks that don't require deep reasoning.",
    cases: ["Syntax fixes", "Boilerplate generation", "Variable renames", "Config files", "Simple code comments"],
    tip: "Batch multiple simple edits in one session for maximum efficiency.",
    alts: [{ model: "geminiPro", note: "Step up if Flash quality isn't quite cutting it" }],
  },
  routine_coding: {
    model: "sonnet",
    title: "Routine Development",
    why: "Sonnet handles 90% of professional development work with the best value-to-performance ratio. The workhorse of daily coding.",
    cases: ["Building features", "API endpoints", "Database queries", "Standard refactoring", "Code review", "Test writing"],
    tip: "This should be your default. Only escalate to Opus when genuinely stuck on a complex problem.",
    alts: [{ model: "geminiPro", note: "Viable budget alternative, especially for frontend-heavy work" }],
  },
  complex_coding: {
    model: "opus",
    title: "Complex / Novel Coding",
    why: "For problems requiring novel approaches or deep reasoning about unfamiliar patterns, Opus provides the most thorough analysis.",
    cases: ["Novel problem solving", "Complex system integration", "Performance-critical implementations", "Deep architectural coding"],
    tip: "Try Sonnet first for 2\u20133 attempts. If it's not getting there, escalate to Opus.",
    alts: [{ model: "sonnet", note: "Try Sonnet first \u2014 it handles more than you'd expect" }],
  },
  budget_coding: {
    model: "geminiPro",
    title: "Budget-Conscious Development",
    why: "Gemini 3 Pro delivers strong results at half the cost of Opus. 74.2% SWE-bench score \u2014 competitive on quality.",
    cases: ["General development", "Frontend work", "Open-source projects", "Learning projects", "Budget-constrained teams"],
    tip: "Gemini Pro is especially strong for frontend. Consider Sonnet if you need top-tier backend quality.",
    alts: [{ model: "sonnet", note: "Worth the upgrade for complex backend logic" }, { model: "flash", note: "Drop down further for truly simple tasks" }],
  },
  batch_coding: {
    model: "flash",
    title: "High-Volume / Batch Coding",
    why: "At $0.08/task, Flash is unbeatable for high-volume simple operations. Gemini Pro for moderate complexity at volume.",
    cases: ["Automated code generation at scale", "Batch processing", "CI/CD integration", "Many similar refactors"],
    tip: "Use Flash for ultra-simple tasks, upgrade to Gemini Pro for moderate complexity at volume.",
    alts: [{ model: "geminiPro", note: "Better quality for moderate complexity at only $0.22/task" }],
  },
  debug_simple: {
    model: "sonnet",
    title: "Simple Debugging",
    why: "Sonnet handles standard debugging efficiently \u2014 clear errors, stack traces, and common bug patterns are well within its capabilities.",
    cases: ["Syntax errors", "Simple logic bugs", "Clear stack traces", "Import/dependency issues", "Null pointer exceptions"],
    tip: "Paste the full error message and relevant code. Sonnet is great at pattern-matching common issues.",
    alts: [],
  },
  debug_medium: {
    model: "sonnet",
    title: "Medium Debugging",
    why: "Sonnet handles most medium bugs. Consider GPT-5.2 if the issue involves complex async logic or mathematical reasoning.",
    cases: ["Cross-file dependencies", "State management bugs", "Async/promise issues", "API integration problems"],
    tip: "If Sonnet doesn't solve it in 2\u20133 attempts, escalate to GPT-5.2 (logic) or Opus (architecture).",
    alts: [{ model: "gpt", note: "Better for complex async logic and mathematical reasoning" }],
  },
  debug_complex: {
    model: "opus",
    title: "Complex Debugging",
    why: "Opus's superior reasoning finds root causes that other models miss. When you've been stuck 30+ minutes, the 5x cost is absolutely worth it.",
    cases: ["Race conditions", "Memory leaks", "Performance bottlenecks", "Third-party library issues", "System-wide state bugs"],
    tip: "Always try Sonnet first. Escalate to Opus when 2\u20133 attempts fail. The savings add up.",
    alts: [{ model: "gpt", note: "Good for bugs with mathematical/algorithmic root causes" }],
  },
  creative_writing: {
    model: "sonnet",
    title: "Creative & Marketing Content",
    why: "Sonnet has excellent natural language quality and understands context and tone well. Great for user-facing content.",
    cases: ["Blog posts", "Marketing copy", "Product descriptions", "Email templates", "Social media content"],
    tip: "Provide examples of your brand voice for more consistent output.",
    alts: [],
  },
  fiction_short: {
    model: "sonnet",
    title: "Short-Form Fiction",
    why: "Sonnet's natural language quality, tonal range, and strong contextual understanding make it ideal for short stories, scenes, and character-driven pieces without the premium cost of Opus.",
    cases: ["Short stories", "Individual scenes or chapters", "Dialogue drafting", "Character sketches", "Flash fiction"],
    tip: "Give Sonnet a brief on voice, tone, and genre upfront. It adapts well to stylistic direction and stays consistent across a session.",
    alts: [{ model: "opus", note: "Worth it for literary fiction where every sentence needs to carry real weight" }],
  },
  fiction_long: {
    model: "opus",
    title: "Long-Form / Complex Fiction",
    why: "Opus's deep reasoning shines in long-form fiction where narrative coherence, layered character arcs, and complex worldbuilding need to stay consistent across many chapters. It produces more nuanced prose and catches thematic threads other models drop.",
    cases: ["Novel-length projects", "Multi-chapter continuity", "Deep worldbuilding", "Interwoven plot lines", "Literary or experimental fiction"],
    tip: "Pair Opus for planning and key chapters with Sonnet for filling in lighter connective scenes to manage cost.",
    alts: [{ model: "sonnet", note: "Handles most chapter drafting well \u2014 reserve Opus for pivotal scenes and structural planning" }],
  },
  docs_simple: {
    model: "flash",
    title: "Quick Documentation",
    why: "Flash handles simple docs quickly and cheaply \u2014 perfect for inline comments and basic READMEs.",
    cases: ["Inline code comments", "Simple README files", "Changelog entries", "Basic setup instructions"],
    tip: "For quick docs, speed matters more than depth. Flash gets the job done.",
    alts: [{ model: "sonnet", note: "Upgrade if you need more nuanced technical explanations" }],
  },
  docs_comprehensive: {
    model: "sonnet",
    title: "Comprehensive Documentation",
    why: "Sonnet produces thorough, well-structured documentation with good technical depth.",
    cases: ["Full API documentation", "Architecture guides", "Technical specifications", "User guides"],
    tip: "Use Sonnet for initial comprehensive docs, then Flash for maintenance updates.",
    alts: [{ model: "flash", note: "Fine for updates and small additions to existing docs" }],
  },
  large_standard: {
    model: "sonnet1m",
    title: "Large Codebase \u2014 Standard Work",
    why: "Sonnet's 1M token context in Max Mode handles enterprise-scale codebases while maintaining strong code quality.",
    cases: ["Enterprise monorepos", "Legacy codebase work", "Multi-file refactors", "Codebase-wide migrations"],
    tip: "Use 1M context only when genuinely needed. Most tasks work fine with the default 200k context.",
    alts: [{ model: "sonnet", note: "Use standard Sonnet (200k) when you don't need the full context" }],
  },
  large_complex: {
    model: "opus",
    title: "Large Codebase \u2014 Complex Architecture",
    why: "When a large codebase also has complex architectural issues, Opus's deep reasoning combined with targeted context is the best approach.",
    cases: ["Architectural refactoring in monorepos", "Complex dependency analysis", "System-wide design changes"],
    tip: "Use Sonnet (1M) to explore the codebase, then bring in Opus for architectural decisions.",
    alts: [{ model: "sonnet1m", note: "Start here for exploration, escalate to Opus for design decisions" }],
  },
  agent_orchestrator: {
    model: "opus",
    title: "Orchestrator / Planner Agent",
    why: "The orchestrator needs to reason about system-wide state, make architectural decisions, and coordinate specialized agents. Premium reasoning is essential here.",
    cases: ["System-wide coordination", "Architectural decisions", "Edge case handling", "Error recovery"],
    tip: "Orchestrator calls are infrequent but critical. Don't cheap out here \u2014 it directs all other agents.",
    alts: [{ model: "gpt", note: "Good alternative for systems with heavy mathematical components" }],
  },
  agent_worker: {
    model: "sonnet",
    title: "Worker / Execution Agent",
    why: "Worker agents do 70\u201380% of actual work. Sonnet's value-to-performance ratio makes it ideal for high-volume implementation.",
    cases: ["Feature implementation", "Routine coding tasks", "Executing within defined boundaries"],
    tip: "Worker agents handle the bulk of work. Sonnet's quality-to-cost ratio shines here.",
    alts: [{ model: "geminiPro", note: "Good for frontend-focused worker agents at lower cost" }],
  },
  agent_quick: {
    model: "flash",
    title: "Quick Task Agent",
    why: "For boilerplate, configs, and simple operations at high volume, Flash is unbeatable on speed and cost.",
    cases: ["Boilerplate generation", "File system operations", "Simple data transformations", "Config creation"],
    tip: "Pair with an Orchestrator (Opus) that decides when to delegate to the Quick Task Agent.",
    alts: [],
  },
  agent_research: {
    model: "gpt",
    title: "Research / Analysis Agent",
    why: "Deep analysis and algorithmic optimization benefit from GPT-5.2's superior reasoning. Opus is a strong alternative for architectural analysis.",
    cases: ["Deep codebase analysis", "Performance profiling", "Complex algorithmic decisions", "Mathematical optimization"],
    tip: "Use GPT-5.2 for math-heavy analysis, Opus for architecture-heavy analysis.",
    alts: [{ model: "opus", note: "Better for architectural analysis and system-level reasoning" }],
  },
};

const ALL_MODELS_ORDER = ["opus", "sonnet", "gpt", "geminiPro", "flash", "sonnet1m"];

// ─── SHARED COMPONENTS ───────────────────────────────────────

function Badge({ text, color, bg }) {
  return (
    <span style={{ background: bg, color, fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 999, letterSpacing: 0.3 }}>{text}</span>
  );
}

function OptionCard({ icon, label, desc, onClick, index }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "14px 18px",
        border: hovered ? "1.5px solid #6366F1" : "1.5px solid #E5E7EB", borderRadius: 12,
        background: hovered ? "#F5F3FF" : "#fff", cursor: "pointer", textAlign: "left",
        transition: "all 0.15s ease", transform: hovered ? "translateY(-1px)" : "none",
        boxShadow: hovered ? "0 4px 12px rgba(99,102,241,0.10)" : "0 1px 3px rgba(0,0,0,0.04)",
        animation: `fadeSlideIn 0.25s ease ${index * 0.04}s both`,
      }}
    >
      <span style={{ fontSize: 26, lineHeight: 1, flexShrink: 0, width: 36, textAlign: "center" }}>{icon}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 15, color: "#1F2937", marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.3 }}>{desc}</div>
      </div>
      <svg style={{ marginLeft: "auto", flexShrink: 0, color: hovered ? "#6366F1" : "#D1D5DB", transition: "color 0.15s" }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
    </button>
  );
}

function Breadcrumbs({ path, onNavigate }) {
  if (path.length === 0) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 20, fontSize: 13 }}>
      <button onClick={() => onNavigate(-1)} style={{ background: "none", border: "none", color: "#6366F1", cursor: "pointer", fontWeight: 500, padding: "2px 4px", borderRadius: 4 }}>Start</button>
      {path.map((step, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          {i < path.length - 1 ? (
            <button onClick={() => onNavigate(i)} style={{ background: "none", border: "none", color: "#6366F1", cursor: "pointer", fontWeight: 500, padding: "2px 4px", borderRadius: 4 }}>{step.choiceLabel}</button>
          ) : (
            <span style={{ color: "#374151", fontWeight: 600 }}>{step.choiceLabel}</span>
          )}
        </span>
      ))}
    </div>
  );
}

function ModelCard({ modelKey, highlighted }) {
  const m = MODELS[modelKey];
  return (
    <div style={{
      border: highlighted ? `2px solid ${m.color}` : "1.5px solid #E5E7EB",
      borderRadius: 14, padding: 20,
      background: highlighted ? m.bg + "40" : "#fff", transition: "all 0.2s",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: m.color, flexShrink: 0 }} />
        <span style={{ fontWeight: 700, fontSize: 17, color: "#1F2937" }}>{m.name}</span>
        <Badge text={m.badge} color={m.color} bg={m.bg} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px", fontSize: 13, color: "#4B5563" }}>
        <div><span style={{ color: "#9CA3AF" }}>Cost:</span> {m.cost}</div>
        <div><span style={{ color: "#9CA3AF" }}>Speed:</span> {m.speed}</div>
        <div><span style={{ color: "#9CA3AF" }}>Context:</span> {m.context}</div>
        <div><span style={{ color: "#9CA3AF" }}>SWE-bench:</span> {m.swe}</div>
      </div>
      <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
        {m.strengths.map((s, i) => (
          <span key={i} style={{ fontSize: 11, background: "#F3F4F6", color: "#4B5563", padding: "3px 10px", borderRadius: 999 }}>{s}</span>
        ))}
      </div>
    </div>
  );
}

// ─── TAB BAR ─────────────────────────────────────────────────

const TABS = [
  { key: "wizard", label: "Wizard", icon: "M12 2L2 7l10 5 10-5-10-5z|M2 17l10 5 10-5|M2 12l10 5 10-5" },
  { key: "calculator", label: "Calculator", icon: "M12 1v22|M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" },
  { key: "benchmarks", label: "Benchmarks", icon: "M18 20V10|M12 20V4|M6 20v-6" },
];

function TabBar({ activeTab, onChange }) {
  return (
    <div style={{ display: "flex", background: "#fff", borderRadius: 12, border: "1.5px solid #E5E7EB", marginBottom: 24, overflow: "hidden" }}>
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "12px 8px", border: "none", cursor: "pointer",
            background: activeTab === tab.key ? "#6366F1" : "transparent",
            color: activeTab === tab.key ? "#fff" : "#6B7280",
            fontWeight: activeTab === tab.key ? 600 : 500,
            fontSize: 13, transition: "all 0.15s ease",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {tab.icon.split("|").map((d, i) => <path key={i} d={d} />)}
          </svg>
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ─── COST CALCULATOR ─────────────────────────────────────────

function TaskSlider({ cat, value, onChange }) {
  return (
    <div style={{ background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "14px 16px", animation: "fadeSlideIn 0.25s ease both" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>{cat.icon}</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#1F2937" }}>{cat.label}</div>
            <div style={{ fontSize: 11, color: "#9CA3AF" }}>{cat.desc}</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: "#6366F1" }}>{value}</div>
          <div style={{ fontSize: 10, color: "#9CA3AF" }}>tasks/day</div>
        </div>
      </div>
      <input
        type="range" min="0" max="50" value={value} onChange={(e) => onChange(parseInt(e.target.value))}
        style={{ width: "100%", height: 6, accentColor: "#6366F1", cursor: "pointer" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#D1D5DB", marginTop: 2 }}>
        <span>0</span><span>25</span><span>50</span>
      </div>
    </div>
  );
}

function CostCalculatorView({ tasksPerDay, setTasksPerDay }) {
  const totalTasks = Object.values(tasksPerDay).reduce((s, v) => s + v, 0);

  const tieredMonthly = TASK_CATEGORIES.reduce((sum, cat) => {
    return sum + tasksPerDay[cat.key] * COST_NUMERIC[cat.recommended] * 30;
  }, 0);

  const singleModelCosts = CALC_MODELS.map((key) => ({
    key,
    model: MODELS[key],
    monthly: totalTasks * COST_NUMERIC[key] * 30,
  })).sort((a, b) => a.monthly - b.monthly);

  const mostExpensive = singleModelCosts[singleModelCosts.length - 1]?.monthly || 0;
  const savings = mostExpensive > 0 ? ((mostExpensive - tieredMonthly) / mostExpensive * 100) : 0;

  return (
    <div style={{ animation: "fadeSlideIn 0.3s ease both" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 19, fontWeight: 700, color: "#1F2937", marginBottom: 4 }}>Cost Calculator</h2>
        <p style={{ fontSize: 13, color: "#9CA3AF" }}>Set your daily task volume per category to estimate monthly spend</p>
      </div>

      <div style={{ display: "grid", gap: 10, marginBottom: 24 }}>
        {TASK_CATEGORIES.map((cat) => (
          <TaskSlider
            key={cat.key} cat={cat} value={tasksPerDay[cat.key]}
            onChange={(v) => setTasksPerDay((prev) => ({ ...prev, [cat.key]: v }))}
          />
        ))}
      </div>

      {totalTasks > 0 && (
        <>
          <div style={{
            border: "2px solid #6366F1", borderRadius: 16, padding: 20,
            background: "linear-gradient(135deg, #EEF2FF, #E0E7FF)", marginBottom: 16,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#6366F1", textTransform: "uppercase", letterSpacing: 1 }}>Tiered Approach</div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>Right model for each task type</div>
              </div>
              {savings > 0 && (
                <div style={{ background: "#059669", color: "#fff", padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                  Save {savings.toFixed(0)}%
                </div>
              )}
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#1F2937", marginBottom: 12 }}>
              ${tieredMonthly.toFixed(2)}<span style={{ fontSize: 14, fontWeight: 500, color: "#6B7280" }}>/month</span>
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              {TASK_CATEGORIES.filter((cat) => tasksPerDay[cat.key] > 0).map((cat) => {
                const m = MODELS[cat.recommended];
                const cost = tasksPerDay[cat.key] * COST_NUMERIC[cat.recommended] * 30;
                return (
                  <div key={cat.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, color: "#4B5563" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: m.color, flexShrink: 0 }} />
                      <span>{cat.label}</span>
                      <span style={{ color: "#9CA3AF" }}>\u2192 {m.name.split(" ").pop()}</span>
                    </div>
                    <span style={{ fontWeight: 600 }}>${cost.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
            vs. Single Model for Everything
          </div>
          <div style={{ display: "grid", gap: 8, marginBottom: 8 }}>
            {singleModelCosts.map(({ key, model, monthly }) => {
              const barWidth = mostExpensive > 0 ? (monthly / mostExpensive * 100) : 0;
              return (
                <div key={key} style={{ background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: model.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#1F2937" }}>{model.name}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: monthly > tieredMonthly ? "#DC2626" : "#059669" }}>
                      ${monthly.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ height: 6, background: "#F3F4F6", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${barWidth}%`, background: model.color, borderRadius: 3, transition: "width 0.3s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center" }}>
            {totalTasks} tasks/day \u00D7 30 days \u00B7 GPT-5.2 estimated at $0.35/task
          </div>
        </>
      )}

      {totalTasks === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#9CA3AF" }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>💰</div>
          <div style={{ fontSize: 14 }}>Move the sliders above to see cost estimates</div>
        </div>
      )}
    </div>
  );
}

// ─── BENCHMARK COMPONENTS ────────────────────────────────────

function BenchmarkBar({ benchKey, highlightModel }) {
  const bench = BENCHMARKS[benchKey];
  const maxScore = Math.max(...Object.values(bench.scores));
  const sortedModels = Object.entries(bench.scores)
    .sort(([, a], [, b]) => b - a);

  return (
    <div style={{ display: "grid", gap: 6 }}>
      {sortedModels.map(([modelKey, score]) => {
        const m = MODELS[modelKey];
        if (!m) return null;
        const pct = maxScore > 0 ? (score / maxScore * 100) : 0;
        const isHighlighted = modelKey === highlightModel;
        return (
          <div key={modelKey} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 80, fontSize: 11, color: isHighlighted ? "#1F2937" : "#6B7280", fontWeight: isHighlighted ? 700 : 500, textAlign: "right", flexShrink: 0 }}>
              {m.name.split(" ").slice(-1)[0]}
            </div>
            <div style={{ flex: 1, height: 20, background: "#F3F4F6", borderRadius: 6, overflow: "hidden", position: "relative" }}>
              <div style={{
                height: "100%", width: `${pct}%`, background: m.color,
                borderRadius: 6, transition: "width 0.4s ease",
                opacity: isHighlighted ? 1 : 0.6,
              }} />
              <span style={{
                position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                fontSize: 11, fontWeight: 700, color: pct > 60 ? "#fff" : "#374151",
              }}>
                {typeof score === "number" ? `${score}%` : score}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BenchmarkModal({ benchKey, onClose, highlightModel }) {
  const bench = BENCHMARKS[benchKey];
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        animation: "fadeSlideIn 0.2s ease both",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 16, padding: 24, maxWidth: 480, width: "100%",
          maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: "#1F2937" }}>{bench.name}</div>
            <div style={{ fontSize: 13, color: "#6366F1", fontWeight: 500 }}>{bench.description}</div>
          </div>
          <button onClick={onClose} style={{ background: "#F3F4F6", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div style={{ background: "#F9FAFB", borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
          {bench.detail}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
          <div style={{ background: "#EEF2FF", borderRadius: 10, padding: "10px 14px" }}>
            <div style={{ fontSize: 10, color: "#6366F1", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Relevance</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1F2937", marginTop: 2 }}>{bench.weight}</div>
          </div>
          <div style={{ background: "#F0FDF4", borderRadius: 10, padding: "10px 14px" }}>
            <div style={{ fontSize: 10, color: "#059669", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Scoring</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1F2937", marginTop: 2 }}>{bench.scoring}</div>
          </div>
        </div>

        <div style={{ fontWeight: 600, fontSize: 14, color: "#1F2937", marginBottom: 10 }}>Model Comparison</div>
        <BenchmarkBar benchKey={benchKey} highlightModel={highlightModel} />
      </div>
    </div>
  );
}

function BenchmarkExplorerView({ onSelectBenchmark }) {
  return (
    <div style={{ animation: "fadeSlideIn 0.3s ease both" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 19, fontWeight: 700, color: "#1F2937", marginBottom: 4 }}>Benchmark Explorer</h2>
        <p style={{ fontSize: 13, color: "#9CA3AF" }}>Tap any benchmark to see what it measures and how models compare</p>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        {BENCHMARK_ORDER.map((benchKey, idx) => {
          const bench = BENCHMARKS[benchKey];
          const topModel = Object.entries(bench.scores).sort(([, a], [, b]) => b - a)[0];
          const topM = MODELS[topModel[0]];
          return (
            <button
              key={benchKey}
              onClick={() => onSelectBenchmark(benchKey)}
              style={{
                background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 14, padding: 18,
                cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                animation: `fadeSlideIn 0.25s ease ${idx * 0.05}s both`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#1F2937" }}>{bench.name}</div>
                  <div style={{ fontSize: 12, color: "#6B7280" }}>{bench.description}</div>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 11, color: "#9CA3AF" }}>Leader:</span>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: topM.color }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "#1F2937" }}>{topM.name}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: topM.color }}>{topModel[1]}%</span>
              </div>

              <BenchmarkBar benchKey={benchKey} />
            </button>
          );
        })}
      </div>

      <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: 16, marginTop: 18, display: "flex", gap: 10 }}>
        <span style={{ fontSize: 18, lineHeight: 1 }}>💡</span>
        <div style={{ fontSize: 13, color: "#92400E", lineHeight: 1.5 }}>
          <strong>Reading benchmarks:</strong> No single benchmark tells the full story. SWE-bench and Aider reflect day-to-day coding most directly. AIME matters mainly for math-heavy work. Consider cost alongside performance.
        </div>
      </div>
    </div>
  );
}

// ─── RESULT VIEW (with tappable benchmarks) ──────────────────

function ResultView({ resultKey, onReset, onNavigate, path, onSelectBenchmark }) {
  const r = RESULTS[resultKey];
  const m = MODELS[r.model];
  const [showAll, setShowAll] = useState(false);

  const benchScoreItems = [
    { label: "Cost", value: m.cost, benchKey: null },
    { label: "Speed", value: m.speed, benchKey: null },
    { label: "SWE-bench", value: m.swe, benchKey: "swe" },
    { label: "Aider", value: m.aider, benchKey: "aider" },
  ];

  return (
    <div style={{ animation: "fadeSlideIn 0.3s ease both" }}>
      <Breadcrumbs path={path} onNavigate={onNavigate} />

      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#6366F1", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6 }}>Recommended Model</div>
        <div style={{ fontSize: 13, color: "#6B7280" }}>{r.title}</div>
      </div>

      <div style={{
        border: `2px solid ${m.color}`, borderRadius: 16, padding: 24,
        background: `linear-gradient(135deg, ${m.bg}30, ${m.bg}60)`, marginBottom: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: m.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 22, color: "#1F2937" }}>{m.name}</div>
            <Badge text={m.badge} color={m.color} bg={m.bg} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 18 }}>
          {benchScoreItems.map((item, i) => (
            item.benchKey ? (
              <button
                key={i}
                onClick={() => onSelectBenchmark(item.benchKey)}
                style={{
                  background: "rgba(255,255,255,0.7)", borderRadius: 10, padding: "10px 14px",
                  border: "1.5px solid transparent", cursor: "pointer", textAlign: "left",
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = "#6366F1"}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = "transparent"}
              >
                <div style={{ fontSize: 11, color: "#6366F1", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 4 }}>
                  {item.label}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1F2937", marginTop: 2 }}>{item.value}</div>
              </button>
            ) : (
              <div key={i} style={{ background: "rgba(255,255,255,0.7)", borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{item.label}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1F2937", marginTop: 2 }}>{item.value}</div>
              </div>
            )
          ))}
        </div>

        <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.6 }}>{r.why}</div>
      </div>

      <div style={{ display: "grid", gap: 16, marginBottom: 20 }}>
        <div style={{ background: "#F9FAFB", borderRadius: 12, padding: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: "#1F2937", marginBottom: 10 }}>Use Cases</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {r.cases.map((c, i) => (
              <span key={i} style={{ fontSize: 12, background: "#fff", border: "1px solid #E5E7EB", color: "#374151", padding: "4px 12px", borderRadius: 999 }}>{c}</span>
            ))}
          </div>
        </div>

        <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: 16, display: "flex", gap: 10 }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>💡</span>
          <div style={{ fontSize: 13, color: "#92400E", lineHeight: 1.5 }}><strong>Pro Tip:</strong> {r.tip}</div>
        </div>

        {r.alts.length > 0 && (
          <div style={{ background: "#F9FAFB", borderRadius: 12, padding: 18 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#1F2937", marginBottom: 10 }}>Alternatives to Consider</div>
            <div style={{ display: "grid", gap: 8 }}>
              {r.alts.map((alt, i) => {
                const am = MODELS[alt.model];
                return (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: "10px 14px" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: am.color, marginTop: 5, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#1F2937" }}>{am.name}</div>
                      <div style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.4 }}>{alt.note}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <button onClick={() => setShowAll(!showAll)} style={{
        width: "100%", padding: "12px", border: "1.5px solid #E5E7EB", borderRadius: 10, background: "#fff",
        cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#6366F1", marginBottom: 12,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
      }}>
        {showAll ? "Hide" : "View"} Full Model Comparison
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: showAll ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><path d="M6 9l6 6 6-6"/></svg>
      </button>

      {showAll && (
        <div style={{ display: "grid", gap: 10, marginBottom: 16, animation: "fadeSlideIn 0.25s ease both" }}>
          {ALL_MODELS_ORDER.map((key) => <ModelCard key={key} modelKey={key} highlighted={key === r.model} />)}
        </div>
      )}

      <button onClick={onReset} style={{
        width: "100%", padding: "14px", border: "none", borderRadius: 10, background: "#6366F1",
        color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        Start Over
      </button>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────

export default function CursorModelSelector() {
  const [currentNode, setCurrentNode] = useState("start");
  const [path, setPath] = useState([]);
  const [resultKey, setResultKey] = useState(null);
  const [activeTab, setActiveTab] = useState("wizard");
  const [selectedBenchmark, setSelectedBenchmark] = useState(null);
  const [tasksPerDay, setTasksPerDay] = useState({
    simpleEdits: 0, routineCoding: 0, debugging: 0, architecture: 0, math: 0, writing: 0,
  });

  const handleSelect = useCallback((option) => {
    const newPath = [...path, { nodeId: currentNode, choiceLabel: option.label }];
    if (option.next.startsWith("result:")) {
      setPath(newPath);
      setResultKey(option.next.replace("result:", ""));
    } else {
      setPath(newPath);
      setCurrentNode(option.next);
    }
  }, [path, currentNode]);

  const reset = useCallback(() => {
    setPath([]);
    setCurrentNode("start");
    setResultKey(null);
  }, []);

  const handleBreadcrumbNav = useCallback((idx) => {
    if (idx === -1) { reset(); return; }
    const nextNodeId = path[idx + 1]?.nodeId;
    setPath(path.slice(0, idx + 1));
    setCurrentNode(nextNodeId || path[idx]?.nodeId || "start");
    setResultKey(null);
  }, [path, reset]);

  const node = TREE[currentNode];

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #F8FAFC 0%, #EEF2FF 100%)", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button:hover { opacity: 0.95; }
        input[type=range] { -webkit-appearance: none; appearance: none; background: #E5E7EB; border-radius: 3px; outline: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px; border-radius: 50%; background: #6366F1; cursor: pointer; border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.2); }
      `}</style>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "32px 20px 40px" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
            marginBottom: 14, boxShadow: "0 4px 14px rgba(99,102,241,0.25)",
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1F2937", marginBottom: 4 }}>Cursor Model Selector</h1>
          <p style={{ fontSize: 14, color: "#6B7280" }}>Find the optimal model for your task, estimate costs, and explore benchmarks</p>
        </div>

        <TabBar activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === "wizard" && (
          resultKey ? (
            <ResultView
              resultKey={resultKey} onReset={reset} path={path}
              onNavigate={handleBreadcrumbNav}
              onSelectBenchmark={(key) => setSelectedBenchmark(key)}
            />
          ) : (
            <div style={{ animation: "fadeSlideIn 0.3s ease both" }}>
              <Breadcrumbs path={path} onNavigate={handleBreadcrumbNav} />
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 19, fontWeight: 700, color: "#1F2937", marginBottom: 4 }}>{node.question}</h2>
                <p style={{ fontSize: 13, color: "#9CA3AF" }}>{node.subtitle}</p>
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {node.options.map((opt, i) => (
                  <OptionCard key={opt.label} icon={opt.icon} label={opt.label} desc={opt.desc} onClick={() => handleSelect(opt)} index={i} />
                ))}
              </div>
              {path.length > 0 && (
                <button
                  onClick={() => {
                    if (path.length <= 1) { reset(); return; }
                    const prev = path[path.length - 1];
                    setPath(path.slice(0, -1));
                    setCurrentNode(prev.nodeId);
                    setResultKey(null);
                  }}
                  style={{ display: "flex", alignItems: "center", gap: 6, margin: "18px auto 0", background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: 13, fontWeight: 500 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                  Back
                </button>
              )}
            </div>
          )
        )}

        {activeTab === "calculator" && (
          <CostCalculatorView tasksPerDay={tasksPerDay} setTasksPerDay={setTasksPerDay} />
        )}

        {activeTab === "benchmarks" && (
          <BenchmarkExplorerView onSelectBenchmark={(key) => setSelectedBenchmark(key)} />
        )}

        <div style={{ textAlign: "center", marginTop: 32, fontSize: 11, color: "#9CA3AF" }}>
          Based on SWE-bench, Aider, and Terminal-Bench benchmarks \u00B7 Feb 2026
        </div>
      </div>

      {selectedBenchmark && (
        <BenchmarkModal
          benchKey={selectedBenchmark}
          onClose={() => setSelectedBenchmark(null)}
          highlightModel={resultKey ? RESULTS[resultKey]?.model : null}
        />
      )}
    </div>
  );
}
