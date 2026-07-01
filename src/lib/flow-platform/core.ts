import type { ConversationEngineConfig } from "@/lib/conversation/engine";
import type { FlowConversationProfile, FlowEntityDefinition, FlowIntentDefinition } from "./types";

export function buildConversationEngineConfig<TIntent extends string, TEntity extends string = never>(
  profile: FlowConversationProfile<TIntent, TEntity>,
): ConversationEngineConfig<TIntent, TEntity> {
  return {
    clarificationPrompt: profile.clarificationPrompt,
    entityRules: profile.entityDefinitions.map((entity) => ({
      entity: entity.entity,
      normalize: entity.normalize,
      patterns: entity.patterns,
    })),
    escalationIntents: profile.escalationIntents,
    fallbackIntent: profile.fallbackIntent,
    fallbackPrompt: profile.fallbackPrompt,
    followUpPrompts: Object.fromEntries(profile.intentDefinitions.map((definition) => [definition.intent, definition.followUpQuestion])) as Partial<Record<TIntent, string>>,
    intentRules: profile.intentDefinitions.map((definition) => ({
      intent: definition.intent,
      keywords: definition.keywords,
      priority: definition.priority,
    })),
  };
}

export function buildFollowUpPromptMap<TIntent extends string>(definitions: readonly FlowIntentDefinition<TIntent>[]) {
  return Object.fromEntries(definitions.map((definition) => [definition.intent, definition.followUpQuestion])) as Partial<Record<TIntent, string>>;
}

export function buildEntityRuleMap<TEntity extends string>(definitions: readonly FlowEntityDefinition<TEntity>[]) {
  return definitions.map((definition) => ({
    entity: definition.entity,
    normalize: definition.normalize,
    patterns: definition.patterns,
  }));
}

