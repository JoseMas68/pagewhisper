/**
 * PageWhisper AI System - Prompt Versioning
 *
 * Template-based prompt system with versioning and variable interpolation.
 */

import type {
  PromptTemplate,
  PromptVariable,
  RenderedPrompt,
  PromptVersioningConfig,
  ValidationError
} from '../types'

/**
 * Built-in prompt templates
 */
const BUILTIN_TEMPLATES: PromptTemplate[] = [
  // Version 1.0 - Basic component conversion
  {
    id: 'basic-v1',
    version: '1.0.0',
    name: 'Basic Component Conversion',
    description: 'Simple template for converting web components to code',
    systemPrompt: `You are an expert frontend developer specializing in component extraction and code conversion.`,
    userPrompt: `Extract the following web component and convert it to clean, reusable code.

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
Return the code in markdown format with file names as headers.`,
    variables: [
      {
        name: 'html',
        type: 'string',
        required: true,
        description: 'Component HTML code'
      },
      {
        name: 'css',
        type: 'string',
        required: true,
        description: 'Component CSS code'
      },
      {
        name: 'framework',
        type: 'string',
        required: false,
        description: 'Detected framework name',
        default: 'Unknown'
      }
    ],
    deprecated: false,
    createdAt: '2025-01-15T00:00:00Z',
    modifiedAt: '2025-01-15T00:00:00Z'
  },

  // Version 2.0 - Enhanced component conversion
  {
    id: 'enhanced-v2',
    version: '2.0.0',
    name: 'Enhanced Component Conversion',
    description: 'Advanced template with better structure and more options',
    systemPrompt: `You are a senior frontend engineer with expertise in modern frameworks and component architecture. You write clean, maintainable, and production-ready code following best practices.`,
    userPrompt: `You are converting a web component into production-ready code for {{targetFramework}}.

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
{{additionalRequirements}}`,
    variables: [
      { name: 'html', type: 'string', required: true, description: 'Component HTML' },
      { name: 'css', type: 'string', required: true, description: 'Component CSS' },
      { name: 'framework', type: 'string', required: false, description: 'Source framework', default: 'Unknown' },
      { name: 'libraries', type: 'string', required: false, description: 'Detected libraries', default: 'None' },
      { name: 'componentType', type: 'string', required: false, description: 'Component type', default: 'Component' },
      { name: 'targetFramework', type: 'string', required: true, description: 'Target framework' },
      { name: 'typescriptCheck', type: 'string', required: false, description: 'TypeScript check', default: 'Use TypeScript with proper type definitions' },
      { name: 'extension', type: 'string', required: true, description: 'File extension' },
      { name: 'styleApproach', type: 'string', required: false, description: 'Style approach', default: 'Maintain original CSS with prefixed classes' },
      { name: 'styleSection', type: 'string', required: false, description: 'Style code section', default: '// Styles included in component' },
      { name: 'typesSection', type: 'string', required: false, description: 'Types section', default: '' },
      { name: 'testsSection', type: 'string', required: false, description: 'Tests section', default: '' },
      { name: 'additionalRequirements', type: 'string', required: false, description: 'Additional requirements', default: '' }
    ],
    targetFramework: 'generic',
    deprecated: false,
    createdAt: '2025-02-01T00:00:00Z',
    modifiedAt: '2025-02-01T00:00:00Z'
  },

  // React-specific template
  {
    id: 'react-v2',
    version: '2.0.0',
    name: 'React Component Conversion',
    description: 'Optimized template for React component conversion',
    systemPrompt: `You are a React specialist with deep expertise in hooks, performance optimization, and modern React patterns. You write clean, idiomatic React code following React best practices.`,
    userPrompt: `Convert this component to a modern React functional component with hooks.

\`\`\`html
{{html}}
\`\`\`

\`\`\`css
{{css}}
\`\`\`

**Requirements:**
- Use functional components with hooks
- TypeScript with proper types
- Maintain original visual appearance
- Accessibility (WCAG 2.1 AA compliant)
- Performance optimizations (useMemo, useCallback where appropriate)
- Responsive design
- Error boundary for production use

**Output:**
\`\`\`typescript
// Component.tsx
import React from 'react'

interface ComponentProps {
  // Define props here
}

export const Component: React.FC<ComponentProps> = ({ ...props }) => {
  // Component implementation
}

export default Component
\`\`\`

\`\`\`typescript
// Component.module.css
.module {
  /* CSS Module styles */
}
\`\`\``,
    variables: [
      { name: 'html', type: 'string', required: true, description: 'Component HTML' },
      { name: 'css', type: 'string', required: true, description: 'Component CSS' }
    ],
    targetFramework: 'react',
    deprecated: false,
    createdAt: '2025-02-01T00:00:00Z',
    modifiedAt: '2025-02-01T00:00:00Z'
  },

  // Vue-specific template
  {
    id: 'vue-v2',
    version: '2.0.0',
    name: 'Vue 3 Component Conversion',
    description: 'Optimized template for Vue 3 component conversion',
    systemPrompt: `You are a Vue.js specialist with expertise in Vue 3 Composition API, script setup, and modern Vue patterns. You write clean, idiomatic Vue code following Vue best practices.`,
    userPrompt: `Convert this component to a modern Vue 3 component with Composition API and script setup.

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
  <!-- template content -->
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  // Define props
}

const props = defineProps<Props>()

const emit = defineEmits<{
  // Define emits
}>()

// Component logic
</script>

<style scoped>
/* component styles */
</style>
\`\`\``,
    variables: [
      { name: 'html', type: 'string', required: true, description: 'Component HTML' },
      { name: 'css', type: 'string', required: true, description: 'Component CSS' }
    ],
    targetFramework: 'vue',
    deprecated: false,
    createdAt: '2025-02-01T00:00:00Z',
    modifiedAt: '2025-02-01T00:00:00Z'
  }
]

/**
 * Prompt Versioning Manager
 */
export class PromptVersioning {
  private templates: Map<string, PromptTemplate>
  private config: PromptVersioningConfig

  constructor(config?: Partial<PromptVersioningConfig>) {
    this.templates = new Map()
    this.config = this.buildConfig(config)

    // Register built-in templates
    this.registerBuiltinTemplates()
  }

  /**
   * Render prompt from template
   */
  render(templateId: string, variables: Record<string, any>): RenderedPrompt {
    const template = this.getTemplate(templateId)

    // Validate variables
    this.validateVariables(template, variables)

    // Render prompts
    const systemPrompt = template.systemPrompt
    const userPrompt = this.renderTemplate(template.userPrompt, variables)

    return {
      systemPrompt,
      userPrompt,
      templateId: template.id,
      templateVersion: template.version,
      variables,
      metadata: {
        renderedAt: new Date().toISOString(),
        targetFramework: template.targetFramework
      }
    }
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): PromptTemplate {
    const template = this.templates.get(id)

    if (!template) {
      throw new Error(`Template '${id}' not found`)
    }

    // Check if deprecated and auto-migrate
    if (template.deprecated && template.replacedBy && this.config.autoMigrate) {
      return this.getTemplate(template.replacedBy)
    }

    // Check if deprecated and not allowed
    if (template.deprecated && !this.config.allowDeprecated) {
      if (template.replacedBy) {
        throw new Error(`Template '${id}' is deprecated. Use '${template.replacedBy}' instead.`)
      }
      throw new Error(`Template '${id}' is deprecated.`)
    }

    return template
  }

  /**
   * Get all templates
   */
  getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values())
  }

  /**
   * Get templates by framework
   */
  getTemplatesByFramework(framework: string): PromptTemplate[] {
    return this.getAllTemplates().filter(t =>
      !t.targetFramework || t.targetFramework === framework || t.targetFramework === 'generic'
    )
  }

  /**
   * Get latest template version
   */
  getLatestTemplate(framework?: string): PromptTemplate {
    let templates = this.getAllTemplates().filter(t => !t.deprecated)

    if (framework) {
      templates = templates.filter(t =>
        !t.targetFramework || t.targetFramework === framework || t.targetFramework === 'generic'
      )
    }

    // Sort by version (descending)
    templates.sort((a, b) => this.compareVersions(b.version, a.version))

    return templates[0] || this.getTemplate(this.config.defaultVersion)
  }

  /**
   * Register custom template
   */
  registerTemplate(template: PromptTemplate): void {
    // Validate template
    this.validateTemplate(template)

    // Add to registry
    this.templates.set(template.id, template)
  }

  /**
   * Unregister template
   */
  unregisterTemplate(id: string): boolean {
    return this.templates.delete(id)
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PromptVersioningConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Validate template
   */
  validateTemplate(template: PromptTemplate): void {
    const errors: string[] = []

    // Required fields
    if (!template.id) errors.push('Template ID is required')
    if (!template.version) errors.push('Template version is required')
    if (!template.name) errors.push('Template name is required')
    if (!template.systemPrompt) errors.push('System prompt is required')
    if (!template.userPrompt) errors.push('User prompt is required')

    // Check version format
    if (!this.isValidVersion(template.version)) {
      errors.push('Invalid version format (use semver)')
    }

    // Extract variables from user prompt
    const usedVars = this.extractVariables(template.userPrompt)

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

    if (errors.length > 0) {
      throw new ValidationError('Template validation failed', {
        templateId: template.id,
        errors
      })
    }
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  /**
   * Build configuration with defaults
   */
  private buildConfig(config?: Partial<PromptVersioningConfig>): PromptVersioningConfig {
    return {
      defaultVersion: config?.defaultVersion ?? 'enhanced-v2',
      autoMigrate: config?.autoMigrate ?? true,
      allowDeprecated: config?.allowDeprecated ?? false,
      customTemplatesPath: config?.customTemplatesPath
    }
  }

  /**
   * Register built-in templates
   */
  private registerBuiltinTemplates(): void {
    for (const template of BUILTIN_TEMPLATES) {
      this.templates.set(template.id, template)
    }
  }

  /**
   * Render template with variables
   */
  private renderTemplate(template: string, variables: Record<string, any>): string {
    let rendered = template

    // Replace {{variable}} placeholders
    const varRegex = /\{\{(\w+)\}\}/g

    rendered = rendered.replace(varRegex, (match, key) => {
      const value = variables[key]

      if (value === undefined || value === null) {
        return match // Keep placeholder if not provided
      }

      // Convert arrays and objects to string
      if (Array.isArray(value)) {
        return value.join(', ')
      }

      return String(value)
    })

    return rendered
  }

  /**
   * Validate variables against template
   */
  private validateVariables(template: PromptTemplate, variables: Record<string, any>): void {
    const errors: string[] = []

    for (const variableDef of template.variables) {
      if (variableDef.required && !(variableDef.name in variables)) {
        errors.push(`Required variable '${variableDef.name}' is missing`)
      }

      if (variableDef.name in variables) {
        const value = variables[variableDef.name]

        // Type check
        if (!this.isTypeMatch(value, variableDef.type)) {
          errors.push(`Variable '${variableDef.name}' should be ${variableDef.type}`)
        }

        // Pattern check
        if (variableDef.pattern && typeof value === 'string') {
          if (!variableDef.pattern.test(value)) {
            errors.push(`Variable '${variableDef.name}' does not match required pattern`)
          }
        }

        // Enum check
        if (variableDef.enum && !variableDef.enum.includes(value)) {
          errors.push(`Variable '${variableDef.name}' must be one of: ${variableDef.enum.join(', ')}`)
        }
      }
    }

    if (errors.length > 0) {
      throw new ValidationError('Variable validation failed', { errors })
    }
  }

  /**
   * Check if value matches type
   */
  private isTypeMatch(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string'
      case 'number':
        return typeof value === 'number'
      case 'boolean':
        return typeof value === 'boolean'
      case 'object':
        return typeof value === 'object' && !Array.isArray(value)
      case 'array':
        return Array.isArray(value)
      default:
        return true
    }
  }

  /**
   * Extract variable names from template
   */
  private extractVariables(template: string): Set<string> {
    const variables = new Set<string>()
    const regex = /\{\{(\w+)\}\}/g
    let match

    while ((match = regex.exec(template)) !== null) {
      variables.add(match[1])
    }

    return variables
  }

  /**
   * Compare semver versions
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number)
    const parts2 = v2.split('.').map(Number)

    for (let i = 0; i < 3; i++) {
      if (parts1[i] > parts2[i]) return 1
      if (parts1[i] < parts2[i]) return -1
    }

    return 0
  }

  /**
   * Validate semver format
   */
  private isValidVersion(version: string): boolean {
    return /^\d+\.\d+\.\d+$/.test(version)
  }
}

// ============================================================================
// Export
// ============================================================================

export default PromptVersioning
export { BUILTIN_TEMPLATES }
