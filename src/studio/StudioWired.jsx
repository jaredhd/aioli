import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useAioliAgents } from './useAgents.js';

// ============================================================================
// AIOLI STUDIO - WIRED TO AGENTS
// Phase 4: Full integration with the 6-agent system
// ============================================================================

const AVAILABLE_FONTS = [
  { name: 'Inter', weights: [400, 500, 600, 700] },
  { name: 'Roboto', weights: [400, 500, 700] },
  { name: 'Open Sans', weights: [400, 600, 700] },
  { name: 'Poppins', weights: [400, 500, 600, 700] },
  { name: 'Montserrat', weights: [400, 500, 600, 700] },
  { name: 'Playfair Display', weights: [400, 600, 700] },
];

// Hook to load Google Fonts
const useGoogleFont = (fontFamily) => {
  useEffect(() => {
    if (!fontFamily) return;
    const fontId = `google-font-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
    if (document.getElementById(fontId)) return;
    const link = document.createElement('link');
    link.id = fontId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@400;500;600;700&display=swap`;
    document.head.appendChild(link);
  }, [fontFamily]);
};

// Hook to track window size
const useWindowSize = () => {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    const handleResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return size;
};

export default function StudioWired() {
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  // Connect to agents
  const agents = useAioliAgents();

  // ===== UI STATE =====
  // Detect system preference for initial theme
  const getInitialTheme = () => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  };
  
  const [theme, setTheme] = useState(getInitialTheme);
  const [activeView, setActiveView] = useState('create');
  const [viewportSize, setViewportSize] = useState('desktop');
  const [leftPanelOpen, setLeftPanelOpen] = useState(isDesktop);
  const [rightPanelOpen, setRightPanelOpen] = useState(isDesktop);
  const [activeTokenSection, setActiveTokenSection] = useState('colors');
  const [mobilePanel, setMobilePanel] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [apiKey, setApiKey] = useState(localStorage.getItem('aioli_api_key') || '');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  
  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setTheme(e.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // ===== LOCAL TOKEN STATE (syncs with agent) =====
  const [localTokens, setLocalTokens] = useState({
    colors: {
      primary: '#2563eb',      // blue-600: 4.7:1 with white text ✓
      secondary: '#475569',
      success: '#16a34a',
      danger: '#dc2626',
      warning: '#d97706',
      background: '#ffffff',
      text: '#0f172a',
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
    typography: {
      fontFamily: 'Inter',
      baseFontSize: 16,
      headingWeight: 600,
      bodyWeight: 400,
    },
    motion: { micro: 100, fast: 150, normal: 250, slow: 400 },
    radius: { sm: 4, md: 8, lg: 12 },
  });
  
  // Update background/text colors when theme changes
  // Primary stays consistent (button backgrounds work with white text in both modes)
  useEffect(() => {
    setLocalTokens(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        background: theme === 'dark' ? '#0f172a' : '#ffffff',
        text: theme === 'dark' ? '#f8fafc' : '#0f172a',
      }
    }));
  }, [theme]);

  // ===== GENERATED COMPONENT STATE =====
  const [generatedComponent, setGeneratedComponent] = useState(null);
  const [generationError, setGenerationError] = useState(null);
  const [isFixing, setIsFixing] = useState(false);

  // ===== VALIDATION STATE =====
  const [validationResults, setValidationResults] = useState([]);
  const [contrastResults, setContrastResults] = useState([]);

  // Load font
  useGoogleFont(localTokens.typography.fontFamily);

  // ===== LOAD TOKENS FROM AGENT ON MOUNT =====
  useEffect(() => {
    if (agents.connected) {
      loadTokensFromAgent();
    }
  }, [agents.connected]);

  const loadTokensFromAgent = async () => {
    // Load primitive colors
    const colors = await agents.tokens.getToken('primitive.color.blue.500');
    if (colors) {
      // In a real implementation, we'd map all tokens
      console.log('🎨 Loaded tokens from agent');
    }
  };

  // ===== TOKEN UPDATE (SYNC TO AGENT) =====
  const updateToken = useCallback(async (category, key, value) => {
    // Update local state immediately for responsiveness
    setLocalTokens(prev => ({
      ...prev,
      [category]: { ...prev[category], [key]: value }
    }));

    // Sync to agent in background
    if (agents.connected) {
      const tokenPath = mapToTokenPath(category, key);
      if (tokenPath) {
        await agents.tokens.updateToken(tokenPath, value);
        console.log(`✅ Synced ${tokenPath} = ${value}`);
      }
    }

    // Re-run contrast validation when colors change
    if (category === 'colors') {
      validateContrast(key === 'primary' ? value : localTokens.colors.primary);
    }
  }, [agents.connected, localTokens.colors.primary]);

  // Map UI token names to DTCG paths
  const mapToTokenPath = (category, key) => {
    const mapping = {
      colors: {
        primary: 'semantic.color.primary',
        secondary: 'semantic.color.secondary',
        success: 'semantic.color.success',
        danger: 'semantic.color.danger',
        warning: 'semantic.color.warning',
        background: 'semantic.surface.default',
        text: 'semantic.text.primary',
      },
      spacing: {
        xs: 'primitive.spacing.xs',
        sm: 'primitive.spacing.sm',
        md: 'primitive.spacing.md',
        lg: 'primitive.spacing.lg',
        xl: 'primitive.spacing.xl',
      },
      motion: {
        micro: 'primitive.motion.duration.micro',
        fast: 'primitive.motion.duration.fast',
        normal: 'primitive.motion.duration.normal',
        slow: 'primitive.motion.duration.slow',
      },
      radius: {
        sm: 'primitive.radius.sm',
        md: 'primitive.radius.md',
        lg: 'primitive.radius.lg',
      },
    };
    return mapping[category]?.[key];
  };

  // ===== CONTRAST VALIDATION =====
  const validateContrast = async (primaryColor) => {
    if (!agents.connected) {
      // Fallback to local calculation
      const ratio = calculateLocalContrast(primaryColor, '#ffffff');
      setContrastResults([{
        context: 'Button text',
        foreground: '#ffffff',
        background: primaryColor,
        ratio,
        passes: ratio >= 4.5,
        passesAA: ratio >= 4.5,
        passesAAA: ratio >= 7,
      }]);
      return;
    }

    const result = await agents.a11y.checkContrast('#ffffff', primaryColor, {
      textType: 'normalText',
      level: 'AA',
    });

    if (result) {
      setContrastResults([{
        context: 'Button text',
        ...result,
      }]);
    }
  };

  // Local contrast calculation (fallback)
  const calculateLocalContrast = (hex1, hex2) => {
    const getLuminance = (hex) => {
      const rgb = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
      if (!rgb) return 0;
      const [r, g, b] = [parseInt(rgb[1], 16), parseInt(rgb[2], 16), parseInt(rgb[3], 16)]
        .map(c => { c = c / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const l1 = getLuminance(hex1);
    const l2 = getLuminance(hex2);
    return ((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)).toFixed(2);
  };

  // Initialize contrast on mount and re-validate when tokens change
  useEffect(() => {
    validateContrast(localTokens.colors.primary);
  }, [localTokens.colors.primary, localTokens.colors.background]);

  // ===== COMPONENT GENERATION =====
  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setGenerationError(null);
    
    if (!agents.connected) {
      setGenerationError('Agent server not connected. Start the API server first.');
      return;
    }

    // Save API key to localStorage if provided
    if (apiKey) {
      localStorage.setItem('aioli_api_key', apiKey);
    }

    const result = await agents.component.generateFromDescription(prompt, { apiKey });
    
    if (result?.error) {
      setGenerationError(result.message || result.aiError || 'Generation failed');
    } else if (result) {
      setGeneratedComponent(result);
      
      // Show source info
      if (result.source === 'template') {
        setGenerationError(result.note);
      }
      
      // Automatically validate the generated HTML
      if (result.html) {
        const validation = await agents.a11y.validateHTML(result.html);
        if (validation?.issues) {
          setValidationResults(validation.issues.map(issue => ({
            type: issue.severity === 'error' ? 'error' : 'warning',
            message: issue.message,
          })));
        }
      }
    }
  };

  // ===== FIX ISSUES =====
  const handleFixIssues = async () => {
    if (!generatedComponent?.html || !generatedComponent?.validation?.issues) return;
    
    setIsFixing(true);
    setGenerationError(null);
    
    try {
      const issues = generatedComponent.validation.issues.filter(i => i.severity === 'error');
      
      const result = await agents.component.fixComponent(
        generatedComponent.html, 
        issues, 
        { apiKey }
      );
      
      if (result?.success) {
        setGeneratedComponent(prev => ({
          ...prev,
          html: result.html,
          validation: result.validation,
          passed: result.validation?.passed !== false,
          fixed: true,
          issuesFixed: result.issuesFixed,
        }));
        
        // Update validation display
        if (result.validation?.issues) {
          setValidationResults(result.validation.issues.map(issue => ({
            type: issue.severity === 'error' ? 'error' : 'warning',
            message: issue.message,
          })));
        } else {
          setValidationResults([]);
        }
      } else {
        setGenerationError(result?.error || 'Fix failed');
      }
    } catch (err) {
      setGenerationError(err.message);
    } finally {
      setIsFixing(false);
    }
  };

  // ===== CODE REVIEW =====
  const handleCodeReview = async () => {
    if (!generatedComponent?.html || !agents.connected) return;

    const result = await agents.codeReview.review({
      html: generatedComponent.html,
      css: generatedComponent.css || '',
    });

    if (result) {
      setValidationResults([
        { type: result.approved ? 'success' : 'warning', message: `Score: ${result.score}/100 (${result.grade})` },
        ...result.issues.map(i => ({ type: i.severity, message: i.message })),
      ]);
    }
  };

  // ===== EXPORT CSS =====
  const handleExportCSS = async () => {
    if (agents.connected) {
      const css = await agents.tokens.exportCSS();
      if (css) {
        // Copy to clipboard
        navigator.clipboard.writeText(css);
        alert('CSS copied to clipboard!');
      }
    } else {
      // Generate local CSS
      const css = generateLocalCSS();
      navigator.clipboard.writeText(css);
      alert('CSS copied to clipboard!');
    }
  };

  const generateLocalCSS = () => {
    return `:root {
  /* Colors */
  --color-primary: ${localTokens.colors.primary};
  --color-secondary: ${localTokens.colors.secondary};
  --color-success: ${localTokens.colors.success};
  --color-danger: ${localTokens.colors.danger};
  --color-warning: ${localTokens.colors.warning};
  --color-background: ${localTokens.colors.background};
  --color-text: ${localTokens.colors.text};
  
  /* Typography */
  --font-family: '${localTokens.typography.fontFamily}', sans-serif;
  --font-size-base: ${localTokens.typography.baseFontSize}px;
  --font-weight-heading: ${localTokens.typography.headingWeight};
  --font-weight-body: ${localTokens.typography.bodyWeight};
  
  /* Spacing */
  --spacing-xs: ${localTokens.spacing.xs}px;
  --spacing-sm: ${localTokens.spacing.sm}px;
  --spacing-md: ${localTokens.spacing.md}px;
  --spacing-lg: ${localTokens.spacing.lg}px;
  --spacing-xl: ${localTokens.spacing.xl}px;
  
  /* Border Radius */
  --radius-sm: ${localTokens.radius.sm}px;
  --radius-md: ${localTokens.radius.md}px;
  --radius-lg: ${localTokens.radius.lg}px;
  
  /* Motion */
  --motion-micro: ${localTokens.motion.micro}ms;
  --motion-fast: ${localTokens.motion.fast}ms;
  --motion-normal: ${localTokens.motion.normal}ms;
  --motion-slow: ${localTokens.motion.slow}ms;
}`;
  };

  // ===== EXPORT COMPONENT =====
  const handleExportComponent = (format) => {
    if (!generatedComponent?.html) return;
    
    const css = generateLocalCSS();
    const componentName = generatedComponent.type || 'AioliComponent';
    
    if (format === 'html') {
      // Create standalone HTML file
      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${componentName} - Aioli Component</title>
  <link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(localTokens.typography.fontFamily)}:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
${css}

body {
  font-family: var(--font-family);
  background: var(--color-background);
  color: var(--color-text);
  padding: 2rem;
}
  </style>
</head>
<body>
${generatedComponent.html}
</body>
</html>`;
      
      downloadFile(`${componentName.toLowerCase()}.html`, htmlContent, 'text/html');
      
    } else if (format === 'react') {
      // Convert to React component
      const pascalName = componentName.replace(/[^a-zA-Z0-9]/g, '').replace(/^./, c => c.toUpperCase());
      const reactComponent = `import React from 'react';

// Generated by Aioli Design System
// Tokens: ${new Date().toISOString()}

const styles = \`
${css}
\`;

export default function ${pascalName}() {
  return (
    <>
      <style>{styles}</style>
      <div dangerouslySetInnerHTML={{ __html: \`${generatedComponent.html.replace(/`/g, '\\`')}\` }} />
    </>
  );
}`;
      
      navigator.clipboard.writeText(reactComponent);
      alert('React component copied to clipboard!');
      
    } else if (format === 'package') {
      // Create a downloadable package with all files
      const files = {
        'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${componentName}</title>
  <link rel="stylesheet" href="tokens.css">
  <link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(localTokens.typography.fontFamily)}:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
${generatedComponent.html}
</body>
</html>`,
        'tokens.css': css,
        'component.html': generatedComponent.html,
        'README.md': `# ${componentName}

Generated with Aioli Design System.

## Files
- \`index.html\` - Standalone preview
- \`tokens.css\` - Design token CSS variables
- \`component.html\` - Raw component HTML

## Usage
1. Include \`tokens.css\` in your project
2. Copy the component HTML where needed
3. Customize token values as needed
`,
      };
      
      // For now, download as combined HTML (real zip would need a library)
      const combinedContent = Object.entries(files)
        .map(([name, content]) => `\n${'='.repeat(60)}\n// FILE: ${name}\n${'='.repeat(60)}\n\n${content}`)
        .join('\n');
      
      downloadFile(`${componentName.toLowerCase()}-package.txt`, combinedContent, 'text/plain');
    }
  };
  
  const downloadFile = (filename, content, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ===== UI COLORS =====
  const colors = theme === 'dark' ? {
    bg: '#0f172a', surface: '#1e293b', surface2: '#334155',
    border: '#475569', text: '#f8fafc', textMuted: '#94a3b8', primary: '#3b82f6',
  } : {
    bg: '#f8fafc', surface: '#ffffff', surface2: '#f1f5f9',
    border: '#e2e8f0', text: '#0f172a', textMuted: '#64748b', primary: '#3b82f6',
  };

  // ===== PREVIEW STYLES =====
  const fontStack = `'${localTokens.typography.fontFamily}', sans-serif`;
  const previewStyles = useMemo(() => ({
    button: {
      padding: `${localTokens.spacing.sm}px ${localTokens.spacing.lg}px`,
      backgroundColor: localTokens.colors.primary,
      color: '#ffffff',
      border: 'none',
      borderRadius: `${localTokens.radius.md}px`,
      fontSize: `${localTokens.typography.baseFontSize}px`,
      fontWeight: localTokens.typography.headingWeight,
      fontFamily: fontStack,
      cursor: 'pointer',
    },
    heading: {
      fontSize: `${localTokens.typography.baseFontSize * 1.5}px`,
      fontWeight: localTokens.typography.headingWeight,
      fontFamily: fontStack,
      color: localTokens.colors.text,
      marginBottom: `${localTokens.spacing.sm}px`,
    },
    body: {
      fontSize: `${localTokens.typography.baseFontSize}px`,
      fontWeight: localTokens.typography.bodyWeight,
      fontFamily: fontStack,
      color: localTokens.colors.secondary,
    },
  }), [localTokens, fontStack]);

  // ===== PANEL HANDLERS =====
  const toggleLeftPanel = () => {
    if (isMobile || isTablet) setMobilePanel(mobilePanel === 'left' ? null : 'left');
    else setLeftPanelOpen(!leftPanelOpen);
  };
  const toggleRightPanel = () => {
    if (isMobile || isTablet) setMobilePanel(mobilePanel === 'right' ? null : 'right');
    else setRightPanelOpen(!rightPanelOpen);
  };
  const closeMobilePanel = () => setMobilePanel(null);

  const sidebarWidth = isMobile ? '100%' : isTablet ? '320px' : '280px';

  // ===== COMBINED VALIDATION DISPLAY =====
  const displayValidation = useMemo(() => {
    const items = [];
    
    // Contrast results
    contrastResults.forEach(r => {
      items.push({
        type: r.passesAA ? 'success' : 'error',
        message: `Contrast: ${r.ratio}:1 ${r.passesAA ? '(AA ✓)' : '(Fail)'}`,
      });
    });

    // Other validation results
    validationResults.forEach(r => items.push(r));

    // Motion check
    items.push({
      type: localTokens.motion.fast <= 200 ? 'success' : 'warning',
      message: `Animation: ${localTokens.motion.fast}ms`,
    });

    return items;
  }, [contrastResults, validationResults, localTokens.motion.fast]);

  // ===== STYLES =====
  const styles = {
    container: {
      display: 'flex', flexDirection: 'column', height: '100vh',
      background: colors.bg, color: colors.text,
      fontFamily: "'Inter', -apple-system, sans-serif", overflow: 'hidden', position: 'relative',
    },
    header: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: '56px', padding: '0 12px', background: colors.surface,
      borderBottom: `1px solid ${colors.border}`, flexShrink: 0, zIndex: 100,
    },
    iconBtn: {
      width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'transparent', border: 'none', borderRadius: '8px',
      color: colors.textMuted, cursor: 'pointer', fontSize: '18px', flexShrink: 0,
    },
    sidebar: {
      width: sidebarWidth, maxWidth: '100%', background: colors.surface,
      display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0, zIndex: 50,
    },
    sidebarMobile: {
      position: 'fixed', top: '56px', bottom: 0, width: sidebarWidth, maxWidth: '100%',
      background: colors.surface, display: 'flex', flexDirection: 'column',
      overflow: 'hidden', zIndex: 200, boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    },
    overlay: {
      position: 'fixed', top: '56px', left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 150,
    },
  };

  return (
    <div style={styles.container}>
      {/* ===== HEADER ===== */}
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={toggleLeftPanel} style={{ ...styles.iconBtn, background: leftPanelOpen || mobilePanel === 'left' ? colors.surface2 : 'transparent' }}>☰</button>
          <span style={{ fontSize: '24px' }}>🧄</span>
          {!isMobile && <span style={{ fontWeight: 600 }}>Aioli Studio</span>}
          
          {/* Connection Status */}
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: agents.connected ? '#22c55e' : '#ef4444',
            marginLeft: '8px',
          }} title={agents.connected ? 'Connected to agents' : 'Disconnected'} />
        </div>

        <nav style={{ display: 'flex', gap: '2px', background: colors.surface2, padding: '3px', borderRadius: '10px' }}>
          {[
            { id: 'tokens', label: 'Tokens', emoji: '🎨' },
            { id: 'create', label: 'Create', emoji: '✨' },
            { id: 'export', label: 'Export', emoji: '📦' },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveView(item.id)} style={{
              display: 'flex', alignItems: 'center', gap: '4px', padding: isMobile ? '8px 10px' : '8px 14px',
              background: activeView === item.id ? colors.primary : 'transparent',
              border: 'none', borderRadius: '7px',
              color: activeView === item.id ? 'white' : colors.textMuted,
              fontSize: '13px', fontWeight: 500, cursor: 'pointer',
            }}>
              <span>{item.emoji}</span>
              {!isMobile && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} style={styles.iconBtn}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button onClick={toggleRightPanel} style={{ ...styles.iconBtn, background: rightPanelOpen || mobilePanel === 'right' ? colors.surface2 : 'transparent' }}>✓</button>
        </div>
      </header>

      {/* ===== BODY ===== */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        
        {(isMobile || isTablet) && mobilePanel && <div style={styles.overlay} onClick={closeMobilePanel} />}

        {/* LEFT SIDEBAR - TOKEN EDITOR */}
        {((isDesktop && leftPanelOpen) || mobilePanel === 'left') && (
          <aside style={{ ...(isMobile || isTablet ? styles.sidebarMobile : styles.sidebar), left: 0, borderRight: `1px solid ${colors.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${colors.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '14px' }}>
                <span>🎨</span><span>Token Editor</span>
                {agents.connected && <span style={{ fontSize: '10px', padding: '2px 6px', background: '#22c55e', borderRadius: '4px', color: 'white' }}>LIVE</span>}
              </div>
              {(isMobile || isTablet) && <button onClick={closeMobilePanel} style={styles.iconBtn}>✕</button>}
            </div>

            <div style={{ display: 'flex', padding: '8px', gap: '4px', borderBottom: `1px solid ${colors.border}` }}>
              {[
                { id: 'colors', emoji: '🎨' },
                { id: 'spacing', emoji: '📏' },
                { id: 'typography', emoji: '✏️' },
                { id: 'motion', emoji: '✨' },
                { id: 'radius', emoji: '⬜' },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTokenSection(tab.id)} style={{
                  flex: 1, padding: '10px 8px', background: activeTokenSection === tab.id ? colors.surface2 : 'transparent',
                  border: 'none', borderRadius: '6px', fontSize: '16px', cursor: 'pointer',
                  opacity: activeTokenSection === tab.id ? 1 : 0.5,
                }}>{tab.emoji}</button>
              ))}
            </div>

            <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
              {activeTokenSection === 'colors' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {Object.entries(localTokens.colors).map(([key, value]) => (
                    <ColorPicker key={key} label={key} value={value} onChange={(v) => updateToken('colors', key, v)} colors={colors} />
                  ))}
                </div>
              )}

              {activeTokenSection === 'spacing' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {Object.entries(localTokens.spacing).map(([key, value]) => (
                    <SliderControl key={key} label={key.toUpperCase()} value={value} min={0} max={64} unit="px" onChange={(v) => updateToken('spacing', key, parseInt(v))} colors={colors} previewBar />
                  ))}
                </div>
              )}

              {activeTokenSection === 'typography' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <SectionTitle colors={colors}>Font Family</SectionTitle>
                  <FontSelector value={localTokens.typography.fontFamily} options={AVAILABLE_FONTS} onChange={(v) => updateToken('typography', 'fontFamily', v)} colors={colors} />
                  <SectionTitle colors={colors}>Base Size</SectionTitle>
                  <SliderControl value={localTokens.typography.baseFontSize} min={12} max={24} unit="px" onChange={(v) => updateToken('typography', 'baseFontSize', parseInt(v))} colors={colors} />
                  <SectionTitle colors={colors}>Heading Weight</SectionTitle>
                  <SliderControl value={localTokens.typography.headingWeight} min={400} max={800} step={100} unit="" onChange={(v) => updateToken('typography', 'headingWeight', parseInt(v))} colors={colors} />
                </div>
              )}

              {activeTokenSection === 'motion' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {Object.entries(localTokens.motion).map(([key, value]) => (
                    <SliderControl key={key} label={key} value={value} min={0} max={600} unit="ms" onChange={(v) => updateToken('motion', key, parseInt(v))} colors={colors} />
                  ))}
                </div>
              )}

              {activeTokenSection === 'radius' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {Object.entries(localTokens.radius).map(([key, value]) => (
                    <SliderControl key={key} label={key.toUpperCase()} value={value} min={0} max={32} unit="px" onChange={(v) => updateToken('radius', key, parseInt(v))} colors={colors} previewRadius />
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}

        {/* MAIN CONTENT */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          
          {/* Input Bar */}
          {activeView === 'create' && (
            <div style={{ padding: isMobile ? '12px' : '16px', background: colors.surface, borderBottom: `1px solid ${colors.border}`, flexShrink: 0 }}>
              {/* API Key Section */}
              <div style={{ marginBottom: '12px' }}>
                <button 
                  onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'transparent', border: 'none', color: colors.textMuted,
                    fontSize: '12px', cursor: 'pointer', padding: '4px 0',
                  }}
                >
                  <span>{showApiKeyInput ? '▼' : '▶'}</span>
                  <span>🔑 API Key {apiKey ? '(set)' : '(required for AI)'}</span>
                  {apiKey && <span style={{ color: '#22c55e' }}>✓</span>}
                </button>
                
                {showApiKeyInput && (
                  <div style={{ marginTop: '8px' }}>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-ant-api03-..."
                      style={{
                        width: '100%', padding: '8px 12px',
                        background: colors.surface2, border: `1px solid ${colors.border}`,
                        borderRadius: '6px', color: colors.text, fontSize: '13px',
                      }}
                    />
                    <p style={{ fontSize: '11px', color: colors.textMuted, marginTop: '6px' }}>
                      Enter your Anthropic API key for AI-powered component generation. 
                      Without it, only template-based generation is available.
                    </p>
                  </div>
                )}
              </div>

              {/* Prompt Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: '10px' }}>
                <span style={{ color: colors.textMuted, flexShrink: 0 }}>✨</span>
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                  placeholder={apiKey ? "Describe any component..." : "e.g. 'large danger button with icon'"}
                  style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: colors.text, fontSize: '14px' }}
                />
                <button onClick={handleGenerate} disabled={agents.component.generating} style={{
                  padding: '8px 14px', background: agents.component.generating ? colors.surface2 : colors.primary,
                  border: 'none', borderRadius: '6px', color: 'white', fontSize: '13px', fontWeight: 500, cursor: 'pointer', flexShrink: 0,
                }}>
                  {agents.component.generating ? '...' : isMobile ? '→' : 'Generate'}
                </button>
              </div>
              {generationError && <div style={{ color: generationError.includes('API') ? '#f59e0b' : '#ef4444', fontSize: '12px', marginTop: '8px' }}>⚠ {generationError}</div>}
            </div>
          )}

          {/* Export View */}
          {activeView === 'export' && (
            <div style={{ padding: '16px', background: colors.surface, borderBottom: `1px solid ${colors.border}` }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {/* CSS Variables */}
                <button onClick={handleExportCSS} style={{
                  padding: '12px 20px', background: colors.primary, border: 'none', borderRadius: '8px',
                  color: 'white', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                }}>
                  📋 Copy CSS Variables
                </button>
                
                {/* Export Component as HTML */}
                {generatedComponent?.html && (
                  <button onClick={() => handleExportComponent('html')} style={{
                    padding: '12px 20px', background: colors.surface2, border: `1px solid ${colors.border}`,
                    borderRadius: '8px', color: colors.text, fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                  }}>
                    🌐 Download HTML
                  </button>
                )}
                
                {/* Export Component as React */}
                {generatedComponent?.html && (
                  <button onClick={() => handleExportComponent('react')} style={{
                    padding: '12px 20px', background: colors.surface2, border: `1px solid ${colors.border}`,
                    borderRadius: '8px', color: colors.text, fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                  }}>
                    ⚛️ Copy as React
                  </button>
                )}
                
                {/* Download Full Package */}
                {generatedComponent?.html && (
                  <button onClick={() => handleExportComponent('package')} style={{
                    padding: '12px 20px', background: '#22c55e', border: 'none', borderRadius: '8px',
                    color: 'white', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                  }}>
                    📦 Download Package
                  </button>
                )}
              </div>
              
              {/* Export Info */}
              <div style={{ marginTop: '12px', fontSize: '12px', color: colors.textMuted }}>
                {generatedComponent 
                  ? `Component ready to export: ${generatedComponent.type || 'custom'}`
                  : 'Generate a component first to enable export options'
                }
              </div>
            </div>
          )}

          {/* Preview Area */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '16px' : '24px', background: colors.bg, overflow: 'auto' }}>
            {/* CSS Variables for Preview */}
            <style>{`
              .aioli-preview {
                --color-primary: ${localTokens.colors.primary};
                --color-secondary: ${localTokens.colors.secondary};
                --color-success: ${localTokens.colors.success};
                --color-danger: ${localTokens.colors.danger};
                --color-warning: ${localTokens.colors.warning};
                --color-background: ${localTokens.colors.background};
                --color-surface: ${theme === 'dark' ? '#1e293b' : '#f8fafc'};
                --color-text: ${localTokens.colors.text};
                --color-text-muted: ${theme === 'dark' ? '#94a3b8' : '#64748b'};
                --color-border: ${theme === 'dark' ? '#334155' : '#e2e8f0'};
                --spacing-xs: ${localTokens.spacing.xs}px;
                --spacing-sm: ${localTokens.spacing.sm}px;
                --spacing-md: ${localTokens.spacing.md}px;
                --spacing-lg: ${localTokens.spacing.lg}px;
                --spacing-xl: ${localTokens.spacing.xl}px;
                --font-family: ${fontStack};
                --font-size-sm: 0.875rem;
                --font-size-base: ${localTokens.typography.baseFontSize}px;
                --font-size-lg: 1.125rem;
                --font-size-xl: 1.25rem;
                --font-weight-normal: ${localTokens.typography.bodyWeight};
                --font-weight-medium: 500;
                --font-weight-bold: ${localTokens.typography.headingWeight};
                --radius-sm: ${localTokens.radius.sm}px;
                --radius-md: ${localTokens.radius.md}px;
                --radius-lg: ${localTokens.radius.lg}px;
                --radius-full: 9999px;
                --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
                --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
                --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
                --motion-fast: ${localTokens.motion.fast}ms;
                --motion-normal: ${localTokens.motion.normal}ms;
                --motion-slow: ${localTokens.motion.slow}ms;
              }
            `}</style>
            
            <div 
              className="aioli-preview"
              style={{
                width: '100%',
                maxWidth: viewportSize === 'mobile' ? '375px' : viewportSize === 'tablet' ? '768px' : '100%',
                minHeight: '300px', 
                background: localTokens.colors.background,
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '20px', padding: isMobile ? '20px' : '32px', transition: 'all 300ms ease',
                color: localTokens.colors.text,
              }}
            >
              {/* Show Generated Component if available */}
              {generatedComponent ? (
                <div style={{ width: '100%' }}>
                  {/* Generation Status Bar */}
                  <div style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontSize: '10px', color: theme === 'dark' ? '#94a3b8' : '#64748b', 
                    marginBottom: '12px', textTransform: 'uppercase',
                    flexWrap: 'wrap', gap: '8px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>Generated: {generatedComponent.type || 'component'}</span>
                      <span style={{ 
                        padding: '2px 6px', 
                        borderRadius: '4px',
                        background: generatedComponent.source === 'claude-api' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                        color: generatedComponent.source === 'claude-api' ? '#a78bfa' : '#94a3b8',
                      }}>
                        {generatedComponent.source === 'claude-api' ? '🤖 AI' : '📋 Template'}
                      </span>
                      {generatedComponent.fixed && (
                        <span style={{ 
                          padding: '2px 6px', 
                          borderRadius: '4px',
                          background: 'rgba(34, 197, 94, 0.2)',
                          color: '#22c55e',
                        }}>
                          🔧 Fixed
                        </span>
                      )}
                    </div>
                    
                    {/* Validation Status + Fix Button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {generatedComponent.attempts && (
                        <span style={{ 
                          padding: '2px 6px', 
                          borderRadius: '4px',
                          background: 'rgba(100, 116, 139, 0.2)',
                        }}>
                          {generatedComponent.attempts === 1 ? '1 attempt' : `${generatedComponent.attempts} attempts`}
                        </span>
                      )}
                      <span style={{ 
                        padding: '2px 6px', 
                        borderRadius: '4px',
                        background: generatedComponent.passed !== false ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: generatedComponent.passed !== false ? '#22c55e' : '#ef4444',
                      }}>
                        {generatedComponent.passed !== false ? '✓ A11y Passed' : '⚠ Has Issues'}
                      </span>
                      
                      {/* Fix Button - show when there are issues */}
                      {generatedComponent.passed === false && generatedComponent.validation?.issues?.length > 0 && (
                        <button
                          onClick={handleFixIssues}
                          disabled={isFixing}
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: '#8b5cf6',
                            color: 'white',
                            border: 'none',
                            fontSize: '10px',
                            fontWeight: 500,
                            cursor: isFixing ? 'wait' : 'pointer',
                            opacity: isFixing ? 0.7 : 1,
                            textTransform: 'uppercase',
                          }}
                        >
                          {isFixing ? '🔄 Fixing...' : '🔧 Fix Issues'}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Rendered Component in Sandboxed Iframe */}
                  <iframe
                    srcDoc={`<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: ${fontStack};
      padding: 16px;
      background: ${localTokens.colors.background};
      color: ${localTokens.colors.text};
      
      /* Inject CSS Variables */
      --color-primary: ${localTokens.colors.primary};
      --color-secondary: ${localTokens.colors.secondary};
      --color-success: ${localTokens.colors.success};
      --color-danger: ${localTokens.colors.danger};
      --color-warning: ${localTokens.colors.warning};
      --color-background: ${localTokens.colors.background};
      --color-surface: ${theme === 'dark' ? '#1e293b' : '#f8fafc'};
      --color-text: ${localTokens.colors.text};
      --color-text-muted: ${theme === 'dark' ? '#94a3b8' : '#64748b'};
      --color-border: ${theme === 'dark' ? '#334155' : '#e2e8f0'};
      
      --spacing-xs: ${localTokens.spacing.xs}px;
      --spacing-sm: ${localTokens.spacing.sm}px;
      --spacing-md: ${localTokens.spacing.md}px;
      --spacing-lg: ${localTokens.spacing.lg}px;
      --spacing-xl: ${localTokens.spacing.xl}px;
      
      --font-family: ${fontStack};
      --font-size-sm: 0.875rem;
      --font-size-base: ${localTokens.typography.baseFontSize}px;
      --font-size-lg: 1.125rem;
      --font-size-xl: 1.25rem;
      --font-weight-normal: ${localTokens.typography.bodyWeight};
      --font-weight-medium: 500;
      --font-weight-bold: ${localTokens.typography.headingWeight};
      
      --radius-sm: ${localTokens.radius.sm}px;
      --radius-md: ${localTokens.radius.md}px;
      --radius-lg: ${localTokens.radius.lg}px;
      --radius-full: 9999px;
      
      --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
      --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
      --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
      
      --motion-fast: ${localTokens.motion.fast}ms;
      --motion-normal: ${localTokens.motion.normal}ms;
      --motion-slow: ${localTokens.motion.slow}ms;
    }
    button { cursor: pointer; }
    a { color: var(--color-primary); }
  </style>
  <link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(localTokens.typography.fontFamily)}:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
${generatedComponent.html}
</body>
</html>`}
                    style={{
                      width: '100%',
                      minHeight: '200px',
                      border: 'none',
                      borderRadius: '8px',
                      background: localTokens.colors.background,
                    }}
                    title="Component Preview"
                    sandbox="allow-scripts"
                  />
                  
                  {/* View HTML Details */}
                  {generatedComponent.html && (
                    <details style={{ marginTop: '16px' }}>
                      <summary style={{ fontSize: '12px', color: theme === 'dark' ? '#94a3b8' : '#64748b', cursor: 'pointer' }}>View HTML</summary>
                      <pre style={{ 
                        fontSize: '11px', 
                        background: theme === 'dark' ? '#0f172a' : '#f1f5f9', 
                        color: theme === 'dark' ? '#e2e8f0' : '#334155',
                        padding: '12px', borderRadius: '6px', overflow: 'auto', marginTop: '8px' 
                      }}>
                        {generatedComponent.html}
                      </pre>
                    </details>
                  )}
                </div>
              ) : (
                <>
                  {/* Default Preview */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: theme === 'dark' ? '#94a3b8' : '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Live Preview</div>
                    <button style={previewStyles.button}>Primary Button</button>
                  </div>

                  <div style={{ width: '100%', maxWidth: '280px' }}>
                    <div style={{
                      padding: `${localTokens.spacing.lg}px`,
                      background: theme === 'dark' ? '#1e293b' : localTokens.colors.background,
                      borderRadius: `${localTokens.radius.lg}px`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
                    }}>
                      <h3 style={previewStyles.heading}>Card Title</h3>
                      <p style={previewStyles.body}>Preview updates live as you edit tokens.</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Viewport Controls */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', padding: '10px', background: colors.surface, borderTop: `1px solid ${colors.border}`, flexShrink: 0 }}>
            {['mobile', 'tablet', 'desktop'].map(size => (
              <button key={size} onClick={() => setViewportSize(size)} style={{
                display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px',
                background: viewportSize === size ? colors.primary : 'transparent',
                border: `1px solid ${viewportSize === size ? colors.primary : colors.border}`,
                borderRadius: '6px', color: viewportSize === size ? 'white' : colors.textMuted, fontSize: '11px', cursor: 'pointer',
              }}>
                <span>{size === 'mobile' ? '📱' : size === 'tablet' ? '📱' : '💻'}</span>
                {!isMobile && <span style={{ textTransform: 'capitalize' }}>{size}</span>}
              </button>
            ))}
          </div>
        </main>

        {/* RIGHT SIDEBAR - VALIDATION */}
        {((isDesktop && rightPanelOpen) || mobilePanel === 'right') && (
          <aside style={{ ...(isMobile || isTablet ? styles.sidebarMobile : styles.sidebar), right: 0, borderLeft: `1px solid ${colors.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${colors.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '14px' }}>
                <span>✅</span><span>Validation</span>
              </div>
              {(isMobile || isTablet) && <button onClick={closeMobilePanel} style={styles.iconBtn}>✕</button>}
            </div>

            <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
              {displayValidation.map((result, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', marginBottom: '8px',
                  background: result.type === 'success' ? 'rgba(34,197,94,0.1)' : result.type === 'warning' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                  borderRadius: '8px',
                  color: result.type === 'success' ? '#22c55e' : result.type === 'warning' ? '#f59e0b' : '#ef4444',
                  fontSize: '13px',
                }}>
                  <span>{result.type === 'success' ? '✓' : result.type === 'warning' ? '⚠' : '✗'}</span>
                  <span>{result.message}</span>
                </div>
              ))}

              {/* Code Review Button */}
              {generatedComponent && agents.connected && (
                <button onClick={handleCodeReview} disabled={agents.codeReview.reviewing} style={{
                  width: '100%', padding: '10px', marginTop: '12px',
                  background: colors.surface2, border: `1px solid ${colors.border}`,
                  borderRadius: '8px', color: colors.text, cursor: 'pointer', fontSize: '13px',
                }}>
                  {agents.codeReview.reviewing ? 'Reviewing...' : '🔍 Run Code Review'}
                </button>
              )}

              <div style={{ marginTop: '20px' }}>
                <SectionTitle colors={colors}>CSS Output</SectionTitle>
                <pre style={{
                  padding: '12px', background: colors.bg, borderRadius: '8px',
                  fontSize: '10px', color: colors.textMuted, overflow: 'auto', maxHeight: '180px',
                }}>
                  {generateLocalCSS().slice(0, 500)}...
                </pre>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const SectionTitle = ({ children, colors }) => (
  <h4 style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: colors.textMuted, margin: '0 0 8px 0' }}>{children}</h4>
);

const ColorPicker = ({ label, value, onChange, colors }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', background: colors.surface2, borderRadius: '8px' }}>
    <input type="color" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '32px', height: '32px', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: 0 }} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '12px', fontWeight: 500, color: colors.text, textTransform: 'capitalize' }}>{label}</div>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: '10px', color: colors.textMuted, fontFamily: 'monospace' }} />
    </div>
  </div>
);

const SliderControl = ({ label, value, min, max, step = 1, unit, onChange, colors, previewBar, previewRadius }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      {label && <span style={{ fontSize: '12px', fontWeight: 500, color: colors.text, textTransform: 'capitalize' }}>{label}</span>}
      <span style={{ fontSize: '11px', color: colors.textMuted, fontFamily: 'monospace', marginLeft: 'auto' }}>{value}{unit}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', accentColor: colors.primary, cursor: 'pointer' }} />
    {previewBar && <div style={{ width: Math.min(value, 100) + '%', maxWidth: '100%', height: '6px', background: colors.primary, borderRadius: '3px' }} />}
    {previewRadius && <div style={{ width: '40px', height: '40px', background: colors.primary, borderRadius: `${value}px` }} />}
  </div>
);

const FontSelector = ({ value, options, onChange, colors }) => {
  useEffect(() => {
    options.forEach(font => {
      const id = `gf-${font.name.replace(/\s+/g, '-')}`;
      if (!document.getElementById(id)) {
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${font.name.replace(/\s+/g, '+')}:wght@400;600&display=swap`;
        document.head.appendChild(link);
      }
    });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {options.map(font => (
        <button key={font.name} onClick={() => onChange(font.name)} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px',
          background: value === font.name ? colors.primary : colors.surface2, border: 'none', borderRadius: '8px', cursor: 'pointer',
        }}>
          <span style={{ fontFamily: `'${font.name}', sans-serif`, fontSize: '14px', color: value === font.name ? 'white' : colors.text }}>{font.name}</span>
          <span style={{ fontFamily: `'${font.name}', sans-serif`, fontSize: '18px', color: value === font.name ? 'white' : colors.textMuted }}>Aa</span>
        </button>
      ))}
    </div>
  );
};
