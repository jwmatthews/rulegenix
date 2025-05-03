import { BaseMessage, BaseMessageLike } from '@langchain/core/messages';
import { Annotation, messagesStateReducer } from '@langchain/langgraph';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';

export const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[], BaseMessageLike[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  research_topic: Annotation<string>,
  chat_model: Annotation<BaseChatModel>,
});
