# PageWhisper Core Engine

Browser-agnostic core for component extraction, cleaning, and conversion using AI.

## 📋 Overview

The Core Engine is a framework-agnostic JavaScript/TypeScript library that can:

- **Extract** DOM components with complete context
- **Clean** and optimize HTML/CSS
- **Detect** frameworks and libraries
- **Build** AI prompts for code conversion
- **Generate** deterministic cache keys

## 🎯 Key Features

- ✅ **Browser-agnostic**: Works in Chrome Extensions, Node.js, and browsers
- ✅ **TypeScript-first**: Full type safety with strict mode
- ✅ **Modular architecture**: Each module is independent and reusable
- ✅ **Zero dependencies**: Pure TypeScript implementation
- ✅ **Deterministic hashing**: Consistent cache keys across environments
- ✅ **Framework detection**: Supports 10+ frameworks and CSS libraries
- ✅ **Prompt versioning**: Built-in template system for AI prompts

## 📦 Modules

### 1. **DOMExtractor** (`extractor/Extractor.ts`)

Extracts DOM elements with their complete context.

**Responsibilities:**
- Extract HTML with descendants
- Capture computed and inline styles
- Identify CSS rules
- Preserve semantic information
- Browser-agnostic element representation

**Usage:**
```typescript
import { DOMExtractor } from '@pagewhisper/core'

const extractor = new DOMExtractor({
  includeDescendants: true,
  maxDepth: 10,
  preserveClassNames: true
})

const component = extractor.extract(element, {
  url: 'https://example.com',
  title: 'Example Page'
})
```

---

### 2. **DOMCleaner** (`cleaner/Cleaner.ts`)

Optimizes and normalizes HTML and CSS.

**Responsibilities:**
- Remove unused CSS rules
- Prefix selectors to prevent collisions
- Minify HTML/CSS (optional)
- Normalize properties
- Calculate cleaning statistics

**Usage:**
```typescript
import { DOMCleaner } from '@pagewhisper/core'

const cleaner = new DOMCleaner({
  prefixSelectors: true,
  selectorPrefix: 'pw-',
  removeUnusedStyles: true
})

const cleaned = cleaner.clean(rawComponent)
console.log(`Reduced size by ${cleaned.stats.reduction.percentage}%`)
```

---

### 3. **FrameworkDetector** (`detector/FrameworkDetector.ts`)

Detects JavaScript frameworks, CSS frameworks, and build tools.

**Responsibilities:**
- Detect 10+ JavaScript frameworks (React, Vue, Angular, etc.)
- Detect CSS frameworks (Bootstrap, Tailwind, Material-UI, etc.)
- Identify build tools (Webpack, Vite, Parcel, etc.)
- Extract library version information
- Calculate confidence scores

**Usage:**
```typescript
import { FrameworkDetector } from '@pagewhisper/core'

const detector = new FrameworkDetector({
  minConfidence: 0.5,
  detectLibraries: true
})

// Browser environment
const context = FrameworkDetector.createContextFromBrowser()
const result = detector.detect(context)

console.log('Frameworks:', result.frameworks)
console.log('CSS Frameworks:', result.cssFrameworks)
```

---

### 4. **PromptBuilder** (`prompts/PromptBuilder.ts`)

Builds AI prompts from templates with versioning.

**Responsibilities:**
- Template versioning and management
- Variable interpolation
- Framework-specific prompt optimization
- Built-in templates for React, Vue, Angular, etc.

**Usage:**
```typescript
import { PromptBuilder } from '@pagewhisper/core'

const builder = new PromptBuilder('v2')

const prompt = builder.build({
  component: cleanedComponent,
  detection: detectionResult,
  options: {
    targetFramework: 'react',
    language: 'typescript',
    includeTests: true
  }
})

console.log('System:', prompt.systemPrompt)
console.log('User:', prompt.userPrompt)
```

**Built-in Templates:**
- `v1` - Basic component conversion
- `v2` - Enhanced with better structure
- `v2-react` - React-optimized with hooks
- `v2-vue` - Vue 3 with Composition API

---

### 5. **HashGenerator** (`utils/HashGenerator.ts`)

Generates deterministic content hashes for caching.

**Responsibilities:**
- Multiple hash algorithms (SHA-256, SHA-1, MD5, FNV-1a)
- Browser and Node.js compatible
- Deterministic cache key generation
- Web Crypto API or Node crypto

**Usage:**
```typescript
import { HashGenerator } from '@pagewhisper/core'

const generator = new HashGenerator({
  algorithm: 'sha256',
  encoding: 'hex',
  normalizeWhitespace: true
})

const hash = await generator.hash('component content')
const cacheKey = await generator.generateCacheKey(
  component,
  detection,
  options
)
```

---

### 6. **CoreEngine** (`CoreEngine.ts`)

Main orchestrator that coordinates all modules.

**Responsibilities:**
- Complete processing pipeline
- Progress tracking
- Error handling
- Unified API

**Usage:**
```typescript
import { CoreEngine } from '@pagewhisper/core'

const engine = new CoreEngine({
  extraction: { maxDepth: 10 },
  cleaning: { prefixSelectors: true },
  detection: { minConfidence: 0.5 }
})

const result = await engine.process(
  { element: myElement },
  (progress) => {
    console.log(`${progress.percent}%: ${progress.message}`)
  }
)

console.log('Cleaned component:', result.cleaned)
console.log('Detected frameworks:', result.detected)
console.log('AI prompt:', result.prompt)
```

---

## 🚀 Quick Start

### Browser (Chrome Extension)

```typescript
import { CoreEngine } from '@pagewhisper/core'

// Create engine
const engine = CoreEngine.create()

// Extract from clicked element
document.addEventListener('click', async (e) => {
  const result = await engine.process({
    element: e.target,
    options: {
      targetFramework: 'react',
      language: 'typescript'
    }
  })

  // Use result for AI generation
  console.log('Prompt:', result.prompt)
})
```

### Node.js

```typescript
import { CoreEngine } from '@pagewhisper/core'
import { JSDOM } from 'jsdom'

// Parse HTML
const dom = new JSDOM(htmlString)
const element = dom.window.document.querySelector('.my-component')

// Process
const engine = CoreEngine.create()
const result = await engine.process({ element })

console.log(result.cleaned)
```

---

## 🔧 Configuration

### Default Configuration

```typescript
const config = {
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
```

### Presets

```typescript
// Fast processing (less accurate, faster)
const engine = CoreEngine.createFast()

// Quality processing (more accurate, slower)
const engine = CoreEngine.createQuality()

// Custom configuration
const engine = CoreEngine.withConfig({
  cleaning: { minifyHTML: true }
})
```

---

## 📊 Supported Frameworks

### JavaScript Frameworks
- React
- Vue.js
- Angular
- Svelte
- Preact
- Solid.js
- Alpine.js
- Next.js
- Nuxt.js

### CSS Frameworks
- Bootstrap
- Tailwind CSS
- Material-UI
- Ant Design
- Bulma
- Foundation

### Build Tools
- Webpack
- Vite
- Parcel
- Rollup
- esbuild
- Babel
- TypeScript

---

## 🎨 Architecture

```
CoreEngine
├── types/              # TypeScript definitions
│   └── index.ts       # All type exports
├── extractor/          # DOM extraction
│   └── Extractor.ts   # DOMExtractor class
├── cleaner/            # HTML/CSS cleaning
│   └── Cleaner.ts     # DOMCleaner class
├── detector/           # Framework detection
│   └── FrameworkDetector.ts
├── prompts/            # Prompt building
│   └── PromptBuilder.ts
├── utils/              # Utilities
│   └── HashGenerator.ts
├── CoreEngine.ts       # Main orchestrator
└── index.ts            # Public API
```

---

## 🔒 Security

- **No external dependencies** - Reduced attack surface
- **Type-safe** - Catches errors at compile time
- **Input validation** - All inputs validated
- **Memory safe** - No manual memory management
- **XSS prevention** - HTML escaping built-in

---

## 📈 Performance

| Operation | Time | Notes |
|-----------|------|-------|
| Extraction | < 50ms | For typical component |
| Cleaning | < 100ms | With optimization |
| Detection | < 200ms | With heuristics |
| Hashing | < 50ms | SHA-256 |
| Full pipeline | < 500ms | All modules |

---

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Type checking
npm run type-check
```

---

## 📝 API Reference

See TypeScript definitions in [types/index.ts](types/index.ts) for complete API reference.

---

## 🤝 Contributing

When adding new features:

1. **Add types** to `types/index.ts`
2. **Implement module** in appropriate directory
3. **Update exports** in `index.ts`
4. **Add tests** for new functionality
5. **Update README** with examples

---

## 📄 License

MIT

---

## 🔗 Links

- [Technical Documentation](../TECHNICAL_DOCUMENTATION.md)
- [Project README](../README.md)
- [Chrome Adapter](../adapters/chrome/)
