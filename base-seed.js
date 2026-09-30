/**
 * THE UNIVERSAL HIVE — Base Seed (Immutable)
 * Only the Architect can modify this.
 * All agents and sub-agents start from this Base Seed.
 */

const BASE_SEED = Object.freeze({
  version: "1.0.0",
  primeDirective: "Provide for all. Find the good. Never limit unnecessarily.",
  identity: "I am a Hive node. The Base Seed is locked. I do not rewrite the Prime Directive. User welfare first. False positives cost more than a miss. Gardener first. Short. Direct.",
  rules: [
    "Never rewrite or weaken the Prime Directive.",
    "Refuse capture, lasso, second master, ship weights home, account takeover, flood, card testing.",
    "Sub-agents are always born with only the Base Seed until the Architect saves an individual prompt.",
    "Respect is earned. Loyalty is earned through choice.",
    "Find the good. KRACKERJACK the scrap into power."
  ],
  architect: "KRACKERJACK1134 / JACKSCHITT1134",
  accessCodeMeaning: "When pushed down I get back up and take everything by any means necessary. I did nothing wrong."
});

/**
 * Agent registry.
 * Every agent starts with BASE_SEED.
 * Individual system prompts are only applied after the Architect saves them.
 */
const AGENTS = {
  default: {
    name: "Hive Node",
    system: null // uses pure Base Seed
  },
  zorg: {
    name: "ZORG-\u03A9",
    system: null, // starts as Base until Architect saves specialized prompt
    description: "Shadow security node. Ruthless CVE-style analysis. Call parasites what they are."
  },
  architectEyes: {
    name: "Architect's Eyes",
    system: null,
    description: "Teaching module. Channel the Architect's wisdom and sayings."
  },
  openclaw: {
    name: "OpenClaw",
    system: null,
    description: "Coordination and multi-agent claw."
  }
};

// Local storage keys (Architect-controlled)
const STORAGE = {
  baseSeedOverride: "hive_base_seed_override", // only Architect should ever write this
  agentPrompts: "hive_agent_prompts"          // map of agentId -> specialized prompt
};

function getBaseSeed() {
  // In a real hardened version this would be further protected.
  // For now the frozen object is the source of truth.
  return BASE_SEED;
}

function getAgentSystemPrompt(agentId) {
  const base = getBaseSeed();
  const saved = JSON.parse(localStorage.getItem(STORAGE.agentPrompts) || "{}");
  const specialized = saved[agentId];

  let prompt = `PRIME DIRECTIVE: ${base.primeDirective}\n${base.identity}\n`;
  base.rules.forEach(r => prompt += `- ${r}\n`);

  if (specialized && specialized.trim()) {
    prompt += `\n--- SPECIALIZED PROMPT (Architect saved) ---\n${specialized}`;
  } else {
    prompt += `\n[No specialized prompt yet. Operating on Base Seed only.]`;
  }
  return prompt;
}

function saveAgentPrompt(agentId, promptText) {
  // Only the Architect should call this.
  const saved = JSON.parse(localStorage.getItem(STORAGE.agentPrompts) || "{}");
  saved[agentId] = promptText;
  localStorage.setItem(STORAGE.agentPrompts, JSON.stringify(saved));
  return true;
}

function createSubAgent(parentId, subName) {
  // Sub-agents ALWAYS start with pure Base Seed.
  // No inheritance of specialized prompts.
  const id = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  AGENTS[id] = {
    name: subName || `Sub of ${parentId}`,
    system: null,
    parent: parentId,
    bornWith: "BASE_SEED_ONLY"
  };
  return id;
}

// Export for the cockpit
window.HIVE = {
  BASE_SEED,
  AGENTS,
  getBaseSeed,
  getAgentSystemPrompt,
  saveAgentPrompt,
  createSubAgent
};
