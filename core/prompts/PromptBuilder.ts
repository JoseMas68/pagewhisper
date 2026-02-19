/**
 * PageWhisper Core Engine - Prompt Builder
 *
 * Responsibilities:
 * - Build AI prompts from templates
 * - Template versioning and management
 * - Variable interpolation
 * - Framework-specific prompt optimization
 * - Prompt caching and optimization
 *
 * Browser Compatibility:
 * - Works in any JavaScript environment
 * - No browser or Node.js specific dependencies
 */

import type {
  PromptTemplate,
  PromptVariable,
  RenderedPrompt,
  PromptContext,
  GenerationOptions,
  CleanedComponent,
  DetectionResult
} from '../types/index'

/**
 * Built-in prompt templates
 */
const BUILTIN_TEMPLATES: Record<string, PromptTemplate> = {
  // Version 1: Basic template
  v1: {
    name: 'basic',
    version: 'v1',
    description: 'Basic component conversion prompt',
    systemPrompt: `You are an expert frontend developer specializing in component extraction and code conversion.`,
    userPromptTemplate: `
Extract the following web component and convert it to clean, reusable code.

**Component HTML:**
{{html}}

**Component CSS:**
{{css}}

**Detected Framework:**
{{framework}}

**Requirements:**
1. Create a clean, semantic component
2. Use modern JavaScript (ES6+)
3. Ensure responsive design
4. Add accessibility attributes
5. Include proper error handling

**Output Format:**
Return the code in markdown format with file names as headers.
`.trim(),
    variables: [
      { name: 'html', type: 'string', required: true, description: 'Component HTML' },
      { name: 'css', type: 'string', required: true, description: 'Component CSS' },
      { name: 'framework', type: 'string', required: false, description: 'Detected framework' }
    ],
    targetFrameworks: ['react', 'vue', 'angular', 'svelte', 'vanilla'],
    createdAt: '2025-01-15',
    deprecated: false
  },

  // Version 2: Enhanced template
  v2: {
    name: 'enhanced',
    version: 'v2',
    description: 'Enhanced component conversion with better structure',
    systemPrompt: `You are a senior frontend engineer with expertise in modern frameworks and component architecture. You write clean, maintainable, and production-ready code.`,
    userPromptTemplate: `
You are converting a web component into production-ready code for {{targetFramework}}.

## Input Component

\`\`\`html
{{html}}
\`\`\`

## Styles

\`\`\`css
{{css}}
\`\`\`

## Context

- **Framework**: {{framework}}
- **Libraries**: {{libraries}}
- **Component Type**: {{componentType}}
- **Target Framework**: {{targetFramework}}

## Conversion Requirements

### 1. Framework Conversion
Convert to {{targetFramework}} with:
- Proper component structure
- State management (if needed)
- Event handling
- Props/state interface

### 2. Code Quality
- Follow {{targetFramework}} best practices
- {{typescriptCheck}}
- JSDoc/TSDoc comments
- Error boundaries (if applicable)

### 3. Accessibility
- Semantic HTML elements
- ARIA labels where needed
- Keyboard navigation
- Focus management
- Screen reader support

### 4. Performance
- Optimize re-renders
- Memoize expensive operations
- Lazy loading patterns (if applicable)

### 5. Styling
- Maintain original visual appearance
- Responsive design
- {{styleApproach}}

## Output Format

Provide the complete component code in markdown:

\`\`\`typescript
// Component.{{extension}}
[Component code]
\`\`\`

{{styleSection}}

{{typesSection}}

{{testsSection}}

## Notes
- Maintain all original functionality
- Preserve visual appearance exactly
- Add proper error handling
{{additionalRequirements}}
`.trim(),
    variables: [
      { name: 'html', type: 'string', required: true, description: 'Component HTML' },
      { name: 'css', type: 'string', required: true, description: 'Component CSS' },
      { name: 'framework', type: 'string', required: false, description: 'Source framework' },
      { name: 'libraries', type: 'array', required: false, description: 'Detected libraries' },
      { name: 'componentType', type: 'string', required: false, description: 'Component type' },
      { name: 'targetFramework', type: 'string', required: true, description: 'Target framework' },
      { name: 'typescriptCheck', type: 'string', required: false, description: 'TypeScript check' },
      { name: 'extension', type: 'string', required: true, description: 'File extension' },
      { name: 'styleApproach', type: 'string', required: false, description: 'Style approach' },
      { name: 'styleSection', type: 'string', required: false, description: 'Style code section' },
      { name: 'typesSection', type: 'string', required: false, description: 'Types section' },
      { name: 'testsSection', type: 'string', required: false, description: 'Tests section' },
      { name: 'additionalRequirements', type: 'string', required: false, description: 'Additional requirements' }
    ],
    targetFrameworks: ['react', 'vue', 'angular', 'svelte', 'solid', 'preact'],
    createdAt: '2025-02-01',
    deprecated: false,
    replacedBy: undefined
  },

  // React-specific template
  react: {
    name: 'react-optimized',
    version: 'v2-react',
    description: 'React-optimized component conversion',
    systemPrompt: `You are a React specialist with deep expertise in hooks, performance optimization, and modern React patterns. You write clean, idiomatic React code following React best practices.`,
    userPromptTemplate: `
Convert this component to a modern React functional component with hooks.

\`\`\`html
{{html}}
\`\`\`

\`\`\`css
{{css}}
\`\`\`

**Requirements:**
- Use functional components with hooks
- TypeScript with proper types
- Tailwind CSS or CSS Modules based on the original styles
- Accessibility (WCAG 2.1 AA compliant)
- Performance optimizations (useMemo, useCallback where appropriate)
- Responsive design
- Error boundary for production use

**Output:**
\`\`\`typescript
// Component.tsx
import React from 'react'

// ... component code
\`\`\`

\`\`\`typescript
// types.ts
export interface ComponentProps {
  // ... types
}
\`\`\`
`.trim(),
    variables: [
      { name: 'html', type: 'string', required: true, description: 'Component HTML' },
      { name: 'css', type: 'string', required: true, description: 'Component CSS' }
    ],
    targetFrameworks: ['react'],
    createdAt: '2025-02-01',
    deprecated: false
  },

  // Vue-specific template
  vue: {
    name: 'vue-optimized',
    version: 'v2-vue',
    description: 'Vue 3 optimized component conversion',
    systemPrompt: `You are a Vue.js specialist with expertise in Vue 3 Composition API, script setup, and modern Vue patterns. You write clean, idiomatic Vue code following Vue best practices.`,
    userPromptTemplate: `
Convert this component to a modern Vue 3 component with Composition API and script setup.

\`\`\`html
{{html}}
\`\`\`

\`\`\`css
{{css}}
\`\`\`

**Requirements:**
- Vue 3 with Composition API and <script setup>
- TypeScript with proper types
- Scoped styles maintaining original appearance
- Accessibility (WCAG 2.1 AA compliant)
- Reactive state management with ref/reactive
- Props definition with types
- Emits for events

**Output:**
\`\`\`vue
<template>
  <!-- template -->
</template>

<script setup lang="ts">
// script setup
</script>

<style scoped>
/* styles */
</style>
\`\`\`
`.trim(),
    variables: [
      { name: 'html', type: 'string', required: true, description: 'Component HTML' },
      { name: 'css', type: 'string', required: true, description: 'Component CSS' }
    ],
    targetFrameworks: ['vue'],
    createdAt: '2025-02-01',
    deprecated: false
  }
}

/**
 * Prompt Builder - Core prompt building logic
 */
export class PromptBuilder {
  private templates: Map<string, PromptTemplate>
  private defaultTemplate: string

  constructor(defaultTemplate: string = 'v2') {
    this.templates = new Map(Object.entries(BUILTIN_TEMPLATES))
    this.defaultTemplate = defaultTemplate
  }

  /**
   * Build prompt from context
   */
  build(context: PromptContext): RenderedPrompt {
    const template = this.selectTemplate(context.options.targetFramework)
    const variables = this.extractVariables(context)
    const userPrompt = this.renderTemplate(template, variables)

    return {
      systemPrompt: template.systemPrompt,
      userPrompt,
      templateVersion: template.version,
      variables,
      metadata: {
        templateName: template.name,
        renderedAt: new Date().toISOString(),
        targetFramework: context.options.targetFramework
      }
    }
  }

  /**
   * Select appropriate template for target framework
   */
  private selectTemplate(targetFramework: string): PromptTemplate {
    // Try framework-specific template first
    const frameworkTemplate = this.getTemplate(`${targetFramework}-optimized`)
    if (frameworkTemplate && !frameworkTemplate.deprecated) {
      return frameworkTemplate
    }

    // Fall back to default template
    return this.getTemplate(this.defaultTemplate) || this.getTemplate('v1')!
  }

  /**
   * Get template by name/version
   */
  getTemplate(name: string): PromptTemplate | undefined {
    return this.templates.get(name)
  }

  /**
   * Extract variables from context
   */
  private extractVariables(context: PromptContext): Record<string, any> {
    const { component, detection, options } = context

    return {
      // Basic info
      html: component.html,
      css: component.css,
      framework: component.framework || detection.frameworks[0]?.name || 'Unknown',
      libraries: component.libraries.join(', ') || 'None',

      // Component analysis
      componentType: this.analyzeComponentType(component),

      // Target options
      targetFramework: options.targetFramework,
      language: options.language || 'typescript',

      // Framework-specific
      typescriptCheck: options.language === 'typescript'
        ? 'Use TypeScript with proper type definitions'
        : 'Use modern JavaScript (ES6+)',

      extension: this.getFileExtension(options.targetFramework, options.language),
      styleApproach: this.getStyleApproach(options.targetFramework),

      // Sections
      styleSection: this.buildStyleSection(component, options),
      typesSection: this.buildTypesSection(options),
      testsSection: this.buildTestsSection(options),

      // Additional
      additionalRequirements: this.buildAdditionalRequirements(context)
    }
  }

  /**
   * Analyze component type from HTML
   */
  private analyzeComponentType(component: CleanedComponent): string {
    const html = component.html.toLowerCase()

    if (html.includes('<button')) return 'Button'
    if (html.includes('<input')) return 'Input'
    if (html.includes('<form')) return 'Form'
    if (html.includes('nav')) return 'Navigation'
    if (html.includes('card')) return 'Card'
    if (html.includes('modal') || html.includes('dialog')) return 'Modal'
    if (html.includes('dropdown')) return 'Dropdown'
    if (html.includes('carousel') || html.includes('slider')) return 'Carousel'
    if (html.includes('table')) return 'Table'
    if (html.includes('list')) return 'List'
    if (html.includes('header')) return 'Header'
    if (html.includes('footer')) return 'Footer'
    if (html.includes('sidebar')) return 'Sidebar'

    return 'Component'
  }

  /**
   * Get file extension for framework
   */
  private getFileExtension(framework: string, language?: string): string {
    if (language === 'typescript') {
      switch (framework) {
        case 'react':
        case 'preact':
        case 'solid':
          return 'tsx'
        case 'vue':
          return 'vue'
        case 'angular':
          return 'ts'
        case 'svelte':
          return 'svelte'
        default:
          return 'ts'
      }
    }

    switch (framework) {
      case 'vue':
        return 'vue'
      case 'svelte':
        return 'svelte'
      default:
        return 'jsx'
    }
  }

  /**
   * Get style approach for framework
   */
  private getStyleApproach(framework: string): string {
    switch (framework) {
      case 'react':
        return 'Use Tailwind CSS or CSS Modules'
      case 'vue':
        return 'Use scoped styles in <style scoped>'
      case 'angular':
        return 'Use component styles with :host context'
      case 'svelte':
        return 'Use scoped styles in <style>'
      default:
        return 'Maintain original CSS with prefixed classes'
    }
  }

  /**
   * Build style section
   */
  private buildStyleSection(component: CleanedComponent, options: GenerationOptions): string {
    if (!options.includeStyles) {
      return '// Styles omitted by request'
    }

    const framework = options.targetFramework

    if (framework === 'vue' || framework === 'svelte') {
      return '// Styles are included in <style scoped> section'
    }

    if (component.css) {
      return `\`\`\`css\n/* Component.module.css */\n${component.css}\n\`\`\``
    }

    return '// No styles detected'
  }

  /**
   * Build types section
   */
  private buildTypesSection(options: GenerationOptions): string {
    if (!options.includeTypes || options.language !== 'typescript') {
      return ''
    }

    return `\`\`\`typescript
// types.ts
export interface ComponentProps {
  // Define props here
}

export interface ComponentState {
  // Define state here
}
\`\`\``
  }

  /**
   * Build tests section
   */
  private buildTestsSection(options: GenerationOptions): string {
    if (!options.includeTests) {
      return ''
    }

    return `\`\`\`typescript
// Component.test.ts
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/${options.targetFramework}'

describe('Component', () => {
  it('should render', () => {
    // Add tests
  })
})
\`\`\``
  }

  /**
   * Build additional requirements
   */
  private buildAdditionalRequirements(context: PromptContext): string {
    const requirements: string[] = []

    if (context.options.accessibilityLevel) {
      requirements.push(`- Accessibility: WCAG ${context.options.accessibilityLevel.toUpperCase()} compliant`)
    }

    if (context.options.optimizationLevel) {
      requirements.push(`- Optimization: ${context.options.optimizationLevel} level performance`)
    }

    return requirements.join('\n')
  }

  /**
   * Render template with variables
   */
  private renderTemplate(template: PromptTemplate, variables: Record<string, any>): string {
    let rendered = template.userPromptTemplate

    // Replace all {{variable}} placeholders
    const varRegex = /\{\{(\w+)\}\}/g

    rendered = rendered.replace(varRegex, (match, key) => {
      const value = variables[key]
      if (value === undefined || value === null) {
        // Check if variable is required
        const variableDef = template.variables.find(v => v.name === key)
        if (variableDef?.required) {
          throw new Error(`Required prompt variable '${key}' is missing`)
        }
        return variableDef?.default || ''
      }

      // Convert arrays and objects to string
      if (Array.isArray(value)) {
        return value.join(', ')
      }

      return String(value)
    })

    return rendered
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Register custom template
   */
  registerTemplate(template: PromptTemplate): void {
    this.templates.set(template.version, template)
  }

  /**
   * Unregister template
   */
  unregisterTemplate(version: string): boolean {
    return this.templates.delete(version)
  }

  /**
   * Get all templates
   */
  getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values())
  }

  /**
   * Get active templates (not deprecated)
   */
  getActiveTemplates(): PromptTemplate[] {
    return this.getAllTemplates().filter(t => !t.deprecated)
  }

  /**
   * Set default template
   */
  setDefaultTemplate(version: string): void {
    if (!this.templates.has(version)) {
      throw new Error(`Template '${version}' not found`)
    }
    this.defaultTemplate = version
  }

  /**
   * Get default template
   */
  getDefaultTemplate(): string {
    return this.defaultTemplate
  }

  /**
   * Validate template
   */
  validateTemplate(template: PromptTemplate): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check required fields
    if (!template.name) errors.push('Template name is required')
    if (!template.version) errors.push('Template version is required')
    if (!template.systemPrompt) errors.push('System prompt is required')
    if (!template.userPromptTemplate) errors.push('User prompt template is required')

    // Check variables are defined
    const varRegex = /\{\{(\w+)\}\}/g
    const usedVars = new Set<string>()
    let match
    while ((match = varRegex.exec(template.userPromptTemplate)) !== null) {
      usedVars.add(match[1])
    }

    // Check all used variables are defined
    for (const usedVar of usedVars) {
      const variableDef = template.variables.find(v => v.name === usedVar)
      if (!variableDef) {
        errors.push(`Variable '${usedVar}' is used but not defined`)
      }
    }

    // Check required variables are used
    for (const variableDef of template.variables) {
      if (variableDef.required && !usedVars.has(variableDef.name)) {
        errors.push(`Required variable '${variableDef.name}' is defined but not used`)
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

// ============================================================================
// Export
// ============================================================================

export default PromptBuilder
export type { PromptTemplate, PromptVariable, RenderedPrompt, PromptContext }
