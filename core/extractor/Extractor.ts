/**
 * PageWhisper Core Engine - DOM Extractor
 *
 * Responsibilities:
 * - Extract DOM elements with their complete context
 * - Capture computed styles and inline styles
 * - Identify and extract CSS rules
 * - Preserve semantic information and accessibility attributes
 * - Browser-agnostic: Works with HTMLElement (browser) or parsed DOM (Node.js)
 *
 * Browser Compatibility:
 * - Chrome Extension: Uses native DOM APIs
 * - Node.js: Uses JSDOM or similar parser
 */

import type {
  DOMElement,
  ComputedStyle,
  ElementRect,
  CSSRule,
  ExtractedCSS,
  RawComponent,
  ComponentMetadata,
  ExtractionConfig,
  HTMLElement
} from '../types/index'

// Default extraction configuration
const DEFAULT_CONFIG: ExtractionConfig = {
  includeInlineStyles: true,
  includeComputedStyles: true,
  includeDescendants: true,
  maxDepth: 10,
  preserveClassNames: true,
  preserveDataAttributes: true,
  extractAncestors: false,
  ancestorDepth: 3
}

/**
 * DOM Extractor - Core extraction logic
 */
export class DOMExtractor {
  private config: ExtractionConfig

  constructor(config: Partial<ExtractionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Main extraction method
   * @param element - HTMLElement (browser) or DOMElement (parsed)
   * @param context - Optional context metadata
   */
  extract(element: HTMLElement | DOMElement, context?: { url?: string; title?: string }): RawComponent {
    const domElement = this.normalizeElement(element)

    return {
      html: this.extractHTML(domElement),
      css: this.extractCSS(domElement),
      scripts: this.extractScripts(domElement),
      metadata: this.buildMetadata(domElement, context)
    }
  }

  /**
   * Normalize different element types to internal DOMElement representation
   */
  private normalizeElement(element: HTMLElement | DOMElement): DOMElement {
    // Check if it's already a DOMElement (browser-agnostic)
    if (this.isDOMElement(element)) {
      return element
    }

    // Convert HTMLElement to DOMElement (browser environment)
    return this.convertHTMLElement(element as HTMLElement)
  }

  /**
   * Type guard for DOMElement
   */
  private isDOMElement(element: any): element is DOMElement {
    return (
      typeof element === 'object' &&
      element !== null &&
      'tagName' in element &&
      'attributes' in element &&
      'styles' in element
    )
  }

  /**
   * Convert browser HTMLElement to DOMElement
   */
  private convertHTMLElement(element: HTMLElement): DOMElement {
    const styles = this.extractComputedStyle(element)
    const rect = this.extractBoundingRect(element)

    return {
      tagName: element.tagName.toLowerCase(),
      id: element.id || undefined,
      className: element.className || undefined,
      attributes: this.extractAttributes(element),
      textContent: element.textContent || undefined,
      innerHTML: element.innerHTML,
      children: this.extractChildren(element),
      styles,
      boundingRect: rect
    }
  }

  /**
   * Extract HTML representation
   */
  private extractHTML(element: DOMElement): string {
    let html = `<${element.tagName}`

    // Add attributes
    if (element.id && this.config.preserveClassNames) {
      html += ` id="${this.escapeHTML(element.id)}"`
    }

    if (element.className && this.config.preserveClassNames) {
      html += ` class="${this.escapeHTML(element.className)}"`
    }

    // Add other attributes
    for (const [key, value] of Object.entries(element.attributes)) {
      if (this.shouldIncludeAttribute(key)) {
        html += ` ${key}="${this.escapeHTML(value)}"`
      }
    }

    // Self-closing tags
    if (this.isSelfClosing(element.tagName)) {
      return html + ' />'
    }

    html += '>'

    // Add children if including descendants
    if (this.config.includeDescendants && element.children.length > 0) {
      html += element.children
        .map(child => this.extractHTML(child))
        .join('')
    } else if (element.textContent) {
      html += this.escapeHTML(element.textContent)
    }

    return html + `</${element.tagName}>`
  }

  /**
   * Extract CSS from element
   */
  private extractCSS(element: DOMElement): ExtractedCSS {
    const inlineStyles = this.extractInlineStyles(element)
    const rules = this.extractCSSRules(element)
    const computedStyles = this.extractComputedStylesMap(element)

    return {
      inline: inlineStyles,
      rules,
      computedStyles
    }
  }

  /**
   * Extract inline styles from element
   */
  private extractInlineStyles(element: DOMElement): string {
    const styles: string[] = []

    for (const [property, value] of Object.entries(element.styles)) {
      if (value !== undefined && value !== '') {
        styles.push(`${this.kebabCase(property)}: ${value};`)
      }
    }

    return styles.join(' ')
  }

  /**
   * Extract CSS rules (in browser, from document stylesheets)
   */
  private extractCSSRules(element: DOMElement): CSSRule[] {
    const rules: CSSRule[] = []

    // Generate rules based on element's selectors
    if (element.id) {
      rules.push({
        selector: `#${element.id}`,
        properties: this.extractRelevantProperties(element.styles),
        specificity: 100
      })
    }

    if (element.className) {
      const classes = element.className.split(/\s+/).filter(Boolean)
      for (const className of classes) {
        rules.push({
          selector: `.${className}`,
          properties: this.extractRelevantProperties(element.styles),
          specificity: 10
        })
      }
    }

    // Element selector
    rules.push({
      selector: element.tagName,
      properties: this.extractRelevantProperties(element.styles),
      specificity: 1
    })

    return rules
  }

  /**
   * Extract computed styles as a map
   */
  private extractComputedStylesMap(element: DOMElement): Record<string, ComputedStyle> {
    const selector = this.generateSelector(element)

    return {
      [selector]: element.styles
    }
  }

  /**
   * Extract scripts associated with element
   */
  private extractScripts(element: DOMElement): string[] {
    const scripts: string[] = []

    // Look for script tags in descendants
    if (element.children) {
      for (const child of element.children) {
        if (child.tagName === 'script') {
          if (child.attributes.src) {
            scripts.push(`// Script: ${child.attributes.src}`)
          } else if (child.textContent) {
            scripts.push(child.textContent)
          }
        }

        // Recursively extract from children
        scripts.push(...this.extractScripts(child))
      }
    }

    return scripts
  }

  /**
   * Build component metadata
   */
  private buildMetadata(element: DOMElement, context?: { url?: string; title?: string }): ComponentMetadata {
    const elementCount = this.countElements(element)

    return {
      timestamp: Date.now(),
      source: {
        url: context?.url,
        title: context?.title
      },
      element: {
        selector: this.generateSelector(element),
        tagName: element.tagName,
        id: element.id,
        className: element.className
      },
      dimensions: {
        width: element.boundingRect?.width || 0,
        height: element.boundingRect?.height || 0
      },
      extraction: {
        depth: this.calculateDepth(element),
        elementCount,
        styleCount: Object.keys(element.styles).length
      }
    }
  }

  // ==========================================================================
  // Browser-specific methods (to be implemented by adapters)
  // ==========================================================================

  /**
   * Extract computed styles from element
   * Browser: Use window.getComputedStyle()
   * Node.js: Parse from CSS or use defaults
   */
  private extractComputedStyle(element: HTMLElement): ComputedStyle {
    // In browser environment
    if (typeof window !== 'undefined' && window.getComputedStyle) {
      const computed = window.getComputedStyle(element)
      return this.styleToObject(computed)
    }

    // In Node.js environment, return empty or parsed styles
    return {}
  }

  /**
   * Extract bounding rectangle
   * Browser: Use element.getBoundingClientRect()
   * Node.js: Return placeholder
   */
  private extractBoundingRect(element: HTMLElement): ElementRect {
    // In browser environment
    if (typeof element.getBoundingClientRect === 'function') {
      const rect = element.getBoundingClientRect()
      return {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left,
        bottom: rect.bottom,
        right: rect.right
      }
    }

    // In Node.js environment
    return { x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, bottom: 0, right: 0 }
  }

  /**
   * Extract element attributes
   */
  private extractAttributes(element: HTMLElement): Record<string, string> {
    const attributes: Record<string, string> = {}

    if (typeof element.getAttribute === 'function') {
      // Browser environment
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i]
        attributes[attr.name] = attr.value
      }
    }

    return attributes
  }

  /**
   * Extract child elements
   */
  private extractChildren(element: HTMLElement): DOMElement[] {
    const children: DOMElement[] = []

    if (element.children) {
      for (let i = 0; i < element.children.length; i++) {
        const child = element.children[i] as HTMLElement
        children.push(this.convertHTMLElement(child))
      }
    }

    return children
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Convert CSSStyleDeclaration to object
   */
  private styleToObject(style: CSSStyleDeclaration): ComputedStyle {
    const obj: ComputedStyle = {}

    for (let i = 0; i < style.length; i++) {
      const property = style[i]
      const value = style.getPropertyValue(property)

      // Convert kebab-case to camelCase
      const camelKey = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
      obj[camelKey] = value
    }

    return obj
  }

  /**
   * Extract relevant CSS properties (non-inherited)
   */
  private extractRelevantProperties(styles: ComputedStyle): Record<string, string> {
    const inherited = [
      'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight',
      'textAlign', 'color', 'visibility'
    ]

    const relevant: Record<string, string> = {}

    for (const [key, value] of Object.entries(styles)) {
      if (value && value !== 'none' && value !== 'normal' && !inherited.includes(key)) {
        relevant[this.kebabCase(key)] = value
      }
    }

    return relevant
  }

  /**
   * Generate CSS selector for element
   */
  private generateSelector(element: DOMElement): string {
    let selector = element.tagName

    if (element.id) {
      selector += `#${element.id}`
    }

    if (element.className) {
      const classes = element.className.split(/\s+/).filter(Boolean).join('.')
      if (classes) {
        selector += `.${classes}`
      }
    }

    return selector
  }

  /**
   * Count total elements in tree
   */
  private countElements(element: DOMElement): number {
    let count = 1

    if (element.children) {
      for (const child of element.children) {
        count += this.countElements(child)
      }
    }

    return count
  }

  /**
   * Calculate maximum depth of element tree
   */
  private calculateDepth(element: DOMElement): number {
    if (!element.children || element.children.length === 0) {
      return 1
    }

    return 1 + Math.max(...element.children.map(child => this.calculateDepth(child)))
  }

  /**
   * Check if attribute should be included
   */
  private shouldIncludeAttribute(attr: string): boolean {
    // Skip standard attributes handled separately
    if (['id', 'class', 'style'].includes(attr)) {
      return false
    }

    // Skip data attributes if not preserving
    if (attr.startsWith('data-') && !this.config.preserveDataAttributes) {
      return false
    }

    return true
  }

  /**
   * Escape HTML entities
   */
  private escapeHTML(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }

    return text.replace(/[&<>"']/g, char => map[char])
  }

  /**
   * Convert camelCase to kebab-case
   */
  private kebabCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
  }

  /**
   * Check if tag is self-closing
   */
  private isSelfClosing(tagName: string): boolean {
    return ['img', 'br', 'hr', 'input', 'meta', 'link'].includes(tagName.toLowerCase())
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ExtractionConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get current configuration
   */
  getConfig(): ExtractionConfig {
    return { ...this.config }
  }
}

// ============================================================================
// Export
// ============================================================================

export default DOMExtractor
export type { ExtractionConfig }
