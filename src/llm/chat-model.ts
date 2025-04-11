import { ChatOpenAI } from "@langchain/openai";
import { BedrockChat } from "@langchain/community/chat_models/bedrock";
import { ChatAnthropic } from "@langchain/anthropic";

import { RulegenixConfig, getActiveProvider, isBedrockConfig, isOpenAIConfig, isAnthropicConfig } from '@config';

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
                maxTokens: provider.maxTokens || undefined
            });

        default:
            throw new Error(`Unsupported provider info: ${provider}`);
    }
};
