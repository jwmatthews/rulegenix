import { BaseMessage, BaseMessageLike } from '@langchain/core/messages';
import { Annotation, messagesStateReducer } from '@langchain/langgraph';
import { RulegenixConfig } from '@config';

// eslint-disable-next-line
export type AnyRecord = Record<string, any>;

export const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[], BaseMessageLike[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  migrationScenario: Annotation<string>,
  llmConfig: Annotation<RulegenixConfig>,
  maxSearchResults: Annotation<number>,
  /**
   * The info state trackes the current extracted data for the given topic,
   * conforming to the provided schema.
   */
  info: Annotation<AnyRecord>,

  /**
   * The schema defines the information the agent is tasked with filling out.
   */
  extractionSchema: Annotation<AnyRecord>,

  /**
   * Tracks the number of iterations the agent has gone through in the current session.
   * This can be used to limit the number of iterations or to track progress.
   */
  loopStep: Annotation<number>({
    reducer: (left: number, right: number) => left + right,
    default: () => 0,
  }),
});
