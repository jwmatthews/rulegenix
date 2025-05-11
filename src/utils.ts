import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
  isAIMessage,
  isHumanMessage,
  isToolMessage,
  isSystemMessage,
  MessageContent,
  MessageContentComplex,
} from '@langchain/core/messages';
import { log } from './logger';

export function messageToChatRole(msg: BaseMessage): 'user' | 'assistant' | 'system' | 'tool' {
  if (isHumanMessage(msg)) return 'user';
  if (isAIMessage(msg)) return 'assistant';
  if (isSystemMessage(msg)) return 'system';
  if (isToolMessage(msg)) return 'tool';
  throw new Error('Unknown message type');
}

/**
 * Helper function to extract text content from a complex message.
 *
 * @param content - The complex message content to process
 * @returns The extracted text content
 */
function getSingleTextContent(content: MessageContentComplex) {
  if (content?.type === 'text') {
    return content.text;
  } else if (content.type === 'array') {
    return content.content.map(getSingleTextContent).join(' ');
  }
  return '';
}

/**
 * Helper function to extract text content from various message types.
 *
 * @param content - The message content to process
 * @returns The extracted text content
 */
export function getTextContent(content: MessageContent): string {
  if (typeof content === 'string') {
    return content;
  } else if (Array.isArray(content)) {
    return content.map(getSingleTextContent).join(' ');
  }
  return '';
}

export type MixedMessageType = (BaseMessage | { role: string; content: string })[];
export function debugMessages(messages: MixedMessageType) {
  const dMsg = messages.map((m, i) => {
    if (m instanceof BaseMessage) {
      const dict = m.toDict();
      return {
        i,
        type: dict.type,
        tool_calls: (dict as any).tool_calls,
      };
    } else {
      return {
        i,
        type: m.role,
        tool_calls: undefined,
      };
    }
  });
  return dMsg;
}

/**
 * Prune tool use messages from a list of messages.
 *
 * @param messages - The list of messages to prune
 * @returns The pruned list of messages
 */
export function pruneToolUseMessages(messages: MixedMessageType[]): MixedMessageType[] {
  //
  // Need to remove prior tool use messages from the user message history
  // before invoking the model.  This addresses an issue seen with
  // Amazon Bedrock Converse and tool usage.
  // See: https://github.com/jwmatthews/rulegenix/issues/2
  //
  return messages.filter((m) => {
    if (m instanceof AIMessage) {
      const dict = m.toDict();
      return !((dict as any).tool_calls || (dict as any).tool_use);
    }
    return true;
  });
}

/*
Background reasoning.
- LangChain uses classes to model runtime behavior and method dispatch.
- LangGraph uses plain objects to support serializable, mergeable, persistent state machines.

We need to convert between the two formats.
- toBaseMessages() converts from LangGraph format to LangChain BaseMessage[]
- fromBaseMessages() converts from LangChain BaseMessage[] to LangGraph format

*/

/* TODO:

Working through what to store in the state.  Right now we have a mix of langchain 
expected BaseMessage in some places and then serialized message in others.
I need to get a better handle on what is going on here.

Then I need to remove the older history of tool_use calls to avoid problems with BedRock.

Once bedrock is working then I need to get the extract info working.
Then aggregate the info. 

I would like to aggregate info in a knowledge graph

Then output knowledge graph to rules.

Lets work to get a full pipeline implement of research to rule. 
Later need to handle performance on research to issue calls in parallel.


*/

type MessageRole = 'user' | 'assistant' | 'system' | 'tool';
export interface SerializableMessage {
  role: MessageRole;
  content: string;
  name?: string; // for tool messages
  tool_call_id?: string; // for tool messages
}

// Convert from LangGraph format to LangChain BaseMessage[]
export function toBaseMessages(serialized: SerializableMessage[]): BaseMessage[] {
  return serialized.map((m) => {
    switch (m.role) {
      case 'user':
        return new HumanMessage(m.content);
      case 'assistant':
        return new AIMessage(m.content);
      case 'system':
        return new SystemMessage(m.content);
      case 'tool':
        return new ToolMessage({
          content: m.content,
          name: m.name ?? 'unknown_tool',
          tool_call_id: m.tool_call_id ?? '',
        });
      default:
        throw new Error(`Unknown role: ${(m as any).role}`);
    }
  });
}

// Convert from BaseMessage[] to LangGraph-friendly format
export function fromBaseMessages(messages: BaseMessage[]): SerializableMessage[] {
  return messages.map((msg): SerializableMessage => {
    if (isHumanMessage(msg)) {
      return { role: 'user', content: getTextContent(msg.content) };
    } else if (isAIMessage(msg)) {
      // Note I ran into ts issues and guards not working as expected.
      // So I had to use type assertions to get the correct type.
      const m = msg as AIMessage;
      return { role: 'assistant', content: getTextContent(m.content) };
    } else if (isSystemMessage(msg)) {
      const m = msg as SystemMessage;
      return { role: 'system', content: getTextContent(m.content) };
    } else if (isToolMessage(msg)) {
      const m = msg as ToolMessage;
      return {
        role: 'tool',
        content: getTextContent(m.content),
        name: m.name,
        tool_call_id: m.tool_call_id,
      };
    } else {
      const m = msg as BaseMessage;
      throw new Error(`Unrecognized message type: ${m._getType?.()}`);
    }
  });
}
