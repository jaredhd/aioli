/**
 * Aioli Design System - TypeScript Definitions
 *
 * Comprehensive type declarations for the Aioli Design System engine,
 * covering agents, utilities, constants, and public API exports.
 *
 * @packageDocumentation
 */

// =============================================================================
// COMMON TYPES & INTERFACES
// =============================================================================

/** Severity levels used across the system for issues and fixes. */
export type Severity = 'error' | 'warning' | 'info';

/** Severity levels with uppercase keys, used by the CodeReviewAgent. */
export type SeverityLevel = 'critical' | 'error' | 'warning' | 'info';

/** WCAG conformance levels. */
export type WCAGLevel = 'AA' | 'AAA';

/** Text type categories for contrast checking. */
export type TextType = 'normalText' | 'largeText' | 'uiComponents';

/** Device types for motion duration adjustments. */
export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'wearable';

/** Animation direction for easing selection. */
export type AnimationDirection = 'enter' | 'exit' | 'move' | 'color' | 'opacity';

/** Duration categories defined in the motion standards. */
export type DurationCategory = 'instant' | 'micro' | 'fast' | 'normal' | 'slow' | 'complex';

/** Atomic design component category. */
export type ComponentCategory = 'atom' | 'molecule' | 'organism' | 'template' | 'page';

/** Agent identifier strings. */
export type AgentId =
  | 'design-token'
  | 'accessibility-validator'
  | 'motion-animation'
  | 'component-generator'
  | 'code-review'
  | 'orchestrator'
  | 'human';

// =============================================================================
// TOKEN TYPES
// =============================================================================

/** A single DTCG design token. */
export interface Token {
  /** The token value (may be a reference like "{primitive.color.blue.500}"). */
  $value: string;
  /** DTCG type (color, dimension, fontFamily, etc.). */
  $type?: string;
  /** Human-readable description. */
  $description?: string;
}

/** A fully resolved token returned by DesignTokenAgent.getToken(). */
export interface ResolvedToken {
  /** Full dot-notation path (e.g., "primitive.color.blue.500"). */
  path: string;
  /** The $value as written (may include references). */
  rawValue: string;
  /** Final resolved value with all references replaced. */
  resolvedValue: string;
  /** DTCG type. */
  type?: string;
  /** Description. */
  description?: string;
  /** Path of references followed during resolution. */
  referenceChain: string[];
}

/** Result of token validation. */
export interface ValidationResult {
  /** True if no error-severity issues exist. */
  valid: boolean;
  /** List of validation issues. */
  issues: TokenValidationIssue[];
}

/** A single token validation issue. */
export interface TokenValidationIssue {
  /** Dot-notation path of the token with the issue. */
  path: string;
  /** Description of the issue. */
  error: string;
  /** Issue severity. */
  severity: 'error' | 'warning';
}

/** A flat JSON entry returned by DesignTokenAgent.toFlatJSON(). */
export interface FlatTokenEntry {
  /** Resolved token value. */
  value: string;
  /** DTCG type. */
  type?: string;
  /** Token description. */
  description?: string;
}

// =============================================================================
// AGENT REQUEST / RESPONSE TYPES
// =============================================================================

/** Base shape for all agent requests passed to handleRequest(). */
export interface AgentRequest {
  /** The action to perform. */
  action: string;
  /** Additional parameters vary by agent and action. */
  [key: string]: any;
}

/** Base shape for all agent responses returned from handleRequest(). */
export interface AgentResponse<T = any> {
  /** Whether the request succeeded. */
  success: boolean;
  /** Response payload (present on success). */
  data?: T;
  /** Error message (present on failure). */
  error?: string;
  /** Additional fields vary by agent. */
  [key: string]: any;
}

// =============================================================================
// FIX PROTOCOL TYPES
// =============================================================================

/** Fix type strings used in the routing table. */
export type FixType =
  | 'token.contrast'
  | 'token.update'
  | 'token.create'
  | 'component.semantic'
  | 'component.aria'
  | 'component.structure'
  | 'motion.duration'
  | 'motion.easing'
  | 'motion.reduced'
  | 'manual.review';

/** A fix request created by the protocol utilities. */
export interface FixRequest {
  /** Unique identifier. */
  id: string;
  /** Fix type (determines routing). */
  type: FixType | string;
  /** Issue severity. */
  severity: SeverityLevel;
  /** Agent that detected the issue. */
  source: AgentId;
  /** Agent responsible for applying the fix. */
  target: AgentId;
  /** Original issue details. */
  issue: Record<string, any>;
  /** Proposed fix details. */
  fix: Record<string, any>;
  /** Human-readable description. */
  description: string;
  /** Whether the fix can be applied without human review. */
  autoFixable: boolean;
  /** Current status. */
  status: 'pending' | 'applied' | 'failed';
  /** ISO timestamp of creation. */
  createdAt: string;
}

/** A fix result returned after attempting to apply a fix. */
export interface FixResult {
  /** ID of the original fix request. */
  requestId: string;
  /** Whether the fix was applied successfully. */
  success: boolean;
  /** Error message if fix failed. */
  error: string | null;
  /** Details of changes made. */
  changes: Record<string, any> | null;
  /** Whether re-validation is needed. */
  needsValidation: boolean;
  /** ISO timestamp of completion. */
  completedAt: string;
}

// =============================================================================
// ACCESSIBILITY TYPES
// =============================================================================

/** Parsed RGB color. */
export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

/** Result of a contrast check. */
export interface ContrastResult {
  /** Foreground color (resolved). */
  foreground: string;
  /** Background color (resolved). */
  background: string;
  /** Calculated contrast ratio, rounded to two decimal places. */
  ratio: number;
  /** Required ratio for the target level and text type. */
  required: number;
  /** Whether AA contrast is met. */
  passesAA: boolean;
  /** Whether AAA contrast is met. */
  passesAAA: boolean;
  /** Whether the target level requirement is met. */
  passes: boolean;
  /** Text type checked. */
  textType: TextType;
  /** WCAG level checked. */
  level: WCAGLevel;
}

/** Options for contrast checking. */
export interface ContrastCheckOptions {
  /** Type of text content. Defaults to 'normalText'. */
  textType?: TextType;
  /** WCAG level to check against. */
  level?: WCAGLevel;
  /** Description of the context being checked. */
  context?: string;
}

/** Result of HTML accessibility validation. */
export interface HTMLValidationResult {
  /** Component name. */
  component: string;
  /** True if no error-severity issues found. */
  valid: boolean;
  /** All detected issues. */
  issues: A11yIssue[];
  /** Summary counts. */
  stats: {
    errors: number;
    warnings: number;
    info: number;
  };
}

/** An individual accessibility issue. */
export interface A11yIssue {
  /** Issue category (contrast, semantic, aria, motion, keyboard, system). */
  type: string;
  /** Severity level. */
  severity: Severity;
  /** Issue description. */
  message: string;
  /** Relevant WCAG success criteria. */
  wcagCriteria: string | null;
  /** HTML element involved. */
  element: string | null;
  /** Suggested fix. */
  suggestion: string | null;
  /** File/line location. */
  location: string | null;
}

/** Result of suggestFixes() on the accessibility agent. */
export interface A11yFixSuggestions {
  /** Array of fix requests. */
  fixes: FixRequest[];
  /** Fixes grouped by target agent. */
  byAgent: Record<string, FixRequest[]>;
  /** Summary counts. */
  summary: {
    total: number;
    autoFixable: number;
    needsReview: number;
  };
}

/** A full accessibility validation report. */
export interface A11yReport {
  /** Component name. */
  component: string;
  /** ISO timestamp. */
  timestamp: string;
  /** Target WCAG level. */
  targetLevel: WCAGLevel;
  /** True if no errors. */
  valid: boolean;
  /** Summary counts. */
  summary: {
    total: number;
    errors: number;
    warnings: number;
    info: number;
  };
  /** WCAG criteria affected. */
  wcagCriteriaAffected: string[];
  /** Issues grouped by severity. */
  issues: {
    errors: A11yIssue[];
    warnings: A11yIssue[];
    info: A11yIssue[];
  };
  /** All issues in a flat array. */
  allIssues: A11yIssue[];
}

/** WCAG contrast ratio thresholds. */
export interface WCAGContrastRatios {
  AA: {
    normalText: number;
    largeText: number;
    uiComponents: number;
  };
  AAA: {
    normalText: number;
    largeText: number;
    uiComponents: number;
  };
}

// =============================================================================
// MOTION TYPES
// =============================================================================

/** A duration specification for a single category. */
export interface DurationSpec {
  min: number;
  max: number;
  default: number;
  useCases: string[];
}

/** Result of getDuration(). */
export interface DurationResult {
  /** Calculated duration in ms. */
  duration: number;
  /** Duration category. */
  category: DurationCategory;
  /** Target device. */
  device: DeviceType;
  /** Whether this is an exit animation. */
  isExit: boolean;
  /** Adjusted range. */
  range: { min: number; max: number };
  /** CSS value string (e.g., "167ms"). */
  css: string;
  /** Token reference. */
  token: string;
}

/** Result of getDurationByCategory(). */
export interface DurationByCategoryResult {
  duration: number;
  css: string;
  range: { min: number; max: number };
  category: DurationCategory;
}

/** Result of getEasing(). */
export interface EasingResult {
  /** Cubic bezier value. */
  easing: string;
  /** Human-friendly name (e.g., "ease-out"). */
  name: string;
  /** Reason for this choice. */
  reason: string;
  /** CSS value (same as easing). */
  css: string;
  /** Token reference. */
  token: string;
}

/** Configuration for generateTransition(). */
export interface TransitionConfig {
  /** CSS property to animate. Defaults to 'transform'. */
  property?: string;
  /** Animation type for duration lookup. */
  animationType?: string;
  /** Animation direction. */
  direction?: AnimationDirection;
  /** Target device. */
  device?: DeviceType;
  /** Whether this is an exit animation. */
  isExit?: boolean;
}

/** Result of generateTransition(). */
export interface TransitionResult {
  /** Full CSS transition value. */
  css: string;
  /** CSS property. */
  property: string;
  /** Duration in ms. */
  duration: number;
  /** Duration CSS string. */
  durationCss: string;
  /** Easing curve. */
  easing: string;
  /** Easing name. */
  easingName: string;
  /** Whether the property is GPU-accelerated. */
  isAllowed: boolean;
  /** will-change value. */
  willChange: string | null;
  /** Token reference. */
  token: string;
}

/** Error result from generateTransition() for prohibited properties. */
export interface TransitionError {
  error: true;
  message: string;
  suggestion: string;
  alternatives: string;
}

/** Motion preset result from generatePreset(). */
export interface MotionPreset {
  /** Preset name. */
  preset: string;
  /** Animation type (enter, exit, move). */
  type: string;
  /** Whether this animation is essential. */
  essential: boolean;
  /** Duration info. */
  duration: DurationResult;
  /** Easing info. */
  easing: EasingResult;
  /** Generated CSS. */
  css: {
    transition?: string;
    from?: Record<string, string>;
    to?: Record<string, string>;
    keyframes?: string;
    animation?: string;
  };
  /** Reduced motion CSS alternative. */
  reducedMotion: string | null;
}

/** Stagger delay for a single element. */
export interface StaggerDelay {
  index: number;
  delay: number;
  css: string;
  cssVar: string;
}

/** Result of generateStagger(). */
export interface StaggerResult {
  count: number;
  delays: StaggerDelay[];
  totalDuration: number;
  css: string;
}

/** Result of motion validation. */
export interface MotionValidationResult {
  valid: boolean;
  issues: MotionIssue[];
  summary: {
    errors: number;
    warnings: number;
  };
}

/** A single motion validation issue. */
export interface MotionIssue {
  type: string;
  severity: Severity;
  message: string;
  timestamp: string;
  wcag?: string;
  suggestion?: string;
}

// =============================================================================
// COMPONENT GENERATOR TYPES
// =============================================================================

/** A component template definition from COMPONENT_TEMPLATES. */
export interface ComponentTemplateDefinition {
  /** Atomic design category. */
  category: ComponentCategory;
  /** Description of the component. */
  description: string;
  /** Available visual variants. */
  variants?: string[];
  /** Available size options. */
  sizes?: string[];
  /** Available position options. */
  positions?: string[];
  /** Template function that generates the component. */
  template: (props: Record<string, any>) => GeneratedComponent;
}

/** The output of a component template function. */
export interface GeneratedComponent {
  /** Generated HTML markup. */
  html: string;
  /** Design token paths used by this component. */
  tokens: string[];
  /** Accessibility metadata. */
  a11y: ComponentA11yMetadata;
  /** Motion/animation configuration (present for animated components). */
  motion?: ComponentMotionConfig;
  /** Resolved token values (populated when tokenAgent is connected). */
  resolvedTokens?: Record<string, string>;
  /** Usage hint. */
  usage?: string;
}

/** Full result from ComponentGeneratorAgent.generate(). */
export interface ComponentGenerateResult extends GeneratedComponent {
  /** Component type name. */
  type: string;
  /** Atomic design category. */
  category: ComponentCategory;
  /** Props used to generate the component. */
  props: Record<string, any>;
}

/** Error result from component generation. */
export interface ComponentGenerateError {
  error: true;
  message: string;
  availableTypes?: string[];
}

/** Accessibility metadata attached to generated components. */
export interface ComponentA11yMetadata {
  role?: string;
  focusable?: boolean;
  hasLabel?: boolean;
  hasLabels?: boolean;
  hasAlt?: boolean;
  modal?: boolean;
  focusTrap?: boolean;
  expandable?: boolean;
  landmark?: boolean;
  essential?: boolean;
  atomic?: boolean;
  busy?: boolean;
  multiline?: boolean;
  removable?: boolean;
  scrollable?: boolean;
  currentPage?: boolean;
  currentStep?: boolean;
  valueRange?: boolean;
  externalIndicator?: boolean;
  mobileToggle?: boolean;
  errorHandling?: boolean;
  live?: 'assertive' | 'polite';
  labelledBy?: string;
  describedBy?: string;
  triggeredBy?: string;
  focusManagement?: string;
  orientation?: string;
  keyboardNav?: string[];
}

/** Motion configuration attached to animated components. */
export interface ComponentMotionConfig {
  enter: {
    duration: number;
    easing: string;
    css: string;
  };
  exit: {
    duration: number;
    easing: string;
  };
}

/** Result of parseDescription(). */
export interface ParsedDescription {
  componentType: string;
  props: Record<string, any>;
  confidence: number;
}

/** Error result of parseDescription(). */
export interface ParsedDescriptionError {
  error: true;
  message: string;
  suggestion?: string;
}

/** Component listing entry from listComponents(). */
export interface ComponentListing {
  name: string;
  category: ComponentCategory;
  description: string;
  variants: string[];
  sizes: string[];
}

/** Component info from getComponentInfo(). */
export interface ComponentInfo {
  name: string;
  category: ComponentCategory;
  description: string;
  variants: string[];
  sizes: string[];
  a11yFeatures: ComponentA11yMetadata;
}

// =============================================================================
// CODE REVIEW TYPES
// =============================================================================

/** Review category strings. */
export type ReviewCategory = 'tokens' | 'accessibility' | 'motion' | 'structure' | 'patterns' | 'performance';

/** A code review issue. */
export interface ReviewIssue {
  id: string;
  category: ReviewCategory;
  ruleId: string;
  severity: Severity;
  message: string;
  wcag?: string;
  suggestion?: string;
  details?: any;
  timestamp: string;
}

/** A positive finding / suggestion from code review. */
export interface ReviewSuggestion {
  id: string;
  category: ReviewCategory;
  type: string;
  message: string;
  timestamp: string;
}

/** The full result from CodeReviewAgent.review(). */
export interface ReviewResult {
  /** Whether the code passes (no errors). */
  approved: boolean;
  /** Quality score (0-100). */
  score: number;
  /** Letter grade (A-F). */
  grade: string;
  /** Summary counts. */
  summary: {
    total: number;
    errors: number;
    warnings: number;
    info: number;
    suggestions: number;
    rulesChecked: number;
  };
  /** Issue counts by category. */
  byCategory: Record<ReviewCategory, number>;
  /** All issues. */
  issues: ReviewIssue[];
  /** All positive findings. */
  suggestions: ReviewSuggestion[];
  /** ISO timestamp. */
  timestamp: string;
  /** Review duration in ms. */
  duration: number;
}

/** Result of quickCheck(). */
export interface QuickCheckResult {
  pass: boolean;
  errors: number;
  issues: ReviewIssue[];
}

/** Result of checkCategory(). */
export interface CategoryCheckResult {
  category: ReviewCategory;
  issues: ReviewIssue[];
  suggestions: ReviewSuggestion[];
}

/** Fix suggestion from code review. */
export interface ReviewFixSuggestion {
  id: string;
  issue: string;
  type: string;
  target: AgentId;
  fix?: Record<string, any>;
  description: string;
  autoFixable: boolean;
  severity?: Severity;
}

/** Result of suggestFixes() on code review agent. */
export interface ReviewFixSuggestions {
  fixes: ReviewFixSuggestion[];
  count: number;
  autoFixable: number;
}

// =============================================================================
// ORCHESTRATOR TYPES
// =============================================================================

/** Result of processFixes(). */
export interface ProcessFixesResult {
  processed: Array<{ fix: FixRequest; result?: any; dryRun?: boolean }>;
  skipped: Array<{ fix: FixRequest; reason: string }>;
  failed: Array<{ fix: FixRequest; error: string }>;
  needsReview: number;
  summary: {
    total: number;
    attempted: number;
    succeeded: number;
    failed: number;
  };
}

/** Options for processFixes(). */
export interface ProcessFixesOptions {
  /** Only apply auto-fixable fixes. */
  autoFixOnly?: boolean;
  /** Simulate without applying changes. */
  dryRun?: boolean;
}

/** Result of runFixCycle(). */
export interface FixCycleResult {
  iterations: FixCycleIteration[];
  totalFixed: number;
  remainingIssues: number;
}

/** A single iteration in the fix cycle. */
export interface FixCycleIteration {
  iteration: number;
  issuesFound: number;
  fixesApplied: number;
  fixesFailed: number;
}

/** Options for runFixCycle(). */
export interface FixCycleOptions {
  /** Only apply auto-fixable fixes. Defaults to true. */
  autoFixOnly?: boolean;
  /** Maximum fix/re-validate iterations. Defaults to 3. */
  maxIterations?: number;
}

/** System status from the orchestrator. */
export interface SystemStatus {
  registeredAgents: string[];
  fixHistory: number;
  pendingFixes: number;
}

// =============================================================================
// AI COMPONENT GENERATOR TYPES
// =============================================================================

/** Options for creating an AIComponentGenerator. */
export interface AIComponentGeneratorOptions {
  /** Anthropic API key. */
  apiKey?: string;
  /** Connected design token agent. */
  tokenAgent?: DesignTokenAgent;
  /** Connected accessibility validator agent. */
  a11yAgent?: AccessibilityValidatorAgent;
  /** Connected motion agent. */
  motionAgent?: MotionAgent;
}

/** Result of AI-powered component generation. */
export interface AIGeneratedComponent {
  /** Component type. */
  type: string;
  /** Original description. */
  description: string;
  /** Generated HTML. */
  html: string;
  /** Source of generation. */
  source: 'claude-api' | 'template';
  /** Model used (when source is claude-api). */
  model?: string;
  /** Number of generation attempts. */
  attempts?: number;
  /** Whether it passed accessibility validation. */
  passed?: boolean;
  /** Validation result. */
  validation?: {
    issues: A11yIssue[];
    passed: boolean;
  };
  /** Error from validation. */
  validationError?: string;
  /** Error from AI generation. */
  aiError?: string;
  /** Informational note. */
  note?: string;
  /** Detected variant (template mode). */
  variant?: string;
  /** Detected size (template mode). */
  size?: string;
}

/** Result of fixComponent(). */
export interface AIFixResult {
  success: boolean;
  html: string;
  error?: string;
  validation?: {
    issues: A11yIssue[];
    passed: boolean;
  };
  issuesFixed?: number;
  remainingIssues?: number;
  note?: string;
}

/** Capabilities reported by the AI generator. */
export interface AICapabilities {
  aiEnabled: boolean;
  templateTypes: string[];
  features: string[];
}

// =============================================================================
// AGENT STATUS TYPE
// =============================================================================

/** Status entry for a single agent. */
export interface AgentStatusEntry {
  version: string;
  status: 'active' | 'inactive';
  features?: string[];
}

// =============================================================================
// AGENT CLASSES
// =============================================================================

/**
 * Design Token Agent - core agent for reading, writing, resolving,
 * and validating DTCG design tokens.
 */
export class DesignTokenAgent {
  /** Path to the tokens directory. */
  tokensDir: string;

  /**
   * Create a new DesignTokenAgent.
   * @param tokensDir - Path to the tokens directory.
   */
  constructor(tokensDir: string);

  /** Reload all token files from disk. */
  loadAllTokens(): void;

  /** Count the total number of tokens loaded. */
  countTokens(): number;

  /**
   * Get a token by its dot-notation path.
   * @param path - Token path (e.g., "primitive.color.blue.500").
   * @param options - Resolution options.
   * @returns The resolved token, or null if not found.
   */
  getToken(path: string, options?: { resolve?: boolean }): ResolvedToken | null;

  /**
   * Get all tokens matching a path prefix.
   * @param prefix - Path prefix (e.g., "primitive.color").
   */
  getTokensByPrefix(prefix: string): ResolvedToken[];

  /**
   * Get all tokens of a specific DTCG type.
   * @param type - DTCG type (e.g., "color", "dimension").
   */
  getTokensByType(type: string): ResolvedToken[];

  /**
   * Resolve a token value, following references.
   * @param value - Raw value (may contain {references}).
   * @param visited - Set of visited paths for circular reference detection.
   */
  resolveValue(value: string, visited?: Set<string>): string;

  /**
   * Get the reference chain for a value.
   * @param value - Raw value string.
   * @param chain - Accumulator for recursive calls.
   */
  getReferenceChain(value: string, chain?: string[]): string[];

  /**
   * Set a token value (creates or updates).
   * @param path - Dot-notation path.
   * @param value - New value.
   * @param options - Optional type and description.
   * @returns True if successful.
   */
  setToken(path: string, value: string, options?: { type?: string; description?: string }): boolean;

  /**
   * Delete a token.
   * @param path - Dot-notation path.
   * @returns True if successfully deleted.
   */
  deleteToken(path: string): boolean;

  /** Validate all loaded tokens for structural correctness. */
  validate(): ValidationResult;

  /** Get all token paths as an array of dot-notation strings. */
  getAllTokenPaths(): string[];

  /** Generate CSS custom properties from all tokens. */
  toCSS(): string;

  /** Generate a flat JSON object of all resolved tokens. */
  toFlatJSON(): Record<string, FlatTokenEntry>;

  /**
   * Apply a fix request from the Orchestrator.
   * @param fix - Fix request object.
   */
  applyFix(fix: FixRequest): FixResult;

  /**
   * Handle a request from another agent or the orchestrator.
   * @param request - Agent request with action and parameters.
   */
  handleRequest(request: AgentRequest): AgentResponse;
}

/**
 * Accessibility Validator Agent - validates color contrast, semantic HTML,
 * ARIA usage, motion, and generates fix suggestions.
 */
export class AccessibilityValidatorAgent {
  /** Connected design token agent. */
  tokenAgent: DesignTokenAgent | null;
  /** Target WCAG level ('AA' or 'AAA'). */
  targetLevel: WCAGLevel;
  /** Current list of detected issues. */
  issues: A11yIssue[];

  /**
   * Create a new AccessibilityValidatorAgent.
   * @param options - Configuration options.
   */
  constructor(options?: { tokenAgent?: DesignTokenAgent; targetLevel?: WCAGLevel });

  /** Connect a Design Token Agent. */
  setTokenAgent(agent: DesignTokenAgent): void;

  /** Clear issues for a new validation run. */
  reset(): void;

  /**
   * Add a validation issue.
   * @param type - Issue category.
   * @param severity - Issue severity.
   * @param message - Issue description.
   * @param details - Additional context.
   */
  addIssue(type: string, severity: Severity, message: string, details?: Record<string, any>): void;

  /**
   * Check contrast ratio between two colors.
   * @param foreground - Foreground color string (hex, rgb, or token reference).
   * @param background - Background color string.
   * @param options - Check options.
   */
  checkContrast(foreground: string, background: string, options?: ContrastCheckOptions): ContrastResult;

  /** Validate all semantic color token pairs for contrast. */
  validateTokenContrast(): ContrastResult[];

  /**
   * Validate HTML/JSX for accessibility issues.
   * @param code - HTML or JSX code.
   * @param componentName - Name of component being validated.
   */
  validateHTML(code: string, componentName?: string): HTMLValidationResult;

  /**
   * Validate ARIA usage in code.
   * @param code - HTML/JSX code.
   */
  validateARIA(code: string): A11yIssue[];

  /**
   * Validate CSS for motion/animation accessibility.
   * @param css - CSS code.
   */
  validateMotion(css: string): A11yIssue[];

  /**
   * Run all validations on a component.
   * @param component - Component with name, html, and optional css.
   */
  validateComponent(component: { name: string; html: string; css?: string }): A11yReport;

  /**
   * Generate a validation report for the current issues.
   * @param componentName - Component name for the report.
   */
  generateReport(componentName?: string): A11yReport;

  /**
   * Generate fix requests for all current issues.
   */
  suggestFixes(): A11yFixSuggestions;

  /**
   * Generate a fix request for a specific issue.
   * @param issue - The accessibility issue.
   */
  suggestFixForIssue(issue: A11yIssue): FixRequest | null;

  /**
   * Handle a request from another agent or the orchestrator.
   * @param request - Agent request.
   */
  handleRequest(request: AgentRequest): AgentResponse;
}

/**
 * Motion Agent - generates animations, validates motion standards,
 * and applies motion fixes.
 */
export class MotionAgent {
  /** Connected design token agent. */
  tokenAgent: DesignTokenAgent | null;
  /** Current list of motion issues. */
  issues: MotionIssue[];

  /**
   * Create a new MotionAgent.
   * @param options - Configuration options.
   */
  constructor(options?: { tokenAgent?: DesignTokenAgent });

  /** Reset issues for a new validation run. */
  reset(): void;

  /**
   * Get the recommended duration for an animation type.
   * @param animationType - Animation type (e.g., "modal-open", "button-hover").
   * @param options - Device and exit options.
   */
  getDuration(animationType: string, options?: { device?: DeviceType; isExit?: boolean }): DurationResult;

  /**
   * Get duration by category name.
   * @param category - Duration category.
   * @param device - Target device.
   */
  getDurationByCategory(category: DurationCategory, device?: DeviceType): DurationByCategoryResult | null;

  /**
   * Get the recommended easing curve.
   * @param context - Easing context.
   */
  getEasing(context?: { direction?: AnimationDirection; mayReturn?: boolean }): EasingResult;

  /**
   * Generate a complete CSS transition value.
   * @param config - Transition configuration.
   */
  generateTransition(config: TransitionConfig): TransitionResult | TransitionError;

  /**
   * Generate CSS for a common animation preset.
   * @param preset - Preset name (e.g., "fade-in", "modal-enter").
   * @param options - Generation options.
   */
  generatePreset(preset: string, options?: { device?: DeviceType; essential?: boolean }): MotionPreset | { error: true; message: string };

  /**
   * Wrap CSS with prefers-reduced-motion support.
   * @param selector - CSS selector.
   * @param animationCSS - Animation CSS.
   * @param essential - Whether the animation is essential.
   */
  wrapWithReducedMotion(selector: string, animationCSS: string, essential?: boolean): string;

  /**
   * Check if an animation type is considered essential.
   * @param animationType - Animation type string.
   */
  isEssential(animationType: string): boolean;

  /**
   * Generate stagger delays for multiple elements.
   * @param count - Number of elements.
   * @param options - Stagger options.
   */
  generateStagger(count: number, options?: { baseDelay?: number; staggerDelay?: number; maxDelay?: number }): StaggerResult;

  /**
   * Validate CSS for motion standards compliance.
   * @param css - CSS code.
   */
  validate(css: string): MotionValidationResult;

  /**
   * Apply a fix request routed from the Orchestrator.
   * @param fix - Fix request.
   */
  applyFix(fix: FixRequest): FixResult;

  /** Generate CSS custom properties for motion tokens. */
  generateCSSVariables(): string;

  /**
   * Handle requests from the Orchestrator or other agents.
   * @param request - Agent request.
   */
  handleRequest(request: AgentRequest): AgentResponse;
}

/**
 * Component Generator Agent - creates accessible components from
 * templates or natural language descriptions.
 */
export class ComponentGeneratorAgent {
  /** Connected design token agent. */
  tokenAgent: DesignTokenAgent | null;
  /** Connected motion agent. */
  motionAgent: MotionAgent | null;
  /** Current issues list. */
  issues: any[];

  /**
   * Create a new ComponentGeneratorAgent.
   * @param options - Configuration options.
   */
  constructor(options?: { tokenAgent?: DesignTokenAgent; motionAgent?: MotionAgent });

  /** Reset issues. */
  reset(): void;

  /**
   * Generate a component from a template.
   * @param componentType - Type of component (e.g., "button", "modal").
   * @param props - Component properties.
   */
  generate(componentType: string, props?: Record<string, any>): ComponentGenerateResult | ComponentGenerateError;

  /**
   * Generate a component from a natural language description.
   * @param description - Natural language description.
   */
  generateFromDescription(description: string): ComponentGenerateResult | ComponentGenerateError;

  /**
   * Parse a natural language description into component type and props.
   * @param description - Natural language description.
   */
  parseDescription(description: string): ParsedDescription | ParsedDescriptionError;

  /** List all available component templates. */
  listComponents(): ComponentListing[];

  /**
   * Get detailed info about a component type.
   * @param componentType - Component type name.
   */
  getComponentInfo(componentType: string): ComponentInfo | null;

  /**
   * Apply a fix request routed from the Orchestrator.
   * @param fix - Fix request.
   */
  applyFix(fix: FixRequest): FixResult;

  /**
   * Handle requests from the Orchestrator or other agents.
   * @param request - Agent request.
   */
  handleRequest(request: AgentRequest): AgentResponse;
}

/**
 * Code Review Agent - the final quality gate that reviews generated
 * code against all design system rules.
 */
export class CodeReviewAgent {
  /** Agent name (from AGENTS constant). */
  name: string;
  /** Agent version. */
  version: string;
  /** Connected design token agent. */
  tokenAgent: DesignTokenAgent | null;
  /** Connected accessibility validator agent. */
  a11yAgent: AccessibilityValidatorAgent | null;
  /** Connected motion agent. */
  motionAgent: MotionAgent | null;
  /** Connected component generator agent. */
  componentAgent: ComponentGeneratorAgent | null;
  /** Whether strict mode is enabled. */
  strictMode: boolean;
  /** Active review categories. */
  categories: ReviewCategory[];
  /** Current issues. */
  issues: ReviewIssue[];
  /** Current positive findings. */
  suggestions: ReviewSuggestion[];

  /**
   * Create a new CodeReviewAgent.
   * @param options - Configuration options.
   */
  constructor(options?: {
    tokenAgent?: DesignTokenAgent;
    a11yAgent?: AccessibilityValidatorAgent;
    motionAgent?: MotionAgent;
    componentAgent?: ComponentGeneratorAgent;
    strictMode?: boolean;
    categories?: ReviewCategory[];
  });

  /**
   * Connect agents for delegated checks.
   * @param agents - Map of agent instances.
   */
  setAgents(agents: {
    token?: DesignTokenAgent;
    a11y?: AccessibilityValidatorAgent;
    motion?: MotionAgent;
    component?: ComponentGeneratorAgent;
  }): void;

  /** Reset review state. */
  reset(): void;

  /**
   * Perform a full code review.
   * @param code - Code to review.
   * @param options - Review options.
   */
  review(code: { html?: string; css?: string; component?: string }, options?: Record<string, any>): ReviewResult;

  /**
   * Quick check for blocking errors only.
   * @param code - Code to check.
   */
  quickCheck(code: { html?: string; css?: string }): QuickCheckResult;

  /**
   * Check a specific category only.
   * @param code - Code to check.
   * @param category - Category to check.
   */
  checkCategory(code: { html?: string; css?: string; component?: string }, category: ReviewCategory): CategoryCheckResult;

  /** Generate fix suggestions for current issues. */
  suggestFixes(): ReviewFixSuggestions;

  /**
   * Generate a human-readable report string.
   * @param result - Review result (uses current state if not provided).
   */
  generateReport(result?: ReviewResult): string;

  /**
   * Handle requests from the orchestrator.
   * @param request - Agent request.
   */
  handleRequest(request: AgentRequest): AgentResponse;
}

/**
 * Orchestrator Agent - coordinates all agents, routes fix requests,
 * and manages validation/fix/re-validation cycles.
 */
export class OrchestratorAgent {
  /**
   * Create a new OrchestratorAgent.
   */
  constructor();

  /**
   * Register an agent with the orchestrator.
   * @param id - Agent identifier (from AGENTS constant).
   * @param agent - Agent instance (must have handleRequest method).
   */
  registerAgent(id: string, agent: { handleRequest: (request: AgentRequest) => AgentResponse }): void;

  /**
   * Get a registered agent by ID.
   * @param id - Agent identifier.
   */
  getAgent(id: string): any;

  /**
   * Check if an agent is registered.
   * @param id - Agent identifier.
   */
  hasAgent(id: string): boolean;

  /**
   * Route a request to a specific agent.
   * @param agentId - Target agent identifier.
   * @param request - Agent request.
   */
  routeRequest(agentId: string, request: AgentRequest): AgentResponse;

  /**
   * Process a batch of fix requests.
   * @param fixes - Array of fix requests.
   * @param options - Processing options.
   */
  processFixes(fixes: FixRequest[], options?: ProcessFixesOptions): Promise<ProcessFixesResult>;

  /**
   * Run a full validation/suggest/fix/re-validate cycle.
   * @param options - Cycle options.
   */
  runFixCycle(options?: FixCycleOptions): Promise<FixCycleResult>;

  /**
   * Run validation across registered agents.
   * @param scope - Validation scope ('all', 'a11y', 'tokens').
   */
  runValidation(scope?: string): AgentResponse;

  /** Get suggested fixes from the accessibility agent. */
  getSuggestedFixes(): AgentResponse<A11yFixSuggestions>;

  /** Get system status. */
  getSystemStatus(): AgentResponse<SystemStatus>;

  /**
   * Handle requests from the interface layer.
   * @param request - Agent request.
   */
  handleRequest(request: AgentRequest): AgentResponse | Promise<any>;
}

/**
 * AI-Powered Component Generator - uses the Anthropic Claude API
 * to generate components from natural language descriptions.
 * Requires ANTHROPIC_API_KEY for AI-powered generation; falls back
 * to templates without it.
 */
export class AIComponentGenerator {
  /** Anthropic API key. */
  apiKey: string | null;
  /** Connected design token agent. */
  tokenAgent: DesignTokenAgent | null;
  /** Connected accessibility validator agent. */
  a11yAgent: AccessibilityValidatorAgent | null;
  /** Connected motion agent. */
  motionAgent: MotionAgent | null;

  /**
   * Create a new AIComponentGenerator.
   * @param options - Configuration options including API key and agent connections.
   */
  constructor(options?: AIComponentGeneratorOptions);

  /**
   * Set the Anthropic API key.
   * @param key - API key string.
   */
  setApiKey(key: string): void;

  /**
   * Generate a component from a natural language description.
   * Uses Claude API when available, falls back to templates.
   * @param description - Natural language component description.
   * @param options - Generation options.
   */
  generate(description: string, options?: { maxAttempts?: number }): Promise<AIGeneratedComponent>;

  /**
   * Generate a component using built-in templates (no API required).
   * @param description - Natural language description.
   */
  generateFromTemplate(description: string): AIGeneratedComponent;

  /**
   * Fix accessibility issues in a generated component using the Claude API.
   * @param html - Current HTML.
   * @param issues - Accessibility issues to fix.
   */
  fixComponent(html: string, issues: A11yIssue[]): Promise<AIFixResult>;

  /** Get the generator's capabilities based on current configuration. */
  getCapabilities(): AICapabilities;
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Create and connect all agents with an orchestrator.
 * @param tokensDir - Path to the tokens directory.
 * @returns An object containing all connected agent instances.
 */
export function createAgentSystem(tokensDir: string): {
  /** Design Token Agent instance. */
  token: DesignTokenAgent;
  /** Accessibility Validator Agent instance. */
  a11y: AccessibilityValidatorAgent;
  /** Motion Agent instance. */
  motion: MotionAgent;
  /** Component Generator Agent instance. */
  component: ComponentGeneratorAgent;
  /** Code Review Agent instance. */
  codeReview: CodeReviewAgent;
  /** Orchestrator Agent instance. */
  orchestrator: OrchestratorAgent;
};

/**
 * Create a standalone Design Token Agent.
 * @param tokensDir - Path to the tokens directory.
 */
export function createDesignTokenAgent(tokensDir: string): DesignTokenAgent;

/**
 * Create a standalone Accessibility Validator Agent.
 * @param options - Configuration options.
 */
export function createAccessibilityValidator(options?: {
  tokenAgent?: DesignTokenAgent;
  targetLevel?: WCAGLevel;
}): AccessibilityValidatorAgent;

/**
 * Create a standalone Motion Agent.
 * @param options - Configuration options.
 */
export function createMotionAgent(options?: { tokenAgent?: DesignTokenAgent }): MotionAgent;

/**
 * Create a standalone Component Generator Agent.
 * @param options - Configuration options.
 */
export function createComponentGenerator(options?: {
  tokenAgent?: DesignTokenAgent;
  motionAgent?: MotionAgent;
}): ComponentGeneratorAgent;

/**
 * Create a standalone Code Review Agent.
 * @param options - Configuration options.
 */
export function createCodeReviewAgent(options?: {
  tokenAgent?: DesignTokenAgent;
  a11yAgent?: AccessibilityValidatorAgent;
  motionAgent?: MotionAgent;
  componentAgent?: ComponentGeneratorAgent;
  strictMode?: boolean;
  categories?: ReviewCategory[];
}): CodeReviewAgent;

/**
 * Create an Orchestrator with agents pre-registered.
 * @param agents - Map of agent ID to agent instance.
 */
export function createOrchestrator(agents?: Record<string, { handleRequest: (request: AgentRequest) => AgentResponse }>): OrchestratorAgent;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate the WCAG contrast ratio between two color strings.
 * Supports hex (#RGB, #RRGGBB) and rgb()/rgba() formats.
 * @param color1 - First color string.
 * @param color2 - Second color string.
 * @returns Contrast ratio, or null if colors cannot be parsed.
 */
export function getContrastRatio(color1: string, color2: string): number | null;

/**
 * Parse a color string to RGB values.
 * Supports hex (#RGB, #RRGGBB) and rgb()/rgba() formats.
 * @param color - Color string.
 * @returns Parsed RGB object, or null if unparseable.
 */
export function parseColor(color: string): RGBColor | null;

/**
 * Create a standardized fix result.
 * @param params - Fix result parameters.
 */
export function createFixResult(params: {
  requestId: string;
  success: boolean;
  error?: string | null;
  changes?: Record<string, any> | null;
  needsValidation?: boolean;
}): FixResult;

/**
 * Group fix requests by their target agent.
 * @param fixes - Array of fix requests.
 * @returns Fixes grouped by target agent ID.
 */
export function groupFixesByAgent(fixes: FixRequest[]): Record<string, FixRequest[]>;

/**
 * Filter fixes that can be automatically applied.
 * @param fixes - Array of fix requests.
 * @returns Only auto-fixable fixes.
 */
export function getAutoFixable(fixes: FixRequest[]): FixRequest[];

/**
 * Filter fixes that require human review.
 * @param fixes - Array of fix requests.
 * @returns Only fixes needing human review.
 */
export function getNeedsReview(fixes: FixRequest[]): FixRequest[];

// =============================================================================
// CONSTANTS
// =============================================================================

/** Agent identifier constants. */
export const AGENTS: {
  readonly TOKEN: 'design-token';
  readonly A11Y: 'accessibility-validator';
  readonly MOTION: 'motion-animation';
  readonly COMPONENT: 'component-generator';
  readonly REVIEW: 'code-review';
  readonly ORCHESTRATOR: 'orchestrator';
  readonly HUMAN: 'human';
};

/** WCAG contrast ratio requirements by level and text type. */
export const WCAG_CONTRAST_RATIOS: WCAGContrastRatios;

/**
 * Duration standards by interaction category.
 * Keys: instant, micro, fast, normal, slow, complex.
 */
export const DURATION: Record<DurationCategory, DurationSpec>;

/** Standard easing curves (cubic-bezier values). */
export const EASING: {
  readonly default: string;
  readonly enter: string;
  readonly exit: string;
  readonly linear: string;
};

/**
 * Animation types mapped to their duration category.
 * Keys are animation names like "button-hover", "modal-open", etc.
 */
export const ANIMATION_TYPES: Record<string, DurationCategory>;

/** GPU-accelerated CSS properties that are safe to animate. */
export const ALLOWED_PROPERTIES: readonly string[];

/** Layout-triggering CSS properties that must not be animated. */
export const PROHIBITED_PROPERTIES: readonly string[];

/**
 * Component template definitions.
 * Keys are component type names (e.g., "button", "modal", "card").
 */
export const COMPONENT_TEMPLATES: Record<string, ComponentTemplateDefinition>;

/** Review category constants. */
export const REVIEW_CATEGORIES: {
  readonly TOKENS: 'tokens';
  readonly ACCESSIBILITY: 'accessibility';
  readonly MOTION: 'motion';
  readonly STRUCTURE: 'structure';
  readonly PATTERNS: 'patterns';
  readonly PERFORMANCE: 'performance';
};

/** Severity level constants. */
export const SEVERITY: {
  readonly ERROR: 'error';
  readonly WARNING: 'warning';
  readonly INFO: 'info';
};

/**
 * Agent status metadata for all registered agents.
 * Keys are agent identifiers (e.g., "design-token", "accessibility-validator").
 */
export const AGENT_STATUS: Record<string, AgentStatusEntry>;
