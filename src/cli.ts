#!/usr/bin/env node
import 'source-map-support/register.js';

import { Command } from 'commander';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { UrlFetcher } from './urlFetcher.js';
import { graph as researchGraph } from './agents/research/graph.js';
import { graph as planningGraph } from './agents/planning/graph.js';
import { ConfigLoader, RulegenixConfig } from '@config';
import { getChatModel } from '@llm';
import { messageToChatRole } from '@utils';
import { AIMessage } from '@langchain/core/messages.js';
import { log } from './logger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));

const program = new Command();

program.name('rulegenix').description('CLI tool for rule generation').version(packageJson.version);

program
  .command('test')
  .description('Test command to verify CLI is working')
  .action(() => {
    console.log('CLI is working correctly!');
  });

program
  .command('fetch')
  .description('Fetch content from URLs')
  .option('-f, --file <file>', 'File containing URLs (one per line)')
  .option('-u, --urls <urls...>', 'URLs to fetch')
  .action(async (options) => {
    const fetcher = new UrlFetcher();
    let urls: string[] = [];

    if (options.file) {
      urls = await fetcher.readUrlsFromFile(options.file);
    } else if (options.urls) {
      urls = options.urls;
    } else {
      console.error('Please provide either --file or --urls option');
      process.exit(1);
    }

    console.log(`Fetching ${urls.length} URLs...`);
    const results = await fetcher.fetchUrls(urls);

    // Print results
    results.forEach((result) => {
      console.log(`\nURL: ${result.url}`);
      console.log(`Status: ${result.status}`);
      if (result.error) {
        console.log(`Error: ${result.error}`);
      } else {
        console.log(`Content length: ${result.content.length} characters`);
      }
    });
  });

program
  .command('llm-test')
  .description('Test command to verify LLM is working')
  .option('-c, --config <config.yaml>', 'LLM Provider configuration file')
  .action(async (options) => {
    try {
      const configLoader = ConfigLoader.getInstance(options.config);
      const config = configLoader.getConfig();
      const chatModel = getChatModel(config);
      const msg = await chatModel.invoke('what is LangSmith?');
      console.log(msg);
      console.log('CLI is working correctly!');
    } catch (error) {
      console.error(error);
    }
  });

program
  .command('research-agent')
  .description('Execute a migration research agent to find information')
  .option('-c, --config <config.yaml>', 'LLM Provider configuration file')
  .requiredOption('-s, --scenario <scenario>', 'Migration scenario to research')
  .option('-m, --max-search-results <maxSearchResults>', 'Maximum number of search results', '5')
  .action(async (options) => {
    try {
      const startTime = performance.now();
      const configLoader = ConfigLoader.getInstance(options.config);
      const config = configLoader.getConfig();
      const scenario = options.scenario;
      const maxSearchResults = parseInt(options.maxSearchResults);
      log.info(`Researching ${scenario}...`);

      let result = await researchGraph.invoke({
        migrationScenario: scenario,
        llmConfig: config,
        maxSearchResults,
      });
      log.info('Result:', result);
      if (result.messages.length > 0) {
        const lastMessage = result.messages[result.messages.length - 1];
        log.info(
          `Last message: Role - ${messageToChatRole(lastMessage)}, Content - ${lastMessage.content}`,
        );
      } else {
        log.info('No messages found.');
      }
      const endTime = performance.now();
      log.info(`'research-agent' ran for ${endTime - startTime} milliseconds`);
    } catch (error) {
      console.error(error);
    }
  });

program
  .command('planning-agent')
  .description('Execute a planning agent to find migration concerns')
  .option('-c, --config <config.yaml>', 'LLM Provider configuration file')
  .requiredOption('-s, --scenario <scenario>', 'Migration scenario to research')
  .option('-m, --max-search-results <maxSearchResults>', 'Maximum number of search results', '5')
  .action(async (options) => {
    try {
      const startTime = performance.now();
      const configLoader = ConfigLoader.getInstance(options.config);
      const config = configLoader.getConfig();
      const scenario = options.scenario;
      const maxSearchResults = parseInt(options.maxSearchResults);
      log.info(`Researching ${scenario}...`);

      let result = await planningGraph.invoke({
        migrationScenario: scenario,
        llmConfig: config,
        maxSearchResults,
      });
      log.info('Result:', result);
      if (result.messages.length > 0) {
        const lastMessage = result.messages[result.messages.length - 1];
        log.info(
          `Last message: Role - ${messageToChatRole(lastMessage)}, Content - ${lastMessage.content}`,
        );
      } else {
        log.info('No messages found.');
      }
      const endTime = performance.now();
      log.info(`'research-agent' ran for ${endTime - startTime} milliseconds`);
    } catch (error) {
      console.error(error);
    }
  });

program.parse();
