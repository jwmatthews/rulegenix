import { AwsCredentialIdentity } from "@aws-sdk/types";

// Common parameters that all LLM providers might share
interface BaseProviderConfig {
  type: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  maxRetries?: number;
}

// Provider-specific configurations
interface OpenAIConfig extends BaseProviderConfig {
  type: 'openai';
  apiKey?: string;
  modelName?: string;
}

interface BedrockConfig extends BaseProviderConfig {
  type: 'bedrock';
  region: string;
  credentials?: AwsCredentialIdentity;
}

interface AnthropicConfig extends BaseProviderConfig {
  type: 'anthropic';
  apiKey?: string;
}

interface GoogleGenAIConfig extends BaseProviderConfig {
  type: 'google';
  apiKey?: string;
}

interface XAIConfig extends BaseProviderConfig {
  type: 'xai';
  apiKey?: string;
}

// Union type of all possible provider configs
type ProviderConfig = OpenAIConfig | BedrockConfig | AnthropicConfig | GoogleGenAIConfig | XAIConfig;

// Type guard functions to check provider types
export const isOpenAIConfig = (config: ProviderConfig): config is OpenAIConfig => 
  config.type === 'openai';

export const isBedrockConfig = (config: ProviderConfig): config is BedrockConfig =>
  config.type === 'bedrock';

export const isAnthropicConfig = (config: ProviderConfig): config is AnthropicConfig =>
  config.type === 'anthropic';

export const isGoogleGenAIConfig = (config: ProviderConfig): config is GoogleGenAIConfig =>
  config.type === 'google';

export const isXAIConfig = (config: ProviderConfig): config is XAIConfig =>
  config.type === 'xai';

// Main configuration interface
export interface RulegenixConfig {
  llm: {
    activeProvider: string;
    providers: {
      [key: string]: ProviderConfig;
    };
  };
}

function assertNever(x: never): never {
  throw new Error(`Unexpected provider type: ${(x as any).type}`);
}

export function getActiveProvider(config: RulegenixConfig): ProviderConfig {
  const activeProvider = config.llm.activeProvider;
  const provider = config.llm.providers[activeProvider];
  
  if (!provider) {
    throw new Error(`Active provider '${activeProvider}' not found in configuration`);
  }
  
  return provider;
}

// Validation function to ensure config is valid
export function validateConfig(config: unknown): config is RulegenixConfig {
  const conf = config as RulegenixConfig;
  
  if (!conf?.llm?.activeProvider || !conf?.llm?.providers) {
    throw new Error('Invalid configuration: missing llm section or required fields');
  }

  if (!conf.llm.providers[conf.llm.activeProvider]) {
    throw new Error(`Active provider '${conf.llm.activeProvider}' not found in providers configuration`);
  }

  // Validate each provider configuration
  for (const [name, provider] of Object.entries(conf.llm.providers)) {
    if (!provider.type || !provider.model) {
      throw new Error(`Provider '${name}' missing required fields: type and model`);
    }

    // Provider-specific validation
    switch (provider.type) {
      case 'bedrock':
        if (!isBedrockConfig(provider)) {
          throw new Error(`Invalid Bedrock configuration for provider '${name}'`);
        }
        if (!provider.region) {
          throw new Error(`Bedrock provider '${name}' missing required field: region`);
        }
        break;
      
      case 'openai':
        if (!isOpenAIConfig(provider)) {
          throw new Error(`Invalid OpenAI configuration for provider '${name}'`);
        }
        break;

      case 'anthropic':
        if (!isAnthropicConfig(provider)) {
          throw new Error(`Invalid Anthropic configuration for provider '${name}'`);
        }
        break;

      case 'google':
        if (!isGoogleGenAIConfig(provider)) {
          throw new Error(`Invalid Google GenAI configuration for provider '${name}'`);
        }
        break;

      case 'xai':
        if (!isXAIConfig(provider)) {
          throw new Error(`Invalid XAI configuration for provider '${name}'`);
        }
        break;

      default:
        assertNever(provider);
    }
  }

  return true;
}