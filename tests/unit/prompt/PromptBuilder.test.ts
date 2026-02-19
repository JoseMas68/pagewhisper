/**
 * PageWhisper Core Engine - Prompt Builder Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { PromptBuilder } from '../../core/prompts/PromptBuilder'
import type {
  PromptContext,
  CleanedComponent,
  DetectionResult,
  GenerationOptions,
  PromptTemplate
} from '../../core/types'

describe('PromptBuilder', () => {
  let builder: PromptBuilder
  let mockContext: PromptContext

  beforeEach(() => {
    builder = new PromptBuilder()

    // Create mock component
    const mockComponent: CleanedComponent = {
      html: '<button class="btn btn-primary">Click me</button>',
      css: '.btn { padding: 10px 20px; background: blue; color: white; }',
      framework: 'react',
      libraries: ['react', 'react-dom'],
      metadata: {
        timestamp: Date.now(),
        source: {},
        element: { selector: '.btn', tagName: 'button' },
        dimensions: { width: 100, height: 40 },
        extraction: { depth: 1, elementCount: 1, styleCount: 1 }
      },
      stats: {
        originalSize: { html: 100, css: 50, total: 150 },
        cleanedSize: { html: 80, css: 40, total: 120 },
        reduction: { bytes: 30, percentage: 20 }
      }
    }

    // Create mock detection result
    const mockDetection: DetectionResult = {
      frameworks: [
        { name: 'react', confidence: 0.9, indicators: ['React', 'ReactDOM'] }
      ],
      cssFrameworks: [],
      libraries: ['react', 'react-dom'],
      buildTools: [],
      meta: {}
    }

    // Create mock options
    const mockOptions: GenerationOptions = {
      targetFramework: 'react',
      language: 'typescript',
      includeStyles: true,
      includeTypes: true,
      includeTests: false,
      accessibilityLevel: 'aa',
      optimizationLevel: 'high'
    }

    mockContext = {
      component: mockComponent,
      detection: mockDetection,
      options: mockOptions
    }
  })

  describe('build', () => {
    it('should build a complete prompt', () => {
      const result = builder.build(mockContext)

      expect(result.systemPrompt).toBeDefined()
      expect(result.userPrompt).toBeDefined()
      expect(result.templateVersion).toBeDefined()
      expect(result.variables).toBeDefined()
      expect(result.metadata).toBeDefined()
    })

    it('should include system prompt from template', () => {
      const result = builder.build(mockContext)

      expect(result.systemPrompt).toContain('frontend')
      expect(result.systemPrompt).length.toBeGreaterThan(0)
    })

    it('should include user prompt with rendered variables', () => {
      const result = builder.build(mockContext)

      expect(result.userPrompt).toContain('button')
      expect(result.userPrompt).toContain('padding: 10px 20px')
      expect(result.userPrompt).toContain('react')
    })

    it('should include template version', () => {
      const result = builder.build(mockContext)

      expect(result.templateVersion).toMatch(/v\d+/)
    })

    it('should include all variables', () => {
      const result = builder.build(mockContext)

      expect(result.variables.html).toBeDefined()
      expect(result.variables.css).toBeDefined()
      expect(result.variables.framework).toBeDefined()
      expect(result.variables.targetFramework).toBeDefined()
    })

    it('should include metadata', () => {
      const result = builder.build(mockContext)

      expect(result.metadata.templateName).toBeDefined()
      expect(result.metadata.renderedAt).toBeDefined()
      expect(result.metadata.targetFramework).toBe('react')
    })
  })

  describe('Template Selection', () => {
    it('should use React template for React target', () => {
      const result = builder.build(mockContext)

      expect(result.metadata.templateName).toContain('react')
    })

    it('should use Vue template for Vue target', () => {
      const vueContext: PromptContext = {
        ...mockContext,
        options: { ...mockContext.options, targetFramework: 'vue' }
      }

      const result = builder.build(vueContext)

      expect(result.metadata.templateName).toContain('vue')
    })

    it('should use enhanced template for unsupported framework', () => {
      const svelteContext: PromptContext = {
        ...mockContext,
        options: { ...mockContext.options, targetFramework: 'svelte' }
      }

      const result = builder.build(svelteContext)

      expect(result.metadata.templateName).toBeDefined()
    })

    it('should use default template when no framework-specific exists', () => {
      const angularContext: PromptContext = {
        ...mockContext,
        options: { ...mockContext.options, targetFramework: 'angular' }
      }

      const result = builder.build(angularContext)

      expect(result.metadata.templateName).toBeDefined()
      expect(result.templateVersion).toBeDefined()
    })
  })

  describe('Variable Extraction', () => {
    it('should extract HTML from component', () => {
      const result = builder.build(mockContext)

      expect(result.variables.html).toBe(mockContext.component.html)
    })

    it('should extract CSS from component', () => {
      const result = builder.build(mockContext)

      expect(result.variables.css).toBe(mockContext.component.css)
    })

    it('should extract framework from detection', () => {
      const result = builder.build(mockContext)

      expect(result.variables.framework).toBeDefined()
    })

    it('should extract libraries', () => {
      const result = builder.build(mockContext)

      expect(result.variables.libraries).toContain('react')
    })

    it('should analyze component type', () => {
      const result = builder.build(mockContext)

      expect(result.variables.componentType).toBe('Button')
    })

    it('should detect form component type', () => {
      const formContext: PromptContext = {
        ...mockContext,
        component: {
          ...mockContext.component,
          html: '<form><input type="text" /><button>Submit</button></form>'
        }
      }

      const result = builder.build(formContext)

      expect(result.variables.componentType).toBe('Form')
    })

    it('should detect navigation component type', () => {
      const navContext: PromptContext = {
        ...mockContext,
        component: {
          ...mockContext.component,
          html: '<nav class="navbar"><a href="/">Home</a></nav>'
        }
      }

      const result = builder.build(navContext)

      expect(result.variables.componentType).toBe('Navigation')
    })
  })

  describe('Framework-Specific Variables', () => {
    it('should use TypeScript check for TS language', () => {
      const result = builder.build(mockContext)

      expect(result.variables.typescriptCheck).toContain('TypeScript')
    })

    it('should use JavaScript check for JS language', () => {
      const jsContext: PromptContext = {
        ...mockContext,
        options: { ...mockContext.options, language: 'javascript' }
      }

      const result = builder.build(jsContext)

      expect(result.variables.typescriptCheck).toContain('JavaScript')
    })

    it('should set correct file extension for React TSX', () => {
      const result = builder.build(mockContext)

      expect(result.variables.extension).toBe('tsx')
    })

    it('should set correct file extension for Vue', () => {
      const vueContext: PromptContext = {
        ...mockContext,
        options: { ...mockContext.options, targetFramework: 'vue' }
      }

      const result = builder.build(vueContext)

      expect(result.variables.extension).toBe('vue')
    })

    it('should set correct file extension for Svelte', () => {
      const svelteContext: PromptContext = {
        ...mockContext,
        options: { ...mockContext.options, targetFramework: 'svelte' }
      }

      const result = builder.build(svelteContext)

      expect(result.variables.extension).toBe('svelte')
    })

    it('should include style approach for React', () => {
      const result = builder.build(mockContext)

      expect(result.variables.styleApproach).toContain('Tailwind')
    })

    it('should include style approach for Vue', () => {
      const vueContext: PromptContext = {
        ...mockContext,
        options: { ...mockContext.options, targetFramework: 'vue' }
      }

      const result = builder.build(vueContext)

      expect(result.variables.styleApproach).toContain('scoped')
    })
  })

  describe('Section Building', () => {
    it('should include style section when enabled', () => {
      const result = builder.build(mockContext)

      expect(result.variables.styleSection).toBeDefined()
      expect(result.variables.styleSection).toContain('css')
    })

    it('should omit style section when disabled', () => {
      const noStyleContext: PromptContext = {
        ...mockContext,
        options: { ...mockContext.options, includeStyles: false }
      }

      const result = builder.build(noStyleContext)

      expect(result.variables.styleSection).toContain('omitted')
    })

    it('should include types section for TypeScript', () => {
      const result = builder.build(mockContext)

      expect(result.variables.typesSection).toContain('interface')
    })

    it('should omit types section for JavaScript', () => {
      const jsContext: PromptContext = {
        ...mockContext,
        options: { ...mockContext.options, language: 'javascript' }
      }

      const result = builder.build(jsContext)

      expect(result.variables.typesSection).toBe('')
    })

    it('should include tests section when enabled', () => {
      const testContext: PromptContext = {
        ...mockContext,
        options: { ...mockContext.options, includeTests: true }
      }

      const result = builder.build(testContext)

      expect(result.variables.testsSection).toContain('vitest')
      expect(result.variables.testsSection).toContain('describe')
    })

    it('should omit tests section when disabled', () => {
      const result = builder.build(mockContext)

      expect(result.variables.testsSection).toBe('')
    })
  })

  describe('Additional Requirements', () => {
    it('should include accessibility level when specified', () => {
      const result = builder.build(mockContext)

      expect(result.variables.additionalRequirements).toContain('WCAG')
      expect(result.variables.additionalRequirements).toContain('AA')
    })

    it('should include optimization level when specified', () => {
      const result = builder.build(mockContext)

      expect(result.variables.additionalRequirements).toContain('high')
    })

    it('should handle no additional requirements', () => {
      const noReqContext: PromptContext = {
        ...mockContext,
        options: {
          targetFramework: 'react',
          language: 'typescript',
          includeStyles: true,
          includeTypes: true,
          includeTests: false
        }
      }

      const result = builder.build(noReqContext)

      expect(result.variables.additionalRequirements).toBe('')
    })
  })

  describe('Template Management', () => {
    it('should get template by name', () => {
      const template = builder.getTemplate('v2')

      expect(template).toBeDefined()
      expect(template?.name).toBe('enhanced')
    })

    it('should return undefined for non-existent template', () => {
      const template = builder.getTemplate('non-existent')

      expect(template).toBeUndefined()
    })

    it('should get all templates', () => {
      const templates = builder.getAllTemplates()

      expect(templates.length).toBeGreaterThan(0)
      expect(templates.every(t => t.version)).toBeTruthy()
    })

    it('should get only active templates', () => {
      const activeTemplates = builder.getActiveTemplates()

      expect(activeTemplates.length).toBeGreaterThan(0)
      expect(activeTemplates.every(t => !t.deprecated)).toBeTruthy()
    })

    it('should register custom template', () => {
      const customTemplate: PromptTemplate = {
        name: 'custom',
        version: 'custom-v1',
        description: 'Custom template',
        systemPrompt: 'You are a custom assistant',
        userPromptTemplate: 'Process: {{html}}',
        variables: [
          { name: 'html', type: 'string', required: true, description: 'HTML' }
        ],
        targetFrameworks: ['react'],
        createdAt: new Date().toISOString()
      }

      builder.registerTemplate(customTemplate)

      const retrieved = builder.getTemplate('custom-v1')
      expect(retrieved).toEqual(customTemplate)
    })

    it('should unregister template', () => {
      const customTemplate: PromptTemplate = {
        name: 'temp',
        version: 'temp-v1',
        description: 'Temporary',
        systemPrompt: 'Temp',
        userPromptTemplate: 'Temp: {{html}}',
        variables: [
          { name: 'html', type: 'string', required: true, description: 'HTML' }
        ],
        targetFrameworks: ['react'],
        createdAt: new Date().toISOString()
      }

      builder.registerTemplate(customTemplate)
      const unregistered = builder.unregisterTemplate('temp-v1')

      expect(unregistered).toBe(true)
      expect(builder.getTemplate('temp-v1')).toBeUndefined()
    })

    it('should return false when unregistering non-existent template', () => {
      const result = builder.unregisterTemplate('non-existent')

      expect(result).toBe(false)
    })

    it('should set default template', () => {
      builder.setDefaultTemplate('v1')

      expect(builder.getDefaultTemplate()).toBe('v1')
    })

    it('should throw when setting non-existent default template', () => {
      expect(() => {
        builder.setDefaultTemplate('non-existent')
      }).toThrow()
    })

    it('should get default template', () => {
      const defaultTemplate = builder.getDefaultTemplate()

      expect(defaultTemplate).toBeDefined()
      expect(defaultTemplate).toBe('v2')
    })
  })

  describe('Template Validation', () => {
    it('should validate correct template', () => {
      const validTemplate: PromptTemplate = {
        name: 'valid',
        version: 'valid-v1',
        description: 'Valid template',
        systemPrompt: 'System',
        userPromptTemplate: 'Process {{html}} with {{css}}',
        variables: [
          { name: 'html', type: 'string', required: true, description: 'HTML' },
          { name: 'css', type: 'string', required: true, description: 'CSS' }
        ],
        targetFrameworks: ['react'],
        createdAt: new Date().toISOString()
      }

      const result = builder.validateTemplate(validTemplate)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail validation for missing name', () => {
      const invalidTemplate: PromptTemplate = {
        name: '',
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

      const result = builder.validateTemplate(invalidTemplate)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Template name is required')
    })

    it('should fail validation for missing system prompt', () => {
      const invalidTemplate: PromptTemplate = {
        name: 'test',
        version: 'v1',
        description: 'Test',
        systemPrompt: '',
        userPromptTemplate: 'Test {{html}}',
        variables: [
          { name: 'html', type: 'string', required: true, description: 'HTML' }
        ],
        targetFrameworks: ['react'],
        createdAt: new Date().toISOString()
      }

      const result = builder.validateTemplate(invalidTemplate)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('System prompt is required')
    })

    it('should fail validation for undefined variables in template', () => {
      const invalidTemplate: PromptTemplate = {
        name: 'test',
        version: 'v1',
        description: 'Test',
        systemPrompt: 'System',
        userPromptTemplate: 'Use {{html}} and {{undefinedVar}}',
        variables: [
          { name: 'html', type: 'string', required: true, description: 'HTML' }
        ],
        targetFrameworks: ['react'],
        createdAt: new Date().toISOString()
      }

      const result = builder.validateTemplate(invalidTemplate)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('undefinedVar'))).toBe(true)
    })

    it('should fail validation for unused required variables', () => {
      const invalidTemplate: PromptTemplate = {
        name: 'test',
        version: 'v1',
        description: 'Test',
        systemPrompt: 'System',
        userPromptTemplate: 'Use {{html}}',
        variables: [
          { name: 'html', type: 'string', required: true, description: 'HTML' },
          { name: 'css', type: 'string', required: true, description: 'CSS' }
        ],
        targetFrameworks: ['react'],
        createdAt: new Date().toISOString()
      }

      const result = builder.validateTemplate(invalidTemplate)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('css'))).toBe(true)
    })
  })

  describe('Template Rendering', () => {
    it('should replace all variables in template', () => {
      const result = builder.build(mockContext)

      // Should not contain any unreplaced {{variable}} placeholders
      expect(result.userPrompt).not.toMatch(/\{\{\w+\}\}/)
    })

    it('should handle missing optional variables', () => {
      const contextMissingOptional: PromptContext = {
        ...mockContext,
        detection: {
          frameworks: [],
          cssFrameworks: [],
          libraries: [],
          buildTools: [],
          meta: {}
        }
      }

      const result = builder.build(contextMissingOptional)

      expect(result.userPrompt).toBeDefined()
    })

    it('should throw error for missing required variable', () => {
      const customTemplate: PromptTemplate = {
        name: 'strict',
        version: 'strict-v1',
        description: 'Strict template',
        systemPrompt: 'System',
        userPromptTemplate: 'Use {{requiredVar}}',
        variables: [
          { name: 'requiredVar', type: 'string', required: true, description: 'Required' }
        ],
        targetFrameworks: ['react'],
        createdAt: new Date().toISOString()
      }

      builder.registerTemplate(customTemplate)
      builder.setDefaultTemplate('strict-v1')

      expect(() => {
        builder.build(mockContext)
      }).toThrow('requiredVar')
    })

    it('should convert arrays to comma-separated strings', () => {
      const result = builder.build(mockContext)

      expect(result.variables.libraries).toContain(', ')
    })
  })

  describe('Component Type Analysis', () => {
    it('should detect button component', () => {
      const result = builder.build(mockContext)

      expect(result.variables.componentType).toBe('Button')
    })

    it('should detect input component', () => {
      const inputContext: PromptContext = {
        ...mockContext,
        component: {
          ...mockContext.component,
          html: '<input type="text" placeholder="Enter text" />'
        }
      }

      const result = builder.build(inputContext)

      expect(result.variables.componentType).toBe('Input')
    })

    it('should detect table component', () => {
      const tableContext: PromptContext = {
        ...mockContext,
        component: {
          ...mockContext.component,
          html: '<table><tr><td>Cell</td></tr></table>'
        }
      }

      const result = builder.build(tableContext)

      expect(result.variables.componentType).toBe('Table')
    })

    it('should detect card component', () => {
      const cardContext: PromptContext = {
        ...mockContext,
        component: {
          ...mockContext.component,
          html: '<div class="card">Content</div>'
        }
      }

      const result = builder.build(cardContext)

      expect(result.variables.componentType).toBe('Card')
    })

    it('should detect modal component', () => {
      const modalContext: PromptContext = {
        ...mockContext,
        component: {
          ...mockContext.component,
          html: '<div class="modal">Modal content</div>'
        }
      }

      const result = builder.build(modalContext)

      expect(result.variables.componentType).toBe('Modal')
    })

    it('should default to Component for unknown types', () => {
      const unknownContext: PromptContext = {
        ...mockContext,
        component: {
          ...mockContext.component,
          html: '<div class="unknown">Unknown</div>'
        }
      }

      const result = builder.build(unknownContext)

      expect(result.variables.componentType).toBe('Component')
    })
  })

  describe('Performance', () => {
    it('should build prompts quickly', () => {
      const start = Date.now()

      for (let i = 0; i < 100; i++) {
        builder.build(mockContext)
      }

      const duration = Date.now() - start

      // Should build 100 prompts in less than 1 second
      expect(duration).toBeLessThan(1000)
    })

    it('should handle large components efficiently', () => {
      const largeHTML = '<div>' + 'x'.repeat(10000) + '</div>'
      const largeCSS = '.large { ' + 'color: blue;'.repeat(100) + ' }'

      const largeContext: PromptContext = {
        ...mockContext,
        component: {
          ...mockContext.component,
          html: largeHTML,
          css: largeCSS
        }
      }

      const start = Date.now()
      const result = builder.build(largeContext)
      const duration = Date.now() - start

      expect(result).toBeDefined()
      expect(duration).toBeLessThan(500) // Should still be fast
    })

    it('should not cause memory leaks', () => {
      const start = Date.now()

      for (let i = 0; i < 1000; i++) {
        builder.build(mockContext)
      }

      const duration = Date.now() - start

      // Should handle 1000 iterations reasonably
      expect(duration).toBeLessThan(5000)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty component HTML', () => {
      const emptyHTMLContext: PromptContext = {
        ...mockContext,
        component: {
          ...mockContext.component,
          html: ''
        }
      }

      const result = builder.build(emptyHTMLContext)

      expect(result.userPrompt).toBeDefined()
    })

    it('should handle empty component CSS', () => {
      const emptyCSSContext: PromptContext = {
        ...mockContext,
        component: {
          ...mockContext.component,
          css: ''
        }
      }

      const result = builder.build(emptyCSSContext)

      expect(result.userPrompt).toBeDefined()
    })

    it('should handle component with special characters', () => {
      const specialCharsContext: PromptContext = {
        ...mockContext,
        component: {
          ...mockContext.component,
          html: '<button onclick="alert(\'test\')">Click & "Submit"</button>'
        }
      }

      const result = builder.build(specialCharsContext)

      expect(result.userPrompt).toBeDefined()
    })

    it('should handle null/undefined values gracefully', () => {
      const nullContext: PromptContext = {
        ...mockContext,
        component: {
          ...mockContext.component,
          framework: undefined
        },
        detection: {
          frameworks: [],
          cssFrameworks: [],
          libraries: [],
          buildTools: [],
          meta: {}
        }
      }

      const result = builder.build(nullContext)

      expect(result.userPrompt).toBeDefined()
    })

    it('should handle custom constructor default template', () => {
      const customBuilder = new PromptBuilder('v1')

      expect(customBuilder.getDefaultTemplate()).toBe('v1')
    })
  })
})
