/**
 * PageWhisper Core Engine - Framework Detector Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { FrameworkDetector } from '../../core/detector/FrameworkDetector'
import type { DetectionConfig, DocumentContext } from '../../core/types'

describe('FrameworkDetector', () => {
  let detector: FrameworkDetector

  beforeEach(() => {
    detector = new FrameworkDetector()
  })

  describe('detect', () => {
    it('should detect React from global variables', () => {
      const context: DocumentContext = {
        html: '<div id="root"></div>',
        scripts: [],
        styles: [],
        metaTags: {},
        globalVariables: ['React', 'ReactDOM']
      }

      const result = detector.detect(context)

      expect(result.frameworks.length).toBeGreaterThan(0)

      const react = result.frameworks.find(f => f.name === 'react')
      expect(react).toBeDefined()
      expect(react?.confidence).toBeGreaterThan(0.8)
    })

    it('should detect Vue from data attributes', () => {
      const context: DocumentContext = {
        html: '<div v-if="show">Content</div>',
        scripts: [],
        styles: [],
        metaTags: {},
        globalVariables: []
      }

      const result = detector.detect(context)

      const vue = result.frameworks.find(f => f.name === 'vue')
      expect(vue).toBeDefined()
      expect(vue?.confidence).toBeGreaterThan(0.8)
    })

    it('should detect Angular from ng-app directive', () => {
      const context: DocumentContext = {
        html: '<div ng-app="myApp"></div>',
        scripts: [],
        styles: [],
        metaTags: {},
        globalVariables: ['ng']
      }

      const result = detector.detect(context)

      const angular = result.frameworks.find(f => f.name === 'angular')
      expect(angular).toBeDefined()
    })

    it('should detect multiple frameworks', () => {
      const context: DocumentContext = {
        html: '<div class="react-root"></div>',
        scripts: [],
        styles: [],
        metaTags: {},
        globalVariables: ['React', 'Vue']
      }

      const result = detector.detect(context)

      expect(result.frameworks.length).toBeGreaterThanOrEqual(2)
    })

    it('should detect CSS frameworks', () => {
      const context: DocumentContext = {
        html: '<button class="btn btn-primary">Click</button>',
        scripts: [],
        styles: [{
          content: '.btn { padding: 10px; }'
        }],
        metaTags: {},
        globalVariables: []
      }

      const result = detector.detect(context)

      expect(result.cssFrameworks.length).toBeGreaterThan(0)

      const bootstrap = result.cssFrameworks.find(f => f.name === 'bootstrap')
      expect(bootstrap).toBeDefined()
    })

    it('should detect Tailwind from utility classes', () => {
      const context: DocumentContext = {
        html: '<div class="flex bg-blue-500 p-4">Content</div>',
        scripts: [],
        styles: [],
        metaTags: {},
        globalVariables: []
      }

      const result = detector.detect(context)

      const tailwind = result.cssFrameworks.find(f => f.name === 'tailwind')
      expect(tailwind).toBeDefined()
    })

    it('should extract libraries from scripts', () => {
      const context: DocumentContext = {
        html: '',
        scripts: [{
          src: 'https://cdn.jsdelivr.net/npm/jquery@3.7.0/dist/jquery.min.js',
          content: '',
          type: 'text/javascript',
          async: false,
          defer: false
        }],
        styles: [],
        metaTags: {},
        globalVariables: []
      }

      const result = detector.detect(context)

      expect(result.libraries).toContain('jquery')
    })
  })

  describe('createContextFromHTML', () => {
    it('should create context from HTML string', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script src="https://cdn.react.js"></script>
        </head>
        <body>
          <div id="root"></div>
        </body>
        </html>
      `

      const context = FrameworkDetector.createContextFromHTML(html)

      expect(context).toBeDefined()
      expect(context.html).toBeDefined()
      expect(context.scripts).toBeDefined()
      expect(context.metaTags).toBeDefined()
    })

    it('should extract script tags', () => {
      const html = `
        <html>
          <head>
            <script src="https://example.com/script.js"></script>
          </head>
        </html>
      `

      const context = FrameworkDetector.createContextFromHTML(html)

      expect(context.scripts.length).toBeGreaterThan(0)
      expect(context.scripts[0].src).toContain('example.com')
    })

    it('should extract style tags', () => {
      const html = `
        <html>
          <head>
            <style>.btn { padding: 10px; }</style>
          </head>
        </html>
      `

      const context = FrameworkDetector.createContextFromHTML(html)

      expect(context.styles.length).toBeGreaterThan(0)
      expect(context.styles[0].content).toContain('padding: 10px')
    })
  })

  describe('createContextFromBrowser', () => {
    // Note: This would only work in browser environment
    // In Node.js, it will throw an error
    it('should create context from browser DOM', () => {
      if (typeof window === 'undefined') {
        expect(() => {
          FrameworkDetector.createContextFromBrowser()
        }).toThrow()
        return
      }

      const context = FrameworkDetector.createContextFromBrowser()

      expect(context).toBeDefined()
      expect(context.url).toBeDefined()
    })
  })

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const config = detector.getConfig()

      expect(config.enableHeuristics).toBe(true)
      expect(config.strictMode).toBe(false)
      expect(config.minConfidence).toBe(0.5)
    })

    it('should update configuration', () => {
      detector.updateConfig({
        minConfidence: 0.8,
        strictMode: true
      })

      const config = detector.getConfig()

      expect(config.minConfidence).toBe(0.8)
      expect(config.strictMode).toBe(true)
    })
  })

  describe('Pattern Matching', () => {
    it('should match global variable patterns', () => {
      const context: DocumentContext = {
        html: '',
        scripts: [],
        styles: [],
        metaTags: {},
        globalVariables: ['React', 'ReactDOM', '__NEXT_DATA__']
      }

      const result = detector.detect(context)

      // Should detect React
      expect(result.frameworks.some(f => f.name === 'react')).toBe(true)

      // Should detect Next.js
      expect(result.frameworks.some(f => f.name === 'nextjs')).toBe(true)
    })

    it('should match attribute patterns', () => {
      const context: DocumentContext = {
        html: '<div v-if="show">Content</div>',
        scripts: [],
        styles: [],
        metaTags: {},
        globalVariables: []
      }

      const result = detector.detect(context)

      const vue = result.frameworks.find(f => f.name === 'vue')
      expect(vue).toBeDefined()
      expect(vue?.indicators).toContain('v-if')
    })

    it('should match class patterns', () => {
      const context: DocumentContext = {
        html: '<div class="btn btn-primary">Click</div>',
        scripts: [],
        styles: [{
          content: '.btn { padding: 10px; }'
        }],
        metaTags: {},
        globalVariables: []
      }

      const result = detector.detect(context)

      expect(result.cssFrameworks.length).toBeGreaterThan(0)
    })
  })

  describe('Confidence Scoring', () => {
    it('should calculate high confidence for multiple indicators', () => {
      const context: DocumentContext = {
        html: '<div id="root" data-reactroot="true"></div>',
        scripts: [{
          src: 'https://unpkg.com/react@18/umd/react.production.min.js'
        }],
        styles: [],
        metaTags: {},
        globalVariables: ['React', 'ReactDOM']
      }

      const result = detector.detect(context)

      const react = result.frameworks.find(f => f.name === 'react')
      expect(react?.confidence).toBeGreaterThan(0.9) // Very high confidence
    })

    it('should calculate medium confidence for single indicator', () => {
      const context: DocumentContext = {
        html: '<div class="react-component"></div>',
        scripts: [],
        styles: [{
          content: '.react-component { display: flex; }'
        }],
        metaTags: {},
        globalVariables: []
      }

      const result = detector.detect(context)

      const react = result.frameworks.find(f => f.name === 'react')
      expect(react?.confidence).toBeGreaterThan(0.3) // Lower confidence
      expect(react?.confidence).toBeLessThan(0.8)
    })

    it('should not detect below min confidence threshold', () => {
      const detectorWithHighThreshold = new FrameworkDetector({
        minConfidence: 0.9
      })

      const context: DocumentContext = {
        html: '<div class="react-component"></div>',
        scripts: [],
        styles: [],
        metaTags: {},
        globalVariables: []
      }

      const result = detectorWithHighThreshold.detect(context)

      expect(result.frameworks.length).toBe(0)
    })
  })

  describe('Build Tools', () => {
    it('should detect Webpack from scripts', () => {
      const context: DocumentContext = {
        html: '',
        scripts: [{
          src: 'https://cdn.example.com/webpack.bundle.js',
          content: '',
          type: 'text/javascript',
          async: false,
          defer: false
        }],
        styles: [],
        metaTags: {},
        globalVariables: []
      }

      const result = detector.detect(context)

      expect(result.buildTools).toContain('webpack')
    })

    it('should detect Vite from scripts', () => {
      const context: DocumentContext = {
        html: '',
        scripts: [{
          src: 'https://cdn.example.com/@vite/client',
          content: '',
          type: 'text/javascript',
          async: false,
          defer: false
        }],
        styles: [],
        metaTags: {},
        globalVariables: []
      }

      const result = detector.detect(context)

      expect(result.buildTools).toContain('vite')
    })
  })

  describe('Performance', () => {
    it('should detect quickly', () => {
      const context: DocumentContext = {
        html: '<div class="btn btn-primary">Click</div>',
        scripts: [],
        styles: [],
        metaTags: {},
        globalVariables: []
      }

      const start = Date.now()

      for (let i = 0; i < 100; i++) {
        detector.detect(context)
      }

      const duration = Date.now() - start

      // Should detect 100 contexts in less than 1 second
      expect(duration).toBeLessThan(1000)
    })

    it('should handle large HTML documents', () => {
      const largeHTML = '<div>' + 'p'.repeat(1000) + '</div>'

      const context = FrameworkDetector.createContextFromHTML(largeHTML)

      const start = Date.now()

      const result = detector.detect(context)

      const duration = Date.now() - start

      expect(result).toBeDefined()
      expect(duration).toBeLessThan(500) // Should still be fast
    })
  })
})
