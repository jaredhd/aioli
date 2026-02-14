/**
 * 🧄 Aioli Studio - Agent Hooks
 * 
 * React hooks for interacting with the agent API.
 * These provide a clean interface between the UI and agent system.
 */

import { useState, useCallback, useEffect } from 'react';

const API_BASE = 'http://localhost:3001/api';

// ============================================================================
// GENERIC FETCH HELPER
// ============================================================================

async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// ============================================================================
// TOKEN HOOKS
// ============================================================================

/**
 * Hook for managing design tokens
 */
export function useTokens() {
  const [tokens, setTokens] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTokens = useCallback(async (prefix) => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = prefix ? `/tokens?prefix=${prefix}` : '/tokens';
      const data = await apiFetch(endpoint);
      setTokens(data.tokens);
      return data.tokens;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getToken = useCallback(async (path) => {
    try {
      const data = await apiFetch(`/tokens/get?path=${encodeURIComponent(path)}`);
      return data.token;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  const updateToken = useCallback(async (path, value, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/tokens/set`, {
        method: 'PUT',
        body: { path, value, ...options },
      });
      // Refresh tokens after update
      await fetchTokens();
      return data.token;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchTokens]);

  const validateTokens = useCallback(async () => {
    try {
      const data = await apiFetch('/tokens/validate', { method: 'POST' });
      return data.validation;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  const exportCSS = useCallback(async () => {
    try {
      const data = await apiFetch('/tokens/export/css');
      return data.css;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  return {
    tokens,
    loading,
    error,
    fetchTokens,
    getToken,
    updateToken,
    validateTokens,
    exportCSS,
  };
}

// ============================================================================
// COMPONENT GENERATOR HOOKS
// ============================================================================

/**
 * Hook for generating components
 */
export function useComponentGenerator() {
  const [generating, setGenerating] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [error, setError] = useState(null);

  const generateFromDescription = useCallback(async (description, options = {}) => {
    setGenerating(true);
    setError(null);
    try {
      const data = await apiFetch('/components/generate', {
        method: 'POST',
        body: { description, apiKey: options.apiKey },
      });
      setLastResult(data.component);
      return data.component;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setGenerating(false);
    }
  }, []);

  const generate = useCallback(async (type, props = {}) => {
    setGenerating(true);
    setError(null);
    try {
      const data = await apiFetch('/components/generate', {
        method: 'POST',
        body: { type, props },
      });
      setLastResult(data.component);
      return data.component;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setGenerating(false);
    }
  }, []);

  const fixComponent = useCallback(async (html, issues, options = {}) => {
    setGenerating(true);
    setError(null);
    try {
      const data = await apiFetch('/components/fix', {
        method: 'POST',
        body: { html, issues, apiKey: options.apiKey },
      });
      if (data.component) {
        setLastResult(prev => ({
          ...prev,
          html: data.component.html,
          validation: data.component.validation,
          fixed: true,
          issuesFixed: data.component.issuesFixed,
          remainingIssues: data.component.remainingIssues,
        }));
      }
      return data.component;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setGenerating(false);
    }
  }, []);

  const getTemplates = useCallback(async () => {
    try {
      const data = await apiFetch('/components/templates');
      return data.templates;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  return {
    generating,
    lastResult,
    error,
    generateFromDescription,
    generate,
    fixComponent,
    getTemplates,
  };
}

// ============================================================================
// ACCESSIBILITY HOOKS
// ============================================================================

/**
 * Hook for accessibility validation
 */
export function useAccessibility() {
  const [validating, setValidating] = useState(false);
  const [issues, setIssues] = useState([]);
  const [error, setError] = useState(null);

  const checkContrast = useCallback(async (foreground, background, options = {}) => {
    try {
      const data = await apiFetch('/a11y/check-contrast', {
        method: 'POST',
        body: { foreground, background, ...options },
      });
      return data.result;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  const validateHTML = useCallback(async (html) => {
    setValidating(true);
    setError(null);
    try {
      const data = await apiFetch('/a11y/validate-html', {
        method: 'POST',
        body: { html },
      });
      setIssues(data.result?.issues || []);
      return data.result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setValidating(false);
    }
  }, []);

  const validateTokenContrast = useCallback(async () => {
    setValidating(true);
    setError(null);
    try {
      const data = await apiFetch('/a11y/validate-tokens', { method: 'POST' });
      setIssues(data.issues || []);
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setValidating(false);
    }
  }, []);

  const suggestFixes = useCallback(async (issueList) => {
    try {
      const data = await apiFetch('/a11y/suggest-fixes', {
        method: 'POST',
        body: { issues: issueList || issues },
      });
      return data.fixes;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, [issues]);

  return {
    validating,
    issues,
    error,
    checkContrast,
    validateHTML,
    validateTokenContrast,
    suggestFixes,
  };
}

// ============================================================================
// MOTION HOOKS
// ============================================================================

/**
 * Hook for motion/animation
 */
export function useMotion() {
  const [error, setError] = useState(null);

  const getDuration = useCallback(async (type, device = 'desktop') => {
    try {
      const data = await apiFetch('/motion/get-duration', {
        method: 'POST',
        body: { type, device },
      });
      return data.result;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  const getEasing = useCallback(async (direction) => {
    try {
      const data = await apiFetch('/motion/get-easing', {
        method: 'POST',
        body: { direction },
      });
      return data.result;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  const validateMotion = useCallback(async (css) => {
    try {
      const data = await apiFetch('/motion/validate', {
        method: 'POST',
        body: { css },
      });
      return data.result;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  return {
    error,
    getDuration,
    getEasing,
    validateMotion,
  };
}

// ============================================================================
// CODE REVIEW HOOKS
// ============================================================================

/**
 * Hook for code review
 */
export function useCodeReview() {
  const [reviewing, setReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState(null);
  const [error, setError] = useState(null);

  const review = useCallback(async ({ code, html, css }) => {
    setReviewing(true);
    setError(null);
    try {
      const data = await apiFetch('/review', {
        method: 'POST',
        body: { code, html, css },
      });
      setReviewResult(data.result);
      return data.result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setReviewing(false);
    }
  }, []);

  const quickCheck = useCallback(async ({ code, html, css }) => {
    try {
      const data = await apiFetch('/review/quick', {
        method: 'POST',
        body: { code, html, css },
      });
      return data.result;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  return {
    reviewing,
    reviewResult,
    error,
    review,
    quickCheck,
  };
}

// ============================================================================
// ORCHESTRATOR HOOKS
// ============================================================================

/**
 * Hook for orchestrator actions
 */
export function useOrchestrator() {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleRequest = useCallback(async (type, agent, data) => {
    setProcessing(true);
    setError(null);
    try {
      const response = await apiFetch('/orchestrator/request', {
        method: 'POST',
        body: { type, agent, data },
      });
      return response.result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setProcessing(false);
    }
  }, []);

  const runFixCycle = useCallback(async ({ code, html, css }) => {
    setProcessing(true);
    setError(null);
    try {
      const data = await apiFetch('/orchestrator/fix-cycle', {
        method: 'POST',
        body: { code, html, css },
      });
      return data.result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setProcessing(false);
    }
  }, []);

  return {
    processing,
    error,
    handleRequest,
    runFixCycle,
  };
}

// ============================================================================
// COMBINED STUDIO HOOK
// ============================================================================

/**
 * Combined hook providing all agent functionality for the Studio
 */
export function useAioliAgents() {
  const tokens = useTokens();
  const component = useComponentGenerator();
  const a11y = useAccessibility();
  const motion = useMotion();
  const codeReview = useCodeReview();
  const orchestrator = useOrchestrator();

  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  // Check API connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch(`${API_BASE}/health`);
        const data = await response.json();
        setConnected(data.status === 'ok');
        setConnectionError(null);
      } catch (err) {
        setConnected(false);
        setConnectionError('Cannot connect to Aioli API server');
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  return {
    connected,
    connectionError,
    tokens,
    component,
    a11y,
    motion,
    codeReview,
    orchestrator,
  };
}

export default useAioliAgents;
