/**
 * PageWhisper - Chrome Adapter
 *
 * Adapts the Core Engine and AI System to work within a Chrome Extension.
 */

import { CoreEngine } from '../../core/CoreEngine'
import { AISystem } from '../../ai/AISystem'

export class ChromeAdapter {
  private coreEngine: CoreEngine
  private aiSystem: AISystem
  private initialized: boolean = false

  constructor() {
    this.coreEngine = CoreEngine.create()
    this.aiSystem = AISystem.create()
  }

  /**
   * Initialize adapter
   */
  async initialize() {
    if (this.initialized) return

    // Load settings
    const settings = await this.getSettings()

    // Configure AI system if API key exists
    if (settings.apiKey) {
      await this.aiSystem.configureProvider('openrouter', {
        apiKey: settings.apiKey,
        model: settings.model || 'anthropic/claude-3-sonnet'
      })
    }

    this.initialized = true
    console.log('Chrome adapter initialized')
  }

  /**
   * Extract component from current tab
   */
  async extractComponent(tabId?: number): Promise<any> {
    if (!tabId) {
      throw new Error('No tab ID provided')
    }

    try {
      // Send message to content script
      const response = await chrome.tabs.sendMessage(tabId, {
        type: 'TOGGLE_SELECTION'
      })

      return response
    } catch (error) {
      console.error('Error extracting component:', error)
      throw error
    }
  }

  /**
   * Process component through Core Engine and AI System
   */
  async processComponent(data: any): Promise<any> {
    const { component, options } = data

    try {
      // Step 1: Process through Core Engine
      const coreResult = await this.coreEngine.process({
        element: component,
        options
      })

      // Step 2: Generate AI response
      const aiResponse = await this.aiSystem.generate({
        prompt: coreResult.prompt.userPrompt,
        systemPrompt: coreResult.prompt.systemPrompt
      })

      // Update stats
      await this.updateStats({
        componentsExtracted: 1,
        componentsConverted: 1
      })

      return {
        code: aiResponse.data.content,
        component: coreResult.cleaned,
        cacheKey: coreResult.cacheKey.key,
        usage: aiResponse.data.usage
      }
    } catch (error) {
      console.error('Error processing component:', error)
      throw error
    }
  }

  /**
   * Get extension settings
   */
  async getSettings(): Promise<any> {
    const result = await chrome.storage.local.get('settings')
    return result.settings || {
      apiKey: '',
      model: 'anthropic/claude-3-sonnet',
      targetFramework: 'react',
      language: 'typescript',
      includeStyles: true,
      includeTypes: true,
      includeTests: false
    }
  }

  /**
   * Update extension settings
   */
  async updateSettings(newSettings: any): Promise<any> {
    const currentSettings = await this.getSettings()
    const settings = { ...currentSettings, ...newSettings }

    await chrome.storage.local.set({ settings })

    // Reconfigure AI system if API key changed
    if (newSettings.apiKey) {
      await this.aiSystem.configureProvider('openrouter', {
        apiKey: newSettings.apiKey,
        model: settings.model
      })
    }

    return { settings }
  }

  /**
   * Get usage statistics
   */
  async getStats(): Promise<any> {
    const result = await chrome.storage.local.get('stats')
    return result.stats || {
      componentsExtracted: 0,
      componentsConverted: 0
    }
  }

  /**
   * Update statistics
   */
  async updateStats(increment: any): Promise<void> {
    const stats = await this.getStats()

    await chrome.storage.local.set({
      stats: {
        componentsExtracted: stats.componentsExtracted + (increment.componentsExtracted || 0),
        componentsConverted: stats.componentsConverted + (increment.componentsConverted || 0)
      }
    })
  }

  /**
   * Clear AI cache
   */
  async clearCache(): Promise<void> {
    // This would clear the AI system cache
    await chrome.storage.local.remove('ai-cache')
  }

  /**
   * Check if API key is configured
   */
  async checkApiKey(): Promise<{ valid: boolean }> {
    const settings = await this.getSettings()
    return { valid: !!settings.apiKey }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<any> {
    return {
      healthy: true,
      coreEngine: 'ready',
      aiSystem: this.initialized ? 'ready' : 'not-initialized',
      cache: await this.aiSystem.getCacheStats()
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    console.log('Chrome adapter cleanup')
    this.initialized = false
  }
}

export default ChromeAdapter
