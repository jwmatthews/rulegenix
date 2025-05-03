// src/config/__tests__/config.test.ts

import { validateConfig, RulegenixConfig, getActiveProvider, isXAIConfig } from '../../config';

describe('Configuration Validation', () => {
  const validConfig: RulegenixConfig = {
    llm: {
      activeProvider: 'production-gpt4',
      providers: {
        'production-gpt4': {
          type: 'openai',
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 2000,
        },
        'staging-claude': {
          type: 'anthropic',
          model: 'claude-2',
          temperature: 0.01,
          maxTokens: 16834,
        },
        'aws-claude': {
          type: 'bedrock',
          model: 'anthropic.claude-v2',
          region: 'us-east-1',
        },
        'gemini-pro': {
          type: 'google',
          model: 'gemini-2.5-pro-exp-03-25',
          temperature: 0.7,
        },
        'xai-model': {
          type: 'xai',
          model: 'xai-model',
          temperature: 0.7,
          maxTokens: 2000,
          maxRetries: 3,
        },
        'groq-llama-4-scout-17b-16e-instruct': {
          type: 'groq',
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          temperature: 0,
          maxTokens: 8192,
        },
      },
    },
  };

  describe('validateConfig', () => {
    it('should validate a correct configuration', () => {
      expect(() => validateConfig(validConfig)).not.toThrow();
    });

    it('should validate Google GenAI configuration', () => {
      const config = {
        llm: {
          activeProvider: 'gemini-pro',
          providers: {
            'gemini-pro': validConfig.llm.providers['gemini-pro'],
          },
        },
      };
      expect(() => validateConfig(config as RulegenixConfig)).not.toThrow();
    });

    it('should validate XAI configuration', () => {
      const config = {
        llm: {
          activeProvider: 'xai-model',
          providers: {
            'xai-model': validConfig.llm.providers['xai-model'],
          },
        },
      };
      expect(() => validateConfig(config as RulegenixConfig)).not.toThrow();
    });

    it('should fail on missing active provider', () => {
      const invalidConfig = {
        llm: {
          providers: { ...validConfig.llm.providers },
        },
      };
      expect(() => validateConfig(invalidConfig)).toThrow('missing llm section or required fields');
    });

    it('should fail on non-existent active provider', () => {
      const invalidConfig = {
        llm: {
          ...validConfig.llm,
          activeProvider: 'non-existent-provider',
        },
      };
      expect(() => validateConfig(invalidConfig)).toThrow('not found in providers configuration');
    });

    it('should fail on invalid provider type', () => {
      const invalidConfig = {
        llm: {
          activeProvider: 'invalid-provider',
          providers: {
            'invalid-provider': {
              type: 'invalid-type',
              model: 'some-model',
            },
          },
        },
      };
      expect(() => validateConfig(invalidConfig)).toThrow('Unexpected provider type');
    });

    it('should fail on missing required provider fields', () => {
      const invalidConfig = {
        llm: {
          activeProvider: 'incomplete-provider',
          providers: {
            'incomplete-provider': {
              type: 'openai',
              // missing model field
            },
          },
        },
      };
      expect(() => validateConfig(invalidConfig)).toThrow('missing required fields');
    });

    it('should fail on invalid bedrock config without region', () => {
      const invalidConfig = {
        llm: {
          activeProvider: 'invalid-bedrock',
          providers: {
            'invalid-bedrock': {
              type: 'bedrock',
              model: 'anthropic.claude-v2',
              // missing region field
            },
          },
        },
      };
      expect(() => validateConfig(invalidConfig)).toThrow('missing required field: region');
    });
  });

  describe('getActiveProvider', () => {
    it('should return the active provider configuration', () => {
      const activeProvider = getActiveProvider(validConfig);
      expect(activeProvider).toEqual(validConfig.llm.providers['production-gpt4']);
    });

    it('should return Google GenAI provider when active', () => {
      const config = {
        llm: {
          ...validConfig.llm,
          activeProvider: 'gemini-pro',
        },
      };
      const provider = getActiveProvider(config as RulegenixConfig);
      expect(provider.type).toBe('google');
      expect(provider.model).toBe('gemini-2.5-pro-exp-03-25');
    });

    it('should return XAI provider when active', () => {
      const config = {
        llm: {
          ...validConfig.llm,
          activeProvider: 'xai-model',
        },
      };
      const provider = getActiveProvider(config as RulegenixConfig);
      expect(provider.type).toBe('xai');
      expect(provider.maxRetries).toBe(3);
      expect(isXAIConfig(provider)).toBe(true);
    });

    it('should throw error for non-existent provider', () => {
      const invalidConfig = {
        llm: {
          ...validConfig.llm,
          activeProvider: 'non-existent-provider',
        },
      };
      expect(() => getActiveProvider(invalidConfig as RulegenixConfig)).toThrow(
        "Active provider 'non-existent-provider' not found in configuration",
      );
    });

    it('should return different providers when activeProvider changes', () => {
      const config1 = { ...validConfig };
      const config2 = {
        llm: {
          ...validConfig.llm,
          activeProvider: 'staging-claude',
        },
      };

      const provider1 = getActiveProvider(config1);
      const provider2 = getActiveProvider(config2 as RulegenixConfig);

      expect(provider1.type).toBe('openai');
      expect(provider2.type).toBe('anthropic');
    });
  });
});
