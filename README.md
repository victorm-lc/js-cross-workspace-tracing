# LangGraph TypeScript Multi-Workspace Tracing

A LangGraph TypeScript agent that routes LangSmith traces to different workspaces based on configuration. This repository contains **two implementations**:

1. **Generic cross-workspace tracing** (`agent_generic.ts`) - for non-deployment scenarios, testable locally
2. **LangSmith deployment tracing** (`agent_deployment.ts`) - for LangSmith Platform deployments

## Two Approaches

### 1. Generic Cross-Workspace Tracing (Testable Locally)

**File:** `agent_generic.ts`

Use this approach for general applications where you want to dynamically route traces to different workspaces based on runtime logic (e.g., customer ID, tenant, or environment).

**Key features:**
- Uses `withTracing` from `langsmith/singletons`
- Can be tested locally without deployment
- Suitable for any TypeScript application (not just deployments)

**Usage:**
```typescript
import { runWithTracing } from "./agent_generic.ts";

const result = await runWithTracing({
  configurable: { workspace_id: "workspace_a" }
});
```

### 2. LangSmith Deployment Override (Requires Deployment)

**File:** `agent_deployment.ts`

Use this approach when deploying agents to LangSmith Platform. The `graph()` factory function is called by the LangGraph server with runtime config, and returns a configured graph with the appropriate tracing client.

**Key features:**
- Uses `LangChainTracer` with graph factory function
- Designed specifically for LangSmith Platform deployments
- Workspace routing based on runtime configuration passed through `config` parameter

**Usage:**
```typescript
// Exported as graph() factory - called by LangGraph server
export function graph(config?) {
  // Returns configured graph with workspace-specific tracer
}
```

## Quick Start

### Prerequisites
- Node.js 18+
- npm or pnpm
- LangSmith account with cross-workspace API key

### 1. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 2. Environment Configuration

Create a `.env` file in the project root:

```bash
# .env
LS_CROSS_WORKSPACE_KEY=your_langsmith_api_key_here
```

**Important**: Use a LangSmith API key that has access to multiple workspaces.

### 3. Update Workspace IDs

Edit both `agent_generic.ts` and `agent_deployment.ts` and replace the workspace IDs with your actual workspace IDs:

```typescript
const workspaceAClient = new Client({
  apiKey: LS_API_KEY || undefined,
  apiUrl: "https://api.smith.langchain.com",
  workspaceId: "your-workspace-a-id-here",  // Replace this
});

const workspaceBClient = new Client({
  apiKey: LS_API_KEY || undefined,
  apiUrl: "https://api.smith.langchain.com",
  workspaceId: "your-workspace-b-id-here",  // Replace this
});
```

## Testing

### Test Generic Version (Locally)

Test the generic cross-workspace tracing approach that works in any application:

```bash
npm run test:generic
```

This will:
1. Run the graph with `workspace_id: "workspace_a"` → traces to workspace A, project "production-traces"
2. Run the graph with `workspace_id: "workspace_b"` → traces to workspace B, project "development-traces"
3. Run the graph with no workspace_id → traces to workspace A, project "default-traces"

Check your LangSmith workspaces to verify traces appear in the correct locations.

### Test Deployment Version (Requires Deployment)

#### Option A: Local LangGraph Dev Server

```bash
npm run dev
# or
langgraph dev
```

Then open LangGraph Studio at `http://localhost:2024` and test with different configurations:
- For Workspace A: `{"configurable": {"workspace_id": "workspace_a"}}`
- For Workspace B: `{"configurable": {"workspace_id": "workspace_b"}}`

#### Option B: Deploy to LangSmith Platform

```bash
langgraph deploy
```

Then test via the LangSmith UI or API with different `workspace_id` configurations.

## Project Structure

```
test-js-workspace-tracing/
├── agent_generic.ts           # Generic cross-workspace tracing (withTracing)
├── agent_deployment.ts        # Deployment cross-workspace tracing (graph factory)
├── agent_ts.ts                # Original combined version (kept for reference)
├── test_generic.ts            # Test script for generic version
├── langgraph.json             # LangGraph config (points to agent_deployment.ts)
├── langgraph_deployment.json  # Alternative config (explicit)
├── package.json               # Node.js project configuration
├── tsconfig.json              # TypeScript configuration
├── .env                       # Environment variables (create this)
└── README.md                  # This file
```

## How Each Approach Works

### Generic Cross-Workspace Tracing

Uses `withTracing` to wrap the graph execution in a workspace-specific context:

```typescript
export async function runWithTracing(config = {}) {
  const workspaceId = config.configurable?.workspace_id ?? "workspace_a";
  const { client, projectName } = getWorkspaceClient(workspaceId);

  // Everything within this context goes to the selected workspace
  return await withTracing(
    async () => {
      return await baseGraph.invoke({}, config);
    },
    {
      client,
      project_name: projectName,
      enabled: true,
    }
  );
}
```

### Deployment Cross-Workspace Tracing

Uses a graph factory function with `LangChainTracer`:

```typescript
export function graph(config?) {
  const workspace_id = config?.configurable?.workspace_id ?? "workspace_a";
  const { client, project_name } = selectTracing({
    configurable: { workspace_id },
  });

  const tracer = new LangChainTracer({ client, projectName: project_name });
  return baseGraph.withConfig({ callbacks: [tracer] });
}
```

## Comparison: Python vs TypeScript

| Feature | Python | TypeScript |
|---------|--------|------------|
| **Generic tracing** | `tracing_context()` context manager | `withTracing()` function |
| **Deployment** | `@contextlib.asynccontextmanager` + `tracing_context` | Synchronous `graph()` factory + `LangChainTracer` |
| **Config passing** | `RunnableConfig` dict | `LangGraphRunnableConfig<T>` type |
| **Client routing** | Same approach | Same approach |

Both achieve the same goal: routing traces to different workspaces based on runtime configuration.

## Deployment to LangSmith Platform

### Environment Variables

Set in your deployment environment:

```bash
LS_CROSS_WORKSPACE_KEY=your_api_key_with_multi_workspace_access
```

### Deployment Command

```bash
langgraph deploy
```

### Testing the Deployment

Once deployed, you can test via:

1. **LangSmith UI**: Use the playground with different configurations
2. **API**: Call the deployed graph with different `workspace_id` values
3. **LangGraph Studio**: Connect to the deployed URL

### Configuration Examples

```json
// Route to workspace A
{
  "configurable": {
    "workspace_id": "workspace_a"
  }
}

// Route to workspace B
{
  "configurable": {
    "workspace_id": "workspace_b"
  }
}

// Use default (workspace A)
{
  "configurable": {}
}
```

## Troubleshooting

### Generic Version Issues

- **Authentication Error**: Ensure `LS_CROSS_WORKSPACE_KEY` has access to all target workspaces
- **Workspace Not Found**: Verify workspace IDs in `agent_generic.ts`
- **No traces appearing**: Check that API key is set correctly in `.env`

### Deployment Version Issues

- **Graph not found**: Verify `langgraph.json` points to `./agent_deployment.ts:graph`
- **Function must be synchronous**: The `graph()` function cannot be async
- **Config not passed**: Ensure you're passing config through the LangGraph API
- **Wrong workspace**: Check that `workspace_id` is being passed in `configurable`

### General Issues

- **Type Errors**: Run `npm install` to ensure all dependencies are installed
- **Import errors**: Check that all `@langchain/` packages are installed
- **Module not found**: Ensure you're using TypeScript 5+ and Node 18+

## Key Differences Between Approaches

### When to Use Generic Version (`agent_generic.ts`)

- ✅ Building a multi-tenant SaaS application
- ✅ Need to test locally without deployment
- ✅ Want to use cross-workspace tracing in any TypeScript app
- ✅ Using LangGraph outside of LangSmith Platform

### When to Use Deployment Version (`agent_deployment.ts`)

- ✅ Deploying to LangSmith Platform
- ✅ Want workspace routing based on deployment configuration
- ✅ Need to override default deployment workspace
- ✅ Using LangGraph Cloud or self-hosted LangGraph server

## Notes

- Each `Client` instance maintains its own connection to a specific workspace
- Both approaches support custom project names per workspace
- The API key must have permissions for all target workspaces
- Configuration is validated with Zod schemas
- Traces include nested LangChain/LangGraph operations automatically

## Next Steps

1. ✅ **Test Generic Version**: Run `npm run test:generic` to verify local cross-workspace tracing
2. ✅ **Test Deployment Locally**: Run `npm run dev` and test in LangGraph Studio
3. ✅ **Deploy**: Run `langgraph deploy` to deploy to LangSmith Platform
4. ✅ **Verify**: Check both workspaces in LangSmith UI for traces in correct projects
