/**
 * Generic cross-workspace tracing example for LangGraph (TypeScript).
 * 
 * This version uses traceable() for non-LangSmith deployment scenarios.
 * Use this approach for general applications where you want to dynamically
 * route traces to different workspaces based on runtime logic.
 * 
 * Can be tested locally without deployment.
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
import "dotenv/config";


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

// Config schema for runtime configuration
export const ConfigSchema = z.object({
  workspace_id: z.string(),
});

export const baseGraph = new StateGraph(State, ConfigSchema)
  .addNode("greeting", greeting)
  .addEdge(START, "greeting")
  .addEdge("greeting", END)
  .compile();

// ----- LangSmith clients -----

// API key with access to multiple workspaces
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
function getWorkspaceClient(workspaceId: string): {
  client: Client;
  projectName: string;
} {
  if (workspaceId === "workspace_b") {
    return {
      client: workspaceBClient,
      projectName: "development-traces",
    };
  }
  if (workspaceId === "workspace_a") {
    return {
      client: workspaceAClient,
      projectName: "production-traces",
    };
  }
  // Default to workspace A
  return {
    client: workspaceAClient,
    projectName: "default-traces",
  };
}

// ----- Public API: run with per-request tracing context -----

/**
 * Run the graph with cross-workspace tracing using LangChainTracer.
 * This attaches a workspace-specific tracer via callbacks, ensuring ALL
 * LangGraph operations use the correct client and workspace.
 */
export async function runWithTracing(
  config: Partial<LangGraphRunnableConfig<Configuration>> = {}
) {
  const workspaceId = config.configurable?.workspace_id ?? "workspace_a";
  const { client, projectName } = getWorkspaceClient(workspaceId);

  // Create a tracer with our workspace-specific client
  const tracer = new LangChainTracer({
    client,
    projectName,
  });

  // Attach tracer via callbacks - this propagates to ALL LangGraph operations
  const result = await baseGraph.invoke(
    {},
    {
      configurable: { workspace_id: workspaceId },
      callbacks: [tracer],
    }
  );

  return result;
}

// ----- Example usage (uncomment to run locally) -----
//
// import { fileURLToPath } from "node:url";
// const isMain = import.meta.url === fileURLToPath(process.argv[1]);
// if (isMain) {
//   (async () => {
//     console.log("Testing generic cross-workspace tracing...\n");
//
//     const outA = await runWithTracing({ configurable: { workspace_id: "workspace_a" } });
//     console.log("[workspace_a]", outA);
//
//     const outB = await runWithTracing({ configurable: { workspace_id: "workspace_b" } });
//     console.log("[workspace_b]", outB);
//   })().catch((e) => {
//     console.error(e);
//     process.exit(1);
//   });
// }

