import { ChatOpenAI } from "@langchain/openai";
import { BedrockChat } from "@langchain/community/chat_models/bedrock";

// Configuration to choose the LLM provider
const LLM_PROVIDER = process.env.LLM_PROVIDER || 'openai'; // can be 'openai' or 'bedrock'

// Initialize the appropriate chat model based on configuration
export const getChatModel = () => {
    if (LLM_PROVIDER === 'bedrock') {
        return new BedrockChat({
            model: "anthropic.claude-v2", // Using Claude v2
            region: process.env.AWS_REGION || "us-east-1",
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
            },
        });
    } else {
        return new ChatOpenAI({});
    }
};
