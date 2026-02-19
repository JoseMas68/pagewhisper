/**
 * PageWhisper Core Engine - HTML/CSS Cleaner
 *
 * Responsibilities:
 * - Remove unused CSS rules and properties
 * - Optimize and normalize HTML structure
 * - Prefix selectors to prevent collisions
 * - Minify HTML and CSS (optional)
 * - Calculate cleaning statistics
 *
 * Browser Compatibility:
 * - Chrome Extension: Browser APIs
 * - Node.js: Pure TypeScript, no browser dependencies
 */

import type {
  RawComponent,
  CleanedComponent,
  CleaningConfig,
  CleaningStats,
  CSSRule
} from '../types/index'

// Default cleaning configuration
const DEFAULT_CONFIG: CleaningConfig = {
  removeUnusedStyles: true,
  minifyHTML: false,
  minifyCSS: false,
  prefixSelectors: true,
  selectorPrefix: 'pw-',
  normalizeProperties: true,
  removeComments: true,
  preserveImportant: true,
  combineRules: true
}

/**
 * HTML/CSS Cleaner - Core cleaning logic
 */
export class DOMCleaner {
  private config: CleaningConfig

  constructor(config: Partial<CleaningConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Main cleaning method
   */
  clean(rawComponent: RawComponent): CleanedComponent {
    const originalHTMLSize = this.byteSize(rawComponent.html)
    const originalCSSSize = this.byteSize(JSON.stringify(rawComponent.css))

    // Clean HTML
    const cleanedHTML = this.cleanHTML(rawComponent.html)

    // Clean CSS
    const cleanedCSS = this.cleanCSS(rawComponent.css)

    const cleanedHTMLSize = this.byteSize(cleanedHTML)
    const cleanedCSSSize = this.byteSize(cleanedCSS)

    return {
      html: cleanedHTML,
      css: cleanedCSS,
      libraries: this.extractLibraries(rawComponent),
      metadata: rawComponent.metadata,
      stats: {
        originalSize: {
          html: originalHTMLSize,
          css: originalCSSSize,
          total: originalHTMLSize + originalCSSSize
        },
        cleanedSize: {
          html: cleanedHTMLSize,
          css: cleanedCSSSize,
          total: cleanedHTMLSize + cleanedCSSSize
        },
        reduction: {
          html: originalHTMLSize - cleanedHTMLSize,
          css: originalCSSSize - cleanedCSSSize,
          total: (originalHTMLSize + originalCSSSize) - (cleanedHTMLSize + cleanedCSSSize),
          percentage: this.calculateReduction(
            originalHTMLSize + originalCSSSize,
            cleanedHTMLSize + cleanedCSSSize
          )
        }
      }
    }
  }

  /**
   * Clean HTML content
   */
  private cleanHTML(html: string): string {
    let cleaned = html

    // Remove comments
    if (this.config.removeComments) {
      cleaned = this.removeHTMLComments(cleaned)
    }

    // Remove empty attributes
    cleaned = this.removeEmptyAttributes(cleaned)

    // Normalize whitespace
    cleaned = this.normalizeWhitespace(cleaned)

    // Add selector prefix to classes
    if (this.config.prefixSelectors) {
      cleaned = this.prefixHTMLClasses(cleaned)
    }

    // Minify if requested
    if (this.config.minifyHTML) {
      cleaned = this.minifyHTML(cleaned)
    }

    return cleaned
  }

  /**
   * Clean CSS content
   */
  private cleanCSS(css: ExtractedCSS): string {
    let rules = [...css.rules]

    // Remove unused styles
    if (this.config.removeUnusedStyles) {
      rules = this.filterUsedCSS(rules, css.inline)
    }

    // Normalize properties
    if (this.config.normalizeProperties) {
      rules = this.normalizeCSSProperties(rules)
    }

    // Add selector prefix
    if (this.config.prefixSelectors) {
      rules = this.prefixCSSSelectors(rules)
    }

    // Combine rules
    if (this.config.combineRules) {
      rules = this.combineCSSRules(rules)
    }

    // Generate CSS string
    let cssString = this.rulesToCSS(rules)

    // Add inline styles
    if (css.inline) {
      cssString = `${css.inline}\n${cssString}`.trim()
    }

    // Remove comments
    if (this.config.removeComments) {
      cssString = this.removeCSSComments(cssString)
    }

    // Minify if requested
    if (this.config.minifyCSS) {
      cssString = this.minifyCSS(cssString)
    }

    return cssString
  }

  // ==========================================================================
  // HTML Cleaning Methods
  // ==========================================================================

  /**
   * Remove HTML comments
   */
  private removeHTMLComments(html: string): string {
    return html.replace(/<!--[\s\S]*?-->/g, '')
  }

  /**
   * Remove empty attributes
   */
  private removeEmptyAttributes(html: string): string {
    return html
      .replace(/\s+class=""/g, '')
      .replace(/\s+id=""/g, '')
      .replace(/\s+style=""/g, '')
      .replace(/\s+data-[^=]*=""/g, '')
  }

  /**
   * Normalize whitespace
   */
  private normalizeWhitespace(html: string): string {
    if (this.config.minifyHTML) {
      return html
    }

    // Normalize multiple spaces to single space
    return html.replace(/[ \t]+/g, ' ')
  }

  /**
   * Prefix HTML classes
   */
  private prefixHTMLClasses(html: string): string {
    const prefix = this.config.selectorPrefix

    // Prefix class attributes
    return html.replace(
      /class="([^"]*)"/g,
      (_, classes) => {
        const prefixed = classes
          .split(/\s+/)
          .filter(Boolean)
          .map(cls => cls.startsWith(prefix) ? cls : `${prefix}${cls}`)
          .join(' ')
        return `class="${prefixed}"`
      }
    )
  }

  /**
   * Minify HTML
   */
  private minifyHTML(html: string): string {
    return html
      .replace(/\s+</g, '<')  // Remove space before tags
      .replace(/>\s+/g, '>')  // Remove space after tags
      .replace(/\s+/g, ' ')   // Collapse whitespace
      .trim()
  }

  // ==========================================================================
  // CSS Cleaning Methods
  // ==========================================================================

  /**
   * Filter used CSS rules
   */
  private filterUsedCSS(rules: CSSRule[], inlineStyles: string): CSSRule[] {
    // Extract used properties from inline styles
    const usedProperties = new Set<string>()
    const propertyRegex = /([\w-]+)\s*:/g

    let match
    while ((match = propertyRegex.exec(inlineStyles)) !== null) {
      usedProperties.add(match[1])
    }

    // Filter rules to only include used properties
    return rules.map(rule => ({
      ...rule,
      properties: Object.fromEntries(
        Object.entries(rule.properties).filter(([prop]) =>
          usedProperties.has(prop) || this.isImportantProperty(prop)
        )
      )
    })).filter(rule => Object.keys(rule.properties).length > 0)
  }

  /**
   * Normalize CSS properties
   */
  private normalizeCSSProperties(rules: CSSRule[]): CSSRule[] {
    return rules.map(rule => ({
      ...rule,
      properties: this.normalizeProperties(rule.properties)
    }))
  }

  /**
   * Normalize individual property object
   */
  private normalizeProperties(properties: Record<string, string>): Record<string, string> {
    const normalized: Record<string, string> = {}

    for (const [prop, value] of Object.entries(properties)) {
      // Normalize property name
      const normalizedProp = prop.toLowerCase()

      // Normalize value
      const normalizedValue = this.normalizeCSSValue(value)

      normalized[normalizedProp] = normalizedValue
    }

    return normalized
  }

  /**
   * Normalize CSS value
   */
  private normalizeCSSValue(value: string): string {
    let normalized = value.trim()

    // Normalize colors
    normalized = this.normalizeColor(normalized)

    // Normalize URLs
    normalized = this.normalizeURL(normalized)

    // Remove !important if not preserving
    if (!this.config.preserveImportant) {
      normalized = normalized.replace(/\s*!important/g, '')
    }

    return normalized
  }

  /**
   * Prefix CSS selectors
   */
  private prefixCSSSelectors(rules: CSSRule[]): CSSRule[] {
    const prefix = this.config.selectorPrefix

    return rules.map(rule => ({
      ...rule,
      selector: this.prefixSelector(rule.selector, prefix)
    }))
  }

  /**
   * Prefix a single selector
   */
  private prefixSelector(selector: string, prefix: string): string {
    // Don't prefix element selectors
    if (/^[a-z]+$/.test(selector)) {
      return selector
    }

    // Prefix class selectors
    if (selector.startsWith('.')) {
      return `.${prefix}${selector.slice(1)}`
    }

    // Prefix ID selectors
    if (selector.startsWith('#')) {
      return `#${prefix}${selector.slice(1)}`
    }

    // Handle complex selectors (comma-separated)
    if (selector.includes(',')) {
      return selector
        .split(',')
        .map(s => this.prefixSelector(s.trim(), prefix))
        .join(', ')
    }

    return selector
  }

  /**
   * Combine CSS rules with same selector
   */
  private combineCSSRules(rules: CSSRule[]): CSSRule[] {
    const combined = new Map<string, CSSRule>()

    for (const rule of rules) {
      const existing = combined.get(rule.selector)

      if (existing) {
        // Merge properties
        combined.set(rule.selector, {
          ...existing,
          properties: { ...existing.properties, ...rule.properties }
        })
      } else {
        combined.set(rule.selector, rule)
      }
    }

    return Array.from(combined.values())
  }

  /**
   * Convert rules array to CSS string
   */
  private rulesToCSS(rules: CSSRule[]): string {
    return rules
      .map(rule => {
        const properties = Object.entries(rule.properties)
          .map(([prop, value]) => `  ${prop}: ${value};`)
          .join('\n')

        return `${rule.selector} {\n${properties}\n}`
      })
      .join('\n')
  }

  /**
   * Remove CSS comments
   */
  private removeCSSComments(css: string): string {
    return css.replace(/\/\*[\s\S]*?\*\//g, '')
  }

  /**
   * Minify CSS
   */
  private minifyCSS(css: string): string {
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '')  // Remove comments
      .replace(/\s+/g, ' ')              // Collapse whitespace
      .replace(/\s*([\{\}\:\;])\s*/g, '$1')  // Remove space around special chars
      .replace(/;\}/g, '}')              // Remove last semicolon
      .trim()
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Normalize color values
   */
  private normalizeColor(color: string): string {
    // Convert rgb() to hex
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
    if (rgbMatch) {
      const [, r, g, b] = rgbMatch
      return `#${[r, g, b].map(x => parseInt(x).toString(16).padStart(2, '0')).join('')}`
    }

    // Convert rgba() with full opacity
    const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*1\)/)
    if (rgbaMatch) {
      const [, r, g, b] = rgbaMatch
      return `#${[r, g, b].map(x => parseInt(x).toString(16).padStart(2, '0')).join('')}`
    }

    return color
  }

  /**
   * Normalize URL values
   */
  private normalizeURL(url: string): string {
    // Remove quotes from url()
    return url.replace(/url\(['"]?([^'"]+)['"]?\)/g, 'url($1)')
  }

  /**
   * Check if property is important (should always keep)
   */
  private isImportantProperty(prop: string): boolean {
    const important = [
      'display', 'position', 'float', 'width', 'height',
      'margin', 'padding', 'border', 'background'
    ]

    return important.some(imp => prop.includes(imp))
  }

  /**
   * Extract library references from component
   */
  private extractLibraries(component: RawComponent): string[] {
    const libraries: string[] = []

    // Check scripts for library references
    for (const script of component.scripts) {
      if (script.includes('jquery')) libraries.push('jquery')
      if (script.includes('react')) libraries.push('react')
      if (script.includes('vue')) libraries.push('vue')
      if (script.includes('angular')) libraries.push('angular')
      if (script.includes('lodash')) libraries.push('lodash')
    }

    // Check CSS for framework classes
    if (component.css.inline) {
      const css = component.css.inline.toLowerCase()
      if (css.includes('btn-')) libraries.push('bootstrap')
      if (css.includes('MuiBox-') || css.includes('MuiButton-')) libraries.push('material-ui')
      if (css.includes('ant-')) libraries.push('antd')
    }

    return [...new Set(libraries)]
  }

  /**
   * Calculate byte size of string
   */
  private byteSize(str: string): number {
    return new Blob([str]).size
  }

  /**
   * Calculate reduction percentage
   */
  private calculateReduction(original: number, cleaned: number): number {
    if (original === 0) return 0
    return Math.round(((original - cleaned) / original) * 100)
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Update configuration
   */
  updateConfig(config: Partial<CleaningConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get current configuration
   */
  getConfig(): CleaningConfig {
    return { ...this.config }
  }
}

// ============================================================================
// Types
// ============================================================================

interface ExtractedCSS {
  inline: string
  rules: CSSRule[]
  computedStyles: Record<string, any>
}

// ============================================================================
// Export
// ============================================================================

export default DOMCleaner
export type { CleaningConfig, CleaningStats }
