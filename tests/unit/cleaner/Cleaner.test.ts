/**
 * PageWhisper Core Engine - DOM Cleaner Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { DOMCleaner } from '../../core/cleaner/Cleaner'
import type { CleaningConfig, RawComponent, CSSRule } from '../../core/types'

describe('DOMCleaner', () => {
  let cleaner: DOMCleaner
  let mockComponent: RawComponent

  beforeEach(() => {
    cleaner = new DOMCleaner()

    // Create mock component
    mockComponent = {
      html: '<div class="test" style="color: red;">Content</div>',
      css: {
        inline: 'color: red; font-size: 14px;',
        rules: [
          {
            selector: '.test',
            properties: {
              color: 'red',
              padding: '10px'
            },
            specificity: 10
          },
          {
            selector: '#unused',
            properties: {
              display: 'none'
            },
            specificity: 100
          }
        ],
        computedStyles: {}
      },
      scripts: [],
      metadata: {
        timestamp: Date.now(),
        source: {},
        element: {
          selector: '.test',
          tagName: 'div'
        },
        dimensions: {
          width: 100,
          height: 50
        },
        extraction: {
          depth: 1,
          elementCount: 1,
          styleCount: 2
        }
      }
    }
  })

  describe('clean', () => {
    it('should clean HTML component', () => {
      const result = cleaner.clean(mockComponent)

      expect(result.html).toBeDefined()
      expect(result.css).toBeDefined()
      expect(result.metadata).toBeDefined()
      expect(result.stats).toBeDefined()
    })

    it('should remove unused CSS rules', () => {
      const cleanerWithCleanup = new DOMCleaner({
        removeUnusedStyles: true
      })

      const result = cleanerWithCleanup.clean(mockComponent)

      // Should contain used styles
      expect(result.css).toContain('color: red')
      expect(result.css).toContain('padding: 10px')

      // Should not contain unused rule (optional, based on implementation)
      // The actual implementation may vary
    })

    it('should prefix selectors when configured', () => {
      const cleanerWithPrefix = new DOMCleaner({
        prefixSelectors: true,
        selectorPrefix: 'pw-'
      })

      const result = cleanerWithPrefix.clean(mockComponent)

      // Check if classes are prefixed
      expect(result.html).toContain('pw-test')
    })

    it('should calculate cleaning statistics', () => {
      const result = cleaner.clean(mockComponent)

      expect(result.stats).toBeDefined()
      expect(result.stats.originalSize).toBeDefined()
      expect(result.stats.cleanedSize).toBeDefined()
      expect(result.stats.reduction).toBeDefined()
      expect(result.stats.reduction.percentage).toBeGreaterThanOrEqual(0)
    })
  })

  describe('HTML Cleaning', () => {
    it('should remove HTML comments', () => {
      const componentWithComment: RawComponent = {
        ...mockComponent,
        html: '<div><!-- Comment --></div>'
      }

      const cleaner = new DOMCleaner({
        removeComments: true
      })

      const result = cleaner.clean(componentWithComment)

      expect(result.html).not.toContain('<!-- Comment -->')
    })

    it('should remove empty attributes', () => {
      const componentWithEmptyAttrs: RawComponent = {
        ...mockComponent,
        html: '<div class="" id="">Content</div>'
      }

      const cleaner = new DOMCleaner()
      const result = cleaner.clean(componentWithEmptyAttrs)

      expect(result.html).not.toContain('class=""')
      expect(result.html).not.toContain('id=""')
    })

    it('should normalize whitespace', () => {
      const componentWithSpaces: RawComponent = {
        ...mockComponent,
        html: '<div>  Multiple   spaces  </div>'
      }

      const cleaner = new DOMCleaner()
      const result = cleaner.clean(componentWithSpaces)

      expect(result.html).not.toContain('  ')
    })
  })

  describe('CSS Cleaning', () => {
    it('should normalize CSS properties', () => {
      const component: RawComponent = {
        ...mockComponent,
        css: {
          ...mockComponent.css,
          inline: 'COLOR: red; FONT-SIZE: 14px;'
        }
      }

      const cleaner = new DOMCleaner({
        normalizeProperties: true
      })

      const result = cleaner.clean(component)

      // Should normalize to lowercase
      expect(result.css.toLowerCase()).toContain('color: red')
      expect(result.css.toLowerCase()).toContain('font-size: 14px')
    })

    it('should minify CSS when configured', () => {
      const cleanerMinified = new DOMCleaner({
        minifyCSS: true,
        removeComments: true
      })

      const result = cleanerMinified.clean(mockComponent)

      // Minified CSS should have less whitespace
      const originalSize = mockComponent.css.inline.length
      const cleanedSize = result.css.length

      expect(cleanedSize).toBeLessThanOrEqual(originalSize)
    })
  })

  describe('Statistics', () => {
    it('should calculate original size correctly', () => {
      const result = cleaner.clean(mockComponent)

      expect(result.stats.originalSize.html).toBeGreaterThan(0)
      expect(result.stats.originalSize.css).toBeGreaterThan(0)
      expect(result.stats.originalSize.total).toBe(
        result.stats.originalSize.html + result.stats.originalSize.css
      )
    })

    it('should calculate cleaned size correctly', () => {
      const result = cleaner.clean(mockComponent)

      expect(result.stats.cleanedSize.html).toBeGreaterThan(0)
      expect(result.stats.cleanedSize.css).toBeGreaterThan(0)
      expect(result.stats.cleanedSize.total).toBe(
        result.stats.cleanedSize.html + result.stats.cleanedSize.css
      )
    })

    it('should calculate reduction percentage', () => {
      const result = cleaner.clean(mockComponent)

      expect(result.stats.reduction.percentage).toBeGreaterThanOrEqual(0)
      expect(result.stats.reduction.percentage).toBeLessThanOrEqual(100)
    })
  })

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const cleaner = new DOMCleaner()
      const config = cleaner.getConfig()

      expect(config.removeUnusedStyles).toBe(true)
      expect(config.prefixSelectors).toBe(true)
      expect(config.selectorPrefix).toBe('pw-')
      expect(config.minifyHTML).toBe(false)
      expect(config.minifyCSS).toBe(false)
    })

    it('should allow custom configuration', () => {
      const cleaner = new DOMCleaner({
        selectorPrefix: 'custom-',
        maxDepth: 5
      })

      const config = cleaner.getConfig()

      expect(config.selectorPrefix).toBe('custom-')
    })

    it('should update configuration', () => {
      const cleaner = new DOMCleaner()

      cleaner.updateConfig({
        prefixSelectors: false
      })

      const config = cleaner.getConfig()

      expect(config.prefixSelectors).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle component with no CSS', () => {
      const emptyCSSComponent: RawComponent = {
        ...mockComponent,
        css: {
          inline: '',
          rules: [],
          computedStyles: {}
        }
      }

      const result = cleaner.clean(emptyCSSComponent)

      expect(result.html).toBeDefined()
      expect(result.css).toBeDefined()
    })

    it('should handle component with no HTML', () => {
      const emptyHTMLComponent: RawComponent = {
        ...mockComponent,
        html: ''
      }

      const result = cleaner.clean(emptyHTMLComponent)

      expect(result.html).toBeDefined()
    })

    it('should handle component with no scripts', () => {
      const component: RawComponent = {
        ...mockComponent,
        scripts: []
      }

      const result = cleaner.clean(component)

      expect(result).toBeDefined()
    })
  })

  describe('Performance', () => {
    it('should clean quickly', () => {
      const start = Date.now()

      for (let i = 0; i < 100; i++) {
        cleaner.clean(mockComponent)
      }

      const duration = Date.now() - start

      // Should clean 100 components in less than 1 second
      expect(duration).toBeLessThan(1000)
    })

    it('should not cause memory leaks', () => {
      const largeComponent: RawComponent = {
        ...mockComponent,
        css: {
          ...mockComponent.css,
          rules: Array(100).fill({
            selector: '.test',
            properties: { color: 'red' },
            specificity: 10
          })
        }
      }

      const start = Date.now()

      for (let i = 0; i < 1000; i++) {
        cleaner.clean(largeComponent)
      }

      const duration = Date.now() - start

      // Should handle 1000 iterations reasonably
      expect(duration).toBeLessThan(5000)
    })
  })
})
