/**
 * PageWhisper Core Engine - Framework Detector
 *
 * Responsibilities:
 * - Detect JavaScript frameworks (React, Vue, Angular, Svelte, etc.)
 * - Detect CSS frameworks (Bootstrap, Tailwind, Material-UI, etc.)
 * - Identify build tools and bundlers
 * - Extract library version information
 * - Calculate confidence scores for detections
 *
 * Browser Compatibility:
 * - Chrome Extension: Uses DOM and window object
 * - Node.js: Parses HTML/CSS/JS strings
 */

import type {
  FrameworkInfo,
  DetectionPattern,
  DetectionResult,
  DocumentContext,
  DetectionConfig,
  ScriptInfo,
  StyleInfo
} from '../types/index'

// Default detection configuration
const DEFAULT_CONFIG: DetectionConfig = {
  enableHeuristics: true,
  strictMode: false,
  minConfidence: 0.5,
  detectLibraries: true,
  detectBuildTools: true
}

/**
 * Framework detection patterns
 */
const FRAMEWORK_PATTERNS: Record<string, DetectionPattern[]> = {
  react: [
    { type: 'global', pattern: 'React', description: 'React global object', confidence: 0.9 },
    { type: 'global', pattern: 'ReactDOM', description: 'ReactDOM global object', confidence: 0.9 },
    { type: 'attribute', pattern: 'data-reactroot', description: 'React root element attribute', confidence: 0.95 },
    { type: 'attribute', pattern: 'data-reactid', description: 'React element ID (legacy)', confidence: 0.8 },
    { type: 'class', pattern: 'react-', description: 'React CSS class prefix', confidence: 0.6 },
    { type: 'script', pattern: 'react', description: 'React in script tags', confidence: 0.7 }
  ],

  vue: [
    { type: 'global', pattern: 'Vue', description: 'Vue global object', confidence: 0.9 },
    { type: 'attribute', pattern: 'data-v-', description: 'Vue scoped CSS attribute', confidence: 0.95 },
    { type: 'attribute', pattern: 'v-bind', description: 'Vue directive', confidence: 0.95 },
    { type: 'attribute', pattern: 'v-if', description: 'Vue directive', confidence: 0.95 },
    { type: 'attribute', pattern: 'v-for', description: 'Vue directive', confidence: 0.95 },
    { type: 'class', pattern: 'vue-', description: 'Vue CSS class prefix', confidence: 0.6 },
    { type: 'script', pattern: 'vue', description: 'Vue in script tags', confidence: 0.7 }
  ],

  angular: [
    { type: 'global', pattern: 'ng', description: 'Angular global object', confidence: 0.9 },
    { type: 'attribute', pattern: 'ng-app', description: 'Angular app directive', confidence: 0.95 },
    { type: 'attribute', pattern: 'ng-controller', description: 'Angular controller directive', confidence: 0.95 },
    { type: 'attribute', pattern: 'ng-model', description: 'Angular model directive', confidence: 0.95 },
    { type: 'class', pattern: 'ng-', description: 'Angular CSS class prefix', confidence: 0.8 },
    { type: 'class', pattern: 'ng-scope', description: 'Angular scope class', confidence: 0.9 },
    { type: 'script', pattern: 'angular', description: 'Angular in script tags', confidence: 0.7 }
  ],

  svelte: [
    { type: 'global', pattern: 'SvelteComponent', description: 'Svelte component', confidence: 0.9 },
    { type: 'attribute', pattern: 'data-svelte-', description: 'Svelte internal attribute', confidence: 0.95 },
    { type: 'script', pattern: 'svelte', description: 'Svelte in script tags', confidence: 0.7 }
  ],

  preact: [
    { type: 'global', pattern: 'preact', description: 'Preact global object', confidence: 0.9 },
    { type: 'global', pattern: 'h', description: 'Preact createElement', confidence: 0.6 },
    { type: 'script', pattern: 'preact', description: 'Preact in script tags', confidence: 0.7 }
  ],

  solid: [
    { type: 'global', pattern: 'Solid', description: 'Solid global object', confidence: 0.9 },
    { type: 'script', pattern: 'solid-js', description: 'SolidJS in script tags', confidence: 0.7 }
  ],

  alpine: [
    { type: 'global', pattern: 'Alpine', description: 'Alpine global object', confidence: 0.9 },
    { type: 'attribute', pattern: 'x-data', description: 'Alpine directive', confidence: 0.95 },
    { type: 'attribute', pattern: 'x-show', description: 'Alpine directive', confidence: 0.95 },
    { type: 'script', pattern: 'alpine', description: 'Alpine in script tags', confidence: 0.7 }
  ],

  nextjs: [
    { type: 'script', pattern: '__NEXT_DATA__', description: 'Next.js data', confidence: 0.95 },
    { type: 'meta', pattern: 'next', description: 'Next.js meta tag', confidence: 0.7 }
  ],

  nuxtjs: [
    { type: 'script', pattern: '__NUXT__', description: 'Nuxt.js data', confidence: 0.95 },
    { type: 'meta', pattern: 'nuxt', description: 'Nuxt.js meta tag', confidence: 0.7 }
  ]
}

/**
 * CSS Framework detection patterns
 */
const CSS_FRAMEWORK_PATTERNS: Record<string, DetectionPattern[]> = {
  bootstrap: [
    { type: 'class', pattern: 'btn-', description: 'Bootstrap button classes', confidence: 0.9 },
    { type: 'class', pattern: 'container', description: 'Bootstrap container', confidence: 0.6 },
    { type: 'class', pattern: 'row', description: 'Bootstrap grid row', confidence: 0.6 },
    { type: 'class', pattern: 'col-', description: 'Bootstrap grid column', confidence: 0.9 },
    { type: 'class', pattern: 'navbar', description: 'Bootstrap navbar', confidence: 0.8 },
    { type: 'class', pattern: 'card', description: 'Bootstrap card', confidence: 0.7 },
    { type: 'script', pattern: 'bootstrap', description: 'Bootstrap script', confidence: 0.8 }
  ],

  tailwind: [
    { type: 'class', pattern: 'flex', description: 'Tailwind utility class', confidence: 0.4 },
    { type: 'class', pattern: 'grid', description: 'Tailwind utility class', confidence: 0.4 },
    { type: 'class', pattern: 'bg-', description: 'Tailwind background utility', confidence: 0.7 },
    { type: 'class', pattern: 'text-', description: 'Tailwind text utility', confidence: 0.7 },
    { type: 'class', pattern: 'p-', description: 'Tailwind padding utility', confidence: 0.7 },
    { type: 'class', pattern: 'm-', description: 'Tailwind margin utility', confidence: 0.7 },
    { type: 'class', pattern: 'w-', description: 'Tailwind width utility', confidence: 0.7 },
    { type: 'class', pattern: 'h-', description: 'Tailwind height utility', confidence: 0.7 },
    { type: 'style', pattern: 'tailwind', description: 'Tailwind in styles', confidence: 0.8 }
  ],

  'material-ui': [
    { type: 'class', pattern: 'MuiButton-', description: 'MUI button class', confidence: 0.95 },
    { type: 'class', pattern: 'MuiBox-', description: 'MUI box class', confidence: 0.95 },
    { type: 'class', pattern: 'MuiGrid-', description: 'MUI grid class', confidence: 0.95 },
    { type: 'class', pattern: 'MuiPaper-', description: 'MUI paper class', confidence: 0.95 },
    { type: 'script', pattern: '@material-ui', description: 'MUI script', confidence: 0.8 },
    { type: 'script', pattern: '@mui', description: 'MUI script', confidence: 0.8 }
  ],

  antd: [
    { type: 'class', pattern: 'ant-btn', description: 'Ant Design button', confidence: 0.95 },
    { type: 'class', pattern: 'ant-input', description: 'Ant Design input', confidence: 0.95 },
    { type: 'class', pattern: 'ant-', description: 'Ant Design prefix', confidence: 0.8 },
    { type: 'script', pattern: 'antd', description: 'Ant Design script', confidence: 0.9 }
  ],

  bulma: [
    { type: 'class', pattern: 'button', description: 'Bulma button', confidence: 0.6 },
    { type: 'class', pattern: 'column', description: 'Bulma column', confidence: 0.6 },
    { type: 'class', pattern: 'is-', description: 'Bulma modifier prefix', confidence: 0.8 },
    { type: 'script', pattern: 'bulma', description: 'Bulma script', confidence: 0.8 }
  ],

  foundation: [
    { type: 'class', pattern: 'button', description: 'Foundation button', confidence: 0.5 },
    { type: 'class', pattern: 'grid-x', description: 'Foundation grid', confidence: 0.8 },
    { type: 'class', pattern: 'cell', description: 'Foundation cell', confidence: 0.7 },
    { type: 'script', pattern: 'foundation', description: 'Foundation script', confidence: 0.8 }
  ]
}

/**
 * Build tool detection patterns
 */
const BUILD_TOOL_PATTERNS: Record<string, DetectionPattern[]> = {
  webpack: [
    { type: 'script', pattern: 'webpack', description: 'Webpack bundle', confidence: 0.8 }
  ],

  vite: [
    { type: 'script', pattern: 'vite', description: 'Vite dev server', confidence: 0.9 },
    { type: 'script', pattern: '@vite/', description: 'Vite client', confidence: 0.95 }
  ],

  parcel: [
    { type: 'script', pattern: 'parcel', description: 'Parcel bundler', confidence: 0.8 }
  ],

  rollup: [
    { type: 'script', pattern: 'rollup', description: 'Rollup bundler', confidence: 0.7 }
  ],

  esbuild: [
    { type: 'script', pattern: 'esbuild', description: 'esbuild bundler', confidence: 0.8 }
  ],

  babel: [
    { type: 'script', pattern: '@babel', description: 'Babel transpiler', confidence: 0.8 },
    { type: 'script', pattern: 'babel-', description: 'Babel runtime', confidence: 0.7 }
  ],

  typescript: [
    { type: 'script', pattern: 'tslib', description: 'TypeScript runtime', confidence: 0.8 },
    { type: 'script', pattern: '__decorate', description: 'TypeScript decorator', confidence: 0.7 }
  ]
}

/**
 * Framework Detector - Core detection logic
 */
export class FrameworkDetector {
  private config: DetectionConfig

  constructor(config: Partial<DetectionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Main detection method
   */
  detect(context: DocumentContext): DetectionResult {
    const frameworks = this.detectFrameworks(context)
    const cssFrameworks = this.detectCSSFrameworks(context)
    const libraries = this.detectLibraries(context)
    const buildTools = this.detectBuildTools(context)

    // Calculate overall confidence
    const allDetections = [...frameworks, ...cssFrameworks]
    const overallConfidence = allDetections.length > 0
      ? Math.max(...allDetections.map(f => f.confidence))
      : 0

    return {
      frameworks,
      cssFrameworks,
      libraries,
      buildTools,
      confidence: overallConfidence
    }
  }

  /**
   * Detect JavaScript frameworks
   */
  private detectFrameworks(context: DocumentContext): FrameworkInfo[] {
    const detections: FrameworkInfo[] = []

    for (const [framework, patterns] of Object.entries(FRAMEWORK_PATTERNS)) {
      const matchedPatterns = this.matchPatterns(patterns, context)

      if (matchedPatterns.length > 0) {
        const confidence = this.calculateConfidence(matchedPatterns)
        const version = this.extractVersion(framework, context)

        if (confidence >= this.config.minConfidence) {
          detections.push({
            name: framework,
            version,
            confidence,
            indicators: matchedPatterns.map(p => p.pattern),
            patterns: matchedPatterns
          })
        }
      }
    }

    return this.sortByConfidence(detections)
  }

  /**
   * Detect CSS frameworks
   */
  private detectCSSFrameworks(context: DocumentContext): FrameworkInfo[] {
    const detections: FrameworkInfo[] = []

    for (const [framework, patterns] of Object.entries(CSS_FRAMEWORK_PATTERNS)) {
      const matchedPatterns = this.matchPatterns(patterns, context)

      if (matchedPatterns.length > 0) {
        const confidence = this.calculateConfidence(matchedPatterns)

        if (confidence >= this.config.minConfidence) {
          detections.push({
            name: framework,
            confidence,
            indicators: matchedPatterns.map(p => p.pattern),
            patterns: matchedPatterns
          })
        }
      }
    }

    return this.sortByConfidence(detections)
  }

  /**
   * Detect libraries
   */
  private detectLibraries(context: DocumentContext): string[] {
    if (!this.config.detectLibraries) {
      return []
    }

    const libraries: string[] = []

    // Check scripts for library references
    for (const script of context.scripts) {
      const src = script.src?.toLowerCase() || ''
      const content = script.content?.toLowerCase() || ''

      // Common libraries
      if (src.includes('jquery') || content.includes('jquery')) libraries.push('jquery')
      if (src.includes('lodash') || content.includes('lodash')) libraries.push('lodash')
      if (src.includes('axios') || content.includes('axios')) libraries.push('axios')
      if (src.includes('moment') || content.includes('moment')) libraries.push('moment')
      if (src.includes('dayjs') || content.includes('dayjs')) libraries.push('dayjs')
      if (src.includes('date-fns') || content.includes('date-fns')) libraries.push('date-fns')
      if (src.includes('ramda') || content.includes('ramda')) libraries.push('ramda')
      if (src.includes('rxjs') || content.includes('rxjs')) libraries.push('rxjs')
      if (src.includes('chart.js') || content.includes('chart.js')) libraries.push('chart.js')
      if (src.includes('d3') || content.includes('d3')) libraries.push('d3')
      if (src.includes('three') || content.includes('three')) libraries.push('three')
      if (src.includes('gsap') || content.includes('gsap')) libraries.push('gsap')
    }

    return [...new Set(libraries)]
  }

  /**
   * Detect build tools
   */
  private detectBuildTools(context: DocumentContext): string[] {
    if (!this.config.detectBuildTools) {
      return []
    }

    const detections: string[] = []

    for (const [tool, patterns] of Object.entries(BUILD_TOOL_PATTERNS)) {
      const matchedPatterns = this.matchPatterns(patterns, context)

      if (matchedPatterns.length > 0 && this.calculateConfidence(matchedPatterns) >= this.config.minConfidence) {
        detections.push(tool)
      }
    }

    return detections
  }

  /**
   * Match detection patterns against context
   */
  private matchPatterns(patterns: DetectionPattern[], context: DocumentContext): DetectionPattern[] {
    const matched: DetectionPattern[] = []

    for (const pattern of patterns) {
      if (this.testPattern(pattern, context)) {
        matched.push(pattern)
      }
    }

    return matched
  }

  /**
   * Test a single pattern
   */
  private testPattern(pattern: DetectionPattern, context: DocumentContext): boolean {
    switch (pattern.type) {
      case 'global':
        return this.testGlobalPattern(pattern.pattern, context)
      case 'attribute':
        return this.testAttributePattern(pattern.pattern, context)
      case 'class':
        return this.testClassPattern(pattern.pattern, context)
      case 'script':
        return this.testScriptPattern(pattern.pattern, context)
      case 'meta':
        return this.testMetaPattern(pattern.pattern, context)
      case 'style':
        return this.testStylePattern(pattern.pattern, context)
      default:
        return false
    }
  }

  /**
   * Test global variable pattern
   */
  private testGlobalPattern(pattern: string, context: DocumentContext): boolean {
    return context.globalVariables.includes(pattern)
  }

  /**
   * Test attribute pattern
   */
  private testAttributePattern(pattern: string, context: DocumentContext): boolean {
    // Parse HTML and check for attributes
    const attributeRegex = new RegExp(`\\s${pattern}(?:\\s|=)`, 'i')
    return attributeRegex.test(context.html)
  }

  /**
   * Test CSS class pattern
   */
  private testClassPattern(pattern: string, context: DocumentContext): boolean {
    // Check for class attribute containing pattern
    const classRegex = new RegExp(`class="[^"]*${pattern}`, 'i')
    return classRegex.test(context.html)
  }

  /**
   * Test script pattern
   */
  private testScriptPattern(pattern: string, context: DocumentContext): boolean {
    return context.scripts.some(script => {
      const src = script.src?.toLowerCase() || ''
      const content = script.content?.toLowerCase() || ''
      return src.includes(pattern) || content.includes(pattern)
    })
  }

  /**
   * Test meta tag pattern
   */
  private testMetaPattern(pattern: string, context: DocumentContext): boolean {
    return Object.values(context.metaTags).some(value =>
      value.toLowerCase().includes(pattern)
    )
  }

  /**
   * Test style pattern
   */
  private testStylePattern(pattern: string, context: DocumentContext): boolean {
    return context.styles.some(style => {
      const content = style.content?.toLowerCase() || ''
      return content.includes(pattern)
    })
  }

  /**
   * Calculate confidence from matched patterns
   */
  private calculateConfidence(patterns: DetectionPattern[]): number {
    if (patterns.length === 0) return 0

    // Average confidence with bonus for multiple matches
    const avgConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length
    const matchBonus = Math.min(patterns.length * 0.05, 0.2)

    return Math.min(avgConfidence + matchBonus, 1)
  }

  /**
   * Extract version information for a framework
   */
  private extractVersion(framework: string, context: DocumentContext): string | undefined {
    // Check scripts for version info
    for (const script of context.scripts) {
      const versionMatch = script.src?.match(new RegExp(`${framework}@([\\d.]+)`))
      if (versionMatch) {
        return versionMatch[1]
      }
    }

    return undefined
  }

  /**
   * Sort frameworks by confidence (highest first)
   */
  private sortByConfidence(frameworks: FrameworkInfo[]): FrameworkInfo[] {
    return frameworks.sort((a, b) => b.confidence - a.confidence)
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Update configuration
   */
  updateConfig(config: Partial<DetectionConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get current configuration
   */
  getConfig(): DetectionConfig {
    return { ...this.config }
  }

  /**
   * Create document context from HTML string (Node.js compatible)
   */
  static createContextFromHTML(html: string): DocumentContext {
    // In Node.js, you would use a parser like jsdom or cheerio
    // This is a simplified version for demonstration

    const scripts: ScriptInfo[] = []
    const styles: StyleInfo[] = []
    const metaTags: Record<string, string> = {}
    const globalVariables: string[] = []

    // Extract scripts
    const scriptRegex = /<script[^>]*>(.*?)<\/script>|<script[^>]*src=["']([^"']+)["'][^>]*>/gis
    let match
    while ((match = scriptRegex.exec(html)) !== null) {
      scripts.push({
        src: match[2],
        content: match[1],
        type: 'text/javascript',
        async: false,
        defer: false
      })
    }

    // Extract styles
    const styleRegex = /<style[^>]*>(.*?)<\/style>|<link[^>]*href=["']([^"']+)["'][^>]*>/gis
    while ((match = styleRegex.exec(html)) !== null) {
      styles.push({
        href: match[2],
        content: match[1]
      })
    }

    // Extract meta tags
    const metaRegex = /<meta[^>]*name=["']([^"']+)["'][^>]*content=["']([^"']+)["'][^>]*>/gi
    while ((match = metaRegex.exec(html)) !== null) {
      metaTags[match[1]] = match[2]
    }

    return {
      html,
      scripts,
      styles,
      metaTags,
      globalVariables
    }
  }

  /**
   * Create document context from browser environment
   */
  static createContextFromBrowser(): DocumentContext {
    // Browser environment: use actual DOM and window
    if (typeof window === 'undefined') {
      throw new Error('Browser context not available')
    }

    const scripts: ScriptInfo[] = Array.from(document.scripts).map(script => ({
      src: script.src,
      content: script.textContent || undefined,
      type: script.type || 'text/javascript',
      async: script.async,
      defer: script.defer
    }))

    const styles: StyleInfo[] = Array.from(document.styleSheets).map(sheet => ({
      href: sheet.href || undefined,
      content: undefined, // Would need to fetch CSS rules
      media: sheet.media?.mediaText
    }))

    const metaTags: Record<string, string> = {}
    Array.from(document.querySelectorAll('meta')).forEach(meta => {
      if (meta.name && meta.content) {
        metaTags[meta.name] = meta.content
      }
    })

    // Extract global variables (common frameworks)
    const globalVariables = Object.keys(window).filter(key =>
      /^(React|Vue|Angular|angular|module\.exports|__webpack_require__)/.test(key)
    )

    return {
      url: window.location.href,
      html: document.documentElement.outerHTML,
      scripts,
      styles,
      metaTags,
      globalVariables
    }
  }
}

// ============================================================================
// Export
// ============================================================================

export default FrameworkDetector
export type { DetectionConfig, DetectionResult, FrameworkInfo, DocumentContext }
