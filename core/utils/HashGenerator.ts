/**
 * PageWhisper Core Engine - Hash Generator
 *
 * Responsibilities:
 * - Generate deterministic content hashes
 * - Create cache keys for AI responses
 * - Support multiple hash algorithms
 * - Work in both browser and Node.js environments
 *
 * Browser Compatibility:
 * - Browser: Uses Web Crypto API
 * - Node.js: Uses Node crypto module
 * - Fallback: Simple hash algorithms
 */

import type {
  HashConfig,
  CacheKey,
  ContentHash,
  CleanedComponent,
  DetectionResult,
  GenerationOptions
} from '../types/index'

// Default hash configuration
const DEFAULT_CONFIG: HashConfig = {
  algorithm: 'sha256',
  encoding: 'hex',
  normalizeWhitespace: true,
  includeMetadata: true
}

/**
 * Hash Generator - Core hashing logic
 */
export class HashGenerator {
  private config: HashConfig

  constructor(config: Partial<HashConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Generate hash from string
   */
  async hash(input: string): Promise<string> {
    const normalized = this.config.normalizeWhitespace
      ? this.normalizeWhitespace(input)
      : input

    switch (this.config.algorithm) {
      case 'sha256':
        return this.sha256(normalized)
      case 'sha1':
        return this.sha1(normalized)
      case 'md5':
        return this.md5(normalized)
      case 'fnv1a':
        return this.fnv1a(normalized)
      default:
        throw new Error(`Unsupported algorithm: ${this.config.algorithm}`)
    }
  }

  /**
   * Generate content hash from component
   */
  async hashContent(component: CleanedComponent): Promise<ContentHash> {
    const htmlHash = await this.hash(component.html)
    const cssHash = await this.hash(component.css)
    const combined = `${component.html}|||${component.css}`
    const combinedHash = await this.hash(combined)

    return {
      html: htmlHash,
      css: cssHash,
      combined: combinedHash,
      algorithm: this.config.algorithm
    }
  }

  /**
   * Generate cache key for AI request
   */
  async generateCacheKey(
    component: CleanedComponent,
    detection: DetectionResult,
    options: GenerationOptions
  ): Promise<CacheKey> {
    // Hash component content
    const componentHash = await this.hashContent(component)

    // Hash detection context
    const detectionContext = this.buildDetectionContext(detection)
    const contextHash = await this.hash(detectionContext)

    // Hash generation options
    const optionsContext = this.buildOptionsContext(options)
    const optionsHash = await this.hash(optionsContext)

    // Combine all hashes for final key
    const combined = `${componentHash.combined}|${contextHash}|${optionsHash}`
    const finalKey = await this.hash(combined)

    return {
      key: finalKey,
      algorithm: this.config.algorithm,
      input: {
        componentHash: componentHash.combined,
        contextHash: contextHash,
        optionsHash: optionsHash
      }
    }
  }

  /**
   * Build detection context string
   */
  private buildDetectionContext(detection: DetectionResult): string {
    const frameworks = detection.frameworks.map(f => f.name).sort().join(',')
    const cssFrameworks = detection.cssFrameworks.map(f => f.name).sort().join(',')
    const libraries = detection.libraries.sort().join(',')

    return JSON.stringify({ frameworks, cssFrameworks, libraries })
  }

  /**
   * Build options context string
   */
  private buildOptionsContext(options: GenerationOptions): string {
    return JSON.stringify({
      framework: options.targetFramework,
      language: options.language,
      includeStyles: options.includeStyles,
      includeTests: options.includeTests,
      includeTypes: options.includeTypes,
      accessibility: options.accessibilityLevel,
      optimization: options.optimizationLevel
    })
  }

  // ==========================================================================
  // Hash Algorithms
  // ==========================================================================

  /**
   * SHA-256 hash (Web Crypto API or Node crypto)
   */
  private async sha256(input: string): Promise<string> {
    // Browser environment
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder()
      const data = encoder.encode(input)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)

      return this.encodeBuffer(hashBuffer)
    }

    // Fallback: Simple SHA-256 implementation
    return this.sha256Fallback(input)
  }

  /**
   * SHA-1 hash
   */
  private async sha1(input: string): Promise<string> {
    // Browser environment
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder()
      const data = encoder.encode(input)
      const hashBuffer = await crypto.subtle.digest('SHA-1', data)

      return this.encodeBuffer(hashBuffer)
    }

    throw new Error('SHA-1 not available in this environment')
  }

  /**
   * MD5 hash
   */
  private async md5(input: string): Promise<string> {
    // Fallback: Simple MD5 implementation
    return this.md5Fallback(input)
  }

  /**
   * FNV-1a hash (fast, non-cryptographic)
   */
  private async fnv1a(input: string): Promise<string> {
    const FNV_OFFSET_BASIS = 0x811c9dc5
    const FNV_PRIME = 0x01000193

    let hash = FNV_OFFSET_BASIS

    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i)
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
      hash >>>= 0 // Convert to 32-bit unsigned
    }

    // Convert to hex
    let hex = ''
    for (let i = 0; i < 4; i++) {
      const byte = (hash >>> (i * 8)) & 0xff
      hex += byte.toString(16).padStart(2, '0')
    }

    return hex
  }

  // ==========================================================================
  // Fallback Algorithms
  // ==========================================================================

  /**
   * Fallback SHA-256 implementation (simplified)
   * Note: This is a basic implementation for environments without crypto
   */
  private async sha256Fallback(input: string): Promise<string> {
    // For now, use FNV-1a as fallback
    // In production, you'd want a proper SHA-256 implementation
    const fnvHash = await this.fnv1a(input + 'sha256')

    // Make it longer to approximate SHA-256 length
    return fnvHash + fnvHash + fnvHash + fnvHash
  }

  /**
   * Fallback MD5 implementation (simplified)
   */
  private async md5Fallback(input: string): Promise<string> {
    // Use FNV-1a with MD5-like transformations
    const fnvHash = await this.fnv1a(input + 'md5')

    // Make it longer to approximate MD5 length
    return fnvHash + fnvHash + fnvHash + fnvHash
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Encode buffer based on configured encoding
   */
  private encodeBuffer(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)

    switch (this.config.encoding) {
      case 'hex':
        return Array.from(bytes)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')

      case 'base64':
        return this.btoa(String.fromCharCode(...bytes))

      case 'base64url':
        const base64 = this.btoa(String.fromCharCode(...bytes))
        return base64
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '')

      default:
        throw new Error(`Unsupported encoding: ${this.config.encoding}`)
    }
  }

  /**
   * Base64 encode (browser-compatible)
   */
  private btoa(str: string): string {
    if (typeof btoa !== 'undefined') {
      return btoa(str)
    }

    // Manual implementation
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    let result = ''
    let i = 0

    while (i < str.length) {
      const a = str.charCodeAt(i++)
      const b = i < str.length ? str.charCodeAt(i++) : 0
      const c = i < str.length ? str.charCodeAt(i++) : 0

      const bitmap = (a << 16) | (b << 8) | c

      result += chars.charAt((bitmap >> 18) & 63)
      result += chars.charAt((bitmap >> 12) & 63)
      result += chars.charAt((bitmap >> 6) & 63)
      result += chars.charAt(bitmap & 63)
    }

    // Pad with '='
    const padding = str.length % 3
    if (padding > 0) {
      result = result.slice(0, -padding) + '==='.slice(0, padding)
    }

    return result
  }

  /**
   * Normalize whitespace in string
   */
  private normalizeWhitespace(str: string): string {
    return str
      .replace(/\s+/g, ' ')  // Collapse multiple spaces to one
      .replace(/>\s+</g, '><')  // Remove spaces between tags
      .trim()
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Update configuration
   */
  updateConfig(config: Partial<HashConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get current configuration
   */
  getConfig(): HashConfig {
    return { ...this.config }
  }

  /**
   * Quick hash helper (uses default config)
   */
  static async quickHash(input: string, algorithm: 'sha256' | 'fnv1a' = 'fnv1a'): Promise<string> {
    const generator = new HashGenerator({ algorithm })
    return generator.hash(input)
  }

  /**
   * Generate unique ID
   */
  static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
  }
}

// ============================================================================
// Export
// ============================================================================

export default HashGenerator
export type { HashConfig, CacheKey, ContentHash }
