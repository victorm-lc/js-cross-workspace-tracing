# Quick Start Guide

## 🎯 Ready to Test!

You now have **TWO implementations** ready to test:

### 1️⃣ Generic Cross-Workspace Tracing (Test NOW)

**File:** `agent_generic.ts`  
**Method:** Uses `withTracing` from langsmith  
**Can test:** ✅ Right now, locally, no deployment needed

```bash
# 1. Create .env file
echo "LS_CROSS_WORKSPACE_KEY=your_api_key" > .env

# 2. Run test
npm run test:generic
```

This will run the graph 3 times and send traces to different workspaces.

### 2️⃣ LangSmith Deployment Tracing (Deploy to Test)

**File:** `agent_deployment.ts`  
**Method:** Uses `graph()` factory with `LangChainTracer`  
**Can test:** After deploying to LangSmith Platform or running `langgraph dev`

```bash
# Option A: Test locally with LangGraph server
langgraph dev
# Then open http://localhost:2024

# Option B: Deploy to LangSmith Platform
langgraph deploy
```

---

## 📊 What Each Implementation Does

Both implementations do the same thing but in different ways:

| Feature | Generic | Deployment |
|---------|---------|------------|
| **Workspace routing** | ✅ Yes | ✅ Yes |
| **Config-based** | ✅ Yes | ✅ Yes |
| **Local testing** | ✅ Easy | ⚠️ Needs server |
| **Deployment** | ❌ Not intended | ✅ Designed for it |

### Workspace Routing Logic (Both)

```typescript
workspace_id: "workspace_a" → Workspace A, project "production-traces"
workspace_id: "workspace_b" → Workspace B, project "development-traces"
(no workspace_id)           → Workspace A, project "default-traces"
```

---

## 🚀 Your Next Steps

### Step 1: Test Generic Version (5 minutes)

1. Create `.env`:
   ```bash
   LS_CROSS_WORKSPACE_KEY=lsv2_pt_your_key_here
   ```

2. Run test:
   ```bash
   npm run test:generic
   ```

3. Check LangSmith UI:
   - Workspace A → "production-traces" and "default-traces"
   - Workspace B → "development-traces"

### Step 2: Deploy and Test Deployment Version (10 minutes)

1. Ensure `.env` has your API key

2. Run local server:
   ```bash
   langgraph dev
   ```

3. Open Studio and test with configs:
   ```json
   {"configurable": {"workspace_id": "workspace_a"}}
   {"configurable": {"workspace_id": "workspace_b"}}
   ```

4. Verify traces in LangSmith

### Step 3: Deploy to LangSmith Platform

```bash
langgraph deploy
```

Add `LS_CROSS_WORKSPACE_KEY` to your deployment environment variables, then test via the LangSmith UI.

---

## 📁 File Structure

```
test-js-workspace-tracing/
├── agent_generic.ts          ← Generic version (withTracing)
├── agent_deployment.ts       ← Deployment version (graph factory)
├── test_generic.ts           ← Test script
├── langgraph.json            ← Points to agent_deployment.ts
├── package.json              ← Dependencies ✅ installed
├── .env                      ← YOU NEED TO CREATE THIS
├── README.md                 ← Full documentation
├── DEPLOYMENT_GUIDE.md       ← Step-by-step deployment
├── TESTING_SUMMARY.md        ← Testing checklist
└── QUICK_START.md           ← This file
```

---

## 🔑 Important: Update Workspace IDs

Both files currently use these workspace IDs:
- Workspace A: `1adb79c4-881d-4625-be9c-3118fffb2166`
- Workspace B: `ebbaf2eb-769b-4505-aca2-d11de10372a4`

**Before deploying to production**, update these to your actual workspace IDs in:
- `agent_generic.ts` (lines 83-93)
- `agent_deployment.ts` (lines 73-83)

---

## 🎓 Comparison with Python Version

You already have a working Python version in:
`/Users/victormoreira/Desktop/scratch/lgp-tracing-alternate-workspace/`

### Python vs TypeScript

| Aspect | Python | TypeScript |
|--------|--------|------------|
| **Generic tracing** | `tracing_context()` | `withTracing()` |
| **Deployment** | `@asynccontextmanager` + `yield` | Sync `graph()` factory + `return` |
| **Tracer** | Context manager | `LangChainTracer` callback |

Both achieve the same goal: **route traces to different workspaces based on runtime config**.

---

## ✅ What's Already Done

- [x] Created both implementations (generic + deployment)
- [x] Installed all dependencies
- [x] Created test script
- [x] Created comprehensive documentation
- [x] No linter errors
- [x] Ready to test locally
- [x] Ready to deploy

---

## 🎯 Test Command

```bash
cd /Users/victormoreira/Desktop/test-js-workspace-tracing
npm run test:generic
```

That's it! You're ready to test both versions. 🚀

