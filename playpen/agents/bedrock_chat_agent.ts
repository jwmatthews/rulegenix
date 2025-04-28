// Starting example to play with langgraph js to create an agent

import readline from "readline";
import { ChatOpenAI } from "@langchain/openai"; 
import { ChatBedrockConverse } from "@langchain/aws";
import { Annotation } from "@langchain/langgraph";
import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import { StateGraph } from "@langchain/langgraph";
import { START } from "@langchain/langgraph";
import { END } from "@langchain/langgraph";

const _llm = new ChatOpenAI({
  model: "gpt-3.5-turbo",
});

const llm = new ChatBedrockConverse({
  model: "anthropic.claude-3-5-sonnet-20240620-v1:0",
  region: "us-east-1",
});

const agentNode = async (state: any) => {
  const lastUserMessage = state.messages[state.messages.length - 1];
  const response = await llm.invoke([lastUserMessage]);
  return { messages: [...state.messages, response] };
};

const GraphState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  })
})

// Define the graph
const workflow = new StateGraph(GraphState)
  .addNode("agent", agentNode)
  .addEdge("agent", "agent") // Loop back for now
  
workflow.addEdge(START, "agent");

const app = workflow.compile();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function mainLoop() {
  let messages: BaseMessage[]= [];
  while (true) {
    const userInput: string = await new Promise((resolve) =>
      rl.question("You: ", resolve)
    );
    if (userInput.trim().toLowerCase() === "exit") {
      console.log("Goodbye!");
      break;
    }
    messages.push(new HumanMessage(userInput));
    //messages.push({ role: "user", content: userInput });

    for await (const output of await app.stream({ messages })) {
      const lastMsg = output.agent.messages[output.agent.messages.length - 1];
      console.log("Agent:", lastMsg.content);
      messages = output.agent.messages; // update messages with conversation history
      break; // Only process the first output per turn
    }
  }
  rl.close();
}

mainLoop();