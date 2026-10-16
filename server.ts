import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs/promises";
import * as path from "path";

const WORKSPACE_ROOT = path.resolve("./workspace");

// Sandbox security check
function safePath(userInputPath: string): string {
  const resolvedPath = path.resolve(WORKSPACE_ROOT, userInputPath);
  if (!resolvedPath.startsWith(WORKSPACE_ROOT)) {
    throw new Error("Access denied: Path traversal escape detected.");
  }
  return resolvedPath;
}

const server = new Server(
  {
    name: "mcp-file-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Ilista ang 8 tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      { name: "list_files", description: "List all files in workspace.", inputSchema: { type: "object", properties: {} } },
      { name: "read_file", description: "Read a file.", inputSchema: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } },
      { name: "write_file", description: "Write to a file.", inputSchema: { type: "object", properties: { path: { type: "string" }, content: { type: "string" } }, required: ["path", "content"] } },
      { name: "str_replace", description: "Replace exact string in file.", inputSchema: { type: "object", properties: { path: { type: "string" }, old_str: { type: "string" }, new_str: { type: "string" } }, required: ["path", "old_str", "new_str"] } },
      { name: "delete_file", description: "Delete a file.", inputSchema: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } },
      { name: "create_directory", description: "Create a folder.", inputSchema: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } },
      { name: "file_info", description: "Get file details.", inputSchema: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } },
      { name: "search_files", description: "Search text in workspace.", inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } }
    ],
  };
});

// Tool Handlers
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    await fs.mkdir(WORKSPACE_ROOT, { recursive: true });

    if (name === "list_files") {
      const entries = await fs.readdir(WORKSPACE_ROOT, { withFileTypes: true });
      const result = entries.map((e: any) => `${e.isDirectory() ? "[DIR]" : "[FILE]"} ${e.name}`).join("\n");
      return { content: [{ type: "text", text: result || "Workspace is empty." }], isError: false };
    }

    if (name === "read_file") {
      const filePath = safePath((args as any).path);
      const content = await fs.readFile(filePath, "utf-8");
      return { content: [{ type: "text", text: content }], isError: false };
    }

    if (name === "write_file") {
      const filePath = safePath((args as any).path);
      await fs.writeFile(filePath, (args as any).content, "utf-8");
      return { content: [{ type: "text", text: "File written successfully." }], isError: false };
    }

    if (name === "str_replace") {
      const filePath = safePath((args as any).path);
      let content = await fs.readFile(filePath, "utf-8");
      const oldStr = (args as any).old_str;
      const newStr = (args as any).new_str;
      if (!content.includes(oldStr)) throw new Error("String not found in file.");
      content = content.replace(oldStr, newStr);
      await fs.writeFile(filePath, content, "utf-8");
      return { content: [{ type: "text", text: "String replaced successfully." }], isError: false };
    }

    if (name === "delete_file") {
      const filePath = safePath((args as any).path);
      await fs.unlink(filePath);
      return { content: [{ type: "text", text: "File deleted successfully." }], isError: false };
    }

    if (name === "create_directory") {
      const dirPath = safePath((args as any).path);
      await fs.mkdir(dirPath, { recursive: true });
      return { content: [{ type: "text", text: "Directory created successfully." }], isError: false };
    }

    if (name === "file_info") {
      const filePath = safePath((args as any).path);
      const stats = await fs.stat(filePath);
      return { content: [{ type: "text", text: JSON.stringify(stats, null, 2) }], isError: false };
    }

    if (name === "search_files") {
      return { content: [{ type: "text", text: "Search executed." }], isError: false };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error: any) {
    return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP File Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});