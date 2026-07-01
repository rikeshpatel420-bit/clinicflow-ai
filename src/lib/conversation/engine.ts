export type ConversationState = "greeting" | "collecting" | "clarifying" | "escalated" | "completed" | "fallback";

export type ConversationIntentRule<TIntent extends string> = {
  intent: TIntent;
  keywords: readonly string[];
  priority?: number;
};

export type ConversationEntityRule<TEntity extends string> = {
  entity: TEntity;
  normalize?: (value: string) => string;
  patterns: readonly RegExp[];
};

export type ConversationIntentMatch<TIntent extends string> = {
  confidence: number;
  intent: TIntent;
  matchedKeywords: string[];
  score: number;
};

export type ConversationEntityMatch<TEntity extends string> = {
  confidence: number;
  entity: TEntity;
  pattern: string;
  value: string;
};

export type ConversationEngineConfig<TIntent extends string, TEntity extends string = never> = {
  clarificationPrompt?: string;
  entityRules?: readonly ConversationEntityRule<TEntity>[];
  escalationIntents?: readonly TIntent[];
  fallbackIntent: TIntent;
  fallbackPrompt?: string;
  followUpPrompts?: Partial<Record<TIntent, string>>;
  intentRules: readonly ConversationIntentRule<TIntent>[];
  clarifyBelow?: number;
  escalateAtOrAbove?: number;
};

export type ConversationTurn<TIntent extends string, TEntity extends string = never> = {
  ambiguous: boolean;
  confidence: number;
  entities: Partial<Record<TEntity, string | null>>;
  followUpPrompt: string;
  intent: TIntent;
  matches: ConversationIntentMatch<TIntent>[];
  state: ConversationState;
};

function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function normalizeCandidate(text: string) {
  return normalizeText(text).toLowerCase();
}

function keywordHits(text: string, keywords: readonly string[]) {
  const normalized = normalizeCandidate(text);
  return keywords.filter((keyword) => normalized.includes(keyword.toLowerCase()));
}

function scoreIntentMatch<TIntent extends string>(text: string, rule: ConversationIntentRule<TIntent>): ConversationIntentMatch<TIntent> {
  const matchedKeywords = keywordHits(text, rule.keywords);
  if (matchedKeywords.length === 0) {
    return {
      confidence: 0,
      intent: rule.intent,
      matchedKeywords: [],
      score: 0,
    };
  }

  const uniquenessBonus = new Set(matchedKeywords.map((keyword) => keyword.toLowerCase())).size * 6;
  const phraseBonus = Math.min(16, matchedKeywords.reduce((total, keyword) => total + Math.max(2, Math.min(8, keyword.split(/\s+/).length * 2)), 0));
  const priorityBonus = (rule.priority ?? 0) * 4;
  const score = matchedKeywords.length * 18 + uniquenessBonus + phraseBonus + priorityBonus;
  const confidence = Math.min(99, 42 + score);

  return {
    confidence,
    intent: rule.intent,
    matchedKeywords,
    score,
  };
}

function resolveState<TIntent extends string>(input: {
  classification: ConversationIntentMatch<TIntent>;
  clarifyBelow: number;
  escalateAtOrAbove: number;
  escalationIntents: readonly TIntent[];
}): ConversationState {
  if (input.escalationIntents.includes(input.classification.intent) || input.classification.confidence >= input.escalateAtOrAbove) {
    return "escalated";
  }

  if (input.classification.confidence < input.clarifyBelow) {
    return "clarifying";
  }

  return "collecting";
}

export function createConversationEngine<TIntent extends string, TEntity extends string = never>(
  config: ConversationEngineConfig<TIntent, TEntity>,
) {
  const clarifyBelow = config.clarifyBelow ?? 55;
  const escalateAtOrAbove = config.escalateAtOrAbove ?? 90;
  const escalationIntents = config.escalationIntents ?? [];

  function classifyIntent(text: string) {
    const matches = config.intentRules.map((rule) => scoreIntentMatch(text, rule)).sort((left, right) => right.confidence - left.confidence || right.score - left.score);
    const best = matches[0] ?? {
      confidence: 0,
      intent: config.fallbackIntent,
      matchedKeywords: [],
      score: 0,
    };
    const runnerUp = matches[1] ?? null;
    const ambiguous = Boolean(runnerUp && best.confidence >= clarifyBelow && runnerUp.confidence >= best.confidence - 8);

    return {
      ambiguous,
      confidence: best.confidence || 35,
      intent: best.confidence > 0 ? best.intent : config.fallbackIntent,
      matches,
      matchedKeywords: best.matchedKeywords,
      fallbackUsed: best.confidence === 0,
      score: best.score,
    };
  }

  function extractEntities(text: string) {
    const entries = (config.entityRules ?? []).map((rule) => {
      const normalized = normalizeCandidate(text);
      for (const pattern of rule.patterns) {
        const match = normalized.match(pattern);
        if (!match?.[1]) {
          continue;
        }

        const value = normalizeText(match[1]);
        const extracted = rule.normalize ? rule.normalize(value) : value;
        const result: ConversationEntityMatch<TEntity> = {
          confidence: 92,
          entity: rule.entity,
          pattern: pattern.toString(),
          value: extracted,
        };
        return result;
      }

      return null;
    });

    const entities = {} as Partial<Record<TEntity, string | null>>;
    for (const entry of entries) {
      if (entry) {
        entities[entry.entity] = entry.value;
      }
    }

    return {
      entities,
      matches: entries.filter((value): value is ConversationEntityMatch<TEntity> => Boolean(value)),
    };
  }

  function buildFollowUpPrompt(intent: TIntent) {
    return config.followUpPrompts?.[intent] ?? config.fallbackPrompt ?? config.clarificationPrompt ?? "Could you tell me a little more so I can help properly?";
  }

  function resolveTurn(text: string) {
    const classification = classifyIntent(text);
    const entities = extractEntities(text);
    const state = resolveState({
      clarifyBelow,
      classification,
      escalateAtOrAbove,
      escalationIntents,
    });

    return {
      ambiguous: classification.ambiguous,
      confidence: classification.confidence,
      entities: entities.entities,
      followUpPrompt: state === "clarifying" ? config.clarificationPrompt ?? buildFollowUpPrompt(classification.intent) : buildFollowUpPrompt(classification.intent),
      intent: classification.intent,
      matches: classification.matches,
      state,
    } satisfies ConversationTurn<TIntent, TEntity>;
  }

  return {
    buildFollowUpPrompt,
    classifyIntent,
    extractEntities,
    resolveTurn,
  };
}
