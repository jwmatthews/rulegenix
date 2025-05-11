import { RunnableConfig } from '@langchain/core/runnables';
import { StateAnnotation } from './state.js';
import { AIMessage } from '@langchain/core/messages';
import { ToolMessage, isBaseMessage } from '@langchain/core/messages';
import { z } from 'zod';
import { INFO_PROMPT } from './prompts.js';
import { tool } from '@langchain/core/tools';
import { TavilySearch } from '@langchain/tavily';
import { getChatModel } from '@llm';
import { getTextContent } from '@utils';
import { log } from '../../logger';
import { debugMessages } from '../../utils';

export function initializeTools(state: typeof StateAnnotation.State, config: RunnableConfig) {
  const { llmConfig, maxSearchResults } = state;

  const searchTool = new TavilySearch({
    maxResults: maxSearchResults,
    includeAnswer: true,
    includeRawContent: true,
    includeImages: false,
    searchDepth: 'advanced',
  });

  async function fetchURL({ url }: { url: string }): Promise<string> {
    const response = await fetch(url);
    const content = await response.text();
    const truncatedContent = content.slice(0, 50000); // TODO: make this dynamic
    const p = INFO_PROMPT.replace('{info}', JSON.stringify(state.extractionSchema, null, 2))
      .replace('{url}', url)
      .replace('{content}', truncatedContent);
    const chatModel = getChatModel(llmConfig);
    const result = await chatModel.invoke(p, config);
    return getTextContent(result.content);
  }

  const fetchTool = tool(fetchURL, {
    name: 'fetchURL',
    description: 'Fetch content from a given URL',
    schema: z.object({
      url: z.string().url().describe('The URL of the website to fetch'),
    }),
  });

  return [searchTool, fetchTool];
}

export const toolNode = async (state: typeof StateAnnotation.State, config: RunnableConfig) => {
  const message = state.messages[state.messages.length - 1];
  log.debug('toolNode: message:', message);
  log.info('toolNode: debugMessages:', debugMessages([message]));
  const tools = initializeTools(state, config);
  const outputs = await Promise.all(
    (message as AIMessage).tool_calls?.map(async (call) => {
      const tool = tools.find((tool) => tool.name === call.name);
      try {
        if (tool === undefined) {
          throw new Error(`Tool "${call.name}" not found.`);
        }
        const newCall = {
          ...call,
          args: {
            __state: state,
            ...call.args,
          },
        };
        log.info('Tool call:', newCall['name'], newCall['id']);
        const output = await tool.invoke({ ...newCall, type: 'tool_call' }, config);
        log.info('Tool call succeeded:', output['name'], output['tool_call_id']);
        if (isBaseMessage(output) && output._getType() === 'tool') {
          return output;
        } else {
          return new ToolMessage({
            name: tool.name,
            content: typeof output === 'string' ? output : JSON.stringify(output),
            tool_call_id: call.id ?? '',
          });
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        return new ToolMessage({
          content: `Error: ${e.message}\n Please fix your mistakes.`,
          name: call.name,
          tool_call_id: call.id ?? '',
          status: 'error',
        });
      }
    }) ?? [],
  );

  return { messages: outputs };
};
