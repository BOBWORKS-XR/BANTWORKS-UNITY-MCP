#!/usr/bin/env node
/**
 * Banter MCP Server
 *
 * Full-featured MCP server for Banter SDK development.
 * Provides closed-loop integration with Unity Editor.
 *
 * Usage:
 *   stdio mode (default): node dist/index.js
 *   HTTP mode: node dist/index.js --http [--port 42067]
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { registerTools, handleToolCall } from "./tools/index.js";
import { registerResources, handleResourceRead } from "./resources/index.js";
import { registerPrompts, handlePromptGet } from "./prompts/index.js";
import { getConfig } from "./lib/config.js";

const config = getConfig();

// Create MCP server
const server = new Server(
  {
    name: "banter-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: registerTools() };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  return handleToolCall(request.params.name, request.params.arguments ?? {}, config);
});

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return { resources: registerResources(config) };
});

// Read resource content
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  return handleResourceRead(request.params.uri, config);
});

// List available prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return { prompts: registerPrompts() };
});

// Get prompt content
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  return handlePromptGet(request.params.name, request.params.arguments ?? {});
});

// Start server
async function main() {
  const args = process.argv.slice(2);
  const useHttp = args.includes("--http");

  if (useHttp) {
    // HTTP transport - for shared/remote access
    const portArg = args.find((a, i) => args[i - 1] === "--port");
    const port = portArg ? parseInt(portArg) : 42067;

    const { createHttpServer } = await import("./lib/http-server.js");
    await createHttpServer(server, port);
    console.error(`Banter MCP running on http://localhost:${port}/mcp`);
  } else {
    // Stdio transport - for Claude Code integration
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Banter MCP running on stdio");
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
