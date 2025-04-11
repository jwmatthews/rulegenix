import { load } from 'js-yaml';
import { readFileSync } from 'fs';
import { z } from 'zod';
import type { RulegenixConfig } from './config';

export class ConfigLoader {
  private static instance: ConfigLoader;
  private config: RulegenixConfig;
  private configPath: string;

  private constructor(configPath?: string) {
    this.configPath = configPath || process.env.CONFIG_PATH || 'config.yml';
    this.config = this.loadConfig();
  }

  public static getInstance(configPath?: string): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader(configPath);
    }
    return ConfigLoader.instance;
  }

  private loadConfig(): RulegenixConfig {
    const yamlContent = readFileSync(this.configPath, 'utf8');
    return load(yamlContent) as RulegenixConfig;
  }

  public getConfig(): RulegenixConfig {
    return this.config;
  }
}