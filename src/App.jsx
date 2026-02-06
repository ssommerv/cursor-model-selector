import { useState, useCallback } from "react";

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

function Badge({ text, color, bg }) {
  return (
    <span
      style={{ background: bg, color, fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 999, letterSpacing: 0.3 }}
    >
      {text}
    </span>
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
        display: "flex",
        alignItems: "center",
        gap: 14,
        width: "100%",
        padding: "14px 18px",
        border: hovered ? "1.5px solid #6366F1" : "1.5px solid #E5E7EB",
        borderRadius: 12,
        background: hovered ? "#F5F3FF" : "#fff",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.15s ease",
        transform: hovered ? "translateY(-1px)" : "none",
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
      <button
        onClick={() => onNavigate(-1)}
        style={{ background: "none", border: "none", color: "#6366F1", cursor: "pointer", fontWeight: 500, padding: "2px 4px", borderRadius: 4 }}
      >
        Start
      </button>
      {path.map((step, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          {i < path.length - 1 ? (
            <button
              onClick={() => onNavigate(i)}
              style={{ background: "none", border: "none", color: "#6366F1", cursor: "pointer", fontWeight: 500, padding: "2px 4px", borderRadius: 4 }}
            >
              {step.choiceLabel}
            </button>
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
      borderRadius: 14,
      padding: 20,
      background: highlighted ? m.bg + "40" : "#fff",
      transition: "all 0.2s",
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

function ResultView({ resultKey, onReset, onNavigate, path }) {
  const r = RESULTS[resultKey];
  const m = MODELS[r.model];
  const [showAll, setShowAll] = useState(false);

  return (
    <div style={{ animation: "fadeSlideIn 0.3s ease both" }}>
      <Breadcrumbs path={path} onNavigate={onNavigate} />

      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#6366F1", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6 }}>
          Recommended Model
        </div>
        <div style={{ fontSize: 13, color: "#6B7280" }}>{r.title}</div>
      </div>

      <div style={{
        border: `2px solid ${m.color}`,
        borderRadius: 16,
        padding: 24,
        background: `linear-gradient(135deg, ${m.bg}30, ${m.bg}60)`,
        marginBottom: 20,
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
          {[
            { label: "Cost", value: m.cost },
            { label: "Speed", value: m.speed },
            { label: "Context", value: m.context },
            { label: "SWE-bench", value: m.swe },
          ].map((item, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.7)", borderRadius: 10, padding: "10px 14px" }}>
              <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{item.label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1F2937", marginTop: 2 }}>{item.value}</div>
            </div>
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

      <button
        onClick={() => setShowAll(!showAll)}
        style={{
          width: "100%",
          padding: "12px",
          border: "1.5px solid #E5E7EB",
          borderRadius: 10,
          background: "#fff",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600,
          color: "#6366F1",
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        {showAll ? "Hide" : "View"} Full Model Comparison
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: showAll ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><path d="M6 9l6 6 6-6"/></svg>
      </button>

      {showAll && (
        <div style={{ display: "grid", gap: 10, marginBottom: 16, animation: "fadeSlideIn 0.25s ease both" }}>
          {ALL_MODELS_ORDER.map((key) => (
            <ModelCard key={key} modelKey={key} highlighted={key === r.model} />
          ))}
        </div>
      )}

      <button
        onClick={onReset}
        style={{
          width: "100%",
          padding: "14px",
          border: "none",
          borderRadius: 10,
          background: "#6366F1",
          color: "#fff",
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        Start Over
      </button>
    </div>
  );
}

export default function CursorModelSelector() {
  const [currentNode, setCurrentNode] = useState("start");
  const [path, setPath] = useState([]);
  const [resultKey, setResultKey] = useState(null);

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

  const navigateTo = useCallback((index) => {
    if (index === -1) {
      setPath([]);
      setCurrentNode("start");
      setResultKey(null);
    } else {
      const newPath = path.slice(0, index + 1);
      const targetStep = path[index + 1];
      if (targetStep) {
        setPath(newPath);
        setCurrentNode(path[index + 1]?.nodeId || "start");
        setResultKey(null);
      }
    }
  }, [path]);

  const reset = useCallback(() => {
    setPath([]);
    setCurrentNode("start");
    setResultKey(null);
  }, []);

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
      `}</style>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "32px 20px 40px" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
            marginBottom: 14, boxShadow: "0 4px 14px rgba(99,102,241,0.25)"
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1F2937", marginBottom: 4 }}>Cursor Model Selector</h1>
          <p style={{ fontSize: 14, color: "#6B7280" }}>Answer a few questions to find the optimal model for your task</p>
        </div>

        {resultKey ? (
          <ResultView resultKey={resultKey} onReset={reset} path={path} onNavigate={(idx) => {
            if (idx === -1) { reset(); return; }
            const nextNodeId = path[idx + 1]?.nodeId;
            setPath(path.slice(0, idx + 1));
            setCurrentNode(nextNodeId || path[idx]?.nodeId || "start");
            setResultKey(null);
          }} />
        ) : (
          <div style={{ animation: "fadeSlideIn 0.3s ease both" }}>
            <Breadcrumbs path={path} onNavigate={(idx) => {
              if (idx === -1) { reset(); return; }
              const targetNodeId = path[idx + 1]?.nodeId;
              setPath(path.slice(0, idx + 1));
              setCurrentNode(targetNodeId || path[idx]?.nodeId || "start");
              setResultKey(null);
            }} />

            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 19, fontWeight: 700, color: "#1F2937", marginBottom: 4 }}>{node.question}</h2>
              <p style={{ fontSize: 13, color: "#9CA3AF" }}>{node.subtitle}</p>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {node.options.map((opt, i) => (
                <OptionCard
                  key={opt.label}
                  icon={opt.icon}
                  label={opt.label}
                  desc={opt.desc}
                  onClick={() => handleSelect(opt)}
                  index={i}
                />
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
                style={{
                  display: "flex", alignItems: "center", gap: 6, margin: "18px auto 0",
                  background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: 13, fontWeight: 500
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                Back
              </button>
            )}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 32, fontSize: 11, color: "#9CA3AF" }}>
          Based on SWE-bench, Aider, and Terminal-Bench benchmarks · Feb 2026
        </div>
      </div>
    </div>
  );
}