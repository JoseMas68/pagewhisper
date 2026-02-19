/**
 * PageWhisper Core Engine
 *
 * Browser-agnostic core for component extraction, cleaning, and conversion.
 * Compatible with both browser (Chrome Extension) and Node.js environments.
 *
 * @module CoreEngine
 */

// Main orchestrator
export { CoreEngine } from './CoreEngine'

// Individual modules
export { DOMExtractor } from './extractor/Extractor'
export { DOMCleaner } from './cleaner/Cleaner'
export { FrameworkDetector } from './detector/FrameworkDetector'
export { PromptBuilder } from './prompts/PromptBuilder'
export { HashGenerator } from './utils/HashGenerator'

// Types
export type {
  // Main types
  ProcessRequest,
  ProcessResult,
  CoreConfig,
  ProgressCallback,

  // DOM types
  DOMElement,
  ComputedStyle,
  ElementRect,
  CSSRule,
  ExtractedCSS,
  HTMLElement,

  // Component types
  RawComponent,
  CleanedComponent,
  ComponentMetadata,
  CleaningStats,

  // Detection types
  FrameworkInfo,
  DetectionPattern,
  DetectionResult,
  DocumentContext,
  ScriptInfo,
  StyleInfo,

  // AI & Prompt types
  PromptTemplate,
  PromptVariable,
  RenderedPrompt,
  PromptContext,
  GenerationOptions,

  // Hash & Cache types
  HashConfig,
  CacheKey,
  ContentHash,

  // Configuration types
  ExtractionConfig,
  CleaningConfig,
  DetectionConfig,

  // Error types
  CoreError,
  ExtractionError,
  CleaningError,
  DetectionError,
  PromptError,

  // Utilities
  DeepPartial,
  AsyncResult
} from './types'

// Default export
export { CoreEngine as default } from './CoreEngine'
