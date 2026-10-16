import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs/promises";
import * as path from "path";
const WORKSPACE_ROOT = path.resolve("./workspace");
const server = new Server({
    name: "mcp-file-server",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "list_files",
                description: "List all files and folders inside the sandboxed workspace.",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
        ],
    };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "list_files") {
        try {
            await fs.mkdir(WORKSPACE_ROOT, { recursive: true });
            const entries = await fs.readdir(WORKSPACE_ROOT, { withFileTypes: true });
            const result = entries.map((e) => `${e.isDirectory() ? "[DIR]" : "[FILE]"} ${e.name}`).join("\n");
            return {
                content: [{ type: "text", text: result || "Workspace is empty." }],
                isError: false,
            };
        }
        catch (error) {
            return {
                content: [{ type: "text", text: `Error: ${error.message}` }],
                isError: true,
            };
        }
    }
    throw new Error(`Unknown tool: ${request.params.name}`);
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
//# sourceMappingURL=server.js.map