// src/config/__tests__/config.test.ts

import { validateConfig, RulegenixConfig, getActiveProvider } from '../config';

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
          maxTokensToSample: 1000
        },
        'aws-claude': {
          type: 'bedrock',
          model: 'anthropic.claude-v2',
          region: 'us-east-1'
        }
      }
    }
  };

  describe('validateConfig', () => {
    it('should validate a correct configuration', () => {
      expect(() => validateConfig(validConfig)).not.toThrow();
    });

    it('should fail on missing active provider', () => {
      const invalidConfig = {
        llm: {
          providers: { ...validConfig.llm.providers }
        }
      };
      expect(() => validateConfig(invalidConfig)).toThrow('missing llm section or required fields');
    });

    it('should fail on non-existent active provider', () => {
      const invalidConfig = {
        llm: {
          ...validConfig.llm,
          activeProvider: 'non-existent-provider'
        }
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
              model: 'some-model'
            }
          }
        }
      };
      expect(() => validateConfig(invalidConfig)).toThrow('Unexpected provider type');
    });

    it('should fail on missing required provider fields', () => {
      const invalidConfig = {
        llm: {
          activeProvider: 'incomplete-provider',
          providers: {
            'incomplete-provider': {
              type: 'openai'
              // missing model field
            }
          }
        }
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
              model: 'anthropic.claude-v2'
              // missing region field
            }
          }
        }
      };
      expect(() => validateConfig(invalidConfig)).toThrow('missing required field: region');
    });
  });

  describe('getActiveProvider', () => {
    it('should return the active provider configuration', () => {
      const activeProvider = getActiveProvider(validConfig);
      expect(activeProvider).toEqual(validConfig.llm.providers['production-gpt4']);
    });

    it('should throw error for non-existent provider', () => {
      const invalidConfig = {
        llm: {
          ...validConfig.llm,
          activeProvider: 'non-existent-provider'
        }
      };
      expect(() => getActiveProvider(invalidConfig as RulegenixConfig))
        .toThrow('Active provider \'non-existent-provider\' not found in configuration');
    });

    it('should return different providers when activeProvider changes', () => {
      const config1 = { ...validConfig };
      const config2 = { 
        llm: {
          ...validConfig.llm,
          activeProvider: 'staging-claude'
        }
      };

      const provider1 = getActiveProvider(config1);
      const provider2 = getActiveProvider(config2 as RulegenixConfig);

      expect(provider1.type).toBe('openai');
      expect(provider2.type).toBe('anthropic');
    });
  });
});