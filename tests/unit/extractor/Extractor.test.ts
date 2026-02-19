/**
 * PageWhisper Core Engine - DOM Extractor Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { DOMExtractor } from '../../core/extractor/Extractor'
import type { ExtractionConfig, DOMElement } from '../../core/types'

describe('DOMExtractor', () => {
  let extractor: DOMExtractor
  let mockElement: DOMElement

  beforeEach(() => {
    extractor = new DOMExtractor()

    // Create mock DOM element
    mockElement = {
      tagName: 'button',
      id: 'test-button',
      className: 'btn btn-primary',
      attributes: {
        'data-testid': 'button-1',
        'aria-label': 'Click me'
      },
      textContent: 'Click me',
      innerHTML: 'Click me',
      children: [],
      styles: {
        color: 'rgb(255, 255, 255)',
        backgroundColor: 'rgb(0, 0, 255)',
        padding: '10px 20px',
        border: '1px solid rgb(0, 0, 0)',
        borderRadius: '4px',
        cursor: 'pointer'
      },
      boundingRect: {
        x: 100,
        y: 200,
        width: 100,
        height: 40,
        top: 200,
        left: 100,
        bottom: 240,
        right: 200
      }
    }
  })

  describe('extract', () => {
    it('should extract simple button element', () => {
      const result = extractor.extract(mockElement)

      expect(result.html).toContain('<button')
      expect(result.html).toContain('test-button')
      expect(result.html).toContain('btn-primary')
      expect(result.html).toContain('Click me')
    })

    it('should extract element with inline styles', () => {
      const result = extractor.extract(mockElement)

      expect(result.css.inline).toContain('color: rgb(255, 255, 255)')
      expect(result.css.inline).toContain('background-color: rgb(0, 0, 255)')
      expect(result.css.inline).toContain('padding: 10px 20px')
    })

    it('should extract CSS rules', () => {
      const result = extractor.extract(mockElement)

      expect(result.css.rules).toBeDefined()
      expect(result.css.rules.length).toBeGreaterThan(0)

      // Check for ID selector
      const idRule = result.css.rules.find(r => r.selector === '#test-button')
      expect(idRule).toBeDefined()
      expect(idRule?.specificity).toBe(100)
    })

    it('should extract metadata', () => {
      const result = extractor.extract(mockElement)

      expect(result.metadata).toBeDefined()
      expect(result.metadata.timestamp).toBeDefined()
      expect(result.metadata.element.tagName).toBe('button')
      expect(result.metadata.element.id).toBe('test-button')
      expect(result.metadata.element.className).toBe('btn btn-primary')
    })

    it('should extract bounding rect', () => {
      const result = extractor.extract(mockElement)

      expect(result.metadata.dimensions.width).toBe(100)
      expect(result.metadata.dimensions.height).toBe(40)
    })

    it('should include descendant elements when configured', () => {
      const parentElement: DOMElement = {
        ...mockElement,
        children: [
          {
            tagName: 'span',
            id: 'icon',
            className: 'icon',
            attributes: {},
            textContent: '🎯',
            innerHTML: '🎯',
            children: [],
            styles: {}
          }
        ]
      }

      const extractorWithChildren = new DOMExtractor({
        includeDescendants: true
      })

      const result = extractorWithChildren.extract(parentElement)

      expect(result.html).toContain('span')
      expect(result.html).toContain('icon')
      expect(result.html).toContain('🎯')
    })

    it('should not include descendants when disabled', () => {
      const parentElement: DOMElement = {
        ...mockElement,
        children: [
          {
            tagName: 'span',
            id: 'icon',
            className: 'icon',
            attributes: {},
            textContent: '🎯',
            innerHTML: '🎯',
            children: [],
            styles: {}
          }
        ]
      }

      const extractorWithoutChildren = new DOMExtractor({
        includeDescendants: false
      })

      const result = extractorWithoutChildren.extract(parentElement)

      expect(result.html).not.toContain('span')
    })
  })

  describe('cleanHTML', () => {
    it('should remove empty attributes', () => {
      const element: DOMElement = {
        ...mockElement,
        attributes: {
          'class': '',
          'id': '',
          'disabled': ''
        }
      }

      const extractor = new DOMExtractor()
      const result = extractor.extract(element)

      expect(result.html).not.toContain('class=""')
      expect(result.html).not.toContain('id=""')
    })

    it('should escape HTML entities', () => {
      const element: DOMElement = {
        ...mockElement,
        textContent: '<script>alert("xss")</script>'
      }

      const extractor = new DOMExtractor()
      const result = extractor.extract(element)

      expect(result.html).not.toContain('<script>')
      expect(result.html).toContain('&lt;script&gt;')
    })
  })

  describe('CSS Rules', () => {
    it('should generate rules for ID selector', () => {
      const result = extractor.extract(mockElement)

      const idRule = result.css.rules.find(r => r.selector === '#test-button')
      expect(idRule).toBeDefined()
      expect(idRule?.properties).toBeDefined()
    })

    it('should generate rules for class selectors', () => {
      const result = extractor.extract(mockElement)

      const classRules = result.css.rules.filter(r =>
        r.selector.startsWith('.') &&
        r.selector.includes('btn')
      )

      expect(classRules.length).toBeGreaterThan(0)
    })

    it('should include element selector', () => {
      const result = extractor.extract(mockElement)

      const elementRule = result.css.rules.find(r => r.selector === 'button')
      expect(elementRule).toBeDefined()
    })
  })

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const extractor = new DOMExtractor()
      const config = extractor.getConfig()

      expect(config.includeDescendants).toBe(true)
      expect(config.includeInlineStyles).toBe(true)
      expect(config.preserveClassNames).toBe(true)
      expect(config.maxDepth).toBe(10)
    })

    it('should update configuration', () => {
      const extractor = new DOMExtractor()

      extractor.updateConfig({
        includeDescendants: false,
        maxDepth: 5
      })

      const config = extractor.getConfig()

      expect(config.includeDescendants).toBe(false)
      expect(config.maxDepth).toBe(5)
    })
  })

  describe('Edge Cases', () => {
    it('should handle element without ID', () => {
      const element: DOMElement = {
        ...mockElement,
        id: undefined
      }

      const result = extractor.extract(element)

      expect(result.html).toBeDefined()
      expect(result.metadata.element.id).toBeUndefined()
    })

    it('should handle element without classes', () => {
      const element: DOMElement = {
        ...mockElement,
        className: undefined
      }

      const result = extractor.extract(element)

      expect(result.html).toBeDefined()
      expect(result.metadata.element.className).toBeUndefined()
    })

    it('should handle empty element', () => {
      const element: DOMElement = {
        ...mockElement,
        textContent: '',
        children: []
      }

      const result = extractor.extract(element)

      expect(result.html).toBeDefined()
    })

    it('should handle element with special characters in text', () => {
      const element: DOMElement = {
        ...mockElement,
        textContent: 'Special chars: < > & " \''
      }

      const extractor = new DOMExtractor()
      const result = extractor.extract(element)

      expect(result.html).toContain('&lt;')
      expect(result.html).toContain('&gt;')
      expect(result.html).toContain('&amp;')
    })
  })
})
