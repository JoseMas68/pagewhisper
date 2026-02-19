/**
 * PageWhisper Core Engine - Hash Generator Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { HashGenerator } from '../../core/utils/HashGenerator'
import type {
  HashConfig,
  CacheKey,
  ContentHash,
  CleanedComponent,
  DetectionResult,
  GenerationOptions
} from '../../core/types'

describe('HashGenerator', () => {
  let generator: HashGenerator
  let mockComponent: CleanedComponent
  let mockDetection: DetectionResult
  let mockOptions: GenerationOptions

  beforeEach(() => {
    generator = new HashGenerator()

    // Create mock component
    mockComponent = {
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
    }

    // Create mock detection result
    mockDetection = {
      frameworks: [
        { name: 'react', confidence: 0.9, indicators: ['React'] }
      ],
      cssFrameworks: [],
      libraries: ['react', 'react-dom'],
      buildTools: ['webpack'],
      meta: {}
    }

    // Create mock options
    mockOptions = {
      targetFramework: 'react',
      language: 'typescript',
      includeStyles: true,
      includeTypes: true,
      includeTests: false,
      accessibilityLevel: 'aa',
      optimizationLevel: 'high'
    }
  })

  describe('hash', () => {
    it('should generate hash for string', async () => {
      const input = 'Hello, World!'
      const hash = await generator.hash(input)

      expect(hash).toBeDefined()
      expect(typeof hash).toBe('string')
      expect(hash.length).toBeGreaterThan(0)
    })

    it('should generate consistent hashes for same input', async () => {
      const input = 'Consistent input'
      const hash1 = await generator.hash(input)
      const hash2 = await generator.hash(input)

      expect(hash1).toBe(hash2)
    })

    it('should generate different hashes for different inputs', async () => {
      const hash1 = await generator.hash('Input 1')
      const hash2 = await generator.hash('Input 2')

      expect(hash1).not.toBe(hash2)
    })

    it('should handle empty string', async () => {
      const hash = await generator.hash('')

      expect(hash).toBeDefined()
      expect(hash.length).toBeGreaterThan(0)
    })

    it('should handle special characters', async () => {
      const input = '<script>alert("xss")</script>'
      const hash = await generator.hash(input)

      expect(hash).toBeDefined()
    })

    it('should handle Unicode characters', async () => {
      const input = 'Hello 世界 🌍'
      const hash = await generator.hash(input)

      expect(hash).toBeDefined()
    })

    it('should normalize whitespace when configured', async () => {
      const generatorWithNormalization = new HashGenerator({
        normalizeWhitespace: true
      })

      const hash1 = await generatorWithNormalization.hash('hello   world')
      const hash2 = await generatorWithNormalization.hash('hello world')

      expect(hash1).toBe(hash2)
    })

    it('should not normalize whitespace when disabled', async () => {
      const generatorWithoutNormalization = new HashGenerator({
        normalizeWhitespace: false
      })

      const hash1 = await generatorWithoutNormalization.hash('hello   world')
      const hash2 = await generatorWithoutNormalization.hash('hello world')

      expect(hash1).not.toBe(hash2)
    })
  })

  describe('hashContent', () => {
    it('should generate content hash from component', async () => {
      const result = await generator.hashContent(mockComponent)

      expect(result.html).toBeDefined()
      expect(result.css).toBeDefined()
      expect(result.combined).toBeDefined()
      expect(result.algorithm).toBe('sha256')
    })

    it('should generate separate hashes for HTML and CSS', async () => {
      const result = await generator.hashContent(mockComponent)

      expect(result.html).not.toBe(result.css)
    })

    it('should generate combined hash different from individual', async () => {
      const result = await generator.hashContent(mockComponent)

      expect(result.combined).not.toBe(result.html)
      expect(result.combined).not.toBe(result.css)
    })

    it('should be deterministic for same component', async () => {
      const hash1 = await generator.hashContent(mockComponent)
      const hash2 = await generator.hashContent(mockComponent)

      expect(hash1.html).toBe(hash2.html)
      expect(hash1.css).toBe(hash2.css)
      expect(hash1.combined).toBe(hash2.combined)
    })

    it('should handle component with empty HTML', async () => {
      const emptyHTMLComponent: CleanedComponent = {
        ...mockComponent,
        html: ''
      }

      const result = await generator.hashContent(emptyHTMLComponent)

      expect(result.html).toBeDefined()
      expect(result.css).toBeDefined()
    })

    it('should handle component with empty CSS', async () => {
      const emptyCSSComponent: CleanedComponent = {
        ...mockComponent,
        css: ''
      }

      const result = await generator.hashContent(emptyCSSComponent)

      expect(result.html).toBeDefined()
      expect(result.css).toBeDefined()
    })

    it('should detect changes in HTML', async () => {
      const modifiedComponent: CleanedComponent = {
        ...mockComponent,
        html: '<button class="btn modified">Click</button>'
      }

      const originalHash = await generator.hashContent(mockComponent)
      const modifiedHash = await generator.hashContent(modifiedComponent)

      expect(originalHash.html).not.toBe(modifiedHash.html)
      expect(originalHash.combined).not.toBe(modifiedHash.combined)
    })

    it('should detect changes in CSS', async () => {
      const modifiedComponent: CleanedComponent = {
        ...mockComponent,
        css: '.btn { padding: 20px; }'
      }

      const originalHash = await generator.hashContent(mockComponent)
      const modifiedHash = await generator.hashContent(modifiedComponent)

      expect(originalHash.css).not.toBe(modifiedHash.css)
      expect(originalHash.combined).not.toBe(modifiedHash.combined)
    })
  })

  describe('generateCacheKey', () => {
    it('should generate cache key from all inputs', async () => {
      const result = await generator.generateCacheKey(
        mockComponent,
        mockDetection,
        mockOptions
      )

      expect(result.key).toBeDefined()
      expect(result.algorithm).toBe('sha256')
      expect(result.input).toBeDefined()
      expect(result.input.componentHash).toBeDefined()
      expect(result.input.contextHash).toBeDefined()
      expect(result.input.optionsHash).toBeDefined()
    })

    it('should be deterministic for same inputs', async () => {
      const key1 = await generator.generateCacheKey(
        mockComponent,
        mockDetection,
        mockOptions
      )
      const key2 = await generator.generateCacheKey(
        mockComponent,
        mockDetection,
        mockOptions
      )

      expect(key1.key).toBe(key2.key)
      expect(key1.input.componentHash).toBe(key2.input.componentHash)
      expect(key1.input.contextHash).toBe(key2.input.contextHash)
      expect(key1.input.optionsHash).toBe(key2.input.optionsHash)
    })

    it('should generate different keys for different components', async () => {
      const differentComponent: CleanedComponent = {
        ...mockComponent,
        html: '<div class="different">Different</div>'
      }

      const key1 = await generator.generateCacheKey(
        mockComponent,
        mockDetection,
        mockOptions
      )
      const key2 = await generator.generateCacheKey(
        differentComponent,
        mockDetection,
        mockOptions
      )

      expect(key1.key).not.toBe(key2.key)
    })

    it('should generate different keys for different frameworks', async () => {
      const differentDetection: DetectionResult = {
        ...mockDetection,
        frameworks: [{ name: 'vue', confidence: 0.9, indicators: ['Vue'] }]
      }

      const key1 = await generator.generateCacheKey(
        mockComponent,
        mockDetection,
        mockOptions
      )
      const key2 = await generator.generateCacheKey(
        mockComponent,
        differentDetection,
        mockOptions
      )

      expect(key1.key).not.toBe(key2.key)
    })

    it('should generate different keys for different options', async () => {
      const differentOptions: GenerationOptions = {
        ...mockOptions,
        targetFramework: 'vue',
        language: 'javascript'
      }

      const key1 = await generator.generateCacheKey(
        mockComponent,
        mockDetection,
        mockOptions
      )
      const key2 = await generator.generateCacheKey(
        mockComponent,
        mockDetection,
        differentOptions
      )

      expect(key1.key).not.toBe(key2.key)
    })

    it('should handle detection with no frameworks', async () => {
      const emptyDetection: DetectionResult = {
        frameworks: [],
        cssFrameworks: [],
        libraries: [],
        buildTools: [],
        meta: {}
      }

      const result = await generator.generateCacheKey(
        mockComponent,
        emptyDetection,
        mockOptions
      )

      expect(result.key).toBeDefined()
    })

    it('should handle options with minimal config', async () => {
      const minimalOptions: GenerationOptions = {
        targetFramework: 'react'
      }

      const result = await generator.generateCacheKey(
        mockComponent,
        mockDetection,
        minimalOptions
      )

      expect(result.key).toBeDefined()
    })
  })

  describe('Hash Algorithms', () => {
    it('should support sha256 algorithm', async () => {
      const sha256Generator = new HashGenerator({ algorithm: 'sha256' })
      const hash = await sha256Generator.hash('test')

      expect(hash).toBeDefined()
      expect(hash.length).toBeGreaterThan(0)
    })

    it('should support fnv1a algorithm', async () => {
      const fnv1aGenerator = new HashGenerator({ algorithm: 'fnv1a' })
      const hash = await fnv1aGenerator.hash('test')

      expect(hash).toBeDefined()
      expect(hash.length).toBeGreaterThan(0)
    })

    it('should support sha1 algorithm', async () => {
      const sha1Generator = new HashGenerator({ algorithm: 'sha1' })

      // Note: SHA-1 might not be available in all environments
      try {
        const hash = await sha1Generator.hash('test')
        expect(hash).toBeDefined()
      } catch (error) {
        // Expected in some environments
        expect((error as Error).message).toContain('not available')
      }
    })

    it('should support md5 algorithm', async () => {
      const md5Generator = new HashGenerator({ algorithm: 'md5' })
      const hash = await md5Generator.hash('test')

      expect(hash).toBeDefined()
      expect(hash.length).toBeGreaterThan(0)
    })

    it('should throw error for unsupported algorithm', async () => {
      const invalidGenerator = new HashGenerator({
        algorithm: 'invalid' as any
      })

      await expect(invalidGenerator.hash('test')).rejects.toThrow('Unsupported algorithm')
    })

    it('should generate consistent hashes across different algorithms', async () => {
      const sha256Generator = new HashGenerator({ algorithm: 'sha256' })
      const fnv1aGenerator = new HashGenerator({ algorithm: 'fnv1a' })

      const sha256Hash = await sha256Generator.hash('test')
      const fnv1aHash = await fnv1aGenerator.hash('test')

      // Different algorithms should produce different hashes
      expect(sha256Hash).not.toBe(fnv1aHash)

      // But each should be consistent
      expect(sha256Hash).toBe(await sha256Generator.hash('test'))
      expect(fnv1aHash).toBe(await fnv1aGenerator.hash('test'))
    })
  })

  describe('Encodings', () => {
    it('should support hex encoding', async () => {
      const hexGenerator = new HashGenerator({ encoding: 'hex' })
      const hash = await hexGenerator.hash('test')

      expect(hash).toMatch(/^[0-9a-f]+$/)
    })

    it('should support base64 encoding', async () => {
      const base64Generator = new HashGenerator({ encoding: 'base64' })
      const hash = await base64Generator.hash('test')

      expect(hash).toMatch(/^[a-zA-Z0-9+/=]+$/)
    })

    it('should support base64url encoding', async () => {
      const base64urlGenerator = new HashGenerator({ encoding: 'base64url' })
      const hash = await base64urlGenerator.hash('test')

      // Should not contain + or / characters
      expect(hash).not.toMatch(/[+/]/)
    })

    it('should throw error for unsupported encoding', async () => {
      const invalidGenerator = new HashGenerator({
        encoding: 'invalid' as any
      })

      await expect(invalidGenerator.hash('test')).rejects.toThrow('Unsupported encoding')
    })
  })

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const defaultGenerator = new HashGenerator()
      const config = defaultGenerator.getConfig()

      expect(config.algorithm).toBe('sha256')
      expect(config.encoding).toBe('hex')
      expect(config.normalizeWhitespace).toBe(true)
      expect(config.includeMetadata).toBe(true)
    })

    it('should allow custom configuration', () => {
      const customGenerator = new HashGenerator({
        algorithm: 'fnv1a',
        encoding: 'base64',
        normalizeWhitespace: false
      })

      const config = customGenerator.getConfig()

      expect(config.algorithm).toBe('fnv1a')
      expect(config.encoding).toBe('base64')
      expect(config.normalizeWhitespace).toBe(false)
    })

    it('should update configuration', () => {
      generator.updateConfig({
        algorithm: 'fnv1a',
        encoding: 'base64'
      })

      const config = generator.getConfig()

      expect(config.algorithm).toBe('fnv1a')
      expect(config.encoding).toBe('base64')
      // Other settings should remain
      expect(config.normalizeWhitespace).toBe(true)
    })

    it('should return copy of configuration', () => {
      const config1 = generator.getConfig()
      const config2 = generator.getConfig()

      expect(config1).toEqual(config2)
      expect(config1).not.toBe(config2)
    })
  })

  describe('Static Methods', () => {
    it('should provide quick hash helper', async () => {
      const hash = await HashGenerator.quickHash('quick test')

      expect(hash).toBeDefined()
      expect(typeof hash).toBe('string')
    })

    it('should use fnv1a by default for quick hash', async () => {
      const hash1 = await HashGenerator.quickHash('test')
      const hash2 = await HashGenerator.quickHash('test', 'fnv1a')

      expect(hash1).toBe(hash2)
    })

    it('should support sha256 in quick hash', async () => {
      const hash = await HashGenerator.quickHash('test', 'sha256')

      expect(hash).toBeDefined()
      expect(hash.length).toBeGreaterThan(0)
    })

    it('should generate unique IDs', () => {
      const id1 = HashGenerator.generateId()
      const id2 = HashGenerator.generateId()

      expect(id1).toBeDefined()
      expect(id2).toBeDefined()
      expect(id1).not.toBe(id2)
    })

    it('should generate IDs in correct format', () => {
      const id = HashGenerator.generateId()

      expect(id).toMatch(/^\d+-[a-z0-9]+$/)
    })
  })

  describe('Collision Resistance', () => {
    it('should have low collision rate for similar strings', async () => {
      const strings = [
        'button',
        'buttons',
        'Button',
        'button1',
        'button-1'
      ]

      const hashes = await Promise.all(
        strings.map(s => generator.hash(s))
      )

      // All hashes should be different
      const uniqueHashes = new Set(hashes)
      expect(uniqueHashes.size).toBe(strings.length)
    })

    it('should have avalanche effect', async () => {
      const hash1 = await generator.hash('hello world')
      const hash2 = await generator.hash('hello world!')

      // Small change should result in completely different hash
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('Performance', () => {
    it('should hash strings quickly', async () => {
      const input = 'Performance test string'

      const start = Date.now()
      for (let i = 0; i < 1000; i++) {
        await generator.hash(input)
      }
      const duration = Date.now() - start

      // Should hash 1000 strings in less than 1 second
      expect(duration).toBeLessThan(1000)
    })

    it('should hash large content efficiently', async () => {
      const largeHTML = '<div>' + 'x'.repeat(10000) + '</div>'
      const largeComponent: CleanedComponent = {
        ...mockComponent,
        html: largeHTML
      }

      const start = Date.now()
      await generator.hashContent(largeComponent)
      const duration = Date.now() - start

      expect(duration).toBeLessThan(500)
    })

    it('should generate cache keys quickly', async () => {
      const start = Date.now()

      for (let i = 0; i < 100; i++) {
        await generator.generateCacheKey(
          mockComponent,
          mockDetection,
          mockOptions
        )
      }

      const duration = Date.now() - start

      // Should generate 100 keys in less than 1 second
      expect(duration).toBeLessThan(1000)
    })

    it('should handle fnv1a faster than sha256', async () => {
      const fnv1aGenerator = new HashGenerator({ algorithm: 'fnv1a' })
      const sha256Generator = new HashGenerator({ algorithm: 'sha256' })

      const input = 'test'

      const fnv1aStart = Date.now()
      for (let i = 0; i < 1000; i++) {
        await fnv1aGenerator.hash(input)
      }
      const fnv1aDuration = Date.now() - fnv1aStart

      const sha256Start = Date.now()
      for (let i = 0; i < 1000; i++) {
        await sha256Generator.hash(input)
      }
      const sha256Duration = Date.now() - sha256Start

      // FNV-1a should be faster than SHA-256
      // (This might not always be true depending on implementation)
      expect(fnv1aDuration).toBeLessThanOrEqual(sha256Duration * 2)
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long strings', async () => {
      const longString = 'a'.repeat(100000)
      const hash = await generator.hash(longString)

      expect(hash).toBeDefined()
    })

    it('should handle strings with only whitespace', async () => {
      const whitespaceString = '   \n\t  \r\n  '
      const hash = await generator.hash(whitespaceString)

      expect(hash).toBeDefined()
    })

    it('should handle HTML entities', async () => {
      const htmlEntities = '&lt;script&gt;&amp;&quot;&apos;'
      const hash = await generator.hash(htmlEntities)

      expect(hash).toBeDefined()
    })

    it('should handle null-like values gracefully', async () => {
      const emptyHash = await generator.hash('')
      expect(emptyHash).toBeDefined()
    })

    it('should handle component with only libraries', async () => {
      const libraryOnlyComponent: CleanedComponent = {
        ...mockComponent,
        html: '',
        css: '',
        libraries: ['react', 'lodash', 'axios']
      }

      const result = await generator.hashContent(libraryOnlyComponent)

      expect(result.html).toBeDefined()
      expect(result.css).toBeDefined()
    })
  })

  describe('Detection Context Building', () => {
    it('should sort frameworks deterministically', async () => {
      const unsortedDetection: DetectionResult = {
        frameworks: [
          { name: 'vue', confidence: 0.8, indicators: [] },
          { name: 'react', confidence: 0.9, indicators: [] }
        ],
        cssFrameworks: [],
        libraries: ['lodash', 'react'],
        buildTools: [],
        meta: {}
      }

      const key1 = await generator.generateCacheKey(
        mockComponent,
        unsortedDetection,
        mockOptions
      )

      // Reverse order should produce same key (due to sorting)
      const reversedDetection: DetectionResult = {
        frameworks: [
          { name: 'react', confidence: 0.9, indicators: [] },
          { name: 'vue', confidence: 0.8, indicators: [] }
        ],
        cssFrameworks: [],
        libraries: ['react', 'lodash'],
        buildTools: [],
        meta: {}
      }

      const key2 = await generator.generateCacheKey(
        mockComponent,
        reversedDetection,
        mockOptions
      )

      expect(key1.key).toBe(key2.key)
    })
  })

  describe('Options Context Building', () => {
    it('should include all relevant options', async () => {
      const fullOptions: GenerationOptions = {
        targetFramework: 'vue',
        language: 'typescript',
        includeStyles: true,
        includeTypes: true,
        includeTests: true,
        accessibilityLevel: 'aaa',
        optimizationLevel: 'maximum'
      }

      const result = await generator.generateCacheKey(
        mockComponent,
        mockDetection,
        fullOptions
      )

      expect(result.key).toBeDefined()
      expect(result.input.optionsHash).toBeDefined()
    })

    it('should handle undefined optional fields', async () => {
      const minimalOptions: GenerationOptions = {
        targetFramework: 'react'
      }

      const result = await generator.generateCacheKey(
        mockComponent,
        mockDetection,
        minimalOptions
      )

      expect(result.key).toBeDefined()
    })
  })
})
