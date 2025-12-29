#!/usr/bin/env tsx
/**
 * Test script for generic cross-workspace tracing (non-deployment).
 * 
 * This tests the traceable() approach that can be used in any application.
 * Run with: npx tsx test_generic.ts
 */

// Load .env file FIRST before any other imports
import "dotenv/config";

import { runWithTracing } from "./agent_generic";

async function main() {
  console.log("🧪 Testing GENERIC cross-workspace tracing (non-deployment)\n");
  console.log("This version uses LangChainTracer with callbacks.\n");

  try {
    // Test workspace A
    console.log("📍 Testing Workspace A (production)...");
    const resultA = await runWithTracing({
      configurable: { workspace_id: "workspace_a" }
    });
    console.log("✅ Result:", resultA.response);
    console.log("   Check LangSmith workspace A for traces in project: production-traces\n");

    // Test workspace B
    console.log("📍 Testing Workspace B (development)...");
    const resultB = await runWithTracing({
      configurable: { workspace_id: "workspace_b" }
    });
    console.log("✅ Result:", resultB.response);
    console.log("   Check LangSmith workspace B for traces in project: development-traces\n");

    // Test default workspace
    console.log("📍 Testing default workspace...");
    const resultDefault = await runWithTracing({});
    console.log("✅ Result:", resultDefault.response);
    console.log("   Check LangSmith workspace A for traces in project: default-traces\n");

    console.log("🎉 All generic tests completed successfully!");
    console.log("\n📊 Verify traces in LangSmith:");
    console.log("   - Workspace A (1adb79c4-881d-4625-be9c-3118fffb2166):");
    console.log("     → 'production-traces' project");
    console.log("     → 'default-traces' project");
    console.log("   - Workspace B (ebbaf2eb-769b-4505-aca2-d11de10372a4):");
    console.log("     → 'development-traces' project");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

main();

