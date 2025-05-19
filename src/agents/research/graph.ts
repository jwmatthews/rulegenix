import { StateGraph } from '@langchain/langgraph';
import { RunnableConfig } from '@langchain/core/runnables';
import { AIMessage, HumanMessage } from '@langchain/core/messages';
import { StateAnnotation } from './state.js';
import { getChatModel } from '@llm';
import { initializeTools, toolNode } from './tools.js';
import { MAIN_PROMPT, system_prompt } from './prompts.js';
import { log } from '../../logger';
import { debugMessages, pruneToolUseMessages, toBaseMessages } from '../../utils';
/**
 * Define a node, these do the work of the graph and should have most of the logic.
 * Must return a subset of the properties set in StateAnnotation.
 * @param state The current state of the graph.
 * @param config Extra parameters passed into the state graph.
 * @returns Some subset of parameters of the graph state, used to update the state
 * for the edges and nodes executed next.
 */
const callModel = async (
  state: typeof StateAnnotation.State,
  _config: RunnableConfig,
): Promise<typeof StateAnnotation.Update> => {
  const { llmConfig, migrationScenario, messages = [] } = state;

  const rawModel = getChatModel(llmConfig);
  if (!rawModel.bindTools) {
    throw new Error('Chat model does not support tool binding');
  }
  const tools = initializeTools(state, _config);

  //log.info('Binding tools...', tools);
  const chatModel = rawModel.bindTools([...tools], {
    tool_choice: 'auto',
  });

  //const p = MAIN_PROMPT.replace('{info}', JSON.stringify(state.extractionSchema, null, 2)).replace(
  const p = system_prompt
    .replace('{info}', JSON.stringify(state.extractionSchema, null, 2))
    .replace('{scenario}', state.migrationScenario);

  const userMessages = [{ role: 'user', content: p }, ...state.messages];
  const startTime = performance.now();
  log.info('userMessages:', userMessages);
  log.info('debugMessages(userMessages):', debugMessages(userMessages));
  const response: AIMessage = await chatModel.invoke(userMessages, _config);
  log.info('response:', response);
  const responseMessages = [response];
  const endTime = performance.now();
  log.info(`Model invocation took ${endTime - startTime} milliseconds`);
  log.info(`Response: ${response.content}`);

  let info;
  if ((response?.tool_calls && response.tool_calls?.length) || 0) {
    for (const tool_call of response.tool_calls || []) {
      if (tool_call.name === 'Info') {
        info = tool_call.args;
        // If info was called, the agent is submitting a response.
        // (it's not actually a function to call, it's a schema to extract)
        // To ensure that the graph doesn'tend up in an invalid state
        // (where the AI has called tools but no tool message has been provided)
        // we will drop any extra tool_calls.
        response.tool_calls = response.tool_calls?.filter((tool_call) => tool_call.name === 'Info');
        break;
      }
    }
  } else {
    // If LLM didn't respect the tool_choice
    responseMessages.push(new HumanMessage('Please respond by calling one of the provided tools.'));
  }
  return {
    messages: responseMessages,
    info,
    // This increments the step counter.
    // We configure a max step count to avoid infinite research loops
    loopStep: 1,
  };
};

/**
 * Routing function: Determines whether to continue research or end the builder.
 * This function decides if the gathered information is satisfactory or if more research is needed.
 *
 * @param state - The current state of the research builder
 * @returns Either "callModel" to continue research or END to finish the builder
 */
export const route = (
  state: typeof StateAnnotation.State,
): 'callModel' | 'tools' | 'reflect' | '__end__' => {
  const lastMessage: AIMessage = state.messages[state.messages.length - 1];
  log.info(
    'Routing decision: lastMessage._getType() = ',
    lastMessage._getType(),
    'lastMessage.tool_calls?.map((t) => t.name) = ',
    lastMessage.tool_calls?.map((t) => t.name),
  );

  if (lastMessage._getType() !== 'ai') {
    return 'callModel';
  }

  // If the "Info" tool was called, then the model provided its extraction output. Reflect on the result
  if (lastMessage.tool_calls && lastMessage.tool_calls[0]?.name === 'Info') {
    return 'reflect';
  }

  if (
    lastMessage._getType() === 'ai' &&
    Array.isArray(lastMessage.tool_calls) &&
    lastMessage.tool_calls.length > 0
  ) {
    return 'tools';
  }

  return '__end__';
};

const builder = new StateGraph(StateAnnotation)
  .addNode('callModel', callModel)
  .addEdge('__start__', 'callModel')
  .addNode('tools', toolNode)
  .addEdge('tools', 'callModel')
  .addConditionalEdges('callModel', route);

export const graph = builder.compile();

graph.name = 'Research Agent';
