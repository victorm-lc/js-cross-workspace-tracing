# Deployment Guide: Cross-Workspace Tracing

This guide walks you through deploying the TypeScript agent to LangSmith with cross-workspace tracing.

## Prerequisites

- LangSmith account with access to multiple workspaces
- Personal Access Token (`lsv2_pt_...`) with org-level access
- Code pushed to a GitHub repository
- LangGraph CLI installed (for local testing): `npm install -g @langchain/langgraph-cli`

## Local Testing with LangGraph Studio

Before deploying, test locally with LangGraph Studio:

```bash
cd /Users/victormoreira/Desktop/test-js-workspace-tracing

# Start local LangGraph dev server
langgraph dev
```

This opens Studio at `http://localhost:2024` where you can:
1. Select the "agent" graph
2. Set `workspace_id` in the configuration panel
3. Run the agent and verify traces appear in the correct workspace

## Deploy to LangSmith Cloud

### Step 1: Push to GitHub

Your code must be in a GitHub repository. Push your code:

```bash
git init  # if not already
git add .
git commit -m "Add cross-workspace tracing agent"
git remote add origin <your-repo-url>
git push -u origin main
```

### Step 2: Create Deployment in LangSmith UI

1. Go to [LangSmith](https://smith.langchain.com)
2. Navigate to **Deployments** in the left sidebar
3. Click **+ New Deployment**
4. Select your GitHub repository from the dropdown
5. Configure the deployment:
   - Select the branch (e.g., `main`)
   - LangSmith will detect your `langgraph.json` automatically
6. Click **Deploy**

### Step 3: Configure Environment Variables

After deployment is created:

1. Go to your deployment's **Settings** tab
2. Add environment variable:

| Variable | Value |
|----------|-------|
| `LS_CROSS_WORKSPACE_KEY` | Your Personal Access Token (`lsv2_pt_...`) |

**Important**: This must be a Personal Access Token, not a workspace-scoped Service Key (`lsv2_sk_...`).

### Step 4: Create Assistants

Navigate to your deployment's **Assistants** tab:

#### Assistant A (Production Workspace)

1. Click **+ New Assistant**
2. Select graph: `agent`
3. Name: `Production Traces`
4. In the configuration panel, set:
   - `workspace_id`: `workspace_a`
5. Click **Create Assistant**

#### Assistant B (Development Workspace)

1. Click **+ New Assistant**
2. Select graph: `agent`
3. Name: `Development Traces`
4. In the configuration panel, set:
   - `workspace_id`: `workspace_b`
5. Click **Create Assistant**

## Testing the Deployment

### Test via Studio

1. Go to your deployment
2. Click on an assistant to open it in Studio
3. Run the agent
4. Check the corresponding workspace for traces:
   - **Production Traces** assistant → Workspace A, project "production-traces"
   - **Development Traces** assistant → Workspace B, project "development-traces"

### Test via SDK

```typescript
import { Client } from "@langchain/langgraph-sdk";

const client = new Client({ 
  apiUrl: "your-deployment-url", 
  apiKey: "your-langsmith-api-key" 
});

// Option 1: Use assistant by name/ID
const thread = await client.threads.create();
const response = await client.runs.create(
  thread.thread_id,
  "production-traces-assistant-id",  // or use the UUID
  { input: {} }
);

// Option 2: Pass config directly with graph ID
const response2 = await client.runs.create(
  thread.thread_id,
  "agent",  // graph ID
  { 
    input: {},
    config: { configurable: { workspace_id: "workspace_b" } }
  }
);
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    LangSmith Deployment                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐      ┌──────────────────┐            │
│  │  Assistant A     │      │  Assistant B     │            │
│  │  workspace_id:   │      │  workspace_id:   │            │
│  │  "workspace_a"   │      │  "workspace_b"   │            │
│  └────────┬─────────┘      └────────┬─────────┘            │
│           │                         │                       │
│           ▼                         ▼                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              graph(config)                           │   │
│  │  - Reads workspace_id from config.configurable      │   │
│  │  - Creates LangChainTracer with workspace client    │   │
│  │  - Attaches tracer via callbacks                    │   │
│  └─────────────────────────────────────────────────────┘   │
│           │                         │                       │
└───────────┼─────────────────────────┼───────────────────────┘
            │                         │
            ▼                         ▼
   ┌────────────────┐        ┌────────────────┐
   │  Workspace A   │        │  Workspace B   │
   │  production-   │        │  development-  │
   │  traces        │        │  traces        │
   └────────────────┘        └────────────────┘
```

## Workspace Configuration

The agent is configured with these workspace IDs (in `agent_deployment.ts`):

| Workspace | ID | Project Name |
|-----------|-----|--------------|
| Workspace A | `1adb79c4-881d-4625-be9c-3118fffb2166` | production-traces |
| Workspace B | `ebbaf2eb-769b-4505-aca2-d11de10372a4` | development-traces |

To use different workspaces, update lines 91-101 in `agent_deployment.ts`.

## Troubleshooting

### 403 Forbidden errors
- Ensure `LS_CROSS_WORKSPACE_KEY` is a Personal Access Token (`lsv2_pt_...`)
- Service Keys (`lsv2_sk_...`) only work for their home workspace

### Traces not appearing in correct workspace
- Verify the `workspace_id` value in your assistant configuration
- Check that the workspace IDs in `agent_deployment.ts` match your actual workspaces

### Configuration not showing in Studio
- The `workspace_id` field should appear in the configuration panel
- If not visible, check that `ConfigSchema` is passed to `StateGraph`

### Deployment not building
- Ensure `langgraph.json` points to the correct file: `"./agent_deployment.ts:graph"`
- Check that all dependencies are in `package.json`
