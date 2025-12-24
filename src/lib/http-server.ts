/**
 * HTTP transport for Banter MCP
 *
 * Note: Full HTTP transport requires more complex setup with the MCP SDK.
 * For now, this provides a placeholder that logs a message.
 * Use stdio transport (default) for Claude Code integration.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";

/**
 * Create an HTTP server that wraps the MCP server
 *
 * TODO: Implement full HTTP transport when MCP SDK provides better support
 */
export async function createHttpServer(_mcpServer: Server, port: number): Promise<void> {
  console.error(`[Banter MCP] HTTP transport requested on port ${port}`);
  console.error(`[Banter MCP] Note: HTTP transport is not fully implemented yet.`);
  console.error(`[Banter MCP] Please use stdio transport (default) for now.`);
  console.error(`[Banter MCP] Run without --http flag to use stdio transport.`);

  // Keep the process alive
  await new Promise(() => {});
}
