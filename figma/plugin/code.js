/**
 * Aioli Design System — Figma Plugin
 *
 * Creates Variables, Text Styles, Effect Styles, and Components
 * from the figma-tokens.json payload produced by transform-tokens.js.
 *
 * When published to Figma Community, BUNDLED_TOKENS contains the full
 * token payload so users can generate with one click (no JSON paste needed).
 * The build script (figma/build-plugin.js) replaces the null below with data.
 */

// Bundled token data — replaced by build-plugin.js, null in dev mode
const BUNDLED_TOKENS = null;

// Show the UI, passing whether tokens are bundled
figma.showUI(__html__, { width: 420, height: 580 });
figma.ui.postMessage({ type: 'init', hasBundledTokens: BUNDLED_TOKENS !== null, stats: BUNDLED_TOKENS ? BUNDLED_TOKENS.meta.stats : null });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sendProgress(percent, message) {
  figma.ui.postMessage({ type: 'progress', percent, message });
}

function sendLog(message, level) {
  figma.ui.postMessage({ type: 'log', message: message, level: level || '' });
}

function sendDone(stats) {
  figma.ui.postMessage({ type: 'done', stats });
}

function sendError(message) {
  figma.ui.postMessage({ type: 'error', message });
}

/**
 * Convert a Figma RGBA object { r, g, b, a } (0-1 range) to Figma's paint format.
 */
function colorToSolidPaint(c) {
  return { type: 'SOLID', color: { r: c.r, g: c.g, b: c.b }, opacity: c.a !== undefined ? c.a : 1 };
}

/**
 * Load Inter font (fallback to default if unavailable).
 */
async function loadFonts() {
  var fonts = [
    { family: 'Inter', style: 'Regular' },
    { family: 'Inter', style: 'Medium' },
    { family: 'Inter', style: 'Semi Bold' },
    { family: 'Inter', style: 'Bold' },
    { family: 'Inter', style: 'Extra Bold' },
  ];

  var loaded = [];
  for (var fi = 0; fi < fonts.length; fi++) {
    try {
      await figma.loadFontAsync(fonts[fi]);
      loaded.push(fonts[fi]);
      loadedFontStyles[fonts[fi].style] = true;
    } catch (_) {
      // Font not available, will fall back
    }
  }
  sendLog('Loaded fonts: ' + Object.keys(loadedFontStyles).join(', '), 'done');
  return loaded;
}

/**
 * Get the font style name for a given weight.
 */
function weightToStyle(weight) {
  const map = {
    300: 'Light', 400: 'Regular', 500: 'Medium',
    600: 'Semi Bold', 700: 'Bold', 800: 'Extra Bold', 900: 'Black',
  };
  return map[weight] || 'Regular';
}

// ---------------------------------------------------------------------------
// Variable Creation
// ---------------------------------------------------------------------------

/**
 * Create a Variable Collection with the given name and modes.
 */
function createCollection(name, modeNames) {
  const collection = figma.variables.createVariableCollection(name);
  // First mode is always "Mode 1" by default — rename it
  const defaultMode = collection.modes[0];
  collection.renameMode(defaultMode.modeId, modeNames[0]);

  // Add additional modes (may fail if Figma plan doesn't support enough modes)
  for (let i = 1; i < modeNames.length; i++) {
    try {
      collection.addMode(modeNames[i]);
    } catch (err) {
      sendLog('Could not add mode "' + modeNames[i] + '" to ' + name + ': ' + (err.message || err) + ' (plan may limit modes to ' + collection.modes.length + ')', 'err');
    }
  }

  sendLog('  Collection "' + name + '": ' + collection.modes.length + ' modes created', '');
  return collection;
}

/**
 * Create variables in a collection from a flat map of path → { value, type, alias?, description? }.
 * Returns a map of path → Variable for alias resolution.
 */
function createVariables(collection, varsMap, modeId, allVariables) {
  if (!allVariables) allVariables = {};
  const created = {};

  for (const [path, def] of Object.entries(varsMap)) {
    const name = path; // Path is already /-separated
    let variable;

    try {
      variable = figma.variables.createVariable(name, collection, def.type);
    } catch (_) {
      // Variable name conflict — skip
      continue;
    }

    if (def.description) {
      variable.description = def.description;
    }

    // Set value
    if (def.alias) {
      // Resolve alias to a Variable
      const aliasVar = resolveAlias(def.alias, allVariables);
      if (aliasVar) {
        try {
          variable.setValueForMode(modeId, { type: 'VARIABLE_ALIAS', id: aliasVar.id });
        } catch (_) {
          // Alias type mismatch — set resolved value instead
          setDirectValue(variable, modeId, def, allVariables);
        }
      } else {
        // Alias not found — set as direct value if possible
        setDirectValue(variable, modeId, def, allVariables);
      }
    } else if (def.value !== undefined) {
      variable.setValueForMode(modeId, def.value);
    }

    created[path] = variable;
    allVariables[`${collection.name === 'Primitives' ? 'primitives' : collection.name === 'Semantic' ? 'semantic' : 'component'}/${path}`] = variable;
  }

  return created;
}

/**
 * Resolve an alias path to a Variable object.
 */
function resolveAlias(aliasPath, allVariables) {
  return allVariables[aliasPath] || null;
}

/**
 * Set a direct value on a variable when alias resolution fails.
 */
function setDirectValue(variable, modeId, def, allVariables) {
  if (def.type === 'COLOR') {
    // Default to a neutral color
    variable.setValueForMode(modeId, { r: 0.5, g: 0.5, b: 0.5, a: 1 });
  } else {
    variable.setValueForMode(modeId, 0);
  }
}

/**
 * Apply theme overrides to a collection's mode.
 * Uses the allVariables map for direct O(1) lookups instead of re-querying the API.
 */
function applyThemeOverrides(collection, modeId, overrides, allVariables, collectionPrefix) {
  var applied = 0;
  var skipped = 0;
  var missing = [];
  for (const [fullPath, override] of Object.entries(overrides)) {
    // fullPath is like 'semantic/surface/card/default'
    const prefix = collectionPrefix + '/';
    if (!fullPath.startsWith(prefix)) continue;

    // Look up variable directly from allVariables map
    var variable = allVariables[fullPath];
    if (!variable) {
      skipped++;
      if (missing.length < 5) missing.push(fullPath);
      continue;
    }

    if (override.value !== undefined) {
      try {
        variable.setValueForMode(modeId, override.value);
        applied++;
      } catch (err) {
        sendLog('    Override failed: ' + fullPath + ' - ' + (err.message || err), 'err');
        skipped++;
      }
    }
  }
  if (skipped > 0) {
    sendLog('    Overrides: ' + applied + ' applied, ' + skipped + ' skipped (missing: ' + missing.join(', ') + (skipped > 5 ? '...' : '') + ')', 'warn');
  } else {
    sendLog('    Overrides: ' + applied + ' applied', 'done');
  }
}

// ---------------------------------------------------------------------------
// Style Creation
// ---------------------------------------------------------------------------

async function createTextStyles(textStyleDefs) {
  const created = [];
  for (const def of textStyleDefs) {
    const style = figma.createTextStyle();
    style.name = def.name;

    const fontStyle = weightToStyle(def.fontWeight);
    try {
      await figma.loadFontAsync({ family: def.fontFamily, style: fontStyle });
      style.fontName = { family: def.fontFamily, style: fontStyle };
    } catch (_) {
      // Fall back to Inter Regular
      try {
        await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
        style.fontName = { family: 'Inter', style: 'Regular' };
      } catch (_) {
        // Skip this style
        continue;
      }
    }

    style.fontSize = def.fontSize;
    style.lineHeight = { unit: 'PERCENT', value: def.lineHeight * 100 };
    if (def.letterSpacing) {
      style.letterSpacing = { unit: 'PERCENT', value: def.letterSpacing * 100 };
    }

    created.push(style);
    sendLog(`Text style: ${def.name}`, 'done');
  }
  return created;
}

function createEffectStyles(effectStyleDefs) {
  const created = [];
  for (const def of effectStyleDefs) {
    const style = figma.createEffectStyle();
    style.name = def.name;

    style.effects = def.effects.map(e => ({
      type: e.type,
      color: { r: e.color.r, g: e.color.g, b: e.color.b, a: e.color.a },
      offset: e.offset,
      radius: e.radius,
      spread: e.spread || 0,
      visible: true,
      blendMode: 'NORMAL',
    }));

    created.push(style);
    sendLog(`Effect style: ${def.name}`, 'done');
  }
  return created;
}

// ---------------------------------------------------------------------------
// Color Styles (Paint Styles bound to variables for easy rebranding)
// ---------------------------------------------------------------------------

async function createColorStyles(colorStyleDefs, allVariables) {
  if (!colorStyleDefs || colorStyleDefs.length === 0) return [];
  const created = [];
  for (const def of colorStyleDefs) {
    const style = figma.createPaintStyle();
    style.name = 'Aioli/' + def.name;

    // Try to bind to the semantic variable
    const varKey = 'semantic/' + def.variablePath;
    const variable = allVariables[varKey];

    if (variable) {
      try {
        const paint = figma.variables.setBoundVariableForPaint(
          { type: 'SOLID', color: def.fallback, opacity: 1 },
          'color',
          variable
        );
        style.paints = [paint];
      } catch (_) {
        // Fallback to static color
        style.paints = [{ type: 'SOLID', color: def.fallback }];
      }
    } else {
      style.paints = [{ type: 'SOLID', color: def.fallback }];
    }

    created.push(style);
    sendLog('Color style: ' + def.name, 'done');
  }
  return created;
}

// ---------------------------------------------------------------------------
// Component Creation
// ---------------------------------------------------------------------------

/**
 * Size presets for different component categories.
 */
const COMPONENT_SIZES = {
  atom: { width: 200, height: 40 },
  molecule: { width: 320, height: 120 },
  organism: { width: 480, height: 320 },
  template: { width: 800, height: 600 },
};

/**
 * Create all 43 component definitions as Figma Component Sets.
 */
async function createComponents(componentDefs, allVariables) {
  var created = [];
  var page = figma.currentPage;
  var componentRefMap = {};

  // Place each atomic category inside a Figma Section for professional organization
  var sectionY = 0;
  var categoryTitles = { atom: 'Atoms', molecule: 'Molecules', organism: 'Organisms', template: 'Templates' };
  var categories = ['atom', 'molecule', 'organism', 'template'];
  var padding = 80;
  var maxRowWidth = 4000;
  var gap = 60;

  for (var catIdx = 0; catIdx < categories.length; catIdx++) {
    var category = categories[catIdx];
    var catComponents = componentDefs.filter(function(c) { return c.category === category; });
    if (catComponents.length === 0) continue;

    // Create a Figma Section for this category
    var section = figma.createSection();
    section.name = categoryTitles[category] || category;

    // Collect all component nodes first so we can measure and position
    var compNodes = [];
    for (var ci = 0; ci < catComponents.length; ci++) {
      var compDef = catComponents[ci];
      var comp = await createSingleComponent(compDef, allVariables, componentRefMap);
      if (comp) {
        compNodes.push(comp);
        created.push(comp);
        componentRefMap[compDef.name] = comp;
        sendLog('Component: ' + compDef.name, 'done');
      }
    }

    // Position components inside the section using a wrapping grid
    var colX = padding;
    var rowY = padding;
    var rowMaxHeight = 0;

    for (var ni = 0; ni < compNodes.length; ni++) {
      var node = compNodes[ni];

      // Wrap to next row if exceeds max width
      if (colX > padding && colX + node.width > maxRowWidth) {
        colX = padding;
        rowY += rowMaxHeight + gap;
        rowMaxHeight = 0;
      }

      node.x = colX;
      node.y = rowY;
      section.appendChild(node);

      colX += node.width + gap;
      if (node.height > rowMaxHeight) rowMaxHeight = node.height;
    }

    // Resize section to fit all contents with padding
    var sectionWidth = Math.max(colX + padding, maxRowWidth);
    var sectionHeight = rowY + rowMaxHeight + padding;
    section.resizeWithoutConstraints(sectionWidth, sectionHeight);

    // Position section on the page
    section.x = 0;
    section.y = sectionY;
    page.appendChild(section);

    // Move down for next section
    sectionY += sectionHeight + 120;
  }

  return { components: created, nextY: sectionY };
}

/**
 * Create a single component (or component set if it has variants).
 */
async function createSingleComponent(def, allVariables, componentRefMap) {
  var size = COMPONENT_SIZES[def.category] || COMPONENT_SIZES.atom;
  var variantKeys = Object.keys(def.variants);

  if (variantKeys.length === 0) {
    // Simple component (no variants)
    return createBaseComponent(def, size, allVariables, undefined, componentRefMap);
  }

  // Component with variants → create a Component Set
  // Generate the default variant first
  var defaultComp = createBaseComponent(def, size, allVariables, def.defaultVariant, componentRefMap);
  if (!defaultComp) return null;

  // For each additional variant combination, create a component
  var allVariants = [defaultComp];
  var combinations = generateVariantCombinations(def.variants, def.defaultVariant);

  // Limit combinations to prevent explosion (max 24 per component)
  var limitedCombinations = combinations.slice(0, 24);

  for (var ci = 0; ci < limitedCombinations.length; ci++) {
    var combo = limitedCombinations[ci];
    // Skip the default (already created)
    var isDefault = true;
    var comboKeys = Object.keys(combo);
    for (var ki = 0; ki < comboKeys.length; ki++) {
      if (def.defaultVariant[comboKeys[ki]] !== combo[comboKeys[ki]]) {
        isDefault = false;
        break;
      }
    }
    if (isDefault) continue;

    var variant = createBaseComponent(def, size, allVariables, combo, componentRefMap);
    if (variant) {
      allVariants.push(variant);
    }
  }

  // Arrange variants in a uniform grid before combining so they don't stack
  var gapX = 20;
  var gapY = 20;

  // Use the last variant axis length as column count for logical grouping
  // e.g., Button (last axis = State[4]) → 4 columns per row
  var cols;
  if (variantKeys.length > 1) {
    var lastAxisKey = variantKeys[variantKeys.length - 1];
    cols = def.variants[lastAxisKey].length;
  } else if (variantKeys.length === 1) {
    cols = Math.min(def.variants[variantKeys[0]].length, 6);
  } else {
    cols = Math.ceil(Math.sqrt(allVariants.length));
  }
  if (cols < 2) cols = 2;

  // Find maximum dimensions across all variants for uniform grid cells
  var maxW = 0;
  var maxH = 0;
  for (var mi = 0; mi < allVariants.length; mi++) {
    var mw = allVariants[mi].width || size.width;
    var mh = allVariants[mi].height || size.height;
    if (mw > maxW) maxW = mw;
    if (mh > maxH) maxH = mh;
  }

  for (var gi = 0; gi < allVariants.length; gi++) {
    var col = gi % cols;
    var row = Math.floor(gi / cols);
    allVariants[gi].x = col * (maxW + gapX);
    allVariants[gi].y = row * (maxH + gapY);
  }

  // Combine into a Component Set
  if (allVariants.length > 1) {
    try {
      var componentSet = figma.combineAsVariants(allVariants, figma.currentPage);
      componentSet.name = def.name;
      return componentSet;
    } catch (_) {
      // If combineAsVariants fails, return the first component
      return allVariants[0];
    }
  }

  return defaultComp;
}

/**
 * Helper: bind a fill to a variable, with fallback color.
 */
function bindFill(node, tokenPath, variantProps, allVariables, fallback) {
  var varRef = resolveTokenPath(tokenPath, variantProps, allVariables);
  if (varRef) {
    try {
      var paint = figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: fallback || { r: 1, g: 1, b: 1 } },
        'color',
        varRef
      );
      node.fills = [paint];
      return;
    } catch (_) { /* fall through */ }
  }
  if (fallback) node.fills = [{ type: 'SOLID', color: fallback }];
}

/**
 * Helper: bind strokes to a variable.
 */
function bindStroke(node, tokenPath, variantProps, allVariables, fallback, weight) {
  var varRef = resolveTokenPath(tokenPath, variantProps, allVariables);
  if (varRef) {
    try {
      var stroke = figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: fallback || { r: 0.886, g: 0.91, b: 0.941 } },
        'color',
        varRef
      );
      node.strokes = [stroke];
      node.strokeWeight = weight || 1;
      return;
    } catch (_) { /* fall through */ }
  }
  if (fallback) {
    node.strokes = [{ type: 'SOLID', color: fallback }];
    node.strokeWeight = weight || 1;
  }
}

/**
 * Helper: bind corner radius to a variable.
 */
function bindRadius(node, tokenPath, variantProps, allVariables, fallback) {
  var varRef = resolveTokenPath(tokenPath, variantProps, allVariables);
  if (varRef) {
    try {
      node.setBoundVariable('topLeftRadius', varRef);
      node.setBoundVariable('topRightRadius', varRef);
      node.setBoundVariable('bottomLeftRadius', varRef);
      node.setBoundVariable('bottomRightRadius', varRef);
      return;
    } catch (_) { /* fall through */ }
  }
  node.cornerRadius = fallback || 6;
}

/**
 * Track which Inter font styles were successfully loaded.
 */
var loadedFontStyles = {};

/**
 * Helper: create a text node with optional variable-bound fill.
 * Uses loadedFontStyles to only set fonts we know are available.
 */
function createTextNode(text, fontSize, fontStyle, fillToken, variantProps, allVariables, fallbackColor) {
  var node = figma.createText();
  var style = fontStyle || 'Regular';
  // Only set fontName if that style was loaded; default is Inter Regular
  if (loadedFontStyles[style]) {
    node.fontName = { family: 'Inter', style: style };
  } else if (loadedFontStyles['Regular'] && style !== 'Regular') {
    // Fallback to Regular if requested style not loaded
    node.fontName = { family: 'Inter', style: 'Regular' };
  }
  node.characters = String(text);
  node.fontSize = fontSize || 14;
  node.textAutoResize = 'WIDTH_AND_HEIGHT';
  if (fillToken) {
    bindFill(node, fillToken, variantProps, allVariables, fallbackColor || { r: 0.06, g: 0.09, b: 0.16 });
  } else if (fallbackColor) {
    node.fills = [{ type: 'SOLID', color: fallbackColor }];
  }
  return node;
}

/**
 * Get a component instance from the componentRefMap.
 * Handles both COMPONENT_SET (finds matching variant) and COMPONENT types.
 */
function getComponentInstance(refs, name, props) {
  var compOrSet = refs[name];
  if (!compOrSet) return null;
  if (compOrSet.type === 'COMPONENT_SET') {
    var children = compOrSet.children;
    // Try to find variant matching all requested props
    for (var i = 0; i < children.length; i++) {
      if (children[i].type !== 'COMPONENT') continue;
      var matches = true;
      var propKeys = Object.keys(props || {});
      for (var pi = 0; pi < propKeys.length; pi++) {
        if (children[i].name.indexOf(propKeys[pi] + '=' + props[propKeys[pi]]) === -1) {
          matches = false;
          break;
        }
      }
      if (matches) return children[i].createInstance();
    }
    // Fallback: default variant
    if (compOrSet.defaultVariant) return compOrSet.defaultVariant.createInstance();
    if (children.length > 0) return children[0].createInstance();
  }
  if (compOrSet.type === 'COMPONENT') return compOrSet.createInstance();
  return null;
}

/**
 * Component-specific inner structure builders.
 * Each returns child nodes to append, and optionally modifies the component frame.
 */
var COMPONENT_BUILDERS = {
  // --- ATOMS ---
  Button: function(comp, def, size, vp, vars) {
    var sizeLabel = vp.Size || 'md';
    var h = { xs: 28, sm: 32, md: 40, lg: 48, xl: 56 }[sizeLabel] || 40;
    var fs = { xs: 11, sm: 12, md: 14, lg: 16, xl: 18 }[sizeLabel] || 14;
    var px = { xs: 8, sm: 12, md: 16, lg: 20, xl: 24 }[sizeLabel] || 16;
    comp.resize(Math.max(px * 2 + fs * 5, 80), h);
    comp.layoutMode = 'HORIZONTAL';
    comp.primaryAxisSizingMode = 'AUTO';
    comp.counterAxisSizingMode = 'FIXED';
    comp.primaryAxisAlignItems = 'CENTER';
    comp.counterAxisAlignItems = 'CENTER';
    comp.paddingLeft = px; comp.paddingRight = px;
    bindFill(comp, def.tokens.fill, vp, vars, { r: 0.15, g: 0.39, b: 0.92 });
    bindRadius(comp, def.tokens.radius, vp, vars, 6);
    if (vp.State === 'disabled') comp.opacity = 0.5;
    var label = createTextNode(vp.Variant || 'Button', fs, 'Semi Bold', def.tokens.text, vp, vars, { r: 1, g: 1, b: 1 });
    comp.appendChild(label);
  },

  Input: function(comp, def, size, vp, vars) {
    comp.resize(280, 40);
    comp.layoutMode = 'HORIZONTAL';
    comp.primaryAxisSizingMode = 'FIXED';
    comp.counterAxisSizingMode = 'FIXED';
    comp.primaryAxisAlignItems = 'MIN';
    comp.counterAxisAlignItems = 'CENTER';
    comp.paddingLeft = 12; comp.paddingRight = 12;
    bindFill(comp, def.tokens.fill || 'semantic/surface/page/default', vp, vars, { r: 1, g: 1, b: 1 });
    bindStroke(comp, def.tokens.border || 'semantic/border/default', vp, vars, { r: 0.82, g: 0.84, b: 0.87 }, vp.State === 'focus' ? 2 : 1);
    bindRadius(comp, def.tokens.radius, vp, vars, 6);
    if (vp.State === 'disabled') comp.opacity = 0.5;
    var placeholder = createTextNode('Placeholder text', 14, 'Regular', 'semantic/text/muted', vp, vars, { r: 0.6, g: 0.63, b: 0.67 });
    placeholder.layoutGrow = 1;
    placeholder.textAutoResize = 'HEIGHT';
    if (vp.State === 'error') {
      bindStroke(comp, 'semantic/color/danger/default', vp, vars, { r: 0.86, g: 0.15, b: 0.15 }, 2);
    }
    comp.appendChild(placeholder);
  },

  Badge: function(comp, def, size, vp, vars) {
    var s = { sm: { h: 20, fs: 10, px: 6 }, md: { h: 24, fs: 12, px: 8 }, lg: { h: 28, fs: 13, px: 10 } }[vp.Size || 'md'] || { h: 24, fs: 12, px: 8 };
    comp.resize(s.px * 2 + s.fs * 4, s.h);
    comp.layoutMode = 'HORIZONTAL';
    comp.primaryAxisSizingMode = 'AUTO';
    comp.counterAxisSizingMode = 'FIXED';
    comp.primaryAxisAlignItems = 'CENTER';
    comp.counterAxisAlignItems = 'CENTER';
    comp.paddingLeft = s.px; comp.paddingRight = s.px;
    comp.cornerRadius = 999;
    bindFill(comp, def.tokens.fill, vp, vars, { r: 0.93, g: 0.94, b: 1 });
    var label = createTextNode(vp.Variant || 'Badge', s.fs, 'Medium', def.tokens.text, vp, vars, { r: 0.15, g: 0.15, b: 0.92 });
    comp.appendChild(label);
  },

  Avatar: function(comp, def, size, vp, vars) {
    var dim = { xs: 24, sm: 32, md: 40, lg: 56 }[vp.Size || 'md'] || 40;
    comp.resize(dim, dim);
    comp.cornerRadius = vp.Shape === 'square' ? 8 : dim;
    comp.layoutMode = 'HORIZONTAL';
    comp.primaryAxisAlignItems = 'CENTER';
    comp.counterAxisAlignItems = 'CENTER';
    bindFill(comp, def.tokens.fill, vp, vars, { r: 0.88, g: 0.92, b: 1 });
    var initials = createTextNode('JD', dim * 0.35, 'Semi Bold', def.tokens.text, vp, vars, { r: 0.15, g: 0.39, b: 0.92 });
    comp.appendChild(initials);
  },

  Spinner: function(comp, def, size, vp, vars) {
    var dim = { sm: 16, md: 24, lg: 32 }[vp.Size || 'md'] || 24;
    comp.resize(dim, dim);
    comp.cornerRadius = dim;
    comp.fills = [];
    bindStroke(comp, def.tokens.stroke || 'semantic/color/primary/default', vp, vars, { r: 0.15, g: 0.39, b: 0.92 }, 2);
    comp.dashPattern = [Math.round(dim * 0.8), Math.round(dim * 0.4)];
  },

  Link: function(comp, def, size, vp, vars) {
    comp.resize(100, 20);
    comp.layoutMode = 'HORIZONTAL';
    comp.primaryAxisSizingMode = 'AUTO';
    comp.counterAxisSizingMode = 'AUTO';
    comp.fills = [];
    var label = createTextNode('Link text', 14, 'Medium', def.tokens.text || 'semantic/text/link', vp, vars, { r: 0.15, g: 0.39, b: 0.92 });
    label.textDecoration = 'UNDERLINE';
    comp.appendChild(label);
  },

  Chip: function(comp, def, size, vp, vars) {
    comp.resize(80, 32);
    comp.layoutMode = 'HORIZONTAL';
    comp.primaryAxisSizingMode = 'AUTO';
    comp.counterAxisSizingMode = 'FIXED';
    comp.primaryAxisAlignItems = 'CENTER';
    comp.counterAxisAlignItems = 'CENTER';
    comp.paddingLeft = 12; comp.paddingRight = 12;
    comp.cornerRadius = 999;
    bindFill(comp, def.tokens.fill, vp, vars, { r: 0.96, g: 0.96, b: 0.97 });
    bindStroke(comp, def.tokens.border, vp, vars, { r: 0.88, g: 0.89, b: 0.91 });
    var label = createTextNode('Chip', 12, 'Medium', def.tokens.text, vp, vars, { r: 0.2, g: 0.2, b: 0.25 });
    comp.appendChild(label);
    if (vp.Removable === 'true') {
      var x = createTextNode('\u00D7', 14, 'Regular', 'semantic/text/muted', vp, vars, { r: 0.5, g: 0.5, b: 0.55 });
      comp.appendChild(x);
    }
  },

  Divider: function(comp, def, size, vp, vars) {
    if (vp.Orientation === 'vertical') {
      comp.resize(1, 40);
    } else {
      comp.resize(200, 1);
    }
    comp.fills = [];
    bindStroke(comp, def.tokens.stroke || 'semantic/border/default', vp, vars, { r: 0.88, g: 0.89, b: 0.91 });
  },

  Skeleton: function(comp, def, size, vp, vars) {
    if (vp.Type === 'circle') {
      comp.resize(40, 40); comp.cornerRadius = 40;
    } else if (vp.Type === 'rectangle') {
      comp.resize(200, 120); comp.cornerRadius = 8;
    } else {
      comp.resize(200, 16); comp.cornerRadius = 4;
    }
    bindFill(comp, def.tokens.fill, vp, vars, { r: 0.92, g: 0.93, b: 0.94 });
  },

  Progress: function(comp, def, size, vp, vars) {
    var h = vp.Size === 'sm' ? 4 : 8;
    comp.resize(200, h);
    comp.cornerRadius = h;
    comp.layoutMode = 'HORIZONTAL';
    comp.primaryAxisSizingMode = 'FIXED';
    comp.counterAxisSizingMode = 'FIXED';
    bindFill(comp, def.tokens.track || 'semantic/surface/page/muted', vp, vars, { r: 0.92, g: 0.93, b: 0.94 });
    // Progress fill bar
    var bar = figma.createFrame();
    bar.name = 'Fill';
    bar.resize(120, h);
    bar.cornerRadius = h;
    bar.layoutAlign = 'STRETCH';
    bindFill(bar, def.tokens.fill, vp, vars, { r: 0.15, g: 0.39, b: 0.92 });
    comp.appendChild(bar);
  },

  Checkbox: function(comp, def, size, vp, vars) {
    comp.resize(20, 20);
    comp.cornerRadius = 4;
    if (vp.State === 'disabled') comp.opacity = 0.5;
    if (vp.Checked === 'checked' || vp.Checked === 'indeterminate') {
      bindFill(comp, def.tokens.fill, vp, vars, { r: 0.15, g: 0.39, b: 0.92 });
      var mark = createTextNode(vp.Checked === 'checked' ? '\u2713' : '\u2014', 14, 'Bold', null, vp, vars, { r: 1, g: 1, b: 1 });
      comp.layoutMode = 'HORIZONTAL';
      comp.primaryAxisAlignItems = 'CENTER';
      comp.counterAxisAlignItems = 'CENTER';
      comp.appendChild(mark);
    } else {
      comp.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
      bindStroke(comp, def.tokens.border, vp, vars, { r: 0.78, g: 0.8, b: 0.82 }, 2);
    }
  },

  Radio: function(comp, def, size, vp, vars) {
    comp.resize(20, 20);
    comp.cornerRadius = 20;
    if (vp.State === 'disabled') comp.opacity = 0.5;
    if (vp.Selected === 'true') {
      bindFill(comp, def.tokens.fill, vp, vars, { r: 0.15, g: 0.39, b: 0.92 });
      // Inner dot
      var dot = figma.createEllipse();
      dot.name = 'Dot';
      dot.resize(8, 8);
      dot.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
      comp.layoutMode = 'HORIZONTAL';
      comp.primaryAxisAlignItems = 'CENTER';
      comp.counterAxisAlignItems = 'CENTER';
      comp.appendChild(dot);
    } else {
      comp.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
      bindStroke(comp, def.tokens.border, vp, vars, { r: 0.78, g: 0.8, b: 0.82 }, 2);
    }
  },

  Rating: function(comp, def, size, vp, vars) {
    var dim = { sm: 14, md: 20, lg: 28 }[vp.Size || 'md'] || 20;
    comp.resize(dim * 5 + 4 * 4, dim);
    comp.layoutMode = 'HORIZONTAL';
    comp.primaryAxisSizingMode = 'AUTO';
    comp.counterAxisSizingMode = 'AUTO';
    comp.itemSpacing = 4;
    comp.fills = [];
    for (var i = 0; i < 5; i++) {
      var star = createTextNode('*', dim, 'Regular', null, vp, vars, i < 3 ? { r: 0.96, g: 0.76, b: 0.04 } : { r: 0.82, g: 0.84, b: 0.87 });
      comp.appendChild(star);
    }
  },

  Toggle: function(comp, def, size, vp, vars) {
    var w = vp.Size === 'sm' ? 36 : 48;
    var h = vp.Size === 'sm' ? 20 : 26;
    var knobSize = h - 4;
    comp.resize(w, h);
    comp.cornerRadius = h;
    comp.layoutMode = 'HORIZONTAL';
    comp.counterAxisAlignItems = 'CENTER';
    comp.paddingLeft = 2; comp.paddingRight = 2;
    if (vp.State === 'on') {
      bindFill(comp, def.tokens.fillOn || 'semantic/color/primary/default', vp, vars, { r: 0.15, g: 0.39, b: 0.92 });
      comp.primaryAxisAlignItems = 'MAX';
    } else {
      bindFill(comp, def.tokens.fillOff || 'semantic/border/default', vp, vars, { r: 0.82, g: 0.84, b: 0.87 });
      comp.primaryAxisAlignItems = 'MIN';
    }
    var knob = figma.createEllipse();
    knob.name = 'Knob';
    knob.resize(knobSize, knobSize);
    knob.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    comp.appendChild(knob);
  },

  // --- MOLECULES ---
  Tooltip: function(comp, def, size, vp, vars) {
    comp.resize(140, 36);
    comp.layoutMode = 'HORIZONTAL';
    comp.primaryAxisSizingMode = 'AUTO';
    comp.counterAxisSizingMode = 'AUTO';
    comp.primaryAxisAlignItems = 'CENTER';
    comp.counterAxisAlignItems = 'CENTER';
    comp.paddingTop = 8; comp.paddingBottom = 8;
    comp.paddingLeft = 12; comp.paddingRight = 12;
    comp.cornerRadius = 6;
    bindFill(comp, def.tokens.fill, vp, vars, { r: 0.1, g: 0.1, b: 0.15 });
    var label = createTextNode('Tooltip text', 12, 'Regular', def.tokens.text, vp, vars, { r: 1, g: 1, b: 1 });
    comp.appendChild(label);
  },

  Select: function(comp, def, size, vp, vars) {
    comp.resize(280, 40);
    comp.layoutMode = 'HORIZONTAL';
    comp.primaryAxisSizingMode = 'FIXED';
    comp.counterAxisSizingMode = 'FIXED';
    comp.counterAxisAlignItems = 'CENTER';
    comp.paddingLeft = 12; comp.paddingRight = 12;
    comp.itemSpacing = 0;
    bindFill(comp, 'semantic/surface/page/default', vp, vars, { r: 1, g: 1, b: 1 });
    bindStroke(comp, 'semantic/border/default', vp, vars, { r: 0.82, g: 0.84, b: 0.87 });
    bindRadius(comp, 'component/input/radius', vp, vars, 6);
    var label = createTextNode('Select option', 14, 'Regular', 'semantic/text/muted', vp, vars, { r: 0.4, g: 0.42, b: 0.46 });
    label.layoutGrow = 1;
    comp.appendChild(label);
    var arrow = createTextNode('\u25BC', 10, 'Regular', 'semantic/text/muted', vp, vars, { r: 0.5, g: 0.52, b: 0.55 });
    comp.appendChild(arrow);
  },

  Textarea: function(comp, def, size, vp, vars) {
    comp.resize(280, 100);
    comp.layoutMode = 'VERTICAL';
    comp.primaryAxisSizingMode = 'FIXED';
    comp.counterAxisSizingMode = 'FIXED';
    comp.paddingTop = 10; comp.paddingLeft = 12; comp.paddingRight = 12;
    bindFill(comp, 'semantic/surface/page/default', vp, vars, { r: 1, g: 1, b: 1 });
    bindStroke(comp, 'semantic/border/default', vp, vars, { r: 0.82, g: 0.84, b: 0.87 });
    bindRadius(comp, 'component/input/radius', vp, vars, 6);
    var label = createTextNode('Enter text here...', 14, 'Regular', 'semantic/text/muted', vp, vars, { r: 0.6, g: 0.62, b: 0.65 });
    label.layoutGrow = 1;
    label.textAutoResize = 'HEIGHT';
    label.layoutAlign = 'STRETCH';
    comp.appendChild(label);
  },

  Alert: function(comp, def, size, vp, vars) {
    comp.resize(320, 64);
    comp.layoutMode = 'HORIZONTAL';
    comp.primaryAxisSizingMode = 'FIXED';
    comp.counterAxisSizingMode = 'AUTO';
    comp.counterAxisAlignItems = 'CENTER';
    comp.itemSpacing = 10;
    comp.paddingTop = 12; comp.paddingBottom = 12;
    comp.paddingLeft = 16; comp.paddingRight = 16;
    comp.cornerRadius = 8;
    bindFill(comp, def.tokens.fill, vp, vars, { r: 0.93, g: 0.95, b: 1 });
    bindStroke(comp, def.tokens.border || 'semantic/border/default', vp, vars, { r: 0.82, g: 0.85, b: 0.95 });
    var icon = createTextNode('\u26A0', 16, 'Regular', def.tokens.text, vp, vars, { r: 0.15, g: 0.39, b: 0.92 });
    comp.appendChild(icon);
    var textCol = figma.createFrame();
    textCol.name = 'Content';
    textCol.layoutMode = 'VERTICAL';
    textCol.primaryAxisSizingMode = 'AUTO';
    textCol.counterAxisSizingMode = 'AUTO';
    textCol.itemSpacing = 2;
    textCol.fills = [];
    var title = createTextNode('Alert Title', 14, 'Semi Bold', def.tokens.text, vp, vars, { r: 0.06, g: 0.09, b: 0.16 });
    var desc = createTextNode('This is an alert description.', 12, 'Regular', def.tokens.muted || 'semantic/text/muted', vp, vars, { r: 0.4, g: 0.42, b: 0.47 });
    textCol.appendChild(title);
    textCol.appendChild(desc);
    comp.appendChild(textCol);
  },

  // --- ORGANISMS ---
  Card: function(comp, def, size, vp, vars) {
    comp.resize(320, 200);
    comp.layoutMode = 'VERTICAL';
    comp.primaryAxisSizingMode = 'AUTO';
    comp.counterAxisSizingMode = 'FIXED';
    comp.itemSpacing = 0;
    bindFill(comp, def.tokens.fill || 'semantic/surface/card/default', vp, vars, { r: 1, g: 1, b: 1 });
    bindStroke(comp, def.tokens.border || 'semantic/border/default', vp, vars, { r: 0.88, g: 0.9, b: 0.92 });
    bindRadius(comp, def.tokens.radius || 'component/card/radius', vp, vars, 12);
    // Image placeholder
    var imgArea = figma.createFrame();
    imgArea.name = 'Image';
    imgArea.resize(320, 100);
    imgArea.layoutAlign = 'STRETCH';
    bindFill(imgArea, 'semantic/surface/page/subtle', vp, vars, { r: 0.94, g: 0.95, b: 0.96 });
    comp.appendChild(imgArea);
    // Content area
    var content = figma.createFrame();
    content.name = 'Content';
    content.layoutMode = 'VERTICAL';
    content.primaryAxisSizingMode = 'AUTO';
    content.counterAxisSizingMode = 'FIXED';
    content.layoutAlign = 'STRETCH';
    content.itemSpacing = 6;
    content.paddingTop = 16; content.paddingBottom = 16;
    content.paddingLeft = 16; content.paddingRight = 16;
    content.fills = [];
    var heading = createTextNode('Card Title', 16, 'Semi Bold', def.tokens.text, vp, vars, { r: 0.06, g: 0.09, b: 0.16 });
    var body = createTextNode('Card description with supporting text for context.', 13, 'Regular', 'semantic/text/muted', vp, vars, { r: 0.4, g: 0.42, b: 0.47 });
    body.textAutoResize = 'HEIGHT';
    body.layoutAlign = 'STRETCH';
    content.appendChild(heading);
    content.appendChild(body);
    comp.appendChild(content);
  },

  Modal: function(comp, def, size, vp, vars, refs) {
    comp.resize(480, 280);
    comp.layoutMode = 'VERTICAL';
    comp.primaryAxisSizingMode = 'FIXED';
    comp.counterAxisSizingMode = 'FIXED';
    comp.itemSpacing = 0;
    bindFill(comp, def.tokens.fill || 'semantic/surface/card/default', vp, vars, { r: 1, g: 1, b: 1 });
    comp.cornerRadius = 12;
    comp.effects = [{ type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.15 }, offset: { x: 0, y: 8 }, radius: 32, spread: 0, visible: true, blendMode: 'NORMAL' }];
    // Header
    var header = figma.createFrame();
    header.name = 'Header';
    header.layoutMode = 'HORIZONTAL';
    header.layoutAlign = 'STRETCH';
    header.primaryAxisSizingMode = 'FIXED';
    header.counterAxisSizingMode = 'AUTO';
    header.paddingTop = 20; header.paddingBottom = 16; header.paddingLeft = 24; header.paddingRight = 24;
    header.fills = [];
    var hTitle = createTextNode('Modal Title', 18, 'Semi Bold', def.tokens.text, vp, vars, { r: 0.06, g: 0.09, b: 0.16 });
    hTitle.layoutGrow = 1;
    header.appendChild(hTitle);
    var closeBtn = createTextNode('\u2715', 16, 'Regular', 'semantic/text/muted', vp, vars, { r: 0.5, g: 0.52, b: 0.55 });
    header.appendChild(closeBtn);
    comp.appendChild(header);
    // Body
    var body = figma.createFrame();
    body.name = 'Body';
    body.layoutMode = 'VERTICAL';
    body.layoutAlign = 'STRETCH';
    body.primaryAxisSizingMode = 'FIXED';
    body.counterAxisSizingMode = 'FIXED';
    body.layoutGrow = 1;
    body.paddingLeft = 24; body.paddingRight = 24;
    body.fills = [];
    var bText = createTextNode('This is the modal body content area. Place any content here.', 14, 'Regular', 'semantic/text/muted', vp, vars, { r: 0.35, g: 0.37, b: 0.42 });
    bText.textAutoResize = 'HEIGHT';
    bText.layoutAlign = 'STRETCH';
    body.appendChild(bText);
    comp.appendChild(body);
    // Footer
    var footer = figma.createFrame();
    footer.name = 'Footer';
    footer.layoutMode = 'HORIZONTAL';
    footer.layoutAlign = 'STRETCH';
    footer.primaryAxisSizingMode = 'FIXED';
    footer.counterAxisSizingMode = 'AUTO';
    footer.primaryAxisAlignItems = 'MAX';
    footer.counterAxisAlignItems = 'CENTER';
    footer.itemSpacing = 8;
    footer.paddingTop = 16; footer.paddingBottom = 20; footer.paddingLeft = 24; footer.paddingRight = 24;
    footer.fills = [];
    // Cancel button — use instance if available
    var cancelInstance = getComponentInstance(refs || {}, 'Button', { Variant: 'secondary', Size: 'md', State: 'default' });
    if (cancelInstance) {
      var cTexts = cancelInstance.findAll(function(n) { return n.type === 'TEXT'; });
      if (cTexts.length > 0) cTexts[0].characters = 'Cancel';
      footer.appendChild(cancelInstance);
    } else {
      var cancelBtn = figma.createFrame();
      cancelBtn.name = 'Cancel';
      cancelBtn.layoutMode = 'HORIZONTAL'; cancelBtn.primaryAxisAlignItems = 'CENTER'; cancelBtn.counterAxisAlignItems = 'CENTER';
      cancelBtn.paddingLeft = 16; cancelBtn.paddingRight = 16; cancelBtn.paddingTop = 8; cancelBtn.paddingBottom = 8;
      cancelBtn.cornerRadius = 6;
      bindFill(cancelBtn, 'semantic/color/secondary/subtle', vp, vars, { r: 0.96, g: 0.97, b: 0.98 });
      bindStroke(cancelBtn, 'semantic/border/default', vp, vars, { r: 0.88, g: 0.9, b: 0.92 });
      cancelBtn.primaryAxisSizingMode = 'AUTO'; cancelBtn.counterAxisSizingMode = 'AUTO';
      var cLabel = createTextNode('Cancel', 14, 'Medium', 'semantic/text/default', vp, vars, { r: 0.25, g: 0.27, b: 0.32 });
      cancelBtn.appendChild(cLabel);
      footer.appendChild(cancelBtn);
    }
    // Confirm button — use instance if available
    var confirmInstance = getComponentInstance(refs || {}, 'Button', { Variant: 'primary', Size: 'md', State: 'default' });
    if (confirmInstance) {
      var cfTexts = confirmInstance.findAll(function(n) { return n.type === 'TEXT'; });
      if (cfTexts.length > 0) cfTexts[0].characters = 'Confirm';
      footer.appendChild(confirmInstance);
    } else {
      var confirmBtn = figma.createFrame();
      confirmBtn.name = 'Confirm';
      confirmBtn.layoutMode = 'HORIZONTAL'; confirmBtn.primaryAxisAlignItems = 'CENTER'; confirmBtn.counterAxisAlignItems = 'CENTER';
      confirmBtn.paddingLeft = 16; confirmBtn.paddingRight = 16; confirmBtn.paddingTop = 8; confirmBtn.paddingBottom = 8;
      confirmBtn.cornerRadius = 6;
      confirmBtn.primaryAxisSizingMode = 'AUTO'; confirmBtn.counterAxisSizingMode = 'AUTO';
      bindFill(confirmBtn, 'semantic/color/primary/default', vp, vars, { r: 0.15, g: 0.39, b: 0.92 });
      var cfLabel = createTextNode('Confirm', 14, 'Medium', null, vp, vars, { r: 1, g: 1, b: 1 });
      confirmBtn.appendChild(cfLabel);
      footer.appendChild(confirmBtn);
    }
    comp.appendChild(footer);
  },

  Table: function(comp, def, size, vp, vars) {
    comp.resize(480, 200);
    comp.layoutMode = 'VERTICAL';
    comp.primaryAxisSizingMode = 'FIXED';
    comp.counterAxisSizingMode = 'AUTO';
    comp.itemSpacing = 0;
    bindFill(comp, def.tokens.fill || 'semantic/surface/card/default', vp, vars, { r: 1, g: 1, b: 1 });
    bindStroke(comp, 'semantic/border/subtle', vp, vars, { r: 0.88, g: 0.9, b: 0.92 });
    comp.cornerRadius = 8;
    var cols = ['Name', 'Status', 'Date'];
    // Header row
    var hRow = figma.createFrame();
    hRow.name = 'Header'; hRow.layoutMode = 'HORIZONTAL';
    hRow.layoutAlign = 'STRETCH'; hRow.primaryAxisSizingMode = 'FIXED'; hRow.counterAxisSizingMode = 'AUTO';
    hRow.paddingTop = 10; hRow.paddingBottom = 10; hRow.paddingLeft = 16; hRow.paddingRight = 16;
    bindFill(hRow, def.tokens.headerFill || 'semantic/surface/page/subtle', vp, vars, { r: 0.97, g: 0.97, b: 0.98 });
    for (var ci = 0; ci < cols.length; ci++) {
      var hCell = createTextNode(cols[ci], 12, 'Semi Bold', def.tokens.headerText || 'semantic/text/muted', vp, vars, { r: 0.35, g: 0.37, b: 0.42 });
      hCell.layoutGrow = 1;
      hRow.appendChild(hCell);
    }
    comp.appendChild(hRow);
    // Data rows
    var rowData = [['Alice', 'Active', '2025-01-15'], ['Bob', 'Pending', '2025-01-14']];
    for (var ri = 0; ri < rowData.length; ri++) {
      var dRow = figma.createFrame();
      dRow.name = 'Row ' + (ri + 1); dRow.layoutMode = 'HORIZONTAL';
      dRow.layoutAlign = 'STRETCH'; dRow.primaryAxisSizingMode = 'FIXED'; dRow.counterAxisSizingMode = 'AUTO';
      dRow.paddingTop = 10; dRow.paddingBottom = 10; dRow.paddingLeft = 16; dRow.paddingRight = 16;
      dRow.fills = [];
      bindStroke(dRow, 'semantic/border/subtle', vp, vars, { r: 0.94, g: 0.95, b: 0.96 });
      dRow.strokesIncludedInLayout = false;
      for (var di = 0; di < rowData[ri].length; di++) {
        var dCell = createTextNode(rowData[ri][di], 13, 'Regular', def.tokens.text || 'semantic/text/default', vp, vars, { r: 0.15, g: 0.17, b: 0.22 });
        dCell.layoutGrow = 1;
        dRow.appendChild(dCell);
      }
      comp.appendChild(dRow);
    }
  },

  Navigation: function(comp, def, size, vp, vars) {
    comp.resize(480, 56);
    comp.layoutMode = 'HORIZONTAL';
    comp.primaryAxisSizingMode = 'FIXED';
    comp.counterAxisSizingMode = 'FIXED';
    comp.counterAxisAlignItems = 'CENTER';
    comp.itemSpacing = 24;
    comp.paddingLeft = 20; comp.paddingRight = 20;
    bindFill(comp, def.tokens.fill || 'semantic/surface/card/default', vp, vars, { r: 1, g: 1, b: 1 });
    bindStroke(comp, 'semantic/border/subtle', vp, vars, { r: 0.92, g: 0.93, b: 0.94 });
    var brand = createTextNode('Brand', 16, 'Bold', def.tokens.text || 'semantic/text/default', vp, vars, { r: 0.06, g: 0.09, b: 0.16 });
    comp.appendChild(brand);
    var navItems = ['Home', 'About', 'Contact'];
    for (var ni = 0; ni < navItems.length; ni++) {
      var item = createTextNode(navItems[ni], 14, 'Medium', 'semantic/text/muted', vp, vars, { r: 0.35, g: 0.37, b: 0.42 });
      comp.appendChild(item);
    }
  },

  // --- MOLECULES (remaining) ---

  Tabs: function(comp, def, size, vp, vars) {
    var count = parseInt(vp.Count || '3');
    comp.resize(360, 140);
    comp.layoutMode = 'VERTICAL';
    comp.primaryAxisSizingMode = 'FIXED';
    comp.counterAxisSizingMode = 'FIXED';
    comp.itemSpacing = 0;
    comp.fills = [];
    // Tab bar
    var tabBar = figma.createFrame();
    tabBar.name = 'Tab Bar';
    tabBar.layoutMode = 'HORIZONTAL';
    tabBar.layoutAlign = 'STRETCH';
    tabBar.primaryAxisSizingMode = 'FIXED';
    tabBar.counterAxisSizingMode = 'AUTO';
    tabBar.itemSpacing = 0;
    tabBar.fills = [];
    bindStroke(tabBar, 'semantic/border/subtle', vp, vars, { r: 0.92, g: 0.93, b: 0.94 });
    tabBar.strokesIncludedInLayout = false;
    var tabLabels = ['Overview', 'Details', 'Settings', 'Billing'];
    for (var ti = 0; ti < count; ti++) {
      var tab = figma.createFrame();
      tab.name = 'Tab ' + (ti + 1);
      tab.layoutMode = 'HORIZONTAL';
      tab.primaryAxisSizingMode = 'AUTO';
      tab.counterAxisSizingMode = 'AUTO';
      tab.primaryAxisAlignItems = 'CENTER';
      tab.counterAxisAlignItems = 'CENTER';
      tab.paddingTop = 10; tab.paddingBottom = 10;
      tab.paddingLeft = 16; tab.paddingRight = 16;
      tab.fills = [];
      if (ti === 0) {
        bindStroke(tab, 'semantic/color/primary/default', vp, vars, { r: 0.15, g: 0.39, b: 0.92 }, 2);
        tab.strokesIncludedInLayout = false;
      }
      var tLabel = createTextNode(tabLabels[ti] || 'Tab', 13, ti === 0 ? 'Semi Bold' : 'Regular', ti === 0 ? 'semantic/color/primary/default' : 'semantic/text/muted', vp, vars, ti === 0 ? { r: 0.15, g: 0.39, b: 0.92 } : { r: 0.45, g: 0.47, b: 0.52 });
      tab.appendChild(tLabel);
      tabBar.appendChild(tab);
    }
    comp.appendChild(tabBar);
    // Content area
    var content = figma.createFrame();
    content.name = 'Content';
    content.layoutMode = 'VERTICAL';
    content.layoutAlign = 'STRETCH';
    content.layoutGrow = 1;
    content.paddingTop = 16; content.paddingLeft = 16;
    content.fills = [];
    var cText = createTextNode('Tab content goes here.', 13, 'Regular', 'semantic/text/muted', vp, vars, { r: 0.4, g: 0.42, b: 0.47 });
    content.appendChild(cText);
    comp.appendChild(content);
  },

  Accordion: function(comp, def, size, vp, vars) {
    var expanded = vp.Expanded === 'true';
    comp.resize(320, expanded ? 130 : 48);
    comp.layoutMode = 'VERTICAL';
    comp.primaryAxisSizingMode = 'FIXED';
    comp.counterAxisSizingMode = 'AUTO';
    comp.itemSpacing = 0;
    bindFill(comp, def.tokens.fill, vp, vars, { r: 1, g: 1, b: 1 });
    bindStroke(comp, def.tokens.border, vp, vars, { r: 0.92, g: 0.93, b: 0.94 });
    comp.cornerRadius = 8;
    // Header
    var header = figma.createFrame();
    header.name = 'Header';
    header.layoutMode = 'HORIZONTAL';
    header.layoutAlign = 'STRETCH';
    header.primaryAxisSizingMode = 'FIXED';
    header.counterAxisSizingMode = 'AUTO';
    header.counterAxisAlignItems = 'CENTER';
    header.paddingTop = 12; header.paddingBottom = 12;
    header.paddingLeft = 16; header.paddingRight = 16;
    header.fills = [];
    var hText = createTextNode('Accordion item', 14, 'Medium', def.tokens.text, vp, vars, { r: 0.06, g: 0.09, b: 0.16 });
    hText.layoutGrow = 1;
    header.appendChild(hText);
    var chevron = createTextNode(expanded ? '\u25B2' : '\u25BC', 10, 'Regular', 'semantic/text/muted', vp, vars, { r: 0.5, g: 0.52, b: 0.55 });
    header.appendChild(chevron);
    comp.appendChild(header);
    if (expanded) {
      var body = figma.createFrame();
      body.name = 'Body';
      body.layoutMode = 'VERTICAL';
      body.layoutAlign = 'STRETCH';
      body.primaryAxisSizingMode = 'AUTO';
      body.counterAxisSizingMode = 'FIXED';
      body.paddingTop = 4; body.paddingBottom = 16;
      body.paddingLeft = 16; body.paddingRight = 16;
      body.fills = [];
      var bText = createTextNode('Accordion content with additional details and information shown when expanded.', 13, 'Regular', 'semantic/text/muted', vp, vars, { r: 0.4, g: 0.42, b: 0.47 });
      bText.textAutoResize = 'HEIGHT';
      bText.layoutAlign = 'STRETCH';
      body.appendChild(bText);
      comp.appendChild(body);
    }
  },

  Dropdown: function(comp, def, size, vp, vars) {
    var isOpen = vp.State === 'open';
    comp.resize(200, isOpen ? 168 : 40);
    comp.layoutMode = 'VERTICAL';
    comp.primaryAxisSizingMode = 'FIXED';
    comp.counterAxisSizingMode = 'AUTO';
    comp.itemSpacing = 4;
    comp.fills = [];
    // Trigger
    var trigger = figma.createFrame();
    trigger.name = 'Trigger';
    trigger.layoutMode = 'HORIZONTAL';
    trigger.layoutAlign = 'STRETCH';
    trigger.primaryAxisSizingMode = 'FIXED';
    trigger.counterAxisSizingMode = 'AUTO';
    trigger.counterAxisAlignItems = 'CENTER';
    trigger.paddingTop = 8; trigger.paddingBottom = 8;
    trigger.paddingLeft = 12; trigger.paddingRight = 12;
    trigger.cornerRadius = 6;
    bindFill(trigger, def.tokens.fill, vp, vars, { r: 1, g: 1, b: 1 });
    bindStroke(trigger, def.tokens.border, vp, vars, { r: 0.82, g: 0.84, b: 0.87 });
    var tText = createTextNode('Select option', 13, 'Regular', def.tokens.text, vp, vars, { r: 0.2, g: 0.22, b: 0.27 });
    tText.layoutGrow = 1;
    trigger.appendChild(tText);
    var arrow = createTextNode('\u25BC', 9, 'Regular', def.tokens.text, vp, vars, { r: 0.5, g: 0.52, b: 0.55 });
    trigger.appendChild(arrow);
    comp.appendChild(trigger);
    if (isOpen) {
      var menu = figma.createFrame();
      menu.name = 'Menu';
      menu.layoutMode = 'VERTICAL';
      menu.layoutAlign = 'STRETCH';
      menu.primaryAxisSizingMode = 'FIXED';
      menu.counterAxisSizingMode = 'AUTO';
      menu.cornerRadius = 6;
      menu.paddingTop = 4; menu.paddingBottom = 4;
      bindFill(menu, def.tokens.fill, vp, vars, { r: 1, g: 1, b: 1 });
      menu.effects = [{ type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.1 }, offset: { x: 0, y: 4 }, radius: 12, spread: 0, visible: true, blendMode: 'NORMAL' }];
      var items = ['Option 1', 'Option 2', 'Option 3'];
      for (var di = 0; di < items.length; di++) {
        var opt = figma.createFrame();
        opt.name = items[di];
        opt.layoutMode = 'HORIZONTAL';
        opt.layoutAlign = 'STRETCH';
        opt.primaryAxisSizingMode = 'FIXED';
        opt.counterAxisSizingMode = 'AUTO';
        opt.counterAxisAlignItems = 'CENTER';
        opt.paddingTop = 8; opt.paddingBottom = 8;
        opt.paddingLeft = 12; opt.paddingRight = 12;
        if (di === 0) { bindFill(opt, def.tokens.subtleFill || 'semantic/surface/page/subtle', vp, vars, { r: 0.96, g: 0.97, b: 0.98 }); } else { opt.fills = []; }
        var oText = createTextNode(items[di], 13, 'Regular', def.tokens.text, vp, vars, { r: 0.15, g: 0.17, b: 0.22 });
        opt.appendChild(oText);
        menu.appendChild(opt);
      }
      comp.appendChild(menu);
    }
  },

  Toast: function(comp, def, size, vp, vars) {
    var variant = vp.Variant || 'info';
    var colors = { info: { r: 0.15, g: 0.39, b: 0.92 }, success: { r: 0.02, g: 0.53, b: 0.34 }, warning: { r: 0.89, g: 0.65, b: 0.04 }, error: { r: 0.86, g: 0.15, b: 0.15 } };
    var icons = { info: '\u2139', success: '\u2713', warning: '\u26A0', error: '\u2716' };
    var accentColor = colors[variant] || colors.info;
    comp.resize(340, 56);
    comp.layoutMode = 'HORIZONTAL';
    comp.primaryAxisSizingMode = 'FIXED';
    comp.counterAxisSizingMode = 'FIXED';
    comp.counterAxisAlignItems = 'CENTER';
    comp.itemSpacing = 10;
    comp.paddingLeft = 0; comp.paddingRight = 12;
    comp.cornerRadius = 8;
    bindFill(comp, def.tokens.fill, vp, vars, { r: 1, g: 1, b: 1 });
    comp.effects = [{ type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.1 }, offset: { x: 0, y: 4 }, radius: 16, spread: 0, visible: true, blendMode: 'NORMAL' }];
    // Color accent bar
    var bar = figma.createFrame();
    bar.name = 'Accent';
    bar.resize(4, 56);
    bar.fills = [{ type: 'SOLID', color: accentColor }];
    bar.cornerRadius = 8;
    comp.appendChild(bar);
    var icon = createTextNode(icons[variant] || '\u2139', 16, 'Regular', def.tokens.border, vp, vars, accentColor);
    comp.appendChild(icon);
    var msgCol = figma.createFrame();
    msgCol.name = 'Message';
    msgCol.layoutMode = 'VERTICAL';
    msgCol.primaryAxisSizingMode = 'AUTO';
    msgCol.counterAxisSizingMode = 'AUTO';
    msgCol.layoutGrow = 1;
    msgCol.itemSpacing = 2;
    msgCol.fills = [];
    var title = createTextNode(variant.charAt(0).toUpperCase() + variant.slice(1), 13, 'Semi Bold', def.tokens.text, vp, vars, { r: 0.06, g: 0.09, b: 0.16 });
    var desc = createTextNode('This is a toast notification.', 12, 'Regular', def.tokens.muted || 'semantic/text/muted', vp, vars, { r: 0.45, g: 0.47, b: 0.52 });
    msgCol.appendChild(title);
    msgCol.appendChild(desc);
    comp.appendChild(msgCol);
    var close = createTextNode('\u2715', 12, 'Regular', def.tokens.muted || 'semantic/text/muted', vp, vars, { r: 0.6, g: 0.62, b: 0.65 });
    comp.appendChild(close);
  },

  Breadcrumb: function(comp, def, size, vp, vars) {
    var count = parseInt(vp.Items || '3');
    var crumbs = ['Home', 'Products', 'Electronics', 'Laptops'];
    comp.resize(count * 80, 20);
    comp.layoutMode = 'HORIZONTAL';
    comp.primaryAxisSizingMode = 'AUTO';
    comp.counterAxisSizingMode = 'AUTO';
    comp.counterAxisAlignItems = 'CENTER';
    comp.itemSpacing = 6;
    comp.fills = [];
    for (var bi = 0; bi < count; bi++) {
      if (bi > 0) {
        var sep = createTextNode('/', 12, 'Regular', def.tokens.text || 'semantic/text/muted', vp, vars, { r: 0.7, g: 0.72, b: 0.75 });
        comp.appendChild(sep);
      }
      var isLast = bi === count - 1;
      var crumb = createTextNode(crumbs[bi] || 'Page', 13, isLast ? 'Semi Bold' : 'Regular', isLast ? (def.tokens.activeText || 'semantic/text/default') : (def.tokens.text || 'semantic/text/muted'), vp, vars, isLast ? { r: 0.06, g: 0.09, b: 0.16 } : { r: 0.45, g: 0.47, b: 0.52 });
      if (!isLast) crumb.textDecoration = 'UNDERLINE';
      comp.appendChild(crumb);
    }
  },

  Pagination: function(comp, def, size, vp, vars) {
    comp.resize(300, 36);
    comp.layoutMode = 'HORIZONTAL';
    comp.primaryAxisSizingMode = 'AUTO';
    comp.counterAxisSizingMode = 'AUTO';
    comp.counterAxisAlignItems = 'CENTER';
    comp.itemSpacing = 4;
    comp.fills = [];
    var pageItems = ['\u00AB', '1', '2', '3', '\u2026', '10', '\u00BB'];
    for (var pi = 0; pi < pageItems.length; pi++) {
      var pg = figma.createFrame();
      pg.name = 'Page ' + pageItems[pi];
      pg.layoutMode = 'HORIZONTAL';
      pg.primaryAxisSizingMode = 'FIXED';
      pg.counterAxisSizingMode = 'FIXED';
      pg.primaryAxisAlignItems = 'CENTER';
      pg.counterAxisAlignItems = 'CENTER';
      pg.resize(32, 32);
      pg.cornerRadius = 6;
      var isActive = pageItems[pi] === '1';
      if (isActive) {
        bindFill(pg, def.tokens.fill || 'semantic/color/primary/default', vp, vars, { r: 0.15, g: 0.39, b: 0.92 });
      } else {
        pg.fills = [];
      }
      var pgText = createTextNode(pageItems[pi], 13, isActive ? 'Semi Bold' : 'Regular', isActive ? null : 'semantic/text/muted', vp, vars, isActive ? { r: 1, g: 1, b: 1 } : { r: 0.4, g: 0.42, b: 0.47 });
      pg.appendChild(pgText);
      comp.appendChild(pg);
    }
  },

  Stepper: function(comp, def, size, vp, vars) {
    var steps = parseInt(vp.Steps || '3');
    comp.resize(steps * 110, 40);
    comp.layoutMode = 'HORIZONTAL';
    comp.primaryAxisSizingMode = 'AUTO';
    comp.counterAxisSizingMode = 'AUTO';
    comp.counterAxisAlignItems = 'CENTER';
    comp.itemSpacing = 0;
    comp.fills = [];
    var labels = ['Account', 'Details', 'Review', 'Confirm', 'Done'];
    for (var si = 0; si < steps; si++) {
      if (si > 0) {
        var line = figma.createFrame();
        line.name = 'Line';
        line.resize(40, 2);
        if (si <= 1) {
          bindFill(line, 'semantic/color/primary/default', vp, vars, { r: 0.15, g: 0.39, b: 0.92 });
        } else {
          bindFill(line, 'semantic/border/subtle', vp, vars, { r: 0.88, g: 0.9, b: 0.92 });
        }
        comp.appendChild(line);
      }
      var stepFrame = figma.createFrame();
      stepFrame.name = 'Step ' + (si + 1);
      stepFrame.layoutMode = 'VERTICAL';
      stepFrame.primaryAxisSizingMode = 'AUTO';
      stepFrame.counterAxisSizingMode = 'AUTO';
      stepFrame.counterAxisAlignItems = 'CENTER';
      stepFrame.itemSpacing = 4;
      stepFrame.fills = [];
      var circle = figma.createFrame();
      circle.name = 'Circle';
      circle.resize(28, 28);
      circle.cornerRadius = 28;
      circle.layoutMode = 'HORIZONTAL';
      circle.primaryAxisAlignItems = 'CENTER';
      circle.counterAxisAlignItems = 'CENTER';
      if (si === 0) {
        bindFill(circle, 'semantic/color/success/default', vp, vars, { r: 0.02, g: 0.53, b: 0.34 });
        var check = createTextNode('\u2713', 12, 'Bold', null, vp, vars, { r: 1, g: 1, b: 1 });
        circle.appendChild(check);
      } else if (si === 1) {
        bindFill(circle, def.tokens.fillActive || 'semantic/color/primary/default', vp, vars, { r: 0.15, g: 0.39, b: 0.92 });
        var num = createTextNode(String(si + 1), 12, 'Semi Bold', null, vp, vars, { r: 1, g: 1, b: 1 });
        circle.appendChild(num);
      } else {
        bindFill(circle, 'semantic/surface/page/subtle', vp, vars, { r: 0.94, g: 0.95, b: 0.96 });
        bindStroke(circle, 'semantic/border/subtle', vp, vars, { r: 0.88, g: 0.9, b: 0.92 });
        var num2 = createTextNode(String(si + 1), 12, 'Medium', 'semantic/text/muted', vp, vars, { r: 0.55, g: 0.57, b: 0.6 });
        circle.appendChild(num2);
      }
      stepFrame.appendChild(circle);
      var sLabel = createTextNode(labels[si] || 'Step', 11, si <= 1 ? 'Medium' : 'Regular', si <= 1 ? 'semantic/text/default' : 'semantic/text/muted', vp, vars, si <= 1 ? { r: 0.06, g: 0.09, b: 0.16 } : { r: 0.55, g: 0.57, b: 0.6 });
      stepFrame.appendChild(sLabel);
      comp.appendChild(stepFrame);
    }
  },

  Popover: function(comp, def, size, vp, vars) {
    comp.resize(220, 100);
    comp.layoutMode = 'VERTICAL';
    comp.primaryAxisSizingMode = 'AUTO';
    comp.counterAxisSizingMode = 'FIXED';
    comp.itemSpacing = 4;
    comp.paddingTop = 12; comp.paddingBottom = 12;
    comp.paddingLeft = 16; comp.paddingRight = 16;
    comp.cornerRadius = 8;
    bindFill(comp, def.tokens.fill, vp, vars, { r: 1, g: 1, b: 1 });
    comp.effects = [{ type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.12 }, offset: { x: 0, y: 4 }, radius: 16, spread: 0, visible: true, blendMode: 'NORMAL' }];
    bindStroke(comp, def.tokens.border, vp, vars, { r: 0.92, g: 0.93, b: 0.94 });
    var title = createTextNode('Popover Title', 14, 'Semi Bold', def.tokens.text, vp, vars, { r: 0.06, g: 0.09, b: 0.16 });
    comp.appendChild(title);
    var body = createTextNode('Popover content with helpful information.', 12, 'Regular', 'semantic/text/muted', vp, vars, { r: 0.4, g: 0.42, b: 0.47 });
    body.textAutoResize = 'HEIGHT';
    body.layoutAlign = 'STRETCH';
    comp.appendChild(body);
  },

  'Form Group': function(comp, def, size, vp, vars) {
    var fields = parseInt(vp.Fields || '3');
    comp.resize(300, fields * 72);
    comp.layoutMode = 'VERTICAL';
    comp.primaryAxisSizingMode = 'FIXED';
    comp.counterAxisSizingMode = 'FIXED';
    comp.itemSpacing = 16;
    comp.fills = [];
    var fieldNames = ['Full Name', 'Email Address', 'Phone Number', 'Company'];
    for (var fi = 0; fi < fields; fi++) {
      var fieldGroup = figma.createFrame();
      fieldGroup.name = fieldNames[fi] || 'Field';
      fieldGroup.layoutMode = 'VERTICAL';
      fieldGroup.layoutAlign = 'STRETCH';
      fieldGroup.primaryAxisSizingMode = 'AUTO';
      fieldGroup.counterAxisSizingMode = 'AUTO';
      fieldGroup.itemSpacing = 4;
      fieldGroup.fills = [];
      var label = createTextNode(fieldNames[fi] || 'Label', 12, 'Medium', def.tokens.text, vp, vars, { r: 0.15, g: 0.17, b: 0.22 });
      fieldGroup.appendChild(label);
      var input = figma.createFrame();
      input.name = 'Input';
      input.layoutMode = 'HORIZONTAL';
      input.layoutAlign = 'STRETCH';
      input.primaryAxisSizingMode = 'FIXED';
      input.counterAxisSizingMode = 'AUTO';
      input.counterAxisAlignItems = 'CENTER';
      input.paddingTop = 8; input.paddingBottom = 8;
      input.paddingLeft = 12; input.paddingRight = 12;
      input.cornerRadius = 6;
      bindFill(input, def.tokens.fill || 'semantic/surface/page/default', vp, vars, { r: 1, g: 1, b: 1 });
      bindStroke(input, def.tokens.border || 'semantic/border/default', vp, vars, { r: 0.82, g: 0.84, b: 0.87 });
      var placeholder = createTextNode('Enter ' + (fieldNames[fi] || 'value').toLowerCase(), 13, 'Regular', def.tokens.muted || 'semantic/text/muted', vp, vars, { r: 0.6, g: 0.62, b: 0.65 });
      placeholder.layoutGrow = 1;
      placeholder.textAutoResize = 'HEIGHT';
      input.appendChild(placeholder);
      fieldGroup.appendChild(input);
      comp.appendChild(fieldGroup);
    }
  },

  'Search Autocomplete': function(comp, def, size, vp, vars) {
    var isOpen = vp.State === 'open';
    comp.resize(300, isOpen ? 200 : 40);
    comp.layoutMode = 'VERTICAL';
    comp.primaryAxisSizingMode = 'FIXED';
    comp.counterAxisSizingMode = 'FIXED';
    comp.itemSpacing = 4;
    comp.fills = [];
    // Search input
    var input = figma.createFrame();
    input.name = 'Search Input';
    input.layoutMode = 'HORIZONTAL';
    input.layoutAlign = 'STRETCH';
    input.primaryAxisSizingMode = 'FIXED';
    input.counterAxisSizingMode = 'AUTO';
    input.counterAxisAlignItems = 'CENTER';
    input.itemSpacing = 8;
    input.paddingTop = 8; input.paddingBottom = 8;
    input.paddingLeft = 12; input.paddingRight = 12;
    input.cornerRadius = 6;
    bindFill(input, def.tokens.fill, vp, vars, { r: 1, g: 1, b: 1 });
    bindStroke(input, def.tokens.border, vp, vars, { r: 0.82, g: 0.84, b: 0.87 });
    var searchIcon = createTextNode('Q', 14, 'Regular', 'semantic/text/muted', vp, vars, { r: 0.5, g: 0.52, b: 0.55 });
    input.appendChild(searchIcon);
    var searchText = createTextNode(isOpen ? 'Search query' : 'Search...', 13, 'Regular', isOpen ? (def.tokens.text || 'semantic/text/default') : 'semantic/text/muted', vp, vars, isOpen ? { r: 0.1, g: 0.12, b: 0.17 } : { r: 0.6, g: 0.62, b: 0.65 });
    searchText.layoutGrow = 1;
    searchText.textAutoResize = 'HEIGHT';
    input.appendChild(searchText);
    comp.appendChild(input);
    if (isOpen) {
      var results = figma.createFrame();
      results.name = 'Results';
      results.layoutMode = 'VERTICAL';
      results.layoutAlign = 'STRETCH';
      results.primaryAxisSizingMode = 'FIXED';
      results.counterAxisSizingMode = 'AUTO';
      results.cornerRadius = 6;
      results.paddingTop = 4; results.paddingBottom = 4;
      bindFill(results, 'semantic/surface/card/default', vp, vars, { r: 1, g: 1, b: 1 });
      results.effects = [{ type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.1 }, offset: { x: 0, y: 4 }, radius: 12, spread: 0, visible: true, blendMode: 'NORMAL' }];
      var resultItems = ['Search result one', 'Search result two', 'Search result three'];
      for (var ri = 0; ri < resultItems.length; ri++) {
        var rItem = figma.createFrame();
        rItem.name = resultItems[ri];
        rItem.layoutMode = 'HORIZONTAL';
        rItem.layoutAlign = 'STRETCH';
        rItem.primaryAxisSizingMode = 'FIXED';
        rItem.counterAxisSizingMode = 'AUTO';
        rItem.counterAxisAlignItems = 'CENTER';
        rItem.paddingTop = 8; rItem.paddingBottom = 8;
        rItem.paddingLeft = 12; rItem.paddingRight = 12;
        if (ri === 0) {
          bindFill(rItem, 'semantic/surface/page/subtle', vp, vars, { r: 0.96, g: 0.97, b: 0.98 });
        } else {
          rItem.fills = [];
        }
        var rText = createTextNode(resultItems[ri], 13, 'Regular', def.tokens.text || 'semantic/text/default', vp, vars, { r: 0.15, g: 0.17, b: 0.22 });
        rItem.appendChild(rText);
        results.appendChild(rItem);
      }
      comp.appendChild(results);
    }
  },

  // --- ORGANISMS (remaining) ---

  'Card Product': function(comp, def, size, vp, vars, refs) {
    comp.resize(280, 340);
    comp.layoutMode = 'VERTICAL';
    comp.primaryAxisSizingMode = 'FIXED';
    comp.counterAxisSizingMode = 'FIXED';
    comp.itemSpacing = 0;
    bindFill(comp, def.tokens.fill, vp, vars, { r: 1, g: 1, b: 1 });
    bindStroke(comp, def.tokens.border, vp, vars, { r: 0.92, g: 0.93, b: 0.94 });
    bindRadius(comp, def.tokens.radius, vp, vars, 12);
    // Product image
    var img = figma.createFrame();
    img.name = 'Product Image';
    img.resize(280, 180);
    img.layoutAlign = 'STRETCH';
    bindFill(img, 'semantic/surface/page/subtle', vp, vars, { r: 0.95, g: 0.95, b: 0.96 });
    var imgIcon = createTextNode('IMG', 14, 'Medium', 'semantic/text/muted', vp, vars, { r: 0.7, g: 0.72, b: 0.75 });
    img.layoutMode = 'HORIZONTAL';
    img.primaryAxisSizingMode = 'FIXED';
    img.counterAxisSizingMode = 'FIXED';
    img.primaryAxisAlignItems = 'CENTER';
    img.counterAxisAlignItems = 'CENTER';
    img.appendChild(imgIcon);
    comp.appendChild(img);
    // Content
    var content = figma.createFrame();
    content.name = 'Content';
    content.layoutMode = 'VERTICAL';
    content.layoutAlign = 'STRETCH';
    content.primaryAxisSizingMode = 'AUTO';
    content.counterAxisSizingMode = 'AUTO';
    content.itemSpacing = 8;
    content.paddingTop = 14; content.paddingBottom = 14;
    content.paddingLeft = 16; content.paddingRight = 16;
    content.fills = [];
    var name = createTextNode('Product Name', 15, 'Semi Bold', def.tokens.text || 'semantic/text/default', vp, vars, { r: 0.06, g: 0.09, b: 0.16 });
    name.textAutoResize = 'HEIGHT';
    name.layoutAlign = 'STRETCH';
    content.appendChild(name);
    var price = createTextNode('$49.99', 18, 'Bold', def.tokens.accent || 'semantic/color/primary/default', vp, vars, { r: 0.15, g: 0.39, b: 0.92 });
    price.textAutoResize = 'HEIGHT';
    price.layoutAlign = 'STRETCH';
    content.appendChild(price);
    // Add to cart button — use instance if available
    var cartInstance = getComponentInstance(refs || {}, 'Button', { Variant: 'primary', Size: 'md', State: 'default' });
    if (cartInstance) {
      var cartTexts = cartInstance.findAll(function(n) { return n.type === 'TEXT'; });
      if (cartTexts.length > 0) cartTexts[0].characters = 'Add to Cart';
      cartInstance.layoutAlign = 'STRETCH';
      content.appendChild(cartInstance);
    } else {
      var btn = figma.createFrame();
      btn.name = 'Add to Cart';
      btn.layoutMode = 'HORIZONTAL';
      btn.layoutAlign = 'STRETCH';
      btn.primaryAxisSizingMode = 'FIXED';
      btn.counterAxisSizingMode = 'AUTO';
      btn.primaryAxisAlignItems = 'CENTER';
      btn.counterAxisAlignItems = 'CENTER';
      btn.paddingTop = 10; btn.paddingBottom = 10;
      btn.cornerRadius = 6;
      btn.fills = [{ type: 'SOLID', color: { r: 0.15, g: 0.39, b: 0.92 } }];
      var btnLabel = createTextNode('Add to Cart', 13, 'Semi Bold', null, vp, vars, { r: 1, g: 1, b: 1 });
      btn.appendChild(btnLabel);
      content.appendChild(btn);
    }
    comp.appendChild(content);
  },

  'Card Profile': function(comp, def, size, vp, vars) {
    comp.resize(280, 240);
    comp.layoutMode = 'VERTICAL';
    comp.primaryAxisSizingMode = 'FIXED';
    comp.counterAxisSizingMode = 'FIXED';
    comp.counterAxisAlignItems = 'CENTER';
    comp.itemSpacing = 12;
    comp.paddingTop = 24; comp.paddingBottom = 24;
    comp.paddingLeft = 24; comp.paddingRight = 24;
    bindFill(comp, def.tokens.fill, vp, vars, { r: 1, g: 1, b: 1 });
    comp.cornerRadius = 12;
    bindStroke(comp, 'semantic/border/subtle', vp, vars, { r: 0.92, g: 0.93, b: 0.94 });
    // Avatar
    var avatar = figma.createFrame();
    avatar.name = 'Avatar';
    avatar.resize(64, 64);
    avatar.cornerRadius = 64;
    avatar.layoutMode = 'HORIZONTAL';
    avatar.primaryAxisAlignItems = 'CENTER';
    avatar.counterAxisAlignItems = 'CENTER';
    bindFill(avatar, 'semantic/color/primary/subtle', vp, vars, { r: 0.88, g: 0.92, b: 1 });
    var initials = createTextNode('JD', 22, 'Semi Bold', def.tokens.accent || 'semantic/color/primary/default', vp, vars, { r: 0.15, g: 0.39, b: 0.92 });
    avatar.appendChild(initials);
    comp.appendChild(avatar);
    var name = createTextNode('Jane Doe', 16, 'Semi Bold', def.tokens.text, vp, vars, { r: 0.06, g: 0.09, b: 0.16 });
    name.textAutoResize = 'HEIGHT';
    name.layoutAlign = 'STRETCH';
    name.textAlignHorizontal = 'CENTER';
    comp.appendChild(name);
    var role = createTextNode('Product Designer', 13, 'Regular', 'semantic/text/muted', vp, vars, { r: 0.45, g: 0.47, b: 0.52 });
    role.textAutoResize = 'HEIGHT';
    role.layoutAlign = 'STRETCH';
    role.textAlignHorizontal = 'CENTER';
    comp.appendChild(role);
    // Social row
    var socials = figma.createFrame();
    socials.name = 'Socials';
    socials.layoutMode = 'HORIZONTAL';
    socials.primaryAxisSizingMode = 'AUTO';
    socials.counterAxisSizingMode = 'AUTO';
    socials.itemSpacing = 12;
    socials.fills = [];
    var socialIcons = ['+', '@', '#'];
    for (var si = 0; si < socialIcons.length; si++) {
      var sIcon = createTextNode(socialIcons[si], 16, 'Regular', 'semantic/text/muted', vp, vars, { r: 0.45, g: 0.47, b: 0.52 });
      socials.appendChild(sIcon);
    }
    comp.appendChild(socials);
  },

  'Card Stats': function(comp, def, size, vp, vars) {
    var isUp = vp.Direction !== 'down';
    comp.resize(200, 120);
    comp.layoutMode = 'VERTICAL';
    comp.primaryAxisSizingMode = 'FIXED';
    comp.counterAxisSizingMode = 'FIXED';
    comp.itemSpacing = 6;
    comp.paddingTop = 20; comp.paddingBottom = 20;
    comp.paddingLeft = 20; comp.paddingRight = 20;
    bindFill(comp, def.tokens.fill, vp, vars, { r: 1, g: 1, b: 1 });
    comp.cornerRadius = 12;
    bindStroke(comp, 'semantic/border/subtle', vp, vars, { r: 0.92, g: 0.93, b: 0.94 });
    var label = createTextNode('Revenue', 12, 'Medium', 'semantic/text/muted', vp, vars, { r: 0.45, g: 0.47, b: 0.52 });
    comp.appendChild(label);
    var value = createTextNode('$12,450', 28, 'Bold', def.tokens.text, vp, vars, { r: 0.06, g: 0.09, b: 0.16 });
    comp.appendChild(value);
    var trendRow = figma.createFrame();
    trendRow.name = 'Trend';
    trendRow.layoutMode = 'HORIZONTAL';
    trendRow.primaryAxisSizingMode = 'AUTO';
    trendRow.counterAxisSizingMode = 'AUTO';
    trendRow.counterAxisAlignItems = 'CENTER';
    trendRow.itemSpacing = 4;
    trendRow.fills = [];
    var trendColor = isUp ? { r: 0.02, g: 0.53, b: 0.34 } : { r: 0.86, g: 0.15, b: 0.15 };
    var trendToken = isUp ? 'semantic/color/success/default' : 'semantic/color/danger/default';
    var arrow = createTextNode(isUp ? '\u2191' : '\u2193', 13, 'Bold', trendToken, vp, vars, trendColor);
    trendRow.appendChild(arrow);
    var pct = createTextNode(isUp ? '12.5%' : '3.2%', 13, 'Semi Bold', trendToken, vp, vars, trendColor);
    trendRow.appendChild(pct);
    var vs = createTextNode('vs last month', 11, 'Regular', 'semantic/text/muted', vp, vars, { r: 0.55, g: 0.57, b: 0.6 });
    trendRow.appendChild(vs);
    comp.appendChild(trendRow);
  },

  Hero: function(comp, def, size, vp, vars, refs) {
    var align = vp.Alignment || 'left';
    var alignMap = { left: 'MIN', center: 'CENTER', right: 'MAX' };
    comp.resize(640, 320);
    comp.layoutMode = 'VERTICAL';
    comp.primaryAxisSizingMode = 'FIXED';
    comp.counterAxisSizingMode = 'FIXED';
    comp.primaryAxisAlignItems = 'CENTER';
    comp.counterAxisAlignItems = alignMap[align] || 'MIN';
    comp.itemSpacing = 20;
    comp.paddingTop = 60; comp.paddingBottom = 60;
    comp.paddingLeft = 48; comp.paddingRight = 48;
    bindFill(comp, def.tokens.fill, vp, vars, { r: 0.98, g: 0.98, b: 0.99 });
    var heading = createTextNode('Build Something Amazing', 36, 'Bold', def.tokens.text, vp, vars, { r: 0.06, g: 0.09, b: 0.16 });
    heading.textAutoResize = 'HEIGHT';
    heading.layoutAlign = 'STRETCH';
    comp.appendChild(heading);
    var subtitle = createTextNode('A powerful platform to create, design, and ship faster than ever before.', 16, 'Regular', 'semantic/text/muted', vp, vars, { r: 0.4, g: 0.42, b: 0.47 });
    subtitle.textAutoResize = 'HEIGHT';
    subtitle.layoutAlign = 'STRETCH';
    comp.appendChild(subtitle);
    var ctaRow = figma.createFrame();
    ctaRow.name = 'CTA Row';
    ctaRow.layoutMode = 'HORIZONTAL';
    ctaRow.primaryAxisSizingMode = 'AUTO';
    ctaRow.counterAxisSizingMode = 'AUTO';
    ctaRow.itemSpacing = 12;
    ctaRow.fills = [];
    // Primary CTA — use instance if available
    var priInstance = getComponentInstance(refs || {}, 'Button', { Variant: 'primary', Size: 'lg', State: 'default' });
    if (priInstance) {
      var priTexts = priInstance.findAll(function(n) { return n.type === 'TEXT'; });
      if (priTexts.length > 0) priTexts[0].characters = 'Get Started';
      ctaRow.appendChild(priInstance);
    } else {
      var primary = figma.createFrame();
      primary.name = 'CTA Primary';
      primary.layoutMode = 'HORIZONTAL';
      primary.primaryAxisAlignItems = 'CENTER'; primary.counterAxisAlignItems = 'CENTER';
      primary.paddingTop = 12; primary.paddingBottom = 12; primary.paddingLeft = 24; primary.paddingRight = 24;
      primary.cornerRadius = 8;
      primary.primaryAxisSizingMode = 'AUTO'; primary.counterAxisSizingMode = 'AUTO';
      bindFill(primary, def.tokens.accent || 'semantic/color/primary/default', vp, vars, { r: 0.15, g: 0.39, b: 0.92 });
      var pLabel = createTextNode('Get Started', 15, 'Semi Bold', null, vp, vars, { r: 1, g: 1, b: 1 });
      primary.appendChild(pLabel);
      ctaRow.appendChild(primary);
    }
    // Secondary CTA — use instance if available
    var secInstance = getComponentInstance(refs || {}, 'Button', { Variant: 'secondary', Size: 'lg', State: 'default' });
    if (secInstance) {
      var secTexts = secInstance.findAll(function(n) { return n.type === 'TEXT'; });
      if (secTexts.length > 0) secTexts[0].characters = 'Learn More';
      ctaRow.appendChild(secInstance);
    } else {
      var secondary = figma.createFrame();
      secondary.name = 'CTA Secondary';
      secondary.layoutMode = 'HORIZONTAL';
      secondary.primaryAxisAlignItems = 'CENTER'; secondary.counterAxisAlignItems = 'CENTER';
      secondary.paddingTop = 12; secondary.paddingBottom = 12; secondary.paddingLeft = 24; secondary.paddingRight = 24;
      secondary.cornerRadius = 8;
      secondary.primaryAxisSizingMode = 'AUTO'; secondary.counterAxisSizingMode = 'AUTO';
      bindFill(secondary, 'semantic/color/secondary/subtle', vp, vars, { r: 0.96, g: 0.97, b: 0.98 });
      bindStroke(secondary, 'semantic/border/default', vp, vars, { r: 0.82, g: 0.84, b: 0.87 });
      var sLabel = createTextNode('Learn More', 15, 'Medium', 'semantic/text/default', vp, vars, { r: 0.25, g: 0.27, b: 0.32 });
      secondary.appendChild(sLabel);
      ctaRow.appendChild(secondary);
    }
    comp.appendChild(ctaRow);
  },

  'Feature Grid': function(comp, def, size, vp, vars) {
    var cols = parseInt(vp.Columns || '3');
    comp.resize(cols * 200 + (cols - 1) * 20, 200);
    comp.layoutMode = 'HORIZONTAL';
    comp.primaryAxisSizingMode = 'AUTO';
    comp.counterAxisSizingMode = 'AUTO';
    comp.itemSpacing = 20;
    comp.fills = [];
    var features = [
      { icon: '>', title: 'Lightning Fast', desc: 'Optimized for speed and performance.' },
      { icon: '>', title: 'Customizable', desc: 'Adapt to your unique needs.' },
      { icon: '>', title: 'Easy to Use', desc: 'Simple and intuitive interface.' },
      { icon: '>', title: 'Reliable', desc: 'Enterprise-grade reliability.' },
    ];
    for (var fi = 0; fi < cols; fi++) {
      var f = features[fi] || features[0];
      var card = figma.createFrame();
      card.name = f.title;
      card.layoutMode = 'VERTICAL';
      card.primaryAxisSizingMode = 'AUTO';
      card.counterAxisSizingMode = 'FIXED';
      card.resize(200, 180);
      card.itemSpacing = 10;
      card.paddingTop = 20; card.paddingBottom = 20;
      card.paddingLeft = 20; card.paddingRight = 20;
      card.cornerRadius = 12;
      bindFill(card, def.tokens.fill, vp, vars, { r: 1, g: 1, b: 1 });
      bindStroke(card, 'semantic/border/subtle', vp, vars, { r: 0.94, g: 0.95, b: 0.96 });
      var iconFrame = figma.createFrame();
      iconFrame.name = 'Icon';
      iconFrame.resize(40, 40);
      iconFrame.cornerRadius = 8;
      iconFrame.layoutMode = 'HORIZONTAL';
      iconFrame.primaryAxisAlignItems = 'CENTER';
      iconFrame.counterAxisAlignItems = 'CENTER';
      bindFill(iconFrame, 'semantic/color/primary/subtle', vp, vars, { r: 0.93, g: 0.95, b: 1 });
      var fIcon = createTextNode(f.icon, 18, 'Regular', def.tokens.accent || 'semantic/color/primary/default', vp, vars, { r: 0.15, g: 0.39, b: 0.92 });
      iconFrame.appendChild(fIcon);
      card.appendChild(iconFrame);
      var fTitle = createTextNode(f.title, 15, 'Semi Bold', def.tokens.text, vp, vars, { r: 0.06, g: 0.09, b: 0.16 });
      fTitle.textAutoResize = 'HEIGHT';
      fTitle.layoutAlign = 'STRETCH';
      card.appendChild(fTitle);
      var fDesc = createTextNode(f.desc, 12, 'Regular', 'semantic/text/muted', vp, vars, { r: 0.45, g: 0.47, b: 0.52 });
      fDesc.textAutoResize = 'HEIGHT';
      fDesc.layoutAlign = 'STRETCH';
      card.appendChild(fDesc);
      comp.appendChild(card);
    }
  },

  'Pricing Table': function(comp, def, size, vp, vars, refs) {
    var highlighted = vp.Highlighted === 'true';
    comp.resize(260, 380);
    comp.layoutMode = 'VERTICAL';
    comp.primaryAxisSizingMode = 'FIXED';
    comp.counterAxisSizingMode = 'AUTO';
    comp.counterAxisAlignItems = 'CENTER';
    comp.itemSpacing = 16;
    comp.paddingTop = 28; comp.paddingBottom = 28;
    comp.paddingLeft = 24; comp.paddingRight = 24;
    comp.cornerRadius = 16;
    if (highlighted) {
      bindFill(comp, def.tokens.accent || 'semantic/color/primary/default', vp, vars, { r: 0.15, g: 0.39, b: 0.92 });
      comp.effects = [{ type: 'DROP_SHADOW', color: { r: 0.15, g: 0.39, b: 0.92, a: 0.25 }, offset: { x: 0, y: 8 }, radius: 24, spread: 0, visible: true, blendMode: 'NORMAL' }];
    } else {
      bindFill(comp, def.tokens.fill, vp, vars, { r: 1, g: 1, b: 1 });
      bindStroke(comp, def.tokens.border || 'semantic/border/subtle', vp, vars, { r: 0.92, g: 0.93, b: 0.94 });
    }
    var textColor = highlighted ? { r: 1, g: 1, b: 1 } : { r: 0.06, g: 0.09, b: 0.16 };
    var mutedColor = highlighted ? { r: 0.85, g: 0.9, b: 1 } : { r: 0.45, g: 0.47, b: 0.52 };
    var textToken = highlighted ? null : (def.tokens.text || 'semantic/text/default');
    var mutedToken = highlighted ? null : (def.tokens.muted || 'semantic/text/muted');
    var planName = createTextNode(highlighted ? 'Pro' : 'Starter', 14, 'Semi Bold', mutedToken, vp, vars, mutedColor);
    comp.appendChild(planName);
    var priceRow = figma.createFrame();
    priceRow.name = 'Price';
    priceRow.layoutMode = 'HORIZONTAL';
    priceRow.primaryAxisSizingMode = 'AUTO';
    priceRow.counterAxisSizingMode = 'AUTO';
    priceRow.counterAxisAlignItems = 'MAX';
    priceRow.itemSpacing = 2;
    priceRow.fills = [];
    var dollar = createTextNode('$', 18, 'Medium', textToken, vp, vars, textColor);
    priceRow.appendChild(dollar);
    var amount = createTextNode(highlighted ? '29' : '0', 40, 'Bold', textToken, vp, vars, textColor);
    priceRow.appendChild(amount);
    var period = createTextNode('/mo', 14, 'Regular', mutedToken, vp, vars, mutedColor);
    priceRow.appendChild(period);
    comp.appendChild(priceRow);
    // Feature list
    var featureList = ['5 Projects', 'Up to 10 users', 'Basic analytics', 'Email support', 'API access'];
    for (var pi = 0; pi < featureList.length; pi++) {
      var fRow = figma.createFrame();
      fRow.name = featureList[pi];
      fRow.layoutMode = 'HORIZONTAL';
      fRow.primaryAxisSizingMode = 'AUTO';
      fRow.counterAxisSizingMode = 'AUTO';
      fRow.counterAxisAlignItems = 'CENTER';
      fRow.itemSpacing = 8;
      fRow.fills = [];
      var checkIcon = createTextNode('\u2713', 12, 'Bold', highlighted ? null : (def.tokens.success || 'semantic/color/success/default'), vp, vars, highlighted ? { r: 0.7, g: 1, b: 0.85 } : { r: 0.02, g: 0.53, b: 0.34 });
      fRow.appendChild(checkIcon);
      var fText = createTextNode(featureList[pi], 13, 'Regular', textToken, vp, vars, textColor);
      fRow.appendChild(fText);
      comp.appendChild(fRow);
    }
    // CTA button — use instance if available
    var ctaVariant = highlighted ? 'secondary' : 'primary';
    var ctaInstance = getComponentInstance(refs || {}, 'Button', { Variant: ctaVariant, Size: 'md', State: 'default' });
    if (ctaInstance) {
      var ctaTexts = ctaInstance.findAll(function(n) { return n.type === 'TEXT'; });
      if (ctaTexts.length > 0) ctaTexts[0].characters = 'Get Started';
      ctaInstance.layoutAlign = 'STRETCH';
      comp.appendChild(ctaInstance);
    } else {
      var cta = figma.createFrame();
      cta.name = 'CTA';
      cta.layoutMode = 'HORIZONTAL';
      cta.layoutAlign = 'STRETCH';
      cta.primaryAxisSizingMode = 'FIXED';
      cta.counterAxisSizingMode = 'AUTO';
      cta.primaryAxisAlignItems = 'CENTER';
      cta.counterAxisAlignItems = 'CENTER';
      cta.paddingTop = 10; cta.paddingBottom = 10;
      cta.cornerRadius = 8;
      if (highlighted) {
        cta.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
        var ctaLabel = createTextNode('Get Started', 14, 'Semi Bold', null, vp, vars, { r: 0.15, g: 0.39, b: 0.92 });
      } else {
        cta.fills = [{ type: 'SOLID', color: { r: 0.15, g: 0.39, b: 0.92 } }];
        var ctaLabel = createTextNode('Get Started', 14, 'Semi Bold', null, vp, vars, { r: 1, g: 1, b: 1 });
      }
      cta.appendChild(ctaLabel);
      comp.appendChild(cta);
    }
  },

  'Data Table': function(comp, def, size, vp, vars) {
    comp.resize(560, 220);
    comp.layoutMode = 'VERTICAL';
    comp.primaryAxisSizingMode = 'FIXED';
    comp.counterAxisSizingMode = 'AUTO';
    comp.itemSpacing = 0;
    bindFill(comp, def.tokens.fill, vp, vars, { r: 1, g: 1, b: 1 });
    comp.cornerRadius = 8;
    bindStroke(comp, 'semantic/border/subtle', vp, vars, { r: 0.92, g: 0.93, b: 0.94 });
    var headers = ['Name', 'Email', 'Role', 'Status'];
    var rows = [
      ['Alice Johnson', 'alice@example.com', 'Admin', 'Active'],
      ['Bob Smith', 'bob@example.com', 'Editor', 'Active'],
      ['Carol White', 'carol@example.com', 'Viewer', 'Inactive'],
    ];
    // Header
    var hRow = figma.createFrame();
    hRow.name = 'Header';
    hRow.layoutMode = 'HORIZONTAL';
    hRow.layoutAlign = 'STRETCH';
    hRow.primaryAxisSizingMode = 'FIXED';
    hRow.counterAxisSizingMode = 'AUTO';
    hRow.paddingTop = 10; hRow.paddingBottom = 10;
    hRow.paddingLeft = 16; hRow.paddingRight = 16;
    bindFill(hRow, def.tokens.headerFill || 'semantic/surface/page/subtle', vp, vars, { r: 0.97, g: 0.97, b: 0.98 });
    for (var hi = 0; hi < headers.length; hi++) {
      var hCell = createTextNode(headers[hi], 12, 'Semi Bold', def.tokens.headerText || 'semantic/text/muted', vp, vars, { r: 0.35, g: 0.37, b: 0.42 });
      hCell.layoutGrow = 1;
      hRow.appendChild(hCell);
    }
    comp.appendChild(hRow);
    for (var ri = 0; ri < rows.length; ri++) {
      var dRow = figma.createFrame();
      dRow.name = 'Row ' + (ri + 1);
      dRow.layoutMode = 'HORIZONTAL';
      dRow.layoutAlign = 'STRETCH';
      dRow.primaryAxisSizingMode = 'FIXED';
      dRow.counterAxisSizingMode = 'AUTO';
      dRow.paddingTop = 10; dRow.paddingBottom = 10;
      dRow.paddingLeft = 16; dRow.paddingRight = 16;
      dRow.fills = [];
      bindStroke(dRow, 'semantic/border/subtle', vp, vars, { r: 0.95, g: 0.96, b: 0.97 });
      dRow.strokesIncludedInLayout = false;
      for (var ci = 0; ci < rows[ri].length; ci++) {
        var dCell = createTextNode(rows[ri][ci], 13, 'Regular', def.tokens.text || 'semantic/text/default', vp, vars, { r: 0.15, g: 0.17, b: 0.22 });
        dCell.layoutGrow = 1;
        dRow.appendChild(dCell);
      }
      comp.appendChild(dRow);
    }
  },

  'Form Wizard': function(comp, def, size, vp, vars, refs) {
    var steps = parseInt(vp.Steps || '3');
    comp.resize(480, 360);
    comp.layoutMode = 'VERTICAL';
    comp.primaryAxisSizingMode = 'FIXED';
    comp.counterAxisSizingMode = 'FIXED';
    comp.itemSpacing = 0;
    bindFill(comp, def.tokens.fill, vp, vars, { r: 1, g: 1, b: 1 });
    comp.cornerRadius = 12;
    bindStroke(comp, 'semantic/border/subtle', vp, vars, { r: 0.92, g: 0.93, b: 0.94 });
    // Step indicator bar
    var stepBar = figma.createFrame();
    stepBar.name = 'Step Indicator';
    stepBar.layoutMode = 'HORIZONTAL';
    stepBar.layoutAlign = 'STRETCH';
    stepBar.primaryAxisSizingMode = 'FIXED';
    stepBar.counterAxisSizingMode = 'AUTO';
    stepBar.primaryAxisAlignItems = 'CENTER';
    stepBar.counterAxisAlignItems = 'CENTER';
    stepBar.paddingTop = 16; stepBar.paddingBottom = 16;
    stepBar.paddingLeft = 24; stepBar.paddingRight = 24;
    stepBar.itemSpacing = 8;
    bindFill(stepBar, def.tokens.stepFill || 'semantic/surface/page/subtle', vp, vars, { r: 0.98, g: 0.98, b: 0.99 });
    var stepLabels = ['Account', 'Profile', 'Review', 'Confirm'];
    for (var si = 0; si < steps; si++) {
      if (si > 0) {
        var dot = figma.createFrame();
        dot.name = 'Sep';
        dot.resize(20, 2);
        if (si <= 1) {
          bindFill(dot, def.tokens.accent || 'semantic/color/primary/default', vp, vars, { r: 0.15, g: 0.39, b: 0.92 });
        } else {
          bindFill(dot, 'semantic/border/subtle', vp, vars, { r: 0.88, g: 0.9, b: 0.92 });
        }
        stepBar.appendChild(dot);
      }
      var sBadge = figma.createFrame();
      sBadge.name = 'Step ' + (si + 1);
      sBadge.layoutMode = 'HORIZONTAL';
      sBadge.primaryAxisSizingMode = 'AUTO';
      sBadge.counterAxisSizingMode = 'AUTO';
      sBadge.primaryAxisAlignItems = 'CENTER';
      sBadge.counterAxisAlignItems = 'CENTER';
      sBadge.itemSpacing = 6;
      sBadge.paddingTop = 4; sBadge.paddingBottom = 4;
      sBadge.paddingLeft = 8; sBadge.paddingRight = 8;
      sBadge.cornerRadius = 12;
      if (si === 1) {
        bindFill(sBadge, def.tokens.stepActive || 'semantic/color/primary/subtle', vp, vars, { r: 0.93, g: 0.95, b: 1 });
      } else {
        sBadge.fills = [];
      }
      var sNum = createTextNode(String(si + 1), 11, si <= 1 ? 'Semi Bold' : 'Regular', si <= 1 ? (def.tokens.accent || 'semantic/color/primary/default') : (def.tokens.muted || 'semantic/text/muted'), vp, vars, si <= 1 ? { r: 0.15, g: 0.39, b: 0.92 } : { r: 0.55, g: 0.57, b: 0.6 });
      sBadge.appendChild(sNum);
      var sName = createTextNode(stepLabels[si] || 'Step', 12, si <= 1 ? 'Medium' : 'Regular', si <= 1 ? (def.tokens.accent || 'semantic/color/primary/default') : (def.tokens.muted || 'semantic/text/muted'), vp, vars, si <= 1 ? { r: 0.15, g: 0.39, b: 0.92 } : { r: 0.55, g: 0.57, b: 0.6 });
      sBadge.appendChild(sName);
      stepBar.appendChild(sBadge);
    }
    comp.appendChild(stepBar);
    // Form area
    var form = figma.createFrame();
    form.name = 'Form Content';
    form.layoutMode = 'VERTICAL';
    form.layoutAlign = 'STRETCH';
    form.layoutGrow = 1;
    form.primaryAxisSizingMode = 'FIXED';
    form.counterAxisSizingMode = 'FIXED';
    form.itemSpacing = 14;
    form.paddingTop = 24; form.paddingBottom = 16;
    form.paddingLeft = 24; form.paddingRight = 24;
    form.fills = [];
    var fields = ['Email Address', 'Password'];
    for (var fi = 0; fi < fields.length; fi++) {
      var fg = figma.createFrame();
      fg.name = fields[fi];
      fg.layoutMode = 'VERTICAL';
      fg.layoutAlign = 'STRETCH';
      fg.primaryAxisSizingMode = 'AUTO';
      fg.counterAxisSizingMode = 'FIXED';
      fg.itemSpacing = 4;
      fg.fills = [];
      var fLabel = createTextNode(fields[fi], 12, 'Medium', def.tokens.text || 'semantic/text/default', vp, vars, { r: 0.15, g: 0.17, b: 0.22 });
      fg.appendChild(fLabel);
      var fInput = figma.createFrame();
      fInput.name = 'Input';
      fInput.layoutMode = 'HORIZONTAL';
      fInput.layoutAlign = 'STRETCH';
      fInput.primaryAxisSizingMode = 'FIXED';
      fInput.counterAxisSizingMode = 'AUTO';
      fInput.counterAxisAlignItems = 'CENTER';
      fInput.paddingTop = 8; fInput.paddingBottom = 8;
      fInput.paddingLeft = 12; fInput.paddingRight = 12;
      fInput.cornerRadius = 6;
      bindFill(fInput, 'semantic/surface/page/default', vp, vars, { r: 1, g: 1, b: 1 });
      bindStroke(fInput, 'semantic/border/default', vp, vars, { r: 0.82, g: 0.84, b: 0.87 });
      var fPlaceholder = createTextNode('Enter ' + fields[fi].toLowerCase(), 13, 'Regular', def.tokens.muted || 'semantic/text/muted', vp, vars, { r: 0.6, g: 0.62, b: 0.65 });
      fInput.appendChild(fPlaceholder);
      fg.appendChild(fInput);
      form.appendChild(fg);
    }
    comp.appendChild(form);
    // Footer buttons
    var footer = figma.createFrame();
    footer.name = 'Footer';
    footer.layoutMode = 'HORIZONTAL';
    footer.layoutAlign = 'STRETCH';
    footer.primaryAxisSizingMode = 'FIXED';
    footer.counterAxisSizingMode = 'AUTO';
    footer.primaryAxisAlignItems = 'MAX';
    footer.counterAxisAlignItems = 'CENTER';
    footer.itemSpacing = 8;
    footer.paddingTop = 12; footer.paddingBottom = 20;
    footer.paddingLeft = 24; footer.paddingRight = 24;
    footer.fills = [];
    // Back button — use instance if available
    var backInstance = getComponentInstance(refs || {}, 'Button', { Variant: 'secondary', Size: 'md', State: 'default' });
    if (backInstance) {
      var bTexts = backInstance.findAll(function(n) { return n.type === 'TEXT'; });
      if (bTexts.length > 0) bTexts[0].characters = 'Back';
      footer.appendChild(backInstance);
    } else {
      var backBtn = figma.createFrame();
      backBtn.name = 'Back';
      backBtn.layoutMode = 'HORIZONTAL'; backBtn.primaryAxisAlignItems = 'CENTER'; backBtn.counterAxisAlignItems = 'CENTER';
      backBtn.paddingLeft = 16; backBtn.paddingRight = 16; backBtn.paddingTop = 8; backBtn.paddingBottom = 8;
      backBtn.cornerRadius = 6;
      backBtn.primaryAxisSizingMode = 'AUTO'; backBtn.counterAxisSizingMode = 'AUTO';
      backBtn.fills = [];
      backBtn.strokes = [{ type: 'SOLID', color: { r: 0.82, g: 0.84, b: 0.87 } }]; backBtn.strokeWeight = 1;
      var bLabel = createTextNode('Back', 13, 'Medium', null, vp, vars, { r: 0.35, g: 0.37, b: 0.42 });
      backBtn.appendChild(bLabel);
      footer.appendChild(backBtn);
    }
    // Next button — use instance if available
    var nextInstance = getComponentInstance(refs || {}, 'Button', { Variant: 'primary', Size: 'md', State: 'default' });
    if (nextInstance) {
      var nTexts = nextInstance.findAll(function(n) { return n.type === 'TEXT'; });
      if (nTexts.length > 0) nTexts[0].characters = 'Next Step';
      footer.appendChild(nextInstance);
    } else {
      var nextBtn = figma.createFrame();
      nextBtn.name = 'Next';
      nextBtn.layoutMode = 'HORIZONTAL'; nextBtn.primaryAxisAlignItems = 'CENTER'; nextBtn.counterAxisAlignItems = 'CENTER';
      nextBtn.paddingLeft = 16; nextBtn.paddingRight = 16; nextBtn.paddingTop = 8; nextBtn.paddingBottom = 8;
      nextBtn.cornerRadius = 6;
      nextBtn.primaryAxisSizingMode = 'AUTO'; nextBtn.counterAxisSizingMode = 'AUTO';
      nextBtn.fills = [{ type: 'SOLID', color: { r: 0.15, g: 0.39, b: 0.92 } }];
      var nLabel = createTextNode('Next Step', 13, 'Semi Bold', null, vp, vars, { r: 1, g: 1, b: 1 });
      nextBtn.appendChild(nLabel);
      footer.appendChild(nextBtn);
    }
    comp.appendChild(footer);
  },

  // --- TEMPLATES ---

  'Layout Dashboard': function(comp, def, size, vp, vars) {
    comp.resize(800, 500);
    comp.layoutMode = 'HORIZONTAL';
    comp.primaryAxisSizingMode = 'FIXED';
    comp.counterAxisSizingMode = 'FIXED';
    comp.itemSpacing = 0;
    comp.fills = [];
    // Sidebar
    var sidebar = figma.createFrame();
    sidebar.name = 'Sidebar';
    sidebar.resize(200, 500);
    sidebar.layoutMode = 'VERTICAL';
    sidebar.primaryAxisSizingMode = 'FIXED';
    sidebar.counterAxisSizingMode = 'FIXED';
    sidebar.itemSpacing = 4;
    sidebar.paddingTop = 20; sidebar.paddingLeft = 12; sidebar.paddingRight = 12;
    bindFill(sidebar, def.tokens.sidebar || 'semantic/surface/card/default', vp, vars, { r: 1, g: 1, b: 1 });
    bindStroke(sidebar, def.tokens.border || 'semantic/border/subtle', vp, vars, { r: 0.92, g: 0.93, b: 0.94 });
    var brand = createTextNode('Dashboard', 16, 'Bold', def.tokens.text || 'semantic/text/default', vp, vars, { r: 0.06, g: 0.09, b: 0.16 });
    sidebar.appendChild(brand);
    var spacer = figma.createFrame(); spacer.name = 'Spacer'; spacer.resize(10, 16); spacer.fills = [];
    sidebar.appendChild(spacer);
    var navLinks = ['Overview', 'Analytics', 'Users', 'Settings'];
    for (var ni = 0; ni < navLinks.length; ni++) {
      var link = figma.createFrame();
      link.name = navLinks[ni];
      link.layoutMode = 'HORIZONTAL';
      link.layoutAlign = 'STRETCH';
      link.primaryAxisSizingMode = 'FIXED';
      link.counterAxisSizingMode = 'AUTO';
      link.counterAxisAlignItems = 'CENTER';
      link.paddingTop = 8; link.paddingBottom = 8;
      link.paddingLeft = 10; link.paddingRight = 10;
      link.cornerRadius = 6;
      if (ni === 0) {
        bindFill(link, def.tokens.accentSubtle || 'semantic/color/primary/subtle', vp, vars, { r: 0.93, g: 0.95, b: 1 });
      } else {
        link.fills = [];
      }
      var lText = createTextNode(navLinks[ni], 13, ni === 0 ? 'Medium' : 'Regular', ni === 0 ? (def.tokens.accent || 'semantic/color/primary/default') : (def.tokens.muted || 'semantic/text/muted'), vp, vars, ni === 0 ? { r: 0.15, g: 0.39, b: 0.92 } : { r: 0.45, g: 0.47, b: 0.52 });
      link.appendChild(lText);
      sidebar.appendChild(link);
    }
    comp.appendChild(sidebar);
    // Main content
    var main = figma.createFrame();
    main.name = 'Main';
    main.layoutGrow = 1;
    main.layoutMode = 'VERTICAL';
    main.primaryAxisSizingMode = 'FIXED';
    main.counterAxisSizingMode = 'FIXED';
    main.itemSpacing = 16;
    main.paddingTop = 20; main.paddingBottom = 20;
    main.paddingLeft = 24; main.paddingRight = 24;
    bindFill(main, def.tokens.fill, vp, vars, { r: 0.98, g: 0.98, b: 0.99 });
    var header = createTextNode('Overview', 22, 'Bold', def.tokens.text, vp, vars, { r: 0.06, g: 0.09, b: 0.16 });
    main.appendChild(header);
    // Stats row
    var statsRow = figma.createFrame();
    statsRow.name = 'Stats';
    statsRow.layoutMode = 'HORIZONTAL';
    statsRow.layoutAlign = 'STRETCH';
    statsRow.primaryAxisSizingMode = 'FIXED';
    statsRow.counterAxisSizingMode = 'AUTO';
    statsRow.itemSpacing = 16;
    statsRow.fills = [];
    var statNames = ['Revenue', 'Users', 'Orders', 'Growth'];
    var statValues = ['$12,450', '1,249', '342', '+12%'];
    for (var sti = 0; sti < statNames.length; sti++) {
      var statCard = figma.createFrame();
      statCard.name = statNames[sti];
      statCard.layoutMode = 'VERTICAL';
      statCard.layoutGrow = 1;
      statCard.primaryAxisSizingMode = 'AUTO';
      statCard.counterAxisSizingMode = 'FIXED';
      statCard.itemSpacing = 4;
      statCard.paddingTop = 16; statCard.paddingBottom = 16;
      statCard.paddingLeft = 16; statCard.paddingRight = 16;
      statCard.cornerRadius = 8;
      bindFill(statCard, def.tokens.cardFill || 'semantic/surface/card/default', vp, vars, { r: 1, g: 1, b: 1 });
      bindStroke(statCard, def.tokens.border || 'semantic/border/subtle', vp, vars, { r: 0.94, g: 0.95, b: 0.96 });
      var stName = createTextNode(statNames[sti], 11, 'Medium', def.tokens.muted || 'semantic/text/muted', vp, vars, { r: 0.45, g: 0.47, b: 0.52 });
      statCard.appendChild(stName);
      var stVal = createTextNode(statValues[sti], 22, 'Bold', def.tokens.text || 'semantic/text/default', vp, vars, { r: 0.06, g: 0.09, b: 0.16 });
      statCard.appendChild(stVal);
      statsRow.appendChild(statCard);
    }
    main.appendChild(statsRow);
    comp.appendChild(main);
  },

  'Layout Marketing': function(comp, def, size, vp, vars, refs) {
    comp.resize(800, 600);
    comp.layoutMode = 'VERTICAL';
    comp.primaryAxisSizingMode = 'FIXED';
    comp.counterAxisSizingMode = 'FIXED';
    comp.itemSpacing = 0;
    bindFill(comp, def.tokens.fill, vp, vars, { r: 1, g: 1, b: 1 });
    // Nav
    var nav = figma.createFrame();
    nav.name = 'Nav';
    nav.layoutMode = 'HORIZONTAL';
    nav.layoutAlign = 'STRETCH';
    nav.primaryAxisSizingMode = 'FIXED';
    nav.counterAxisSizingMode = 'AUTO';
    nav.counterAxisAlignItems = 'CENTER';
    nav.paddingTop = 14; nav.paddingBottom = 14;
    nav.paddingLeft = 32; nav.paddingRight = 32;
    nav.itemSpacing = 24;
    nav.fills = [];
    bindStroke(nav, def.tokens.border || 'semantic/border/subtle', vp, vars, { r: 0.94, g: 0.95, b: 0.96 });
    nav.strokesIncludedInLayout = false;
    var bName = createTextNode('Brand', 18, 'Bold', def.tokens.text || 'semantic/text/default', vp, vars, { r: 0.06, g: 0.09, b: 0.16 });
    bName.layoutGrow = 1;
    nav.appendChild(bName);
    var navLinks2 = ['Features', 'Pricing', 'About'];
    for (var nli = 0; nli < navLinks2.length; nli++) {
      var nl = createTextNode(navLinks2[nli], 14, 'Medium', def.tokens.muted || 'semantic/text/muted', vp, vars, { r: 0.4, g: 0.42, b: 0.47 });
      nav.appendChild(nl);
    }
    comp.appendChild(nav);
    // Hero section
    var hero = figma.createFrame();
    hero.name = 'Hero';
    hero.layoutMode = 'VERTICAL';
    hero.layoutAlign = 'STRETCH';
    hero.primaryAxisSizingMode = 'FIXED';
    hero.counterAxisSizingMode = 'FIXED';
    hero.layoutGrow = 1;
    hero.primaryAxisAlignItems = 'CENTER';
    hero.counterAxisAlignItems = 'CENTER';
    hero.itemSpacing = 16;
    hero.paddingTop = 60; hero.paddingBottom = 60;
    bindFill(hero, def.tokens.subtleFill || 'semantic/surface/page/subtle', vp, vars, { r: 0.98, g: 0.98, b: 0.99 });
    var hTitle = createTextNode('Build better products', 40, 'Bold', def.tokens.text, vp, vars, { r: 0.06, g: 0.09, b: 0.16 });
    hero.appendChild(hTitle);
    var hSub = createTextNode('Everything you need to ship faster.', 16, 'Regular', def.tokens.muted || 'semantic/text/muted', vp, vars, { r: 0.45, g: 0.47, b: 0.52 });
    hero.appendChild(hSub);
    // Hero CTA — use instance if available
    var heroCtaInstance = getComponentInstance(refs || {}, 'Button', { Variant: 'primary', Size: 'lg', State: 'default' });
    if (heroCtaInstance) {
      var hcTexts = heroCtaInstance.findAll(function(n) { return n.type === 'TEXT'; });
      if (hcTexts.length > 0) hcTexts[0].characters = 'Get Started Free';
      hero.appendChild(heroCtaInstance);
    } else {
      var hCta = figma.createFrame();
      hCta.name = 'CTA';
      hCta.layoutMode = 'HORIZONTAL';
      hCta.primaryAxisAlignItems = 'CENTER'; hCta.counterAxisAlignItems = 'CENTER';
      hCta.paddingTop = 12; hCta.paddingBottom = 12; hCta.paddingLeft = 28; hCta.paddingRight = 28;
      hCta.cornerRadius = 8;
      hCta.primaryAxisSizingMode = 'AUTO'; hCta.counterAxisSizingMode = 'AUTO';
      bindFill(hCta, def.tokens.accent || 'semantic/color/primary/default', vp, vars, { r: 0.15, g: 0.39, b: 0.92 });
      var hcLabel = createTextNode('Get Started Free', 15, 'Semi Bold', null, vp, vars, { r: 1, g: 1, b: 1 });
      hCta.appendChild(hcLabel);
      hero.appendChild(hCta);
    }
    comp.appendChild(hero);
    // Features row
    var fSection = figma.createFrame();
    fSection.name = 'Features';
    fSection.layoutMode = 'HORIZONTAL';
    fSection.layoutAlign = 'STRETCH';
    fSection.primaryAxisSizingMode = 'FIXED';
    fSection.counterAxisSizingMode = 'AUTO';
    fSection.itemSpacing = 24;
    fSection.paddingTop = 40; fSection.paddingBottom = 40;
    fSection.paddingLeft = 32; fSection.paddingRight = 32;
    fSection.fills = [];
    var ftrs = ['Fast', 'Secure', 'Scalable'];
    for (var fti = 0; fti < ftrs.length; fti++) {
      var fc = figma.createFrame();
      fc.name = ftrs[fti];
      fc.layoutMode = 'VERTICAL';
      fc.layoutGrow = 1;
      fc.primaryAxisSizingMode = 'AUTO';
      fc.counterAxisSizingMode = 'FIXED';
      fc.counterAxisAlignItems = 'CENTER';
      fc.itemSpacing = 8;
      fc.paddingTop = 20; fc.paddingBottom = 20;
      fc.fills = [];
      var fIcon = createTextNode('*', 24, 'Regular', def.tokens.accent || 'semantic/color/primary/default', vp, vars, { r: 0.15, g: 0.39, b: 0.92 });
      fc.appendChild(fIcon);
      var fT = createTextNode(ftrs[fti], 16, 'Semi Bold', def.tokens.text || 'semantic/text/default', vp, vars, { r: 0.06, g: 0.09, b: 0.16 });
      fc.appendChild(fT);
      var fD = createTextNode('Feature description goes here.', 12, 'Regular', def.tokens.muted || 'semantic/text/muted', vp, vars, { r: 0.45, g: 0.47, b: 0.52 });
      fc.appendChild(fD);
      fSection.appendChild(fc);
    }
    comp.appendChild(fSection);
  },

  'Layout Blog': function(comp, def, size, vp, vars) {
    comp.resize(800, 500);
    comp.layoutMode = 'VERTICAL';
    comp.primaryAxisSizingMode = 'FIXED';
    comp.counterAxisSizingMode = 'FIXED';
    comp.itemSpacing = 0;
    bindFill(comp, def.tokens.fill, vp, vars, { r: 1, g: 1, b: 1 });
    // Header
    var header = figma.createFrame();
    header.name = 'Header';
    header.layoutMode = 'HORIZONTAL';
    header.layoutAlign = 'STRETCH';
    header.primaryAxisSizingMode = 'FIXED';
    header.counterAxisSizingMode = 'AUTO';
    header.counterAxisAlignItems = 'CENTER';
    header.paddingTop = 14; header.paddingBottom = 14;
    header.paddingLeft = 32; header.paddingRight = 32;
    header.itemSpacing = 24;
    header.fills = [];
    bindStroke(header, def.tokens.border || 'semantic/border/subtle', vp, vars, { r: 0.94, g: 0.95, b: 0.96 });
    header.strokesIncludedInLayout = false;
    var blogName = createTextNode('Blog', 18, 'Bold', def.tokens.text || 'semantic/text/default', vp, vars, { r: 0.06, g: 0.09, b: 0.16 });
    blogName.layoutGrow = 1;
    header.appendChild(blogName);
    var headerLinks = ['Articles', 'Topics', 'About'];
    for (var hli = 0; hli < headerLinks.length; hli++) {
      var hl = createTextNode(headerLinks[hli], 14, 'Medium', def.tokens.muted || 'semantic/text/muted', vp, vars, { r: 0.4, g: 0.42, b: 0.47 });
      header.appendChild(hl);
    }
    comp.appendChild(header);
    // Content area
    var body = figma.createFrame();
    body.name = 'Content';
    body.layoutMode = 'VERTICAL';
    body.layoutAlign = 'STRETCH';
    body.layoutGrow = 1;
    body.primaryAxisSizingMode = 'FIXED';
    body.counterAxisSizingMode = 'FIXED';
    body.itemSpacing = 24;
    body.paddingTop = 32; body.paddingBottom = 32;
    body.paddingLeft = 32; body.paddingRight = 32;
    body.fills = [];
    // Featured post
    var featured = figma.createFrame();
    featured.name = 'Featured Post';
    featured.layoutMode = 'HORIZONTAL';
    featured.layoutAlign = 'STRETCH';
    featured.primaryAxisSizingMode = 'FIXED';
    featured.counterAxisSizingMode = 'AUTO';
    featured.itemSpacing = 20;
    featured.cornerRadius = 12;
    featured.fills = [];
    var fImg = figma.createFrame();
    fImg.name = 'Image';
    fImg.resize(300, 160);
    fImg.cornerRadius = 8;
    bindFill(fImg, def.tokens.subtleFill || 'semantic/surface/page/subtle', vp, vars, { r: 0.94, g: 0.95, b: 0.96 });
    featured.appendChild(fImg);
    var fContent = figma.createFrame();
    fContent.name = 'Content';
    fContent.layoutMode = 'VERTICAL';
    fContent.layoutGrow = 1;
    fContent.primaryAxisSizingMode = 'AUTO';
    fContent.counterAxisSizingMode = 'FIXED';
    fContent.itemSpacing = 8;
    fContent.paddingTop = 8;
    fContent.fills = [];
    var fTag = createTextNode('FEATURED', 10, 'Semi Bold', def.tokens.accent || 'semantic/color/primary/default', vp, vars, { r: 0.15, g: 0.39, b: 0.92 });
    fContent.appendChild(fTag);
    var fTitle = createTextNode('Getting Started with Design Systems', 20, 'Bold', def.tokens.text, vp, vars, { r: 0.06, g: 0.09, b: 0.16 });
    fContent.appendChild(fTitle);
    var fExcerpt = createTextNode('Learn how to build a scalable design system from scratch.', 13, 'Regular', def.tokens.muted || 'semantic/text/muted', vp, vars, { r: 0.45, g: 0.47, b: 0.52 });
    fContent.appendChild(fExcerpt);
    var fMeta = createTextNode('Jan 15, 2025  \u00B7  5 min read', 11, 'Regular', def.tokens.muted || 'semantic/text/muted', vp, vars, { r: 0.6, g: 0.62, b: 0.65 });
    fContent.appendChild(fMeta);
    featured.appendChild(fContent);
    body.appendChild(featured);
    // Post grid (2 cols)
    var grid = figma.createFrame();
    grid.name = 'Post Grid';
    grid.layoutMode = 'HORIZONTAL';
    grid.layoutAlign = 'STRETCH';
    grid.primaryAxisSizingMode = 'FIXED';
    grid.counterAxisSizingMode = 'AUTO';
    grid.itemSpacing = 20;
    grid.fills = [];
    var posts = ['Component Patterns', 'Token Architecture'];
    for (var pi = 0; pi < posts.length; pi++) {
      var post = figma.createFrame();
      post.name = posts[pi];
      post.layoutMode = 'VERTICAL';
      post.layoutGrow = 1;
      post.primaryAxisSizingMode = 'AUTO';
      post.counterAxisSizingMode = 'FIXED';
      post.itemSpacing = 10;
      post.fills = [];
      var pImg = figma.createFrame();
      pImg.name = 'Thumb';
      pImg.resize(200, 100);
      pImg.layoutAlign = 'STRETCH';
      pImg.cornerRadius = 8;
      bindFill(pImg, def.tokens.subtleFill || 'semantic/surface/page/subtle', vp, vars, { r: 0.94, g: 0.95, b: 0.96 });
      post.appendChild(pImg);
      var pTitle = createTextNode(posts[pi], 15, 'Semi Bold', def.tokens.text || 'semantic/text/default', vp, vars, { r: 0.06, g: 0.09, b: 0.16 });
      post.appendChild(pTitle);
      var pDate = createTextNode('Jan 10, 2025', 11, 'Regular', def.tokens.muted || 'semantic/text/muted', vp, vars, { r: 0.6, g: 0.62, b: 0.65 });
      post.appendChild(pDate);
      grid.appendChild(post);
    }
    body.appendChild(grid);
    comp.appendChild(body);
  },
};

// ---------------------------------------------------------------------------
// Getting Started Instructions
// ---------------------------------------------------------------------------

async function createInstructionsSection(page, sectionY) {
  await loadFonts();
  var section = figma.createSection();
  section.name = 'Getting Started';

  var frame = figma.createFrame();
  frame.name = 'Instructions';
  frame.resize(800, 10);
  frame.layoutMode = 'VERTICAL';
  frame.primaryAxisSizingMode = 'AUTO';
  frame.counterAxisSizingMode = 'FIXED';
  frame.itemSpacing = 32;
  frame.paddingTop = 48; frame.paddingBottom = 48;
  frame.paddingLeft = 48; frame.paddingRight = 48;
  frame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  frame.cornerRadius = 16;
  frame.effects = [{ type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.08 }, offset: { x: 0, y: 4 }, radius: 16, spread: 0, visible: true, blendMode: 'NORMAL' }];

  // Title
  var title = figma.createText();
  title.fontName = { family: 'Inter', style: 'Bold' };
  title.characters = 'Aioli Design System — Getting Started';
  title.fontSize = 28;
  title.fills = [{ type: 'SOLID', color: { r: 0.06, g: 0.09, b: 0.16 } }];
  title.textAutoResize = 'HEIGHT';
  title.layoutAlign = 'STRETCH';
  frame.appendChild(title);

  var sections = [
    {
      heading: 'Using Components',
      body: 'Drag components from the Assets panel (Option+2 / Alt+2) into your designs. Each component supports multiple variants — change Size, Variant, and State properties in the right panel.'
    },
    {
      heading: 'Switching Themes',
      body: 'This library includes 7 variable modes: Light, Dark, Glass, Neumorphic, Brutalist, Gradient, and Dark Luxury. To switch: select any frame, open the Layer section in the right panel, and change the variable mode for Semantic and Component collections. Note: 7 modes requires Figma Professional plan (free plan allows 4 modes).'
    },
    {
      heading: 'Light / Dark Mode',
      body: 'Set the variable mode to "Dark" on both the Semantic and Component collections. All colors, surfaces, borders, and text will switch to their dark mode equivalents, fully WCAG AA compliant.'
    },
    {
      heading: 'Rebranding / Custom Colors',
      body: 'To rebrand: open the Variables panel, go to the Semantic collection, and change the "color/primary/default" variable (and its hover/subtle variants) to your brand color. All components using the primary color will auto-update. Color Styles are also available in the Styles panel (Aioli/ namespace) for paint-level customization.'
    },
    {
      heading: 'Component Instances',
      body: 'Organisms (Cards, Modals, Heroes, etc.) contain instances of atom components like Button. Editing the master Button component will cascade changes to all organisms that use it. Look for the diamond icon in the layers panel to identify instances.'
    },
    {
      heading: 'Variable Collections',
      body: 'Primitives: Raw color scales, spacing, radius, shadows (1 mode). Semantic: Intent-based tokens like primary, success, danger (7 theme modes). Component: Component-specific tokens like button sizes (7 theme modes). All 3 collections work together — semantic tokens reference primitives, and components reference semantic tokens.'
    },
  ];

  for (var si = 0; si < sections.length; si++) {
    var group = figma.createFrame();
    group.name = sections[si].heading;
    group.layoutMode = 'VERTICAL';
    group.layoutAlign = 'STRETCH';
    group.primaryAxisSizingMode = 'AUTO';
    group.counterAxisSizingMode = 'FIXED';
    group.itemSpacing = 8;
    group.fills = [];

    var heading = figma.createText();
    heading.fontName = { family: 'Inter', style: 'Semi Bold' };
    heading.characters = sections[si].heading;
    heading.fontSize = 18;
    heading.fills = [{ type: 'SOLID', color: { r: 0.06, g: 0.09, b: 0.16 } }];
    heading.textAutoResize = 'HEIGHT';
    heading.layoutAlign = 'STRETCH';
    group.appendChild(heading);

    var body = figma.createText();
    body.fontName = { family: 'Inter', style: 'Regular' };
    body.characters = sections[si].body;
    body.fontSize = 14;
    body.lineHeight = { unit: 'PERCENT', value: 160 };
    body.fills = [{ type: 'SOLID', color: { r: 0.35, g: 0.37, b: 0.42 } }];
    body.textAutoResize = 'HEIGHT';
    body.layoutAlign = 'STRETCH';
    group.appendChild(body);

    frame.appendChild(group);
  }

  frame.x = 60;
  frame.y = 60;
  section.appendChild(frame);
  section.resizeWithoutConstraints(frame.width + 120, frame.height + 120);
  section.x = 0;
  section.y = sectionY || 0;
  page.appendChild(section);

  sendLog('Instructions section created', 'done');
  return section;
}

/**
 * Create a base component frame with token-bound styles.
 * Uses COMPONENT_BUILDERS for rich inner structure when available.
 */
function createBaseComponent(def, size, allVariables, variantProps, componentRefMap) {
  if (!variantProps) variantProps = {};
  if (!componentRefMap) componentRefMap = {};

  // Build variant name string
  var variantName = Object.keys(variantProps).length > 0
    ? Object.entries(variantProps).map(function(entry) { return entry[0] + '=' + entry[1]; }).join(', ')
    : def.name;

  var component = figma.createComponent();
  component.name = variantName;
  component.resize(size.width, size.height);

  // Default layout
  component.layoutMode = 'VERTICAL';
  component.primaryAxisSizingMode = 'FIXED';
  component.counterAxisSizingMode = 'FIXED';
  component.primaryAxisAlignItems = 'CENTER';
  component.counterAxisAlignItems = 'CENTER';
  component.paddingTop = 8;
  component.paddingBottom = 8;
  component.paddingLeft = 12;
  component.paddingRight = 12;

  // Check if we have a specific builder for this component
  var builder = COMPONENT_BUILDERS[def.name];
  if (builder) {
    try {
      builder(component, def, size, variantProps, allVariables, componentRefMap);
      return component;
    } catch (err) {
      // Log the error so we can debug, then fall through to generic
      sendLog('Builder error [' + def.name + ']: ' + (err.message || err), 'err');
      console.error('Builder error for ' + def.name + ':', err);
    }
  }

  // Generic fallback: styled rectangle with label
  if (def.tokens.fill) {
    bindFill(component, def.tokens.fill, variantProps, allVariables, { r: 0.96, g: 0.97, b: 0.98 });
  }
  if (def.tokens.radius) {
    bindRadius(component, def.tokens.radius, variantProps, allVariables, 6);
  }
  if (def.tokens.border) {
    bindStroke(component, def.tokens.border, variantProps, allVariables, { r: 0.886, g: 0.91, b: 0.941 });
  }

  var textNode = createTextNode(def.name, def.category === 'atom' ? 14 : 16, 'Medium', def.tokens.text, variantProps, allVariables, { r: 0.06, g: 0.09, b: 0.16 });
  component.appendChild(textNode);

  return component;
}

/**
 * Resolve a token path template like 'component/button/{Variant}/bg' with variant values.
 */
function resolveTokenPath(template, variantProps, allVariables) {
  let resolved = template;
  for (const [key, value] of Object.entries(variantProps)) {
    resolved = resolved.replace(`{${key}}`, value);
  }

  // Try to find the variable
  return allVariables[resolved] || allVariables[`component/${resolved}`] || allVariables[`semantic/${resolved}`] || allVariables[`primitives/${resolved}`] || null;
}

/**
 * Generate variant combinations (limited to avoid explosion).
 * Produces all single-axis variants plus the default combo.
 */
function generateVariantCombinations(variants, defaultVariant) {
  const keys = Object.keys(variants);
  if (keys.length === 0) return [];

  const combos = [];

  // Strategy: generate all combinations but limit total count
  // For 2+ axes, generate a cross-product limited to 24 entries
  function generate(index, current) {
    if (index === keys.length) {
      combos.push(Object.assign({}, current));
      return;
    }
    const key = keys[index];
    const values = variants[key];
    for (const val of values) {
      current[key] = val;
      generate(index + 1, current);
      if (combos.length >= 24) return; // Safety limit
    }
  }

  generate(0, {});
  return combos;
}

// ---------------------------------------------------------------------------
// Main message handler
// ---------------------------------------------------------------------------

figma.ui.onmessage = async (msg) => {
  if (msg.type !== 'generate') return;

  // Use bundled tokens if no custom data provided
  const data = msg.data || BUNDLED_TOKENS;
  if (!data) {
    sendError('No token data available. Paste figma-tokens.json or use the bundled version.');
    return;
  }
  const { options } = msg;
  let totalSteps = 0;
  let currentStep = 0;
  const stats = { variables: 0, styles: 0, components: 0 };

  if (options.variables) totalSteps += 3; // 3 collections
  if (options.textStyles) totalSteps += 1;
  if (options.effectStyles) totalSteps += 1;
  if (options.components) totalSteps += 1;

  try {
    // Load fonts upfront — needed for text styles and component builders
    await loadFonts();

    const allVariables = {};

    // ------ VARIABLES ------
    if (options.variables) {
      sendProgress(0, 'Creating Primitives collection...');
      sendLog('Creating variable collections...', '');

      // 1. Primitives (single mode)
      const primCollection = createCollection('Primitives', ['Value']);
      const primModeId = primCollection.modes[0].modeId;
      const primVars = createVariables(primCollection, data.variables.primitives, primModeId, allVariables);
      stats.variables += Object.keys(primVars).length;
      sendLog(`  Primitives: ${Object.keys(primVars).length} variables`, 'done');
      currentStep++;
      sendProgress((currentStep / totalSteps) * 100, 'Creating Semantic collection...');

      // 2. Semantic (6 theme modes)
      const themeNames = ['Light', 'Dark', 'Glass', 'Neumorphic', 'Brutalist', 'Gradient', 'Dark Luxury'];
      const semCollection = createCollection('Semantic', themeNames);
      const semDefaultModeId = semCollection.modes[0].modeId;
      const semVars = createVariables(semCollection, data.variables.semantic, semDefaultModeId, allVariables);
      stats.variables += Object.keys(semVars).length;

      // Apply theme overrides to semantic modes
      const themeMap = { Dark: 'dark', Glass: 'glass', Neumorphic: 'neumorphic', Brutalist: 'brutalist', Gradient: 'gradient', 'Dark Luxury': 'darkLuxury' };
      sendLog('  Applying semantic theme overrides...', '');
      for (const mode of semCollection.modes) {
        const themeKey = themeMap[mode.name];
        if (themeKey && data.themes[themeKey]) {
          sendLog('  Theme: ' + mode.name + ' (' + Object.keys(data.themes[themeKey].overrides).length + ' overrides)', '');
          applyThemeOverrides(semCollection, mode.modeId, data.themes[themeKey].overrides, allVariables, 'semantic');
        }
      }
      sendLog(`  Semantic: ${Object.keys(semVars).length} variables, ${semCollection.modes.length} modes`, 'done');
      currentStep++;
      sendProgress((currentStep / totalSteps) * 100, 'Creating Component collection...');

      // 3. Component (6 theme modes)
      const compCollection = createCollection('Component', themeNames);
      const compDefaultModeId = compCollection.modes[0].modeId;
      const compVars = createVariables(compCollection, data.variables.component, compDefaultModeId, allVariables);
      stats.variables += Object.keys(compVars).length;

      // Apply theme overrides to component modes
      sendLog('  Applying component theme overrides...', '');
      for (const mode of compCollection.modes) {
        const themeKey = themeMap[mode.name];
        if (themeKey && data.themes[themeKey]) {
          sendLog('  Theme: ' + mode.name, '');
          applyThemeOverrides(compCollection, mode.modeId, data.themes[themeKey].overrides, allVariables, 'component');
        }
      }
      sendLog(`  Component: ${Object.keys(compVars).length} variables, ${compCollection.modes.length} modes`, 'done');
      currentStep++;
      sendProgress((currentStep / totalSteps) * 100, 'Variables complete');
    }

    // ------ TEXT STYLES ------
    if (options.textStyles) {
      sendProgress((currentStep / totalSteps) * 100, 'Creating text styles...');
      await loadFonts();
      const textStyles = await createTextStyles(data.textStyles);
      stats.styles += textStyles.length;
      currentStep++;
    }

    // ------ EFFECT STYLES ------
    if (options.effectStyles) {
      sendProgress((currentStep / totalSteps) * 100, 'Creating effect styles...');
      const effectStyles = createEffectStyles(data.effectStyles);
      stats.styles += effectStyles.length;
      currentStep++;
    }

    // ------ COLOR STYLES ------
    if (data.colorStyles && data.colorStyles.length > 0) {
      sendProgress((currentStep / totalSteps) * 100, 'Creating color styles...');
      const colorStyles = await createColorStyles(data.colorStyles, allVariables);
      stats.styles += colorStyles.length;
      sendLog(`  Color styles: ${colorStyles.length}`, 'done');
    }

    // ------ COMPONENTS ------
    var nextSectionY = 0;
    if (options.components) {
      sendProgress((currentStep / totalSteps) * 100, 'Creating components...');
      await loadFonts();
      const result = await createComponents(data.components, allVariables);
      stats.components = result.components.length;
      nextSectionY = result.nextY;
      currentStep++;
    }

    // ------ INSTRUCTIONS ------
    if (options.components) {
      sendProgress(95, 'Creating instructions...');
      await createInstructionsSection(figma.currentPage, nextSectionY);
    }

    sendDone(stats);
    sendLog(`\nComplete! ${stats.variables} variables, ${stats.styles} styles, ${stats.components} components`, 'done');

  } catch (err) {
    sendError(err.message || 'Unknown error');
    sendLog(`Error: ${err.message}`, 'err');
  }
};
