import { StateGraph } from "@langchain/langgraph";
import { RunnableConfig } from "@langchain/core/runnables";
import { HumanMessage } from "@langchain/core/messages";
import { StateAnnotation } from "./state.js";

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
  
  const { chat_model, research_topic, messages = [] } = state;
  const userMessage = new HumanMessage(`What do you know about ${research_topic}?`);
  const startTime = performance.now();
  const response = await chat_model.invoke([...messages, userMessage]);
  const endTime = performance.now();
  console.log(`Model invocation took ${endTime - startTime} milliseconds`);
  console.log(`Response: ${response.content}`);

  return {
    messages: [
      ...messages,
      { role: "user", content: userMessage.content },
      { role: "assistant", content: response.content },
    ],
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
): "__end__" | "callModel" => {
  console.log(`Let's see how many messages we have: ${state.messages.length}`);
  if (state.messages.length > 4) {
    return "__end__";
  }
  // Loop back
  return "callModel";
};

const builder = new StateGraph(StateAnnotation)
  .addNode("callModel", callModel)
  .addEdge("__start__", "callModel")
  .addConditionalEdges("callModel", route);

export const graph = builder.compile();

graph.name = "Research Agent";