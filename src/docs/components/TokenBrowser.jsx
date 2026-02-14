import React, { useState, useMemo } from 'react';

// Import all primitive token files (Vite handles JSON imports)
import primitiveColors from '../../../tokens/primitives/colors.json';
import primitiveSpacing from '../../../tokens/primitives/spacing.json';
import primitiveTypography from '../../../tokens/primitives/typography.json';
import primitiveRadius from '../../../tokens/primitives/radius.json';
import primitiveMotion from '../../../tokens/primitives/motion.json';

// Import semantic token files
import semanticColors from '../../../tokens/semantic/colors.json';
import semanticSurfaces from '../../../tokens/semantic/surfaces.json';

// ---------------------------------------------------------------------------
// Utility: flatten DTCG token JSON into a flat array of token entries
// ---------------------------------------------------------------------------

function flattenTokens(obj, prefix = '', tier = 'primitive') {
  const tokens = [];

  for (const [key, value] of Object.entries(obj)) {
    // Skip top-level $description keys (file-level metadata)
    if (key === '$description') continue;

    // Skip group-level $type — it annotates sibling leaves, not a token itself
    if (key === '$type') continue;

    const path = prefix ? `${prefix}.${key}` : key;

    // If this node has a $value, it is a leaf token
    if (value != null && typeof value === 'object' && '$value' in value) {
      // Determine the token type: either the leaf's own $type or an inherited
      // $type from a parent group level.  We look for $type on the same object
      // first, then fall back to whatever was passed down via recursion.
      const type = value.$type || inferTypeFromPath(path);

      tokens.push({
        path,
        value: formatValue(value.$value, type),
        rawValue: value.$value,
        type,
        tier,
        description: value.$description || '',
      });
    } else if (value != null && typeof value === 'object') {
      // Recurse into nested groups
      tokens.push(...flattenTokens(value, path, tier));
    }
  }

  return tokens;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function inferTypeFromPath(path) {
  if (/\.color\b/i.test(path) || /\.surface\b/i.test(path) || /\.border\b/i.test(path) || /\.text\b/i.test(path)) return 'color';
  if (/\.spacing\b/i.test(path)) return 'dimension';
  if (/\.radius\b/i.test(path)) return 'dimension';
  if (/\.font\.family\b/i.test(path) || /\.fontFamily\b/i.test(path)) return 'fontFamily';
  if (/\.font\.size\b/i.test(path) || /\.fontSize\b/i.test(path)) return 'dimension';
  if (/\.font\.weight\b/i.test(path) || /\.fontWeight\b/i.test(path)) return 'fontWeight';
  if (/\.font\.lineHeight\b/i.test(path) || /\.lineHeight\b/i.test(path)) return 'number';
  if (/\.font\.letterSpacing\b/i.test(path) || /\.letterSpacing\b/i.test(path)) return 'dimension';
  if (/\.motion\.duration\b/i.test(path)) return 'duration';
  if (/\.motion\.easing\b/i.test(path)) return 'cubicBezier';
  return 'unknown';
}

function formatValue(raw, type) {
  if (raw == null) return '';
  if (type === 'cubicBezier' && Array.isArray(raw)) {
    return `cubic-bezier(${raw.join(', ')})`;
  }
  return String(raw);
}

// Determine which category bucket a token belongs to based on its path
function categorize(path) {
  const p = path.toLowerCase();
  if (
    p.includes('.color.') ||
    p.includes('.surface.') ||
    p.includes('.border.') ||
    p.includes('.text.')
  ) return 'colors';
  if (p.includes('.spacing.')) return 'spacing';
  if (p.includes('.font.') || p.includes('.typography')) return 'typography';
  if (p.includes('.radius.')) return 'radius';
  if (p.includes('.motion.')) return 'motion';
  return 'other';
}

// Detect sub-kind of typography token for proper preview styling
function typographySubKind(path) {
  const p = path.toLowerCase();
  if (p.includes('.family')) return 'fontFamily';
  if (p.includes('.weight')) return 'fontWeight';
  if (p.includes('.lineheight') || p.includes('.line-height')) return 'lineHeight';
  if (p.includes('.letterspacing') || p.includes('.letter-spacing')) return 'letterSpacing';
  if (p.includes('.size')) return 'fontSize';
  return 'fontSize'; // default
}

// ---------------------------------------------------------------------------
// Categories and labels
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { key: 'colors', label: 'Colors' },
  { key: 'spacing', label: 'Spacing' },
  { key: 'typography', label: 'Typography' },
  { key: 'radius', label: 'Radius' },
  { key: 'motion', label: 'Motion' },
];

const TIERS = [
  { key: 'all', label: 'All' },
  { key: 'primitive', label: 'Primitive' },
  { key: 'semantic', label: 'Semantic' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TokenBrowser() {
  const [activeCategory, setActiveCategory] = useState('colors');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTier, setActiveTier] = useState('all');

  // Build the complete token list once
  const allTokens = useMemo(() => {
    const primitives = [
      ...flattenTokens(primitiveColors, '', 'primitive'),
      ...flattenTokens(primitiveSpacing, '', 'primitive'),
      ...flattenTokens(primitiveTypography, '', 'primitive'),
      ...flattenTokens(primitiveRadius, '', 'primitive'),
      ...flattenTokens(primitiveMotion, '', 'primitive'),
    ];
    const semantics = [
      ...flattenTokens(semanticColors, '', 'semantic'),
      ...flattenTokens(semanticSurfaces, '', 'semantic'),
    ];
    return [...primitives, ...semantics];
  }, []);

  // Filtered token list
  const filteredTokens = useMemo(() => {
    return allTokens.filter((token) => {
      // Category filter
      if (categorize(token.path) !== activeCategory) return false;

      // Tier filter
      if (activeTier !== 'all' && token.tier !== activeTier) return false;

      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          token.path.toLowerCase().includes(q) ||
          token.value.toLowerCase().includes(q) ||
          token.description.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [allTokens, activeCategory, activeTier, searchQuery]);

  // -------------------------------------------------------------------------
  // Render helpers per category
  // -------------------------------------------------------------------------

  function renderColorToken(token) {
    // Semantic tokens may have reference values like {primitive.color.blue.600}
    // We display the reference as-is; in a real app these would be resolved.
    const isReference = typeof token.rawValue === 'string' && token.rawValue.startsWith('{');
    const bgColor = isReference ? undefined : token.value;

    return (
      <div className="docs-token-swatch" key={token.path}>
        <div
          className="docs-token-swatch__color"
          style={{ backgroundColor: bgColor }}
          title={isReference ? `Reference: ${token.rawValue}` : token.value}
        >
          {isReference && <span className="docs-token-swatch__ref-icon">&#x1F517;</span>}
        </div>
        <div className="docs-token-swatch__label">{token.path}</div>
        <div className="docs-token-swatch__value">{token.value}</div>
      </div>
    );
  }

  function renderSpacingToken(token) {
    return (
      <div className="docs-spacing-bar" key={token.path}>
        <div
          className="docs-spacing-bar__visual"
          style={{ width: token.value, height: '12px' }}
        />
        <div className="docs-spacing-bar__label">{token.path}</div>
        <div className="docs-spacing-bar__value">{token.value}</div>
      </div>
    );
  }

  function renderTypographyToken(token) {
    const kind = typographySubKind(token.path);
    let previewStyle = {};

    switch (kind) {
      case 'fontFamily':
        previewStyle = { fontFamily: token.value };
        break;
      case 'fontWeight':
        previewStyle = { fontWeight: token.value };
        break;
      case 'lineHeight':
        previewStyle = { lineHeight: token.value };
        break;
      case 'letterSpacing':
        previewStyle = { letterSpacing: token.value };
        break;
      case 'fontSize':
      default:
        previewStyle = { fontSize: token.value };
        break;
    }

    return (
      <div className="docs-typography-sample" key={token.path}>
        <span className="docs-typography-sample__preview" style={previewStyle}>
          The quick brown fox
        </span>
        <span className="docs-typography-sample__label">{token.path}</span>
        <span className="docs-typography-sample__value">{token.value}</span>
      </div>
    );
  }

  function renderRadiusToken(token) {
    return (
      <div className="docs-radius-sample" key={token.path}>
        <div
          className="docs-radius-sample__preview"
          style={{ borderRadius: token.value }}
        />
        <span className="docs-radius-sample__label">{token.path}</span>
        <span className="docs-radius-sample__value">{token.value}</span>
      </div>
    );
  }

  function renderMotionToken(token) {
    return (
      <div className="docs-motion-item" key={token.path}>
        <span className="docs-motion-item__label">{token.path}</span>
        <span className="docs-motion-item__value">{token.value}</span>
      </div>
    );
  }

  function renderToken(token) {
    switch (activeCategory) {
      case 'colors':
        return renderColorToken(token);
      case 'spacing':
        return renderSpacingToken(token);
      case 'typography':
        return renderTypographyToken(token);
      case 'radius':
        return renderRadiusToken(token);
      case 'motion':
        return renderMotionToken(token);
      default:
        return renderMotionToken(token); // fallback to simple label/value
    }
  }

  // -------------------------------------------------------------------------
  // Main render
  // -------------------------------------------------------------------------

  return (
    <div className="docs-token-browser">
      {/* Search */}
      <div className="docs-token-browser__search">
        <input
          type="search"
          className="docs-token-browser__search-input"
          placeholder="Search tokens..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search tokens"
        />
      </div>

      {/* Category tabs */}
      <div className="docs-token-browser__tabs" role="tablist" aria-label="Token categories">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            role="tab"
            aria-selected={activeCategory === cat.key}
            className={`docs-token-browser__tab${activeCategory === cat.key ? ' docs-token-browser__tab--active' : ''}`}
            onClick={() => setActiveCategory(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Tier filter */}
      <div className="docs-token-browser__tier-filter">
        {TIERS.map((tier) => (
          <button
            key={tier.key}
            className={`docs-token-browser__tier-btn${activeTier === tier.key ? ' docs-token-browser__tier-btn--active' : ''}`}
            onClick={() => setActiveTier(tier.key)}
          >
            {tier.label}
          </button>
        ))}
        <span className="docs-token-browser__count">
          {filteredTokens.length} token{filteredTokens.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Token grid / list */}
      <div
        className={`docs-token-browser__grid docs-token-browser__grid--${activeCategory}`}
        role="tabpanel"
      >
        {filteredTokens.length === 0 ? (
          <p className="docs-token-browser__empty">No tokens match the current filters.</p>
        ) : (
          filteredTokens.map((token) => renderToken(token))
        )}
      </div>
    </div>
  );
}
