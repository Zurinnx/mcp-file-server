# MCP File-Server Connector (Midterms Part 1 Project)

## Overview
This project is an MCP (Model Context Protocol) File-Server built using Node.js, TypeScript, and the official MCP SDK. It provides a secure file management interface with comprehensive sandboxing protocols.

## Tech Stack
- **Runtime:** Node.js (v18+)
- **Language:** TypeScript
- **Framework/SDK:** Model Context Protocol SDK (`@modelcontextprotocol/sdk`)
- **Validation:** Zod

## Implemented Tools (8 Total)
1. `list_files` - List all files and directories in the workspace.
2. `read_file` - Read the content of a specified file.
3. `write_file` - Write text content to a file.
4. `str_replace` - Replace exact strings within a file.
5. `delete_file` - Delete a specified file.
6. `create_directory` - Create a new directory recursively.
7. `file_info` - Retrieve detailed statistics (metadata) of a file.
8. `search_files` - Search and filter files within the workspace.

## Security & Sandboxing
- Implemented a robust `safePath` validation function.
- Prevents directory traversal attacks (`../` escapes) by ensuring all file system operations are strictly contained within the `./workspace` directory root.

## Handoff & State Protocol
Maintains operational state and history logs via standardized markdown files in the workspace directory:
- `PROJECT_STATE.md`
- `PLAN_LOG.md`
- `CHECKPOINTS.md`
- `DECISIONS.md`