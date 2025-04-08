// @ts-nocheck
import { jest } from "@jest/globals";
import type { Mock } from "jest-mock";
import axios from "axios";
import { UrlFetcher } from "./urlFetcher.js";

import fs from "fs/promises";
import os from "os";
import path from "path";

jest.mock("axios");

describe("UrlFetcher", () => {
  let fetcher: UrlFetcher;
  let mockGet: Mock;

  beforeEach(() => {
    fetcher = new UrlFetcher();
    mockGet = jest.fn();
    (axios.get as unknown) = mockGet;
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("fetchUrls", () => {
    it("should successfully fetch multiple URLs", async () => {
      const urls = ["https://example.com", "https://example.org"];

      mockGet
        .mockResolvedValueOnce({
          data: "content1",
          status: 200,
        })
        .mockResolvedValueOnce({
          data: "content2",
          status: 200,
        });

      const results = await fetcher.fetchUrls(urls);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        url: "https://example.com",
        content: "content1",
        status: 200,
      });
      expect(results[1]).toEqual({
        url: "https://example.org",
        content: "content2",
        status: 200,
      });
      expect(mockGet).toHaveBeenCalledTimes(2);
      expect(mockGet).toHaveBeenCalledWith("https://example.com");
      expect(mockGet).toHaveBeenCalledWith("https://example.org");
    });

    it("should handle failed requests", async () => {
      const urls = ["https://example.com", "https://failing-url.com"];

      mockGet
        .mockResolvedValueOnce({
          data: "content1",
          status: 200,
        })
        .mockRejectedValueOnce({
          response: { status: 404 },
          message: "Not Found",
        });

      const results = await fetcher.fetchUrls(urls);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        url: "https://example.com",
        content: "content1",
        status: 200,
      });
      expect(results[1]).toEqual({
        url: "https://failing-url.com",
        content: "",
        status: 404,
        error: "Not Found",
      });
    });
  });

  describe("readUrlsFromFile", () => {
    it("should read and parse URLs from a file", async () => {
      const fileContent = `
        https://example.com
        # This is a comment
        https://example.org
        
        https://example.net
      `;
      const tmpFilePath = path.join(os.tmpdir(), `urls-${Date.now()}.txt`);
      try {
        await fs.writeFile(tmpFilePath, fileContent.trim());
        const urls = await fetcher.readUrlsFromFile(tmpFilePath);
        expect(urls).toEqual([
          'https://example.com',
          'https://example.org',
          'https://example.net'
        ]);
      } finally {
        await fs.unlink(tmpFilePath);
      }
    });

    it("should handle file reading errors", async () => {
      mockGet.mockRejectedValueOnce({
        message: "File not found",
      });

      await expect(fetcher.readUrlsFromFile("nonexistent.txt")).rejects.toThrow(
        "Failed to read URLs from file: File not found",
      );
    });
  });
});
