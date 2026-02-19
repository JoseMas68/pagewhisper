# PageWhisper Core Engine - API Documentation

Version: 0.1.0 (Sprint 1 - Core Engine MVP)

## Table of Contents

- [Overview](#overview)
- [CoreEngine](#coreengine)
- [DOMExtractor](#domextractor)
- [DOMCleaner](#domcleaner)
- [FrameworkDetector](#frameworkdetector)
- [PromptBuilder](#promptbuilder)
- [HashGenerator](#hashgenerator)
- [Type Definitions](#type-definitions)
- [Examples](#examples)

---

## Overview

The PageWhisper Core Engine provides a complete pipeline for extracting, cleaning, and analyzing web components. It consists of 5 main modules that work together:

1. **DOMExtractor** - Extracts component HTML, CSS, and metadata from DOM elements
2. **DOMCleaner** - Cleans and optimizes HTML/CSS, removes unused styles
3. **FrameworkDetector** - Detects frameworks, libraries, and build tools
4. **PromptBuilder** - Builds AI prompts from component data
5. **HashGenerator** - Generates deterministic hashes for caching

The **CoreEngine** orchestrates all modules and provides a unified API.

---

## CoreEngine

The main orchestrator that coordinates all Core Engine modules.

### Constructor

```typescript
constructor(config?: Partial<CoreConfig>)
```

Creates a new CoreEngine instance with optional configuration.

**Parameters:**
- `config` - Optional partial configuration object

**Example:**
```typescript
import { CoreEngine } from '@pagewhisper/core'

// With default configuration
const engine = new CoreEngine()

// With custom configuration
const customEngine = new CoreEngine({
  extraction: { maxDepth: 20 },
  cleaning: { selectorPrefix: 'custom-' }
})
```

### Factory Methods

```typescript
// Create with default configuration
static create(): CoreEngine

// Create with custom configuration
static withConfig(config: Partial<CoreConfig>): CoreEngine

// Create optimized for speed
static createFast(): CoreEngine

// Create optimized for quality
static createQuality(): CoreEngine
```

### Main Methods

#### `process()`

Process an element through the complete pipeline.

```typescript
async process(
  request: ProcessRequest,
  onProgress?: ProgressCallback
): Promise<ProcessResult>
```

**Parameters:**
- `request.element` - The DOM element to process (HTMLElement or DOMElement)
- `request.options` - Optional generation options
- `onProgress` - Optional callback for progress updates

**Returns:** `ProcessResult` containing all pipeline outputs

**Example:**
```typescript
const result = await engine.process(
  {
    element: domElement,
    options: {
      targetFramework: 'react',
      language: 'typescript',
      includeStyles: true,
      includeTypes: true,
      includeTests: false
    }
  },
  (progress) => {
    console.log(`${progress.stage}: ${progress.percent}% - ${progress.message}`)
  }
)

console.log('Cleaned HTML:', result.cleaned.html)
console.log('Prompt:', result.prompt.userPrompt)
console.log('Cache Key:', result.cacheKey.key)
```

#### Fast Path Methods

```typescript
// Extract only (skip other stages)
async extractOnly(element: HTMLElement | DOMElement): Promise<RawComponent>

// Detect only (from HTML string)
async detectOnly(html: string): Promise<DetectionResult>

// Clean only (skip extraction and detection)
async cleanOnly(raw: RawComponent): Promise<CleanedComponent>

// Generate cache key only
async generateCacheKey(
  html: string,
  css: string,
  options: GenerationOptions
): Promise<string>
```

### Module Access

```typescript
// Get individual module instances
getExtractor(): DOMExtractor
getCleaner(): DOMCleaner
getDetector(): FrameworkDetector
getPromptBuilder(): PromptBuilder
getHashGenerator(): HashGenerator
```

### Configuration

```typescript
// Update configuration after creation
updateConfig(config: Partial<CoreConfig>): void

// Get current configuration
getConfig(): CoreConfig

// Reset to defaults
resetConfig(): void
```

---

## DOMExtractor

Extracts component HTML, CSS, and metadata from DOM elements.

### Constructor

```typescript
constructor(config?: Partial<ExtractionConfig>)
```

### Configuration

```typescript
interface ExtractionConfig {
  includeInlineStyles?: boolean      // Include inline styles (default: true)
  includeComputedStyles?: boolean    // Include computed styles (default: true)
  includeDescendants?: boolean       // Include child elements (default: true)
  maxDepth?: number                  // Max extraction depth (default: 10)
  preserveClassNames?: boolean       // Keep original class names (default: true)
  preserveDataAttributes?: boolean   // Keep data-* attributes (default: true)
  extractAncestors?: boolean         // Include parent elements (default: false)
  ancestorDepth?: number             // How many ancestors to include (default: 3)
}
```

### Main Method

```typescript
extract(element: DOMElement, context?: ExtractionContext): RawComponent
```

**Parameters:**
- `element` - The DOM element to extract
- `context` - Optional context (url, title, etc.)

**Returns:** `RawComponent` with HTML, CSS, and metadata

**Example:**
```typescript
const extractor = new DOMExtractor({ maxDepth: 5 })

const component = extractor.extract(domElement, {
  url: 'https://example.com',
  title: 'Example Page'
})

console.log('HTML:', component.html)
console.log('CSS:', component.css.inline)
console.log('Metadata:', component.metadata)
```

### Configuration Methods

```typescript
updateConfig(config: Partial<ExtractionConfig>): void
getConfig(): ExtractionConfig
```

---

## DOMCleaner

Cleans and optimizes HTML and CSS, removes unused styles.

### Constructor

```typescript
constructor(config?: Partial<CleaningConfig>)
```

### Configuration

```typescript
interface CleaningConfig {
  removeUnusedStyles?: boolean    // Remove unused CSS rules (default: true)
  minifyHTML?: boolean            // Minify HTML output (default: false)
  minifyCSS?: boolean             // Minify CSS output (default: false)
  prefixSelectors?: boolean       // Prefix CSS selectors (default: true)
  selectorPrefix?: string         // Prefix string (default: 'pw-')
  normalizeProperties?: boolean   // Normalize CSS properties (default: true)
  removeComments?: boolean        // Remove HTML/CSS comments (default: true)
  preserveImportant?: boolean     // Keep !important rules (default: true)
  combineRules?: boolean          // Combine CSS rules (default: true)
}
```

### Main Method

```typescript
clean(component: RawComponent): CleanedComponent
```

**Parameters:**
- `component` - Raw component from extractor

**Returns:** `CleanedComponent` with cleaned HTML/CSS and statistics

**Example:**
```typescript
const cleaner = new DOMCleaner({
  removeUnusedStyles: true,
  prefixSelectors: true,
  selectorPrefix: 'myapp-'
})

const cleaned = cleaner.clean(rawComponent)

console.log('Cleaned HTML:', cleaned.html)
console.log('Cleaned CSS:', cleaned.css)
console.log('Statistics:', cleaned.stats)
console.log('Size reduction:', cleaned.stats.reduction.percentage, '%')
```

### Configuration Methods

```typescript
updateConfig(config: Partial<CleaningConfig>): void
getConfig(): CleaningConfig
```

---

## FrameworkDetector

Detects frameworks, libraries, CSS frameworks, and build tools.

### Constructor

```typescript
constructor(config?: Partial<DetectionConfig>)
```

### Configuration

```typescript
interface DetectionConfig {
  enableHeuristics?: boolean    // Use heuristic detection (default: true)
  strictMode?: boolean          // Only high confidence detections (default: false)
  minConfidence?: number        // Minimum confidence threshold (default: 0.5)
  detectLibraries?: boolean     // Detect libraries (default: true)
  detectBuildTools?: boolean    // Detect build tools (default: true)
}
```

### Main Methods

```typescript
detect(context: DocumentContext): DetectionResult
```

**Parameters:**
- `context` - Document context with HTML, scripts, styles, etc.

**Returns:** `DetectionResult` with detected frameworks, libraries, and tools

**Example:**
```typescript
const detector = new FrameworkDetector({ minConfidence: 0.7 })

const result = detector.detect({
  html: '<div class="react-component">Content</div>',
  scripts: [{ src: 'https://cdn.react.js', content: '', type: 'text/javascript', async: false, defer: false }],
  styles: [],
  metaTags: {},
  globalVariables: ['React', 'ReactDOM']
})

console.log('Frameworks:', result.frameworks)
console.log('Libraries:', result.libraries)
console.log('Build Tools:', result.buildTools)
```

### Static Factory Methods

```typescript
// Create context from HTML string
static createContextFromHTML(html: string): DocumentContext

// Create context from browser DOM
static createContextFromBrowser(): DocumentContext
```

### Configuration Methods

```typescript
updateConfig(config: Partial<DetectionConfig>): void
getConfig(): DetectionConfig
```

---

## PromptBuilder

Builds AI prompts from component data using templates.

### Constructor

```typescript
constructor(defaultTemplate?: string)
```

**Parameters:**
- `defaultTemplate` - Template version to use (default: 'v2')

### Main Method

```typescript
build(context: PromptContext): RenderedPrompt
```

**Parameters:**
- `context.component` - Cleaned component data
- `context.detection` - Framework detection results
- `context.options` - Generation options

**Returns:** `RenderedPrompt` with system and user prompts

**Example:**
```typescript
const builder = new PromptBuilder('v2')

const prompt = builder.build({
  component: cleanedComponent,
  detection: detectionResult,
  options: {
    targetFramework: 'react',
    language: 'typescript',
    includeStyles: true,
    includeTypes: true,
    includeTests: false,
    accessibilityLevel: 'aa',
    optimizationLevel: 'high'
  }
})

console.log('System Prompt:', prompt.systemPrompt)
console.log('User Prompt:', prompt.userPrompt)
console.log('Template Version:', prompt.templateVersion)
```

### Template Management

```typescript
// Get template by name/version
getTemplate(name: string): PromptTemplate | undefined

// Get all templates
getAllTemplates(): PromptTemplate[]

// Get only active (non-deprecated) templates
getActiveTemplates(): PromptTemplate[]

// Register custom template
registerTemplate(template: PromptTemplate): void

// Unregister template
unregisterTemplate(version: string): boolean

// Set default template
setDefaultTemplate(version: string): void

// Get default template
getDefaultTemplate(): string

// Validate template
validateTemplate(template: PromptTemplate): { valid: boolean; errors: string[] }
```

---

## HashGenerator

Generates deterministic content hashes for caching.

### Constructor

```typescript
constructor(config?: Partial<HashConfig>)
```

### Configuration

```typescript
interface HashConfig {
  algorithm?: 'sha256' | 'sha1' | 'md5' | 'fnv1a'  // Hash algorithm (default: 'sha256')
  encoding?: 'hex' | 'base64' | 'base64url'       // Output encoding (default: 'hex')
  normalizeWhitespace?: boolean                    // Normalize whitespace (default: true)
  includeMetadata?: boolean                        // Include metadata in hash (default: true)
}
```

### Main Methods

```typescript
// Hash a string
async hash(input: string): Promise<string>

// Hash component content
async hashContent(component: CleanedComponent): Promise<ContentHash>

// Generate cache key for AI request
async generateCacheKey(
  component: CleanedComponent,
  detection: DetectionResult,
  options: GenerationOptions
): Promise<CacheKey>
```

**Examples:**

```typescript
const generator = new HashGenerator({ algorithm: 'fnv1a' })

// Simple hash
const hash = await generator.hash('Hello, World!')
console.log('Hash:', hash)

// Content hash
const contentHash = await generator.hashContent(cleanedComponent)
console.log('HTML Hash:', contentHash.html)
console.log('CSS Hash:', contentHash.css)
console.log('Combined Hash:', contentHash.combined)

// Cache key
const cacheKey = await generator.generateCacheKey(
  cleanedComponent,
  detectionResult,
  { targetFramework: 'react', language: 'typescript', includeStyles: true }
)
console.log('Cache Key:', cacheKey.key)
```

### Static Methods

```typescript
// Quick hash helper
static async quickHash(input: string, algorithm?: 'sha256' | 'fnv1a'): Promise<string>

// Generate unique ID
static generateId(): string
```

### Configuration Methods

```typescript
updateConfig(config: Partial<HashConfig>): void
getConfig(): HashConfig
```

---

## Type Definitions

### ProcessRequest

```typescript
interface ProcessRequest {
  element: HTMLElement | DOMElement
  options?: GenerationOptions
}
```

### ProcessResult

```typescript
interface ProcessResult {
  raw: RawComponent           // Raw extracted component
  cleaned: CleanedComponent    // Cleaned component
  detected: DetectionResult    // Framework detection
  prompt: RenderedPrompt       // AI prompt
  hash: ContentHash            // Content hashes
  cacheKey: CacheKey           // Cache key
  metadata: {
    processingTime: number     // Processing time in ms
    timestamp: number          // Completion timestamp
    config: CoreConfig         // Configuration used
  }
}
```

### GenerationOptions

```typescript
interface GenerationOptions {
  targetFramework: string                // Target framework (react, vue, angular, etc.)
  language?: 'typescript' | 'javascript' // Language (default: 'typescript')
  includeStyles?: boolean                // Include styles (default: true)
  includeTests?: boolean                 // Include tests (default: false)
  includeTypes?: boolean                 // Include types (default: true)
  accessibilityLevel?: 'a' | 'aa' | 'aaa' // Accessibility level (optional)
  optimizationLevel?: string             // Optimization level (optional)
}
```

### ProgressCallback

```typescript
type ProgressCallback = (progress: {
  stage: 'extraction' | 'detection' | 'cleaning' | 'prompt' | 'complete'
  percent: number    // 0-100
  message?: string   // Human-readable message
}) => void
```

### CoreConfig

```typescript
interface CoreConfig {
  extraction: ExtractionConfig
  cleaning: CleaningConfig
  detection: DetectionConfig
  prompts: {
    defaultTemplate: string
  }
  hash: HashConfig
}
```

---

## Examples

### Basic Usage

```typescript
import { CoreEngine } from '@pagewhisper/core'

// Create engine
const engine = CoreEngine.create()

// Process an element
const result = await engine.process({
  element: document.querySelector('.my-component'),
  options: {
    targetFramework: 'react',
    language: 'typescript'
  }
})

// Use results
console.log('Cleaned HTML:', result.cleaned.html)
console.log('AI Prompt:', result.prompt.userPrompt)
console.log('Cache Key:', result.cacheKey.key)
```

### With Progress Tracking

```typescript
const result = await engine.process(
  { element: domElement },
  (progress) => {
    console.log(`${progress.stage}: ${progress.percent}%`)
    if (progress.message) {
      console.log(`  ${progress.message}`)
    }
  }
)
```

### Custom Configuration

```typescript
const engine = CoreEngine.withConfig({
  extraction: {
    maxDepth: 20,
    includeComputedStyles: true
  },
  cleaning: {
    removeUnusedStyles: true,
    selectorPrefix: 'myapp-'
  },
  detection: {
    minConfidence: 0.7,
    enableHeuristics: true
  }
})
```

### Fast Processing

```typescript
const fastEngine = CoreEngine.createFast()
const result = await fastEngine.process({ element: domElement })
```

### Quality Processing

```typescript
const qualityEngine = CoreEngine.createQuality()
const result = await qualityEngine.process({ element: domElement })
```

### Module-Specific Usage

```typescript
// Extract only
const extractor = engine.getExtractor()
const raw = extractor.extract(domElement)

// Detect only
const detector = engine.getDetector()
const detected = detector.detect(context)

// Clean only
const cleaner = engine.getCleaner()
const cleaned = cleaner.clean(raw)

// Build prompt only
const promptBuilder = engine.getPromptBuilder()
const prompt = promptBuilder.build({ component, detection, options })

// Generate hash only
const hashGen = engine.getHashGenerator()
const hash = await hashGen.hashContent(component)
```

### Cache Key Generation

```typescript
// Generate cache key for existing data
const cacheKey = await engine.generateCacheKey(
  '<button>Click</button>',
  '.btn { padding: 10px; }',
  {
    targetFramework: 'vue',
    language: 'typescript'
  }
)

console.log('Cache Key:', cacheKey)
```

---

## Performance Guidelines

### Expected Performance

- **Simple component processing**: < 100ms
- **Extraction**: < 10ms per element
- **Cleaning**: < 10ms per component
- **Detection**: < 20ms per document
- **Hash generation**: < 1ms (FNV-1a), < 10ms (SHA-256)
- **Prompt building**: < 20ms per prompt

### Optimization Tips

1. **Use fast engine** for quick iterations:
   ```typescript
   const fastEngine = CoreEngine.createFast()
   ```

2. **Use fast path methods** when you don't need full pipeline:
   ```typescript
   const raw = await engine.extractOnly(element)
   const detected = await engine.detectOnly(html)
   ```

3. **Cache results** using hash keys:
   ```typescript
   const cacheKey = result.cacheKey.key
   // Store result in cache with cacheKey
   ```

4. **Adjust configuration** for your use case:
   - Reduce `maxDepth` for shallow extraction
   - Disable `includeComputedStyles` for faster extraction
   - Use `fnv1a` algorithm for faster hashing
   - Disable `removeUnusedStyles` for faster cleaning

---

## Error Handling

All methods may throw errors. Always wrap in try-catch:

```typescript
try {
  const result = await engine.process({ element: domElement })
} catch (error) {
  console.error('Processing failed:', error)
  // Handle error
}
```

Common error scenarios:
- Invalid element structure
- Missing required options
- Unsupported hash algorithm
- Template validation errors

---

## Browser Compatibility

All Core Engine modules work in:
- Chrome/Edge (Chromium)
- Firefox
- Safari
- Any modern ES6+ JavaScript environment

No Node.js-specific dependencies are used.

---

## Version History

### v0.1.0 (Sprint 1 - Current)
- Initial Core Engine release
- DOMExtractor, DOMCleaner, FrameworkDetector, PromptBuilder, HashGenerator
- CoreEngine orchestrator with full pipeline
- Comprehensive test coverage (80%+)
- Performance benchmarks
- Complete API documentation

---

## Support

For issues, questions, or contributions, please refer to the project repository.
