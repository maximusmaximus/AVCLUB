import { ROLE_MCP_TOOLS, UserRole } from "@avclub/types";

export interface McpToolDefinition {
  name: string;
  description: string;
  parametersSchema: Record<string, unknown>;
  handler: (args: Record<string, unknown>, userContext: { userId: string; role: UserRole }) => Promise<unknown>;
}

export class McpGatewayServer {
  private registeredTools: Map<string, McpToolDefinition> = new Map();

  constructor() {
    this.registerCoreTools();
  }

  public registerTool(tool: McpToolDefinition) {
    this.registeredTools.set(tool.name, tool);
  }

  /**
   * Return the list of tools accessible to a specific user role.
   */
  public listToolsForRole(role: UserRole): Array<Omit<McpToolDefinition, "handler">> {
    const allowedNames = ROLE_MCP_TOOLS[role] || [];
    const tools: Array<Omit<McpToolDefinition, "handler">> = [];

    for (const name of allowedNames) {
      const tool = this.registeredTools.get(name);
      if (tool) {
        tools.push({
          name: tool.name,
          description: tool.description,
          parametersSchema: tool.parametersSchema,
        });
      }
    }

    return tools;
  }

  /**
   * Execute an MCP tool call enforcing role permissions.
   */
  public async executeToolCall(
    toolName: string,
    args: Record<string, unknown>,
    userContext: { userId: string; role: UserRole }
  ): Promise<{ result?: unknown; error?: string }> {
    const allowed = ROLE_MCP_TOOLS[userContext.role] || [];
    if (!allowed.includes(toolName)) {
      return {
        error: `FORBIDDEN_TOOL_ACCESS: Role '${userContext.role}' is not authorized to execute '${toolName}'`,
      };
    }

    const tool = this.registeredTools.get(toolName);
    if (!tool) {
      return { error: `TOOL_NOT_FOUND: '${toolName}' is not registered` };
    }

    try {
      const result = await tool.handler(args, userContext);
      return { result };
    } catch (err: unknown) {
      return {
        error: err instanceof Error ? err.message : "Internal tool execution error",
      };
    }
  }

  private registerCoreTools() {
    this.registerTool({
      name: "get_event_status",
      description: "Get the current event phase, countdown, and active voter statistics.",
      parametersSchema: {
        type: "object",
        properties: { eventId: { type: "string" } },
        required: ["eventId"],
      },
      handler: async () => ({
        status: "ONLINE",
        phase: "BUILD",
        remainingSeconds: 7200,
        roomScreenPaired: true,
      }),
    });

    this.registerTool({
      name: "submit_presentation",
      description: "Submit a project lightning presentation for Show & Tell with tagged teammates.",
      parametersSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          teamName: { type: "string" },
          demoUrl: { type: "string" },
        },
        required: ["title", "teamName"],
      },
      handler: async (args, ctx) => ({
        success: true,
        presentationId: "pres-generated-id",
        submitter: ctx.userId,
        title: args.title,
      }),
    });

    this.registerTool({
      name: "advance_phase",
      description: "Admin: advance the live room cycle to the next phase.",
      parametersSchema: {
        type: "object",
        properties: { eventId: { type: "string" }, expectedVersion: { type: "number" } },
        required: ["eventId"],
      },
      handler: async () => ({
        success: true,
        newPhase: "BUILD",
      }),
    });
  }
}
