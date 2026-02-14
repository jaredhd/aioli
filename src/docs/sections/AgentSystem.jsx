import React from 'react';
import CodeBlock from '../components/CodeBlock';

export default function AgentSystem() {
  return (
    <section id="agents" className="docs-section">
      <h2 className="docs-section__title">Agent System</h2>

      {/* ------------------------------------------------------------------ */}
      {/* Overview                                                           */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Overview</h3>
      <p className="docs-section__text">
        Aioli uses 6 specialized agents that communicate through a shared
        protocol. Each agent has a focused domain of expertise. The orchestrator
        coordinates requests between agents and manages validation-fix cycles.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* Architecture Diagram                                               */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Architecture</h3>
      <div className="docs-agent-diagram" aria-label="Agent architecture diagram: Orchestrator connects to six specialized agents">
        {/* Orchestrator */}
        <div className="docs-agent-diagram__orchestrator">
          <strong>Orchestrator</strong>
          <span>Request routing, fix cycle management</span>
        </div>

        <div className="docs-agent-diagram__connector" aria-hidden="true">
          <svg width="100%" height="40" viewBox="0 0 600 40" preserveAspectRatio="none">
            <line x1="300" y1="0" x2="50" y2="40" stroke="currentColor" strokeWidth="1.5" />
            <line x1="300" y1="0" x2="160" y2="40" stroke="currentColor" strokeWidth="1.5" />
            <line x1="300" y1="0" x2="270" y2="40" stroke="currentColor" strokeWidth="1.5" />
            <line x1="300" y1="0" x2="380" y2="40" stroke="currentColor" strokeWidth="1.5" />
            <line x1="300" y1="0" x2="490" y2="40" stroke="currentColor" strokeWidth="1.5" />
            <line x1="300" y1="0" x2="560" y2="40" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Agents row */}
        <div className="docs-agent-diagram__agents">
          <div className="docs-agent-diagram__card">
            <strong>Design Token</strong>
            <span>Token CRUD, validation, export</span>
          </div>
          <div className="docs-agent-diagram__card">
            <strong>Accessibility</strong>
            <span>Contrast, HTML, ARIA checks</span>
          </div>
          <div className="docs-agent-diagram__card">
            <strong>Motion</strong>
            <span>Duration, easing, validation</span>
          </div>
          <div className="docs-agent-diagram__card">
            <strong>Component Gen</strong>
            <span>NL to HTML generation</span>
          </div>
          <div className="docs-agent-diagram__card">
            <strong>Code Review</strong>
            <span>Cross-domain review</span>
          </div>
          <div className="docs-agent-diagram__card">
            <strong>AI Gen</strong>
            <span>AI-powered (optional)</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Agent Details Table                                                */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Agent Details</h3>
      <table className="docs-table">
        <thead>
          <tr>
            <th>Agent</th>
            <th>Responsibility</th>
            <th>Key Methods</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Design Token Agent</strong></td>
            <td>Token CRUD operations, reference resolution, validation, and export</td>
            <td>
              <code>getToken()</code>, <code>setToken()</code>,{' '}
              <code>deleteToken()</code>, <code>validate()</code>,{' '}
              <code>toCSS()</code>, <code>toFlatJSON()</code>
            </td>
          </tr>
          <tr>
            <td><strong>Accessibility Validator</strong></td>
            <td>WCAG compliance checking across colors, HTML, and motion</td>
            <td>
              <code>checkContrast()</code>, <code>validateHTML()</code>,{' '}
              <code>validateTokenContrast()</code>, <code>suggestFixes()</code>
            </td>
          </tr>
          <tr>
            <td><strong>Motion Agent</strong></td>
            <td>Animation and transition standards enforcement</td>
            <td>
              <code>getDuration()</code>, <code>getEasing()</code>,{' '}
              <code>generateTransition()</code>, <code>validate()</code>
            </td>
          </tr>
          <tr>
            <td><strong>Component Generator</strong></td>
            <td>Natural language to semantic HTML with token application</td>
            <td>
              <code>generate()</code>, <code>generateFromDescription()</code>
            </td>
          </tr>
          <tr>
            <td><strong>Code Review Agent</strong></td>
            <td>Cross-domain code review spanning all agent domains</td>
            <td>
              <code>review()</code>, <code>quickCheck()</code>
            </td>
          </tr>
          <tr>
            <td><strong>Orchestrator</strong></td>
            <td>Agent coordination, request routing, fix cycle management</td>
            <td>
              <code>routeRequest()</code>, <code>runFixCycle()</code>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ------------------------------------------------------------------ */}
      {/* Agent Protocol                                                     */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Agent Protocol</h3>
      <p className="docs-section__text">
        All agents implement a <code>handleRequest(request)</code> method that
        accepts a structured request object and returns a standardized response.
      </p>
      <CodeBlock
        language="js"
        title="Agent protocol"
        code={`const request = {
  action: 'actionName',   // What to do
  // ... action-specific parameters
};

const result = agent.handleRequest(request);
// Returns: { success: boolean, data: any, error?: string }`}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Request Routing                                                    */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Request Routing</h3>
      <p className="docs-section__text">
        The orchestrator maps agent IDs to instances and routes requests to the
        appropriate agent.
      </p>
      <CodeBlock
        language="js"
        title="Request routing"
        code={`const result = orchestrator.routeRequest('design-token', {
  action: 'getToken',
  path: 'primitive.color.blue.500',
});`}
      />
      <p className="docs-section__text"><strong>Agent IDs:</strong></p>
      <ul className="docs-section__list">
        <li><code>design-token</code> &mdash; Design Token Agent</li>
        <li><code>accessibility-validator</code> &mdash; Accessibility Validator</li>
        <li><code>motion-animation</code> &mdash; Motion Agent</li>
        <li><code>component-generator</code> &mdash; Component Generator</li>
        <li><code>code-review</code> &mdash; Code Review Agent</li>
      </ul>

      {/* ------------------------------------------------------------------ */}
      {/* Fix Cycles                                                         */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Fix Cycles</h3>
      <p className="docs-section__text">
        The orchestrator manages automated validation-fix-revalidation cycles
        to ensure generated code meets all quality standards.
      </p>
      <ol className="docs-section__list">
        <li><strong>Review</strong> &mdash; Code review agent identifies issues across all domains</li>
        <li><strong>Group</strong> &mdash; Issues grouped by responsible agent</li>
        <li><strong>Route</strong> &mdash; Fix requests sent to appropriate agents</li>
        <li><strong>Apply</strong> &mdash; Each agent applies fixes within its domain</li>
        <li><strong>Re-validate</strong> &mdash; Re-run review to verify fixes</li>
        <li><strong>Report</strong> &mdash; Return final state with any remaining issues</li>
      </ol>
      <CodeBlock
        language="js"
        title="Running a fix cycle"
        code={`const result = orchestrator.runFixCycle(code, 'html');
// Returns: { fixed, remaining, fixHistory }`}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Programmatic Usage                                                 */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Programmatic Usage</h3>

      <p className="docs-section__text"><strong>Full system:</strong></p>
      <CodeBlock
        language="js"
        title="Create full agent system"
        code={`import { createAgentSystem } from 'aioli-design';

const { token, a11y, motion, component, codeReview, orchestrator } =
  createAgentSystem('./tokens');`}
      />

      <p className="docs-section__text"><strong>Individual agents:</strong></p>
      <CodeBlock
        language="js"
        title="Create individual agents"
        code={`import { createDesignTokenAgent, createAccessibilityValidator } from 'aioli-design';

const tokenAgent = createDesignTokenAgent('./tokens');
const a11yAgent = createAccessibilityValidator({
  tokenAgent,
  targetLevel: 'AA',
});`}
      />

      <p className="docs-section__text"><strong>With AI generation:</strong></p>
      <CodeBlock
        language="js"
        title="AI-powered generation"
        code={`import { AIComponentGenerator, createDesignTokenAgent } from 'aioli-design';

const tokenAgent = createDesignTokenAgent('./tokens');
const aiGen = new AIComponentGenerator({
  apiKey: process.env.ANTHROPIC_API_KEY,
  tokenAgent,
});

const result = await aiGen.generate('responsive hero section with CTA');`}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Communication Flow                                                 */}
      {/* ------------------------------------------------------------------ */}
      <h3 className="docs-section__subtitle">Communication Flow</h3>
      <p className="docs-section__text">
        The following diagram shows the typical request flow through the agent
        system, from user request to final output.
      </p>

      <div className="docs-agent-flow" aria-label="Agent communication flow diagram">
        <div className="docs-agent-flow__step">
          <div className="docs-agent-flow__node docs-agent-flow__node--start">
            User Request
          </div>
          <div className="docs-agent-flow__arrow" aria-hidden="true">&#x2193;</div>
        </div>

        <div className="docs-agent-flow__step">
          <div className="docs-agent-flow__node docs-agent-flow__node--orchestrator">
            Orchestrator
          </div>
          <div className="docs-agent-flow__arrow" aria-hidden="true">&#x2193;</div>
        </div>

        <div className="docs-agent-flow__step">
          <div className="docs-agent-flow__node">
            Token Agent &mdash; Read tokens
          </div>
          <div className="docs-agent-flow__arrow" aria-hidden="true">&#x2193;</div>
        </div>

        <div className="docs-agent-flow__step">
          <div className="docs-agent-flow__node">
            Component Gen &mdash; Generate HTML
          </div>
          <div className="docs-agent-flow__arrow" aria-hidden="true">&#x2193;</div>
        </div>

        <div className="docs-agent-flow__step">
          <div className="docs-agent-flow__node">
            A11y Agent &mdash; Validate accessibility
          </div>
          <div className="docs-agent-flow__arrow" aria-hidden="true">&#x2193;</div>
        </div>

        <div className="docs-agent-flow__step">
          <div className="docs-agent-flow__node">
            Motion Agent &mdash; Validate animations
          </div>
          <div className="docs-agent-flow__arrow" aria-hidden="true">&#x2193;</div>
        </div>

        <div className="docs-agent-flow__step">
          <div className="docs-agent-flow__node">
            Code Review &mdash; Final check
          </div>
          <div className="docs-agent-flow__arrow" aria-hidden="true">&#x2193;</div>
        </div>

        <div className="docs-agent-flow__step">
          <div className="docs-agent-flow__node docs-agent-flow__node--fix">
            Fix Cycle (if issues found)
          </div>
          <div className="docs-agent-flow__arrow" aria-hidden="true">&#x2193;</div>
        </div>

        <div className="docs-agent-flow__step">
          <div className="docs-agent-flow__node docs-agent-flow__node--end">
            Final Output
          </div>
        </div>
      </div>
    </section>
  );
}
