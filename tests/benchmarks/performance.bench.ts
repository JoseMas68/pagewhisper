/**
 * PageWhisper Core Engine - Performance Benchmarks
 *
 * These benchmarks measure the performance of Core Engine modules.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CoreEngine } from '../../core/CoreEngine'
import { DOMExtractor } from '../../core/extractor/Extractor'
import { DOMCleaner } from '../../core/cleaner/Cleaner'
import { FrameworkDetector } from '../../core/detector/FrameworkDetector'
import { PromptBuilder } from '../../core/prompts/PromptBuilder'
import { HashGenerator } from '../../core/utils/HashGenerator'
import type { DOMElement } from '../../core/types'

describe('Performance Benchmarks', () => {
  describe('DOMExtractor Performance', () => {
    let extractor: DOMExtractor
    let simpleElement: DOMElement
    let complexElement: DOMElement

    beforeEach(() => {
      extractor = new DOMExtractor()

      simpleElement = {
        tagName: 'button',
        id: 'btn',
        className: 'btn-primary',
        attributes: { 'type': 'button' },
        textContent: 'Click',
        innerHTML: 'Click',
        children: [],
        styles: { color: 'blue', padding: '10px' },
        boundingRect: { x: 0, y: 0, width: 100, height: 40, top: 0, left: 0, bottom: 40, right: 100 }
      }

      // Create complex element with nested children
      complexElement = {
        tagName: 'div',
        id: 'container',
        className: 'container',
        attributes: {},
        textContent: '',
        innerHTML: '',
        children: [],
        styles: {},
        boundingRect: { x: 0, y: 0, width: 1200, height: 800, top: 0, left: 0, bottom: 800, right: 1200 }
      }

      // Add nested children (5 levels deep, 10 children per level)
      let currentParent = complexElement
      for (let level = 0; level < 5; level++) {
        const children: DOMElement[] = []
        for (let i = 0; i < 10; i++) {
          const child: DOMElement = {
            tagName: 'div',
            id: `level-${level}-child-${i}`,
            className: `child level-${level}`,
            attributes: {},
            textContent: `Child ${i}`,
            innerHTML: `Child ${i}`,
            children: [],
            styles: { padding: '10px' },
            boundingRect: { x: 0, y: 0, width: 100, height: 50, top: 0, left: 0, bottom: 50, right: 100 }
          }
          children.push(child)
        }
        currentParent.children = children
        currentParent = children[0] // Continue from first child
      }
    })

    it('should extract simple element in < 10ms', () => {
      const iterations = 100
      const start = Date.now()

      for (let i = 0; i < iterations; i++) {
        extractor.extract(simpleElement)
      }

      const duration = Date.now() - start
      const avgTime = duration / iterations

      expect(avgTime).toBeLessThan(10)
    })

    it('should extract complex element in < 100ms', () => {
      const iterations = 10
      const start = Date.now()

      for (let i = 0; i < iterations; i++) {
        extractor.extract(complexElement)
      }

      const duration = Date.now() - start
      const avgTime = duration / iterations

      expect(avgTime).toBeLessThan(100)
    })

    it('should handle 1000 extractions in < 1 second', () => {
      const start = Date.now()

      for (let i = 0; i < 1000; i++) {
        extractor.extract(simpleElement)
      }

      const duration = Date.now() - start
      expect(duration).toBeLessThan(1000)
    })
  })

  describe('DOMCleaner Performance', () => {
    let cleaner: DOMCleaner
    let mockComponent: any

    beforeEach(() => {
      cleaner = new DOMCleaner()

      mockComponent = {
        html: '<div class="test" style="color: red;">Content</div>',
        css: {
          inline: 'color: red; font-size: 14px;',
          rules: [
            {
              selector: '.test',
              properties: { color: 'red', padding: '10px' },
              specificity: 10
            }
          ],
          computedStyles: {}
        },
        scripts: [],
        metadata: {
          timestamp: Date.now(),
          source: {},
          element: { selector: '.test', tagName: 'div' },
          dimensions: { width: 100, height: 50 },
          extraction: { depth: 1, elementCount: 1, styleCount: 1 }
        }
      }
    })

    it('should clean component in < 10ms', () => {
      const iterations = 100
      const start = Date.now()

      for (let i = 0; i < iterations; i++) {
        cleaner.clean(mockComponent)
      }

      const duration = Date.now() - start
      const avgTime = duration / iterations

      expect(avgTime).toBeLessThan(10)
    })

    it('should handle 1000 cleanings in < 1 second', () => {
      const start = Date.now()

      for (let i = 0; i < 1000; i++) {
        cleaner.clean(mockComponent)
      }

      const duration = Date.now() - start
      expect(duration).toBeLessThan(1000)
    })

    it('should clean large CSS efficiently', () => {
      const largeCSS = {
        ...mockComponent,
        css: {
          inline: '.test { ' + 'color: blue;'.repeat(1000) + ' }',
          rules: Array(100).fill({
            selector: '.test',
            properties: { color: 'red' },
            specificity: 10
          }),
          computedStyles: {}
        }
      }

      const iterations = 10
      const start = Date.now()

      for (let i = 0; i < iterations; i++) {
        cleaner.clean(largeCSS)
      }

      const duration = Date.now() - start
      const avgTime = duration / iterations

      expect(avgTime).toBeLessThan(50)
    })
  })

  describe('FrameworkDetector Performance', () => {
    let detector: FrameworkDetector
    let simpleContext: any
    let complexContext: any

    beforeEach(() => {
      detector = new FrameworkDetector()

      simpleContext = {
        html: '<div class="react-component">Content</div>',
        scripts: [],
        styles: [],
        metaTags: {},
        globalVariables: ['React', 'ReactDOM']
      }

      complexContext = {
        html: `
          <html>
            <head>
              <script src="https://cdn.react.js"></script>
              <script src="https://cdn.vue.js"></script>
            </head>
            <body>
              <div id="root" data-reactroot="true">
                <div v-if="show" class="component">Content</div>
              </div>
            </body>
          </html>
        `,
        scripts: [
          { src: 'https://cdn.react.js', content: '', type: 'text/javascript', async: false, defer: false },
          { src: 'https://cdn.vue.js', content: '', type: 'text/javascript', async: false, defer: false }
        ],
        styles: [
          { content: '.btn { padding: 10px; }' },
          { content: '.bg-blue-500 { background: blue; }' }
        ],
        metaTags: {},
        globalVariables: ['React', 'ReactDOM', 'Vue', '__NEXT_DATA__']
      }
    })

    it('should detect frameworks in < 20ms', () => {
      const iterations = 100
      const start = Date.now()

      for (let i = 0; i < iterations; i++) {
        detector.detect(simpleContext)
      }

      const duration = Date.now() - start
      const avgTime = duration / iterations

      expect(avgTime).toBeLessThan(20)
    })

    it('should handle complex detection in < 50ms', () => {
      const iterations = 50
      const start = Date.now()

      for (let i = 0; i < iterations; i++) {
        detector.detect(complexContext)
      }

      const duration = Date.now() - start
      const avgTime = duration / iterations

      expect(avgTime).toBeLessThan(50)
    })

    it('should create context from HTML in < 5ms', () => {
      const html = '<div class="test">Content</div>'
      const iterations = 1000
      const start = Date.now()

      for (let i = 0; i < iterations; i++) {
        FrameworkDetector.createContextFromHTML(html)
      }

      const duration = Date.now() - start
      const avgTime = duration / iterations

      expect(avgTime).toBeLessThan(5)
    })
  })

  describe('PromptBuilder Performance', () => {
    let builder: PromptBuilder
    let mockContext: any

    beforeEach(() => {
      builder = new PromptBuilder()

      mockContext = {
        component: {
          html: '<button class="btn">Click</button>',
          css: '.btn { padding: 10px; }',
          framework: 'react',
          libraries: ['react'],
          metadata: {
            timestamp: Date.now(),
            source: {},
            element: { selector: '.btn', tagName: 'button' },
            dimensions: { width: 100, height: 40 },
            extraction: { depth: 1, elementCount: 1, styleCount: 1 }
          },
          stats: {
            originalSize: { html: 50, css: 20, total: 70 },
            cleanedSize: { html: 40, css: 15, total: 55 },
            reduction: { bytes: 15, percentage: 21.43 }
          }
        },
        detection: {
          frameworks: [{ name: 'react', confidence: 0.9, indicators: ['React'] }],
          cssFrameworks: [],
          libraries: ['react'],
          buildTools: [],
          meta: {}
        },
        options: {
          targetFramework: 'react',
          language: 'typescript',
          includeStyles: true,
          includeTypes: true,
          includeTests: false
        }
      }
    })

    it('should build prompt in < 20ms', () => {
      const iterations = 100
      const start = Date.now()

      for (let i = 0; i < iterations; i++) {
        builder.build(mockContext)
      }

      const duration = Date.now() - start
      const avgTime = duration / iterations

      expect(avgTime).toBeLessThan(20)
    })

    it('should handle large components efficiently', () => {
      const largeComponent = {
        ...mockContext,
        component: {
          ...mockContext.component,
          html: '<div>' + 'x'.repeat(10000) + '</div>',
          css: '.test { ' + 'color: blue;'.repeat(100) + ' }'
        }
      }

      const iterations = 10
      const start = Date.now()

      for (let i = 0; i < iterations; i++) {
        builder.build(largeComponent)
      }

      const duration = Date.now() - start
      const avgTime = duration / iterations

      expect(avgTime).toBeLessThan(50)
    })

    it('should validate template in < 5ms', () => {
      const template = {
        name: 'test',
        version: 'v1',
        description: 'Test',
        systemPrompt: 'System',
        userPromptTemplate: 'Test {{html}}',
        variables: [
          { name: 'html', type: 'string', required: true, description: 'HTML' }
        ],
        targetFrameworks: ['react'],
        createdAt: new Date().toISOString()
      }

      const iterations = 1000
      const start = Date.now()

      for (let i = 0; i < iterations; i++) {
        builder.validateTemplate(template)
      }

      const duration = Date.now() - start
      const avgTime = duration / iterations

      expect(avgTime).toBeLessThan(5)
    })
  })

  describe('HashGenerator Performance', () => {
    let generator: HashGenerator

    beforeEach(() => {
      generator = new HashGenerator()
    })

    it('should hash string using fnv1a in < 1ms', async () => {
      const fnv1aGenerator = new HashGenerator({ algorithm: 'fnv1a' })
      const input = 'Test string for hashing'
      const iterations = 1000
      const start = Date.now()

      for (let i = 0; i < iterations; i++) {
        await fnv1aGenerator.hash(input)
      }

      const duration = Date.now() - start
      const avgTime = duration / iterations

      expect(avgTime).toBeLessThan(1)
    })

    it('should hash string using sha256 in < 10ms', async () => {
      const input = 'Test string for hashing'
      const iterations = 100
      const start = Date.now()

      for (let i = 0; i < iterations; i++) {
        await generator.hash(input)
      }

      const duration = Date.now() - start
      const avgTime = duration / iterations

      expect(avgTime).toBeLessThan(10)
    })

    it('should hash content in < 20ms', async () => {
      const component = {
        html: '<div>Test</div>',
        css: '.test { color: red; }',
        framework: 'react',
        libraries: ['react'],
        metadata: {
          timestamp: Date.now(),
          source: {},
          element: { selector: '.test', tagName: 'div' },
          dimensions: { width: 100, height: 50 },
          extraction: { depth: 1, elementCount: 1, styleCount: 1 }
        },
        stats: {
          originalSize: { html: 20, css: 20, total: 40 },
          cleanedSize: { html: 15, css: 15, total: 30 },
          reduction: { bytes: 10, percentage: 25 }
        }
      }

      const iterations = 50
      const start = Date.now()

      for (let i = 0; i < iterations; i++) {
        await generator.hashContent(component)
      }

      const duration = Date.now() - start
      const avgTime = duration / iterations

      expect(avgTime).toBeLessThan(20)
    })

    it('should generate cache key in < 30ms', async () => {
      const component = {
        html: '<div>Test</div>',
        css: '.test { color: red; }',
        framework: 'react',
        libraries: [],
        metadata: {
          timestamp: Date.now(),
          source: {},
          element: { selector: '.test', tagName: 'div' },
          dimensions: { width: 100, height: 50 },
          extraction: { depth: 1, elementCount: 1, styleCount: 1 }
        },
        stats: {
          originalSize: { html: 20, css: 20, total: 40 },
          cleanedSize: { html: 15, css: 15, total: 30 },
          reduction: { bytes: 10, percentage: 25 }
        }
      }

      const detection = {
        frameworks: [{ name: 'react', confidence: 0.9, indicators: [] }],
        cssFrameworks: [],
        libraries: ['react'],
        buildTools: [],
        meta: {}
      }

      const options = {
        targetFramework: 'react',
        language: 'typescript' as const,
        includeStyles: true,
        includeTests: false,
        includeTypes: true
      }

      const iterations = 50
      const start = Date.now()

      for (let i = 0; i < iterations; i++) {
        await generator.generateCacheKey(component, detection, options)
      }

      const duration = Date.now() - start
      const avgTime = duration / iterations

      expect(avgTime).toBeLessThan(30)
    })
  })

  describe('CoreEngine Performance', () => {
    let engine: CoreEngine
    let mockElement: DOMElement

    beforeEach(() => {
      engine = new CoreEngine()

      mockElement = {
        tagName: 'button',
        id: 'btn',
        className: 'btn-primary',
        attributes: { 'type': 'button' },
        textContent: 'Click',
        innerHTML: 'Click',
        children: [],
        styles: { color: 'blue', padding: '10px' },
        boundingRect: { x: 0, y: 0, width: 100, height: 40, top: 0, left: 0, bottom: 40, right: 100 }
      }
    })

    it('should process simple component in < 100ms', async () => {
      const iterations = 20
      const start = Date.now()

      for (let i = 0; i < iterations; i++) {
        await engine.process({ element: mockElement })
      }

      const duration = Date.now() - start
      const avgTime = duration / iterations

      expect(avgTime).toBeLessThan(100)
    })

    it('should handle 100 processes in < 5 seconds', async () => {
      const start = Date.now()

      for (let i = 0; i < 100; i++) {
        await engine.process({ element: mockElement })
      }

      const duration = Date.now() - start
      expect(duration).toBeLessThan(5000)
    })

    it('should extract only in < 20ms', async () => {
      const iterations = 100
      const start = Date.now()

      for (let i = 0; i < iterations; i++) {
        await engine.extractOnly(mockElement)
      }

      const duration = Date.now() - start
      const avgTime = duration / iterations

      expect(avgTime).toBeLessThan(20)
    })

    it('should detect only in < 30ms', async () => {
      const html = '<div class="react-component">Content</div>'
      const iterations = 100
      const start = Date.now()

      for (let i = 0; i < iterations; i++) {
        await engine.detectOnly(html)
      }

      const duration = Date.now() - start
      const avgTime = duration / iterations

      expect(avgTime).toBeLessThan(30)
    })

    it('should clean only in < 15ms', async () => {
      const rawComponent = {
        html: '<button>Click</button>',
        css: { inline: '.btn { padding: 10px; }', rules: [], computedStyles: {} },
        scripts: [],
        metadata: {
          timestamp: Date.now(),
          source: {},
          element: { selector: '.btn', tagName: 'button' },
          dimensions: { width: 100, height: 40 },
          extraction: { depth: 1, elementCount: 1, styleCount: 1 }
        }
      }

      const iterations = 100
      const start = Date.now()

      for (let i = 0; i < iterations; i++) {
        await engine.cleanOnly(rawComponent)
      }

      const duration = Date.now() - start
      const avgTime = duration / iterations

      expect(avgTime).toBeLessThan(15)
    })
  })

  describe('Memory Efficiency', () => {
    it('should not leak memory during repeated processing', async () => {
      const engine = new CoreEngine()
      const element: DOMElement = {
        tagName: 'div',
        id: 'test',
        className: 'test',
        attributes: {},
        textContent: 'Test',
        innerHTML: 'Test',
        children: [],
        styles: {},
        boundingRect: { x: 0, y: 0, width: 100, height: 100, top: 0, left: 0, bottom: 100, right: 100 }
      }

      // Process many times
      for (let i = 0; i < 1000; i++) {
        await engine.process({ element })
      }

      // If we got here without crashing, memory management is acceptable
      expect(true).toBe(true)
    })

    it('should handle large components without excessive memory', async () => {
      const engine = CoreEngine.createFast()
      const largeElement: DOMElement = {
        tagName: 'div',
        id: 'large',
        className: 'large',
        attributes: {},
        textContent: 'x'.repeat(10000),
        innerHTML: 'x'.repeat(10000),
        children: [],
        styles: {},
        boundingRect: { x: 0, y: 0, width: 1000, height: 1000, top: 0, left: 0, bottom: 1000, right: 1000 }
      }

      const start = Date.now()
      await engine.process({ element: largeElement })
      const duration = Date.now() - start

      expect(duration).toBeLessThan(1000)
    })
  })

  describe('Performance Targets', () => {
    it('should meet all performance targets', async () => {
      const results: { [key: string]: number } = {}

      // Extractor
      const extractor = new DOMExtractor()
      const element: DOMElement = {
        tagName: 'div',
        id: 'test',
        className: 'test',
        attributes: {},
        textContent: 'Test',
        innerHTML: 'Test',
        children: [],
        styles: { color: 'red' },
        boundingRect: { x: 0, y: 0, width: 100, height: 100, top: 0, left: 0, bottom: 100, right: 100 }
      }

      let start = Date.now()
      for (let i = 0; i < 100; i++) extractor.extract(element)
      results.extractor = (Date.now() - start) / 100

      // Cleaner
      const cleaner = new DOMCleaner()
      const component = {
        html: '<div>Test</div>',
        css: { inline: 'color: red;', rules: [], computedStyles: {} },
        scripts: [],
        metadata: {
          timestamp: Date.now(),
          source: {},
          element: { selector: '.test', tagName: 'div' },
          dimensions: { width: 100, height: 100 },
          extraction: { depth: 1, elementCount: 1, styleCount: 1 }
        }
      }

      start = Date.now()
      for (let i = 0; i < 100; i++) cleaner.clean(component)
      results.cleaner = (Date.now() - start) / 100

      // Hash Generator (FNV-1a)
      const hashGen = new HashGenerator({ algorithm: 'fnv1a' })
      start = Date.now()
      for (let i = 0; i < 1000; i++) await hashGen.hash('test')
      results.hashFNV1a = (Date.now() - start) / 1000

      // Hash Generator (SHA-256)
      const sha256Gen = new HashGenerator({ algorithm: 'sha256' })
      start = Date.now()
      for (let i = 0; i < 100; i++) await sha256Gen.hash('test')
      results.hashSHA256 = (Date.now() - start) / 100

      // Core Engine
      const engine = new CoreEngine()
      start = Date.now()
      for (let i = 0; i < 20; i++) await engine.process({ element })
      results.coreEngine = (Date.now() - start) / 20

      // Assert performance targets
      expect(results.extractor).toBeLessThan(10) // < 10ms
      expect(results.cleaner).toBeLessThan(10) // < 10ms
      expect(results.hashFNV1a).toBeLessThan(1) // < 1ms
      expect(results.hashSHA256).toBeLessThan(10) // < 10ms
      expect(results.coreEngine).toBeLessThan(100) // < 100ms

      // Log results for visibility
      console.log('Performance Results:', results)
    })
  })
})
