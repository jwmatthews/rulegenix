import {
  BaseMessage,
  isAIMessage,
  isHumanMessage,
  isToolMessage,
  isSystemMessage,
} from '@langchain/core/messages';
import { MessageContent, MessageContentComplex } from '@langchain/core/messages';

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
