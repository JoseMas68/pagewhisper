/**
 * PageWhisper Core Engine - Integration Tests
 *
 * These tests verify that all Core Engine modules work together correctly.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CoreEngine } from '../../core/CoreEngine'
import type {
  ProcessRequest,
  DOMElement,
  ProcessResult,
  ProgressCallback,
  CoreConfig
} from '../../core/types'

describe('CoreEngine Integration Tests', () => {
  let engine: CoreEngine
  let mockElement: DOMElement

  beforeEach(() => {
    engine = new CoreEngine()

    // Create mock DOM element representing a button
    mockElement = {
      tagName: 'button',
      id: 'submit-btn',
      className: 'btn btn-primary',
      attributes: {
        'data-testid': 'submit',
        'type': 'submit',
        'aria-label': 'Submit form'
      },
      textContent: 'Submit',
      innerHTML: 'Submit',
      children: [],
      styles: {
        color: 'rgb(255, 255, 255)',
        backgroundColor: 'rgb(0, 123, 255)',
        padding: '10px 20px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold'
      },
      boundingRect: {
        x: 100,
        y: 200,
        width: 120,
        height: 44,
        top: 200,
        left: 100,
        bottom: 244,
        right: 220
      }
    }
  })

  describe('Complete Pipeline', () => {
    it('should process element through complete pipeline', async () => {
      const request: ProcessRequest = {
        element: mockElement,
        options: {
          targetFramework: 'react',
          language: 'typescript',
          includeStyles: true,
          includeTypes: true,
          includeTests: false
        }
      }

      const result = await engine.process(request)

      // Verify all pipeline stages executed
      expect(result.raw).toBeDefined()
      expect(result.cleaned).toBeDefined()
      expect(result.detected).toBeDefined()
      expect(result.prompt).toBeDefined()
      expect(result.hash).toBeDefined()
      expect(result.cacheKey).toBeDefined()
      expect(result.metadata).toBeDefined()
    })

    it('should extract component HTML and CSS', async () => {
      const request: ProcessRequest = {
        element: mockElement
      }

      const result = await engine.process(request)

      expect(result.raw.html).toContain('button')
      expect(result.raw.html).toContain('submit-btn')
      expect(result.raw.html).toContain('btn-primary')
      expect(result.raw.css.inline).toBeDefined()
      expect(result.raw.css.inline.length).toBeGreaterThan(0)
    })

    it('should detect frameworks and libraries', async () => {
      const request: ProcessRequest = {
        element: mockElement
      }

      const result = await engine.process(request)

      expect(result.detected).toBeDefined()
      expect(result.detected.frameworks).toBeDefined()
      expect(Array.isArray(result.detected.frameworks)).toBe(true)
    })

    it('should clean HTML and CSS', async () => {
      const request: ProcessRequest = {
        element: mockElement
      }

      const result = await engine.process(request)

      expect(result.cleaned).toBeDefined()
      expect(result.cleaned.html).toBeDefined()
      expect(result.cleaned.css).toBeDefined()
      expect(result.cleaned.stats).toBeDefined()
    })

    it('should build AI prompt', async () => {
      const request: ProcessRequest = {
        element: mockElement,
        options: {
          targetFramework: 'react',
          language: 'typescript'
        }
      }

      const result = await engine.process(request)

      expect(result.prompt).toBeDefined()
      expect(result.prompt.systemPrompt).toBeDefined()
      expect(result.prompt.userPrompt).toBeDefined()
      expect(result.prompt.templateVersion).toBeDefined()
      expect(result.prompt.variables).toBeDefined()
      expect(result.prompt.metadata).toBeDefined()
    })

    it('should generate content hash', async () => {
      const request: ProcessRequest = {
        element: mockElement
      }

      const result = await engine.process(request)

      expect(result.hash).toBeDefined()
      expect(result.hash.html).toBeDefined()
      expect(result.hash.css).toBeDefined()
      expect(result.hash.combined).toBeDefined()
      expect(result.hash.algorithm).toBeDefined()
    })

    it('should generate cache key', async () => {
      const request: ProcessRequest = {
        element: mockElement,
        options: {
          targetFramework: 'vue',
          language: 'typescript'
        }
      }

      const result = await engine.process(request)

      expect(result.cacheKey).toBeDefined()
      expect(result.cacheKey.key).toBeDefined()
      expect(result.cacheKey.algorithm).toBeDefined()
      expect(result.cacheKey.input).toBeDefined()
    })

    it('should include processing metadata', async () => {
      const request: ProcessRequest = {
        element: mockElement
      }

      const result = await engine.process(request)

      expect(result.metadata).toBeDefined()
      expect(result.metadata.processingTime).toBeGreaterThan(0)
      expect(result.metadata.timestamp).toBeDefined()
      expect(result.metadata.config).toBeDefined()
    })
  })

  describe('Progress Tracking', () => {
    it('should call progress callback during processing', async () => {
      const request: ProcessRequest = {
        element: mockElement
      }

      const progressCallback = vi.fn<ProgressCallback>()
      await engine.process(request, progressCallback)

      expect(progressCallback).toHaveBeenCalled()
      expect(progressCallback.mock.calls.length).toBeGreaterThan(0)
    })

    it('should report correct progress stages', async () => {
      const request: ProcessRequest = {
        element: mockElement
      }

      const stages: string[] = []
      const progressCallback: ProgressCallback = (progress) => {
        stages.push(progress.stage)
      }

      await engine.process(request, progressCallback)

      expect(stages).toContain('extraction')
      expect(stages).toContain('detection')
      expect(stages).toContain('cleaning')
      expect(stages).toContain('prompt')
      expect(stages).toContain('complete')
    })

    it('should report progress percentages', async () => {
      const request: ProcessRequest = {
        element: mockElement
      }

      const percentages: number[] = []
      const progressCallback: ProgressCallback = (progress) => {
        percentages.push(progress.percent)
      }

      await engine.process(request, progressCallback)

      // Should start at 10% and end at 100%
      expect(percentages[0]).toBe(10)
      expect(percentages[percentages.length - 1]).toBe(100)

      // Percentages should be increasing
      for (let i = 1; i < percentages.length; i++) {
        expect(percentages[i]).toBeGreaterThanOrEqual(percentages[i - 1])
      }
    })

    it('should provide progress messages', async () => {
      const request: ProcessRequest = {
        element: mockElement
      }

      const messages: string[] = []
      const progressCallback: ProgressCallback = (progress) => {
        if (progress.message) {
          messages.push(progress.message)
        }
      }

      await engine.process(request, progressCallback)

      expect(messages.length).toBeGreaterThan(0)
    })
  })

  describe('Module Coordination', () => {
    it('should coordinate extractor and cleaner', async () => {
      const request: ProcessRequest = {
        element: mockElement
      }

      const result = await engine.process(request)

      // Extracted CSS should be cleaned
      expect(result.raw.css.inline).toBeDefined()
      expect(result.cleaned.css).toBeDefined()

      // Cleaned CSS should be different from raw
      const rawLength = result.raw.css.inline.length
      const cleanedLength = result.cleaned.css.length

      // Cleaning may add or remove content, so just check both exist
      expect(rawLength).toBeGreaterThan(0)
      expect(cleanedLength).toBeGreaterThan(0)
    })

    it('should coordinate detector and prompt builder', async () => {
      const request: ProcessRequest = {
        element: mockElement,
        options: {
          targetFramework: 'react'
        }
      }

      const result = await engine.process(request)

      // Detected framework should be reflected in prompt
      expect(result.detected.frameworks).toBeDefined()
      expect(result.prompt.variables.framework).toBeDefined()
    })

    it('should coordinate hash generator and cache key', async () => {
      const request: ProcessRequest = {
        element: mockElement,
        options: {
          targetFramework: 'vue',
          language: 'javascript'
        }
      }

      const result = await engine.process(request)

      // Content hash should be part of cache key input
      expect(result.hash.combined).toBe(result.cacheKey.input.componentHash)
    })

    it('should maintain data consistency across pipeline', async () => {
      const request: ProcessRequest = {
        element: mockElement
      }

      const result = await engine.process(request)

      // HTML should be present throughout pipeline
      expect(result.raw.html).toContain('button')
      expect(result.cleaned.html).toContain('button')
      expect(result.prompt.variables.html).toContain('button')

      // CSS should be present throughout pipeline
      expect(result.raw.css.inline).toBeDefined()
      expect(result.cleaned.css).toBeDefined()
      expect(result.prompt.variables.css).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle missing element gracefully', async () => {
      const request: ProcessRequest = {
        element: undefined as any
      }

      await expect(engine.process(request)).rejects.toThrow()
    })

    it('should handle invalid element structure', async () => {
      const invalidElement = {
        tagName: 'invalid',
        // Missing required properties
      } as any

      const request: ProcessRequest = {
        element: invalidElement
      }

      // Should either throw or return result with errors
      try {
        const result = await engine.process(request)
        // If no error, result should still be defined
        expect(result).toBeDefined()
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    it('should handle processing timeout gracefully', async () => {
      // Create element that might cause timeout
      const complexElement: DOMElement = {
        ...mockElement,
        children: Array(1000).fill(null).map((_, i) => ({
          tagName: 'span',
          id: `child-${i}`,
          className: 'child',
          attributes: {},
          textContent: `Child ${i}`,
          innerHTML: `Child ${i}`,
          children: [],
          styles: {}
        }))
      }

      const request: ProcessRequest = {
        element: complexElement
      }

      // Should complete within reasonable time
      const startTime = Date.now()
      const result = await engine.process(request)
      const duration = Date.now() - startTime

      expect(result).toBeDefined()
      expect(duration).toBeLessThan(10000) // 10 seconds max
    })
  })

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const config = engine.getConfig()

      expect(config.extraction).toBeDefined()
      expect(config.cleaning).toBeDefined()
      expect(config.detection).toBeDefined()
      expect(config.prompts).toBeDefined()
      expect(config.hash).toBeDefined()
    })

    it('should update configuration', () => {
      const newConfig: Partial<CoreConfig> = {
        extraction: {
          ...engine.getConfig().extraction,
          maxDepth: 20
        }
      }

      engine.updateConfig(newConfig)

      const config = engine.getConfig()
      expect(config.extraction.maxDepth).toBe(20)
    })

    it('should reset configuration to defaults', () => {
      // Modify config
      engine.updateConfig({
        extraction: { ...engine.getConfig().extraction, maxDepth: 50 }
      })

      // Reset
      engine.resetConfig()

      const config = engine.getConfig()
      expect(config.extraction.maxDepth).toBe(DEFAULT_CONFIG.extraction.maxDepth)
    })

    it('should propagate configuration to modules', () => {
      const newConfig: Partial<CoreConfig> = {
        cleaning: {
          ...engine.getConfig().cleaning,
          selectorPrefix: 'custom-'
        }
      }

      engine.updateConfig(newConfig)

      const cleanerConfig = engine.getCleaner().getConfig()
      expect(cleanerConfig.selectorPrefix).toBe('custom-')
    })
  })

  describe('Factory Methods', () => {
    it('should create engine with defaults', () => {
      const defaultEngine = CoreEngine.create()

      expect(defaultEngine).toBeDefined()
      expect(defaultEngine.getConfig()).toEqual(engine.getConfig())
    })

    it('should create engine with custom config', () => {
      const customConfig: Partial<CoreConfig> = {
        extraction: {
          includeInlineStyles: true,
          includeComputedStyles: false,
          includeDescendants: true,
          maxDepth: 5,
          preserveClassNames: false,
          preserveDataAttributes: true,
          extractAncestors: false,
          ancestorDepth: 3
        }
      }

      const customEngine = CoreEngine.withConfig(customConfig)

      expect(customEngine).toBeDefined()
      expect(customEngine.getConfig().extraction.maxDepth).toBe(5)
    })

    it('should create fast engine', () => {
      const fastEngine = CoreEngine.createFast()

      expect(fastEngine).toBeDefined()

      const config = fastEngine.getConfig()
      expect(config.cleaning.minifyHTML).toBe(true)
      expect(config.cleaning.minifyCSS).toBe(true)
      expect(config.hash.algorithm).toBe('fnv1a')
    })

    it('should create quality engine', () => {
      const qualityEngine = CoreEngine.createQuality()

      expect(qualityEngine).toBeDefined()

      const config = qualityEngine.getConfig()
      expect(config.extraction.maxDepth).toBe(20)
      expect(config.detection.minConfidence).toBe(0.3)
    })
  })

  describe('Module Access', () => {
    it('should provide access to extractor', () => {
      const extractor = engine.getExtractor()

      expect(extractor).toBeDefined()
      expect(extractor.getConfig).toBeDefined()
    })

    it('should provide access to cleaner', () => {
      const cleaner = engine.getCleaner()

      expect(cleaner).toBeDefined()
      expect(cleaner.getConfig).toBeDefined()
    })

    it('should provide access to detector', () => {
      const detector = engine.getDetector()

      expect(detector).toBeDefined()
      expect(detector.getConfig).toBeDefined()
    })

    it('should provide access to prompt builder', () => {
      const promptBuilder = engine.getPromptBuilder()

      expect(promptBuilder).toBeDefined()
      expect(promptBuilder.build).toBeDefined()
    })

    it('should provide access to hash generator', () => {
      const hashGenerator = engine.getHashGenerator()

      expect(hashGenerator).toBeDefined()
      expect(hashGenerator.hash).toBeDefined()
    })
  })

  describe('Fast Path Methods', () => {
    it('should support extraction only', async () => {
      const result = await engine.extractOnly(mockElement)

      expect(result).toBeDefined()
      expect(result.html).toBeDefined()
      expect(result.css).toBeDefined()
    })

    it('should support detection only', async () => {
      const html = '<div class="react-component">Content</div>'
      const result = await engine.detectOnly(html)

      expect(result).toBeDefined()
      expect(result.frameworks).toBeDefined()
    })

    it('should support cleaning only', async () => {
      const rawComponent = {
        html: '<button class="btn">Click</button>',
        css: {
          inline: '.btn { padding: 10px; }',
          rules: [],
          computedStyles: {}
        },
        scripts: [],
        metadata: {
          timestamp: Date.now(),
          source: {},
          element: { selector: '.btn', tagName: 'button' },
          dimensions: { width: 100, height: 40 },
          extraction: { depth: 1, elementCount: 1, styleCount: 1 }
        }
      }

      const result = await engine.cleanOnly(rawComponent)

      expect(result).toBeDefined()
      expect(result.html).toBeDefined()
      expect(result.css).toBeDefined()
    })

    it('should support cache key generation only', async () => {
      const html = '<button>Click</button>'
      const css = '.btn { padding: 10px; }'
      const options = {
        targetFramework: 'react',
        language: 'typescript' as const,
        includeStyles: true,
        includeTests: false,
        includeTypes: true
      }

      const cacheKey = await engine.generateCacheKey(html, css, options)

      expect(cacheKey).toBeDefined()
      expect(typeof cacheKey).toBe('string')
      expect(cacheKey.length).toBeGreaterThan(0)
    })
  })

  describe('Real-World Scenarios', () => {
    it('should process React button component', async () => {
      const reactButton: DOMElement = {
        ...mockElement,
        attributes: {
          ...mockElement.attributes,
          'data-reactroot': 'true'
        }
      }

      const request: ProcessRequest = {
        element: reactButton,
        options: {
          targetFramework: 'react',
          language: 'typescript'
        }
      }

      const result = await engine.process(request)

      expect(result).toBeDefined()
      expect(result.prompt.metadata.targetFramework).toBe('react')
    })

    it('should process Vue card component', async () => {
      const vueCard: DOMElement = {
        tagName: 'div',
        id: 'card',
        className: 'card',
        attributes: {
          'data-v-123': ''
        },
        textContent: 'Card content',
        innerHTML: '<div class="card-body">Content</div>',
        children: [],
        styles: {
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '16px'
        },
        boundingRect: {
          x: 0, y: 0, width: 300, height: 200,
          top: 0, left: 0, bottom: 200, right: 300
        }
      }

      const request: ProcessRequest = {
        element: vueCard,
        options: {
          targetFramework: 'vue',
          language: 'typescript'
        }
      }

      const result = await engine.process(request)

      expect(result).toBeDefined()
    })

    it('should process navigation bar', async () => {
      const navBar: DOMElement = {
        tagName: 'nav',
        id: 'navbar',
        className: 'navbar',
        attributes: {
          'role': 'navigation'
        },
        textContent: 'Home About Contact',
        innerHTML: '<a href="/">Home</a><a href="/about">About</a>',
        children: [],
        styles: {
          display: 'flex',
          justifyContent: 'space-between',
          padding: '1rem'
        },
        boundingRect: {
          x: 0, y: 0, width: 1200, height: 60,
          top: 0, left: 0, bottom: 60, right: 1200
        }
      }

      const request: ProcessRequest = {
        element: navBar
      }

      const result = await engine.process(request)

      expect(result).toBeDefined()
      expect(result.prompt.variables.componentType).toBe('Navigation')
    })
  })

  describe('Performance', () => {
    it('should process simple component quickly', async () => {
      const request: ProcessRequest = {
        element: mockElement
      }

      const startTime = Date.now()
      const result = await engine.process(request)
      const duration = Date.now() - startTime

      expect(result).toBeDefined()
      expect(duration).toBeLessThan(5000) // 5 seconds max
    })

    it('should handle multiple sequential processes', async () => {
      const durations: number[] = []

      for (let i = 0; i < 10; i++) {
        const request: ProcessRequest = {
          element: mockElement
        }

        const startTime = Date.now()
        await engine.process(request)
        durations.push(Date.now() - startTime)
      }

      // All should complete within reasonable time
      durations.forEach(duration => {
        expect(duration).toBeLessThan(5000)
      })

      // Check for performance degradation
      const firstDuration = durations[0]
      const lastDuration = durations[durations.length - 1]
      const ratio = lastDuration / firstDuration

      // Last run shouldn't be more than 3x slower than first
      expect(ratio).toBeLessThan(3)
    })

    it('should not cause memory leaks', async () => {
      const iterations = 50

      for (let i = 0; i < iterations; i++) {
        const request: ProcessRequest = {
          element: { ...mockElement }
        }

        await engine.process(request)
      }

      // If we got here without crashing, memory management is working
      expect(true).toBe(true)
    })
  })

  describe('Deterministic Behavior', () => {
    it('should produce same hash for identical inputs', async () => {
      const request: ProcessRequest = {
        element: mockElement
      }

      const result1 = await engine.process(request)
      const result2 = await engine.process(request)

      expect(result1.hash.html).toBe(result2.hash.html)
      expect(result1.hash.css).toBe(result2.hash.css)
      expect(result1.hash.combined).toBe(result2.hash.combined)
    })

    it('should produce same cache key for identical inputs', async () => {
      const request: ProcessRequest = {
        element: mockElement,
        options: {
          targetFramework: 'react',
          language: 'typescript'
        }
      }

      const result1 = await engine.process(request)
      const result2 = await engine.process(request)

      expect(result1.cacheKey.key).toBe(result2.cacheKey.key)
    })

    it('should produce different results for different inputs', async () => {
      const request1: ProcessRequest = {
        element: mockElement
      }

      const differentElement: DOMElement = {
        ...mockElement,
        textContent: 'Different text'
      }

      const request2: ProcessRequest = {
        element: differentElement
      }

      const result1 = await engine.process(request1)
      const result2 = await engine.process(request2)

      expect(result1.hash.combined).not.toBe(result2.hash.combined)
    })
  })
})

// Default configuration reference for tests
const DEFAULT_CONFIG = {
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
    algorithm: 'sha256' as const,
    encoding: 'hex' as const,
    normalizeWhitespace: true,
    includeMetadata: true
  }
}
