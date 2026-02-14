/**
 * 🎯 Orchestrator Agent
 * Part of the Aioli Design System
 * 
 * The conductor — coordinates all agents:
 * - Routes fix requests to appropriate agents
 * - Manages validation → fix → re-validation cycles
 * - Resolves conflicts between agents
 * - Provides unified API for the interface layer
 */

import {
  AGENTS,
  FIX_ROUTING,
  groupFixesByAgent,
  getAutoFixable,
  getNeedsReview,
  createFixResult,
} from './agent-protocol.js';

// ============================================================================
// ORCHESTRATOR CLASS
// ============================================================================

export class OrchestratorAgent {
  constructor() {
    this.agents = new Map();
    this.fixHistory = [];
    this.pendingFixes = [];
  }

  // ==========================================================================
  // AGENT REGISTRATION
  // ==========================================================================

  /**
   * Register an agent with the orchestrator
   * @param {string} id - Agent identifier (from AGENTS constant)
   * @param {Object} agent - Agent instance with handleRequest method
   */
  registerAgent(id, agent) {
    if (!agent.handleRequest) {
      throw new Error(`Agent ${id} must implement handleRequest method`);
    }
    this.agents.set(id, agent);
    console.log(`🎯 Orchestrator: Registered ${id} agent`);
  }

  /**
   * Get a registered agent
   */
  getAgent(id) {
    return this.agents.get(id);
  }

  /**
   * Check if an agent is available
   */
  hasAgent(id) {
    return this.agents.has(id);
  }

  // ==========================================================================
  // REQUEST ROUTING
  // ==========================================================================

  /**
   * Route a request to the appropriate agent
   * @param {string} agentId - Target agent
   * @param {Object} request - Request object
   * @returns {Object} Agent response
   */
  routeRequest(agentId, request) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return { success: false, error: `Agent not registered: ${agentId}` };
    }

    try {
      return agent.handleRequest(request);
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // ==========================================================================
  // FIX ORCHESTRATION
  // ==========================================================================

  /**
   * Process a batch of fixes - route each to the appropriate agent
   * @param {Array} fixes - Array of fix requests
   * @param {Object} options
   * @param {boolean} options.autoFixOnly - Only apply auto-fixable fixes
   * @param {boolean} options.dryRun - Don't actually apply fixes, just report
   * @returns {Object} Results summary
   */
  async processFixes(fixes, options = {}) {
    const { autoFixOnly = false, dryRun = false } = options;

    // Group by target agent
    const byAgent = groupFixesByAgent(fixes);
    
    // Filter if autoFixOnly
    const toProcess = autoFixOnly ? getAutoFixable(fixes) : fixes;
    const needsReview = getNeedsReview(fixes);

    const results = {
      processed: [],
      skipped: [],
      failed: [],
      needsReview: needsReview.length,
      summary: {
        total: fixes.length,
        attempted: 0,
        succeeded: 0,
        failed: 0,
      }
    };

    console.log(`\n🎯 Orchestrator: Processing ${toProcess.length} fixes...`);
    if (needsReview.length > 0) {
      console.log(`   (${needsReview.length} fixes need human review)`);
    }

    for (const fix of toProcess) {
      results.summary.attempted++;

      // Check if target agent is available
      if (!this.hasAgent(fix.target)) {
        console.log(`⏭️  Skipping: ${fix.target} agent not registered`);
        results.skipped.push({ fix, reason: 'Agent not registered' });
        continue;
      }

      // Skip human-required fixes
      if (fix.target === AGENTS.HUMAN) {
        results.skipped.push({ fix, reason: 'Requires human review' });
        continue;
      }

      if (dryRun) {
        console.log(`🔍 [DRY RUN] Would apply: ${fix.description}`);
        results.processed.push({ fix, dryRun: true });
        results.summary.succeeded++;
        continue;
      }

      // Route to agent
      console.log(`🔧 Routing to ${fix.target}: ${fix.description}`);
      const result = this.routeRequest(fix.target, {
        action: 'applyFix',
        fix
      });

      if (result.success) {
        results.summary.succeeded++;
        results.processed.push({ fix, result });
        this.fixHistory.push({
          fix,
          result,
          appliedAt: new Date().toISOString()
        });
      } else {
        results.summary.failed++;
        results.failed.push({ fix, error: result.error });
        console.log(`❌ Failed: ${result.error}`);
      }
    }

    console.log(`\n🎯 Orchestrator: Complete`);
    console.log(`   ✓ ${results.summary.succeeded} succeeded`);
    console.log(`   ✗ ${results.summary.failed} failed`);
    console.log(`   ⏭️  ${results.skipped.length} skipped`);

    return results;
  }

  /**
   * Run a full validation → suggest → fix → re-validate cycle
   * @param {Object} options
   * @returns {Object} Full cycle results
   */
  async runFixCycle(options = {}) {
    const { autoFixOnly = true, maxIterations = 3 } = options;

    if (!this.hasAgent(AGENTS.A11Y)) {
      return { success: false, error: 'Accessibility agent not registered' };
    }

    const cycleResults = {
      iterations: [],
      totalFixed: 0,
      remainingIssues: 0,
    };

    for (let i = 0; i < maxIterations; i++) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🔄 Fix Cycle - Iteration ${i + 1}/${maxIterations}`);
      console.log(`${'='.repeat(60)}`);

      // Step 1: Validate
      console.log('\n📋 Step 1: Running validation...');
      const a11yAgent = this.getAgent(AGENTS.A11Y);
      
      // Run token contrast validation
      a11yAgent.reset();
      a11yAgent.validateTokenContrast();
      
      if (a11yAgent.issues.length === 0) {
        console.log('✅ No issues found!');
        break;
      }

      console.log(`   Found ${a11yAgent.issues.length} issues`);

      // Step 2: Get fix suggestions
      console.log('\n💡 Step 2: Generating fix suggestions...');
      const suggestions = a11yAgent.suggestFixes();
      
      const fixable = suggestions.fixes.filter(f => f.autoFixable);
      console.log(`   ${suggestions.fixes.length} fixes suggested (${fixable.length} auto-fixable)`);

      if (fixable.length === 0) {
        console.log('   No auto-fixable issues remaining');
        cycleResults.remainingIssues = a11yAgent.issues.length;
        break;
      }

      // Step 3: Apply fixes
      console.log('\n🔧 Step 3: Applying fixes...');
      const fixResults = await this.processFixes(
        autoFixOnly ? fixable : suggestions.fixes,
        { autoFixOnly }
      );

      cycleResults.iterations.push({
        iteration: i + 1,
        issuesFound: a11yAgent.issues.length,
        fixesApplied: fixResults.summary.succeeded,
        fixesFailed: fixResults.summary.failed,
      });

      cycleResults.totalFixed += fixResults.summary.succeeded;

      // If nothing was fixed, stop iterating
      if (fixResults.summary.succeeded === 0) {
        console.log('   No fixes applied - stopping cycle');
        break;
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎯 Fix Cycle Complete`);
    console.log(`   Total iterations: ${cycleResults.iterations.length}`);
    console.log(`   Total fixes applied: ${cycleResults.totalFixed}`);
    console.log(`   Remaining issues: ${cycleResults.remainingIssues}`);
    console.log(`${'='.repeat(60)}\n`);

    return cycleResults;
  }

  // ==========================================================================
  // UNIFIED API
  // ==========================================================================

  /**
   * Handle requests from the interface layer
   */
  handleRequest(request) {
    if (!request || !request.action) {
      return { success: false, error: 'Request must include an action' };
    }
    const { action } = request;

    try {
      switch (action) {
        case 'validate':
          return this.runValidation(request.scope);

        case 'suggestFixes':
          return this.getSuggestedFixes();

        case 'applyFixes':
          return this.processFixes(request.fixes, request.options);

        case 'runFixCycle':
          return this.runFixCycle(request.options);

        case 'getStatus':
          return this.getSystemStatus();

        case 'route':
          return this.routeRequest(request.target, request.payload);

        default:
          return { success: false, error: `Unknown action: ${action}` };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Run validation across all registered agents
   */
  runValidation(scope = 'all') {
    const results = {};

    if (this.hasAgent(AGENTS.A11Y) && (scope === 'all' || scope === 'a11y')) {
      const a11y = this.getAgent(AGENTS.A11Y);
      a11y.reset();
      results.a11y = {
        tokenContrast: a11y.validateTokenContrast(),
        issues: [...a11y.issues],
      };
    }

    if (this.hasAgent(AGENTS.TOKEN) && (scope === 'all' || scope === 'tokens')) {
      const token = this.getAgent(AGENTS.TOKEN);
      results.tokens = token.validate();
    }

    return { success: true, data: results };
  }

  /**
   * Get suggested fixes from all agents
   */
  getSuggestedFixes() {
    if (!this.hasAgent(AGENTS.A11Y)) {
      return { success: false, error: 'A11y agent not registered' };
    }

    const a11y = this.getAgent(AGENTS.A11Y);
    return { success: true, data: a11y.suggestFixes() };
  }

  /**
   * Get system status
   */
  getSystemStatus() {
    return {
      success: true,
      data: {
        registeredAgents: Array.from(this.agents.keys()),
        fixHistory: this.fixHistory.length,
        pendingFixes: this.pendingFixes.length,
      }
    };
  }
}

// ============================================================================
// FACTORY & EXPORTS
// ============================================================================

/**
 * Create an orchestrator with all available agents registered
 */
export function createOrchestrator(agents = {}) {
  const orchestrator = new OrchestratorAgent();

  // Register provided agents
  for (const [id, agent] of Object.entries(agents)) {
    orchestrator.registerAgent(id, agent);
  }

  return orchestrator;
}

export default OrchestratorAgent;
