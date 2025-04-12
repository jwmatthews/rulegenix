import { ChatOpenAI } from "@langchain/openai";
import { BedrockChat } from "@langchain/community/chat_models/bedrock";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatXAI } from "@langchain/xai";

import { RulegenixConfig, getActiveProvider, isBedrockConfig, isOpenAIConfig, isAnthropicConfig, isGoogleGenAIConfig, isXAIConfig } from '@config';

export const getChatModel = (config: RulegenixConfig) => {
    const provider = getActiveProvider(config);

    switch (provider.type) {
        case 'bedrock':
            if (!isBedrockConfig(provider)) {
                throw new Error('Invalid Bedrock configuration');
            }
            return new BedrockChat({
                model: provider.model,
                region: provider.region,
                credentials: provider.credentials
            });

        case 'openai':
            if (!isOpenAIConfig(provider)) {
                throw new Error('Invalid OpenAI configuration');
            }
            return new ChatOpenAI({
                modelName: provider.model,
                temperature: provider.temperature,
                maxTokens: provider.maxTokens,
            });

        case 'anthropic':
            if (!isAnthropicConfig(provider)) {
                throw new Error('Invalid Anthropic configuration');
            }
            return new ChatAnthropic({
                model: provider.model,
                temperature: provider.temperature,
                maxTokens: provider.maxTokens
            });

        case 'google':
            if (!isGoogleGenAIConfig(provider)) {
                throw new Error('Invalid Google GenAI configuration');
            }
            return new ChatGoogleGenerativeAI({
                model: provider.model,
                temperature: provider.temperature,
            });

        case 'xai':
            if (!isXAIConfig(provider)) {
                throw new Error('Invalid XAI configuration');
            }
            return new ChatXAI({
                model: provider.model,
                temperature: provider.temperature,
                maxTokens: provider.maxTokens,
                maxRetries: provider.maxRetries
            });

        default:
            throw new Error(`Unsupported provider info: ${provider}`);
    }
};
