import axios, { AxiosError } from 'axios';
import { readFile } from 'fs/promises';

export interface FetchResult {
  url: string;
  content: string;
  status: number;
  error?: string;
}

export class UrlFetcher {
  /**
   * Fetches content from a list of URLs
   * @param urls Array of URLs to fetch
   * @returns Promise resolving to array of fetch results
   */
  async fetchUrls(urls: string[]): Promise<FetchResult[]> {
    const results: FetchResult[] = [];

    for (const url of urls) {
      try {
        const response = await axios.get(url);
        results.push({
          url,
          content: response.data,
          status: response.status
        });
      } catch (error) {
        const axiosError = error as AxiosError;
        results.push({
          url,
          content: '',
          status: axiosError.response?.status || 0,
          error: axiosError.message
        });
      }
    }

    return results;
  }

  /**
   * Reads URLs from a file
   * @param filePath Path to file containing URLs (one per line)
   * @returns Promise resolving to array of URLs
   */
  async readUrlsFromFile(filePath: string): Promise<string[]> {
    try {
      const content = await readFile(filePath, 'utf-8');
      return content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));
    } catch (error) {
      const err = error as Error;
      throw new Error(`Failed to read URLs from file: ${err.message}`);
    }
  }
} 