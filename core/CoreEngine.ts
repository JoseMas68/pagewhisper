/**
 * PageWhisper Core Engine - Orchestrator
 *
 * Responsibilities:
 * - Coordinate all core modules (Extractor, Cleaner, Detector, etc.)
 * - Manage the complete processing pipeline
 * - Provide unified API for component processing
 * - Handle errors and provide detailed feedback
 * - Support progress tracking for long operations
 *
 * Browser Compatibility:
 * - Works in any JavaScript environment
 * - No platform-specific dependencies
 * - Ready for browser (Chrome Extension) and Node.js
 */

import type {
  ProcessRequest,
  ProcessResult,
  CoreConfig,
  ProgressCallback,
  HTMLElement,
  DOMElement,
  ProcessError
} from './types'

import { DOMExtractor } from './extractor/Extractor'
import { DOMCleaner } from './cleaner/Cleaner'
import { FrameworkDetector, DocumentContext } from './detector/FrameworkDetector'
import { PromptBuilder, PromptContext } from './prompts/PromptBuilder'
import { HashGenerator } from './utils/HashGenerator'

// Default configuration
const DEFAULT_CONFIG: CoreConfig = {
  extraction: {
    includeInlineStyles: true,
    includeComputedStyles: true,
    includeDescendants: true,
    maxDepth: 10,
    preserveClassNames: true,
    preserveDataAttributes: true,
    extractAncestors: false,
    ancestorDepth: 3
  },
  cleaning: {
    removeUnusedStyles: true,
    minifyHTML: false,
    minifyCSS: false,
    prefixSelectors: true,
    selectorPrefix: 'pw-',
    normalizeProperties: true,
    removeComments: true,
    preserveImportant: true,
    combineRules: true
  },
  detection: {
    enableHeuristics: true,
    strictMode: false,
    minConfidence: 0.5,
    detectLibraries: true,
    detectBuildTools: true
  },
  prompts: {
    defaultTemplate: 'v2'
  },
  hash: {
    algorithm: 'sha256',
    encoding: 'hex',
    normalizeWhitespace: true,
    includeMetadata: true
  }
}

/**
 * Core Engine - Main orchestrator
 */
export class CoreEngine {
  private config: CoreConfig
  private extractor: DOMExtractor
  private cleaner: DOMCleaner
  private detector: FrameworkDetector
  private promptBuilder: PromptBuilder
  private hashGenerator: HashGenerator

  constructor(config: Partial<CoreConfig> = {}) {
    this.config = this.mergeConfig(DEFAULT_CONFIG, config)

    // Initialize modules
    this.extractor = new DOMExtractor(this.config.extraction)
    this.cleaner = new DOMCleaner(this.config.cleaning)
    this.detector = new FrameworkDetector(this.config.detection)
    this.promptBuilder = new PromptBuilder(this.config.prompts.defaultTemplate)
    this.hashGenerator = new HashGenerator(this.config.hash)
  }

  /**
   * Main processing method - Complete pipeline
   */
  async process(
    request: ProcessRequest,
    onProgress?: ProgressCallback
  ): Promise<ProcessResult> {
    const startTime = Date.now()

    try {
      // Step 1: Extraction
      onProgress?.({ stage: 'extraction', percent: 10, message: 'Extracting component...' })
      const raw = this.extract(request.element, request)

      // Step 2: Detection
      onProgress?.({ stage: 'detection', percent: 30, message: 'Detecting frameworks...' })
      const detected = await this.detect(raw)

      // Step 3: Cleaning
      onProgress?.({ stage: 'cleaning', percent: 50, message: 'Cleaning HTML and CSS...' })
      const cleaned = this.clean(raw, detected)

      // Step 4: Hash generation
      onProgress?.({ stage: 'prompt', percent: 70, message: 'Generating hashes...' })
      const hash = await this.hashGenerator.hashContent(cleaned)

      // Step 5: Prompt building
      onProgress?.({ stage: 'prompt', percent: 85, message: 'Building prompts...' })
      const prompt = this.buildPrompt(cleaned, detected, request.options)

      // Step 6: Cache key generation
      onProgress?.({ stage: 'prompt', percent: 95, message: 'Generating cache key...' })
      const cacheKey = await this.hashGenerator.generateCacheKey(
        cleaned,
        detected,
        request.options || this.getDefaultOptions()
      )

      onProgress?.({ stage: 'complete', percent: 100, message: 'Processing complete!' })

      return {
        raw,
        cleaned,
        detected,
        prompt,
        hash,
        cacheKey,
        metadata: {
          processingTime: Date.now() - startTime,
          timestamp: Date.now(),
          config: this.config
        }
      }
    } catch (error) {
      throw this.enrichError(error, 'CoreEngine.process')
    }
  }

  /**
   * Extract component from element
   */
  private extract(element: HTMLElement | DOMElement, request: ProcessRequest) {
    const context = {
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      title: typeof document !== 'undefined' ? document.title : undefined
    }

    return this.extractor.extract(element, context)
  }

  /**
   * Detect frameworks from raw component
   */
  private async detect(raw: any) {
    // Create document context from raw component
    const context: DocumentContext = {
      url: raw.metadata.source.url,
      html: raw.html,
      scripts: raw.scripts.map((script: string) => ({
        content: script,
        type: 'text/javascript',
        async: false,
        defer: false
      })),
      styles: [{
        content: raw.css.inline,
      }],
      metaTags: {},
      globalVariables: typeof window !== 'undefined'
        ? Object.keys(window).filter(k => /^(React|Vue|Angular)/.test(k))
        : []
    }

    return this.detector.detect(context)
  }

  /**
   * Clean raw component
   */
  private clean(raw: any, detected: any) {
    const cleaned = this.cleaner.clean(raw)

    // Add detected framework info
    if (detected.frameworks.length > 0) {
      cleaned.framework = detected.frameworks[0].name
    }

    return cleaned
  }

  /**
   * Build AI prompt
   */
  private buildPrompt(
    cleaned: any,
    detected: any,
    options: any
  ) {
    const context: PromptContext = {
      component: cleaned,
      detection: detected,
      options: options || this.getDefaultOptions()
    }

    return this.promptBuilder.build(context)
  }

  /**
   * Get default generation options
   */
  private getDefaultOptions() {
    return {
      targetFramework: 'react',
      language: 'typescript' as const,
      includeStyles: true,
      includeTests: false,
      includeTypes: true,
      accessibilityLevel: 'aa' as const,
      optimizationLevel: 'basic' as const
    }
  }

  /**
   * Merge configurations recursively
   */
  private mergeConfig(base: CoreConfig, partial: Partial<CoreConfig> = {}): CoreConfig {
    return {
      extraction: { ...base.extraction, ...partial.extraction },
      cleaning: { ...base.cleaning, ...partial.cleaning },
      detection: { ...base.detection, ...partial.detection },
      prompts: { ...base.prompts, ...partial.prompts },
      hash: { ...base.hash, ...partial.hash }
    }
  }

  /**
   * Enrich error with context
   */
  private enrichError(error: unknown, context: string): ProcessError {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
        context,
        timestamp: Date.now()
      }
    }

    return {
      name: 'UnknownError',
      message: String(error),
      context,
      timestamp: Date.now()
    }
  }

  // ==========================================================================
  // Public API - Individual Module Access
  // ==========================================================================

  /**
   * Get extractor instance
   */
  getExtractor(): DOMExtractor {
    return this.extractor
  }

  /**
   * Get cleaner instance
   */
  getCleaner(): DOMCleaner {
    return this.cleaner
  }

  /**
   * Get detector instance
   */
  getDetector(): FrameworkDetector {
    return this.detector
  }

  /**
   * Get prompt builder instance
   */
  getPromptBuilder(): PromptBuilder {
    return this.promptBuilder
  }

  /**
   * Get hash generator instance
   */
  getHashGenerator(): HashGenerator {
    return this.hashGenerator
  }

  // ==========================================================================
  // Public API - Configuration
  // ==========================================================================

  /**
   * Update configuration
   */
  updateConfig(config: Partial<CoreConfig>): void {
    this.config = this.mergeConfig(this.config, config)

    // Update individual modules
    this.extractor.updateConfig(this.config.extraction)
    this.cleaner.updateConfig(this.config.cleaning)
    this.detector.updateConfig(this.config.detection)
    this.hashGenerator.updateConfig(this.config.hash)

    if (config.prompts?.defaultTemplate) {
      this.promptBuilder.setDefaultTemplate(config.prompts.defaultTemplate)
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): CoreConfig {
    return { ...this.config }
  }

  /**
   * Reset configuration to defaults
   */
  resetConfig(): void {
    this.config = { ...DEFAULT_CONFIG }
    this.updateConfig({})
  }

  // ==========================================================================
  // Public API - Utility Methods
  // ==========================================================================

  /**
   * Process only extraction (fast path)
   */
  async extractOnly(element: HTMLElement | DOMElement): Promise<any> {
    return this.extract(element, {})
  }

  /**
   * Process only detection (fast path)
   */
  async detectOnly(html: string): Promise<any> {
    const context = FrameworkDetector.createContextFromHTML(html)
    return this.detector.detect(context)
  }

  /**
   * Process only cleaning (fast path)
   */
  async cleanOnly(raw: any): Promise<any> {
    return this.cleaner.clean(raw)
  }

  /**
   * Generate cache key without full processing
   */
  async generateCacheKey(
    html: string,
    css: string,
    options: any
  ): Promise<string> {
    const component = {
      html,
      css,
      libraries: [],
      metadata: {
        timestamp: Date.now(),
        source: {},
        element: { selector: '', tagName: 'div' },
        dimensions: { width: 0, height: 0 },
        extraction: { depth: 1, elementCount: 1, styleCount: 0 }
      }
    }

    const detection = {
      frameworks: [],
      cssFrameworks: [],
      libraries: [],
      buildTools: [],
      confidence: 0
    }

    const cacheKey = await this.hashGenerator.generateCacheKey(
      component,
      detection,
      options
    )

    return cacheKey.key
  }

  // ==========================================================================
  // Static Factory Methods
  // ==========================================================================

  /**
   * Create engine with default configuration
   */
  static create(): CoreEngine {
    return new CoreEngine()
  }

  /**
   * Create engine with custom configuration
   */
  static withConfig(config: Partial<CoreConfig>): CoreEngine {
    return new CoreEngine(config)
  }

  /**
   * Create engine optimized for speed (less cleaning, basic detection)
   */
  static createFast(): CoreEngine {
    return new CoreEngine({
      cleaning: {
        removeUnusedStyles: false,
        minifyHTML: true,
        minifyCSS: true,
        prefixSelectors: false,
        selectorPrefix: '',
        normalizeProperties: false,
        removeComments: true,
        preserveImportant: false,
        combineRules: false
      },
      detection: {
        enableHeuristics: false,
        strictMode: false,
        minConfidence: 0.7,
        detectLibraries: false,
        detectBuildTools: false
      },
      hash: {
        algorithm: 'fnv1a',
        encoding: 'hex',
        normalizeWhitespace: false,
        includeMetadata: false
      }
    })
  }

  /**
   * Create engine optimized for quality (thorough cleaning, deep detection)
   */
  static createQuality(): CoreEngine {
    return new CoreEngine({
      extraction: {
        includeInlineStyles: true,
        includeComputedStyles: true,
        includeDescendants: true,
        maxDepth: 20,
        preserveClassNames: true,
        preserveDataAttributes: true,
        extractAncestors: true,
        ancestorDepth: 5
      },
      cleaning: {
        removeUnusedStyles: true,
        minifyHTML: false,
        minifyCSS: false,
        prefixSelectors: true,
        selectorPrefix: 'pw-',
        normalizeProperties: true,
        removeComments: true,
        preserveImportant: true,
        combineRules: true
      },
      detection: {
        enableHeuristics: true,
        strictMode: false,
        minConfidence: 0.3,
        detectLibraries: true,
        detectBuildTools: true
      }
    })
  }
}

// ============================================================================
// Export
// ============================================================================

export default CoreEngine

// Re-export types for convenience
export type {
  ProcessRequest,
  ProcessResult,
  CoreConfig,
  ProgressCallback,
  HTMLElement,
  DOMElement
}
