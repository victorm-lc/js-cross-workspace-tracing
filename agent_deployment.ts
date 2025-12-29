/**
 * LangSmith deployment cross-workspace tracing example (TypeScript).
 * 
 * This agent routes traces to different workspaces based on the `workspace_id`
 * configurable parameter. Deploy to LangSmith Platform and create two assistants:
 * 
 * - Assistant A (Production): Set workspace_id = "workspace_a"
 * - Assistant B (Development): Set workspace_id = "workspace_b"
 * 
 * Each assistant will route traces to its configured workspace.
 * 
 * Required environment variable: LS_CROSS_WORKSPACE_KEY (Personal Access Token)
 */

import {
  StateGraph,
  Annotation,
  START,
  END,
  type LangGraphRunnableConfig,
} from "@langchain/langgraph";
import { z } from "zod";
import { Client } from "langsmith";
import { LangChainTracer } from "@langchain/core/tracers/tracer_langchain";

// ----- Types -----

// Configuration passed via RunnableConfig.configurable
export type Configuration = {
  workspace_id: string; // "workspace_a" | "workspace_b" (or other key)
};

// Graph state: a single string response
const State = Annotation.Root({
  response: Annotation<string>(),
});
type StateType = typeof State.State;

// ----- Node -----

function greeting(
  _state: StateType,
  config: LangGraphRunnableConfig<Configuration>
) {
  const workspaceId = config.configurable?.workspace_id ?? "workspace_a";
  let response: string;

  if (workspaceId === "workspace_a") {
    response = "Hello from Workspace A! Processing with production settings.";
  } else if (workspaceId === "workspace_b") {
    response = "Hello from Workspace B! Processing with development settings.";
  } else {
    response = "Hello from the default workspace!";
  }

  return { response };
}

// ----- Graph -----

// Config schema for runtime configuration (validated & surfaced in Studio)
// The default value ensures the field shows in the UI
export const ConfigSchema = z.object({
  workspace_id: z
    .string()
    .default("workspace_a")
    .describe("Target workspace for tracing: 'workspace_a' or 'workspace_b'"),
});

export const baseGraph = new StateGraph(State, ConfigSchema)
  .addNode("greeting", greeting)
  .addEdge(START, "greeting")
  .addEdge("greeting", END)
  .compile();

// ----- LangSmith clients -----

// API key with access to multiple workspaces
// For deployments, set LS_CROSS_WORKSPACE_KEY in your deployment environment
const LS_API_KEY =
  process.env.LS_CROSS_WORKSPACE_KEY ?? process.env.LANGSMITH_API_KEY ?? "";

if (!LS_API_KEY) {
  // Non-fatal: the graph still runs; traces just won't upload
  console.warn(
    "LangSmith API key not set (LS_CROSS_WORKSPACE_KEY or LANGSMITH_API_KEY). Traces will not be uploaded."
  );
}

// Initialize clients for different workspaces (replace IDs or set env vars)
const workspaceAClient = new Client({
  apiKey: LS_API_KEY || undefined,
  apiUrl: "https://api.smith.langchain.com",
  workspaceId: "1adb79c4-881d-4625-be9c-3118fffb2166",
});

const workspaceBClient = new Client({
  apiKey: LS_API_KEY || undefined,
  apiUrl: "https://api.smith.langchain.com",
  workspaceId: "ebbaf2eb-769b-4505-aca2-d11de10372a4",
});

// Route to appropriate workspace based on configuration
function selectTracing(
  config: LangGraphRunnableConfig<Configuration>
): { client: Client; project_name: string } {
  const key = config.configurable?.workspace_id ?? "workspace_a";
  if (key === "workspace_b") {
    return { client: workspaceBClient, project_name: "development-traces" };
  }
  if (key === "workspace_a") {
    return { client: workspaceAClient, project_name: "production-traces" };
  }
  return { client: workspaceAClient, project_name: "default-traces" };
}

// ----- LangSmith Deployment Factory Function -----

/**
 * Factory function for LangGraph Platform deployments.
 * 
 * This function is called by the LangGraph server for each request.
 * It receives the runtime config and returns a compiled graph with
 * the appropriate tracing configuration.
 * 
 * IMPORTANT: This function MUST be synchronous to work with deployments.
 * 
 * Usage in langgraph.json:
 * {
 *   "graphs": {
 *     "agent": "./agent_deployment.ts:graph"
 *   }
 * }
 */
export function graph(config?: Partial<LangGraphRunnableConfig<Configuration>>) {
  const workspace_id = config?.configurable?.workspace_id ?? "workspace_a";
  const { client, project_name } = selectTracing({
    configurable: { workspace_id },
  } as LangGraphRunnableConfig<Configuration>);

  // Create a tracer for the selected workspace
  const tracer = new LangChainTracer({
    client,
    projectName: project_name,
  });

  // Return the graph with the tracer attached as a callback
  // All traces from this graph will go to the selected workspace
  return baseGraph.withConfig({ callbacks: [tracer] });
}

