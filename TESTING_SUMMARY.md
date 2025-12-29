# Testing Summary

This document provides a quick overview of what's set up and ready to test.

## ✅ What's Ready

### Files Created

1. **`agent_generic.ts`** - Generic cross-workspace tracing (uses `withTracing`)
2. **`agent_deployment.ts`** - LangSmith deployment tracing (uses `graph()` factory)
3. **`test_generic.ts`** - Test script for generic version
4. **`package.json`** - Dependencies and scripts
5. **`langgraph.json`** - LangGraph configuration (points to deployment version)
6. **`tsconfig.json`** - TypeScript configuration
7. **`README.md`** - Complete documentation
8. **`DEPLOYMENT_GUIDE.md`** - Step-by-step deployment instructions

### Dependencies Installed

✅ All dependencies installed via `npm install`

## 🧪 Test Locally Right Now

### 1. Set up your `.env` file

Create `/Users/victormoreira/Desktop/test-js-workspace-tracing/.env`:

```bash
LS_CROSS_WORKSPACE_KEY=your_api_key_here
```

### 2. Test the Generic Version

```bash
cd /Users/victormoreira/Desktop/test-js-workspace-tracing
npm run test:generic
```

**This will:**
- ✅ Run without deployment
- ✅ Test 3 scenarios (workspace A, B, default)
- ✅ Send traces to your actual LangSmith workspaces
- ✅ Show results in terminal

**Expected traces:**
- Workspace `1adb79c4-881d-4625-be9c-3118fffb2166` → "production-traces" and "default-traces"
- Workspace `ebbaf2eb-769b-4505-aca2-d11de10372a4` → "development-traces"

## 🚀 Deploy to LangSmith (Deployment Version)

### 1. Ensure `.env` is set up

The deployment needs `LS_CROSS_WORKSPACE_KEY` in the environment.

### 2. Test with Local LangGraph Server

```bash
cd /Users/victormoreira/Desktop/test-js-workspace-tracing
langgraph dev
```

Open http://localhost:2024 and test with Studio.

### 3. Deploy to LangSmith Platform

```bash
cd /Users/victormoreira/Desktop/test-js-workspace-tracing
langgraph deploy
```

Follow the prompts and then test via the LangSmith UI.

## 📋 Pre-Test Checklist

Before testing, verify:

- [ ] `.env` file created with `LS_CROSS_WORKSPACE_KEY`
- [ ] API key has access to both workspaces:
  - `1adb79c4-881d-4625-be9c-3118fffb2166` (workspace A)
  - `ebbaf2eb-769b-4505-aca2-d11de10372a4` (workspace B)
- [ ] Dependencies installed (✅ done)
- [ ] TypeScript compiles without errors

## 🔍 How to Verify Tests Worked

### After running `npm run test:generic`:

1. **Go to workspace A** (`1adb79c4-881d-4625-be9c-3118fffb2166`):
   - Check project "production-traces" → should have 1 trace
   - Check project "default-traces" → should have 1 trace

2. **Go to workspace B** (`ebbaf2eb-769b-4505-aca2-d11de10372a4`):
   - Check project "development-traces" → should have 1 trace

3. **Verify trace contents**:
   - Each trace should show the graph execution
   - Response should match the workspace (e.g., "Hello from Workspace A!")

### After deployment testing:

Same verification, but traces will be created via the deployed graph instead of local execution.

## 📝 What Each Test Does

### Generic Version Test (`npm run test:generic`)

**Test 1: Workspace A**
```typescript
runWithTracing({ configurable: { workspace_id: "workspace_a" } })
```
→ Traces to workspace A, project "production-traces"  
→ Returns: "Hello from Workspace A! Processing with production settings."

**Test 2: Workspace B**
```typescript
runWithTracing({ configurable: { workspace_id: "workspace_b" } })
```
→ Traces to workspace B, project "development-traces"  
→ Returns: "Hello from Workspace B! Processing with development settings."

**Test 3: Default**
```typescript
runWithTracing({})
```
→ Traces to workspace A (default), project "default-traces"  
→ Returns: "Hello from Workspace A! Processing with production settings."

### Deployment Version Test (via Studio/API)

Same logic, but invoked through LangGraph server with config passed via API.

## 🛠️ Commands Reference

```bash
# Install dependencies (already done)
npm install

# Test generic version locally
npm run test:generic

# Start local LangGraph server (for deployment version)
langgraph dev

# Deploy to LangSmith Platform
langgraph deploy
```

## 🔗 Quick Links

- **Generic implementation**: [`agent_generic.ts`](./agent_generic.ts)
- **Deployment implementation**: [`agent_deployment.ts`](./agent_deployment.ts)
- **Test script**: [`test_generic.ts`](./test_generic.ts)
- **Full docs**: [`README.md`](./README.md)
- **Deployment guide**: [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md)

## 💡 Tips

1. **Start with generic version** - Easier to test, no deployment needed
2. **Check console output** - Shows which workspace is being used
3. **Verify API key permissions** - Must have access to both workspaces
4. **Use different workspace IDs** - Replace the hardcoded IDs with your own
5. **Monitor LangSmith UI** - Watch traces appear in real-time

## ❓ Troubleshooting

**No traces appearing?**
- Check `.env` has the correct API key
- Verify API key has workspace access
- Check console for errors

**Wrong workspace?**
- Verify `workspace_id` in config
- Check workspace IDs match your LangSmith workspaces

**TypeScript errors?**
- Run `npm install` again
- Check Node version (need 18+)

---

Ready to test! Start with:

```bash
cd /Users/victormoreira/Desktop/test-js-workspace-tracing
npm run test:generic
```

