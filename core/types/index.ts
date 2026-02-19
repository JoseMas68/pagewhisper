/**
 * PageWhisper Core Engine - Type Definitions
 *
 * Browser-agnostic types for component extraction, cleaning, and conversion.
 * Compatible with both browser (Chrome Extension) and Node.js environments.
 */

// ============================================================================
// DOM Types (Browser-agnostic representation)
// ============================================================================

/**
 * Browser-agnostic representation of a DOM element.
 * In browser: Created from HTMLElement
 * In Node.js: Created from HTML parsers (cheerio, jsdom)
 */
export interface DOMElement {
  tagName: string
  id?: string
  className?: string
  attributes: Record<string, string>
  textContent?: string
  innerHTML?: string
  children: DOMElement[]
  styles: ComputedStyle
  boundingRect?: ElementRect
}

/**
 * Computed styles for an element
 */
export interface ComputedStyle {
  // Display & Layout
  display?: string
  position?: string
  float?: string
  clear?: string
  overflow?: string
  visibility?: string

  // Box Model
  width?: string
  height?: string
  margin?: string
  marginTop?: string
  marginRight?: string
  marginBottom?: string
  marginLeft?: string
  padding?: string
  paddingTop?: string
  paddingRight?: string
  paddingBottom?: string
  paddingLeft?: string
  border?: string
  borderWidth?: string
  borderColor?: string
  borderStyle?: string
  borderRadius?: string

  // Typography
  fontFamily?: string
  fontSize?: string
  fontWeight?: string
  fontStyle?: string
  lineHeight?: string
  letterSpacing?: string
  textAlign?: string
  textDecoration?: string
  textTransform?: string
  color?: string

  // Background
  backgroundColor?: string
  backgroundImage?: string
  backgroundSize?: string
  backgroundPosition?: string
  backgroundRepeat?: string

  // Flexbox
  flexDirection?: string
  flexWrap?: string
  justifyContent?: string
  alignItems?: string
  gap?: string

  // Grid
  gridTemplateColumns?: string
  gridTemplateRows?: string

  // Positioning
  top?: string
  right?: string
  bottom?: string
  left?: string
  zIndex?: string

  // Effects
  opacity?: string
  boxShadow?: string
  transform?: string
  transition?: string

  // Custom properties
  [key: string]: string | undefined
}

/**
 * Element bounding rectangle
 */
export interface ElementRect {
  x: number
  y: number
  width: number
  height: number
  top: number
  left: number
  bottom: number
  right: number
}

/**
 * CSS rule representation
 */
export interface CSSRule {
  selector: string
  properties: Record<string, string>
  specificity: number
  media?: string
}

/**
 * Extracted CSS from a component
 */
export interface ExtractedCSS {
  inline: string
  rules: CSSRule[]
  computedStyles: Record<string, ComputedStyle>
}

// ============================================================================
// Component Types
// ============================================================================

/**
 * Raw extracted component before cleaning
 */
export interface RawComponent {
  html: string
  css: ExtractedCSS
  scripts: string[]
  metadata: ComponentMetadata
}

/**
 * Cleaned component ready for AI processing
 */
export interface CleanedComponent {
  html: string
  css: string
  framework?: string
  libraries: string[]
  metadata: ComponentMetadata
  stats: CleaningStats
}

/**
 * Component metadata
 */
export interface ComponentMetadata {
  timestamp: number
  source: {
    url?: string
    title?: string
  }
  element: {
    selector: string
    tagName: string
    id?: string
    className?: string
  }
  dimensions: {
    width: number
    height: number
  }
  extraction: {
    depth: number
    elementCount: number
    styleCount: number
  }
}

/**
 * Cleaning statistics
 */
export interface CleaningStats {
  originalSize: {
    html: number
    css: number
    total: number
  }
  cleanedSize: {
    html: number
    css: number
    total: number
  }
  reduction: {
    html: number
    css: number
    total: number
    percentage: number
  }
}

// ============================================================================
// Framework Detection Types
// ============================================================================

/**
 * Detected framework information
 */
export interface FrameworkInfo {
  name: string
  version?: string
  confidence: number // 0-1
  indicators: string[]
  patterns: DetectionPattern[]
}

/**
 * Detection pattern that matched
 */
export interface DetectionPattern {
  type: 'global' | 'attribute' | 'class' | 'script' | 'meta' | 'style'
  pattern: string
  description: string
  confidence: number
}

/**
 * Complete detection result
 */
export interface DetectionResult {
  frameworks: FrameworkInfo[]
  cssFrameworks: FrameworkInfo[]
  libraries: string[]
  buildTools: string[]
  confidence: number // Overall confidence
}

/**
 * Document context for detection
 */
export interface DocumentContext {
  url?: string
  html: string
  scripts: ScriptInfo[]
  styles: StyleInfo[]
  metaTags: Record<string, string>
  globalVariables: string[]
}

/**
 * Script information
 */
export interface ScriptInfo {
  src?: string
  content?: string
  type: string
  async: boolean
  defer: boolean
}

/**
 * Style information
 */
export interface StyleInfo {
  href?: string
  content?: string
  media?: string
}

// ============================================================================
// AI & Prompt Types
// ============================================================================

/**
 * Prompt template definition
 */
export interface PromptTemplate {
  name: string
  version: string
  description: string
  systemPrompt: string
  userPromptTemplate: string
  variables: PromptVariable[]
  targetFrameworks: string[]
  createdAt: string
  deprecated?: boolean
  replacedBy?: string
}

/**
 * Prompt variable definition
 */
export interface PromptVariable {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  required: boolean
  description: string
  default?: any
}

/**
 * Rendered prompt ready for AI
 */
export interface RenderedPrompt {
  systemPrompt: string
  userPrompt: string
  templateVersion: string
  variables: Record<string, any>
  metadata: {
    templateName: string
    renderedAt: string
    targetFramework: string
  }
}

/**
 * Prompt rendering context
 */
export interface PromptContext {
  component: CleanedComponent
  detection: DetectionResult
  options: GenerationOptions
}

/**
 * Code generation options
 */
export interface GenerationOptions {
  targetFramework: string
  language?: 'typescript' | 'javascript'
  includeStyles?: boolean
  includeTests?: boolean
  includeTypes?: boolean
  accessibilityLevel?: 'basic' | 'aa' | 'aaa'
  optimizationLevel?: 'basic' | 'optimized' | 'advanced'
}

// ============================================================================
// Hash & Cache Types
// ============================================================================

/**
 * Hash configuration
 */
export interface HashConfig {
  algorithm: 'sha256' | 'sha1' | 'md5' | 'fnv1a'
  encoding: 'hex' | 'base64' | 'base64url'
  normalizeWhitespace?: boolean
  includeMetadata?: boolean
}

/**
 * Cache key generation result
 */
export interface CacheKey {
  key: string
  algorithm: string
  input: {
    componentHash: string
    contextHash: string
    optionsHash: string
  }
}

/**
 * Content hash result
 */
export interface ContentHash {
  html: string
  css: string
  combined: string
  algorithm: string
}

// ============================================================================
// Processing Types
// ============================================================================

/**
 * Extraction configuration
 */
export interface ExtractionConfig {
  includeInlineStyles: boolean
  includeComputedStyles: boolean
  includeDescendants: boolean
  maxDepth: number
  preserveClassNames: boolean
  preserveDataAttributes: boolean
  extractAncestors: boolean
  ancestorDepth: number
}

/**
 * Cleaning configuration
 */
export interface CleaningConfig {
  removeUnusedStyles: boolean
  minifyHTML: boolean
  minifyCSS: boolean
  prefixSelectors: boolean
  selectorPrefix: string
  normalizeProperties: boolean
  removeComments: boolean
  preserveImportant: boolean
  combineRules: boolean
}

/**
 * Detection configuration
 */
export interface DetectionConfig {
  enableHeuristics: boolean
  strictMode: boolean
  minConfidence: number
  detectLibraries: boolean
  detectBuildTools: boolean
}

/**
 * Core engine configuration
 */
export interface CoreConfig {
  extraction: ExtractionConfig
  cleaning: CleaningConfig
  detection: DetectionConfig
  prompts: {
    defaultTemplate: string
    customTemplatesDir?: string
  }
  hash: HashConfig
}

/**
 * Processing request
 */
export interface ProcessRequest {
  element: DOMElement | HTMLElement // HTMLElement for browser compatibility
  config?: Partial<CoreConfig>
  options?: GenerationOptions
}

/**
 * Processing result
 */
export interface ProcessResult {
  raw: RawComponent
  cleaned: CleanedComponent
  detected: DetectionResult
  prompt?: RenderedPrompt
  hash: ContentHash
  cacheKey: CacheKey
  metadata: {
    processingTime: number
    timestamp: number
    config: CoreConfig
  }
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Base error class for Core Engine
 */
export class CoreError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'CoreError'
  }
}

/**
 * Extraction error
 */
export class ExtractionError extends CoreError {
  constructor(message: string, details?: any) {
    super(message, 'EXTRACTION_ERROR', details)
    this.name = 'ExtractionError'
  }
}

/**
 * Cleaning error
 */
export class CleaningError extends CoreError {
  constructor(message: string, details?: any) {
    super(message, 'CLEANING_ERROR', details)
    this.name = 'CleaningError'
  }
}

/**
 * Detection error
 */
export class DetectionError extends CoreError {
  constructor(message: string, details?: any) {
    super(message, 'DETECTION_ERROR', details)
    this.name = 'DetectionError'
  }
}

/**
 * Prompt error
 */
export class PromptError extends CoreError {
  constructor(message: string, details?: any) {
    super(message, 'PROMPT_ERROR', details)
    this.name = 'PromptError'
  }
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Deep partial type for configuration
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object
    ? DeepPartial<T[P]>
    : T[P]
}

/**
 * Async result wrapper
 */
export type AsyncResult<T> = Promise<{
  success: boolean
  data?: T
  error?: CoreError
}>

/**
 * Processing progress callback
 */
export type ProgressCallback = (progress: {
  stage: 'extraction' | 'cleaning' | 'detection' | 'prompt' | 'complete'
  percent: number
  message: string
}) => void

// ============================================================================
// Export HTMLElement type for browser compatibility
// ============================================================================

// In browser environments, use the native HTMLElement interface
// In Node.js environments, this won't be available (use DOMElement instead)
declare global {
  interface HTMLElement {
    tagName: string
    id?: string
    className?: string
    getAttribute(name: string): string | null
    getBoundingClientRect(): DOMRect
    style: CSSStyleDeclaration
    children: HTMLCollection
    textContent: string | null
    innerHTML: string
    attributes: NamedNodeMap
  }
}

export type HTMLElement = typeof globalThis extends { HTMLElement: any }
  ? globalThis.HTMLElement
  : any
