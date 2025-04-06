#!/usr/bin/env node

import { Command } from 'commander';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { UrlFetcher } from './urlFetcher.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJson = JSON.parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf8')
);

const program = new Command();

program
  .name('rulegenix')
  .description('CLI tool for rule generation')
  .version(packageJson.version);

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
    results.forEach(result => {
      console.log(`\nURL: ${result.url}`);
      console.log(`Status: ${result.status}`);
      if (result.error) {
        console.log(`Error: ${result.error}`);
      } else {
        console.log(`Content length: ${result.content.length} characters`);
      }
    });
  });

program.parse(); 