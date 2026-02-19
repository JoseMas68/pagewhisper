/**
 * PageWhisper - Complete Technical Flow
 *
 * End-to-end flow: User interaction → Extraction → Hash → Cache → AI → Result → Storage
 *
 * Includes:
 * - State management
 * - Error handling
 * - Loading UX
 * - Model fallback
 */

// ============================================================================
// Flow States
// ============================================================================

/**
 * Complete flow states
 */
export type FlowState =
  | 'idle'                  // Initial state
  | 'selecting'             // User selecting element
  | 'extracting'            // Extracting DOM
  | 'detecting'             // Detecting frameworks
  | 'cleaning'              // Cleaning HTML/CSS
  | 'hashing'               // Generating cache key
  | 'checking_cache'        // Checking if cached
  | 'cache_hit'             // Found in cache
  | 'generating_prompt'     // Building AI prompt
  | 'calling_ai'            // Calling AI API
  | 'retrying_ai'           // Retrying AI call
  | 'fallback_model'        // Trying fallback model
  | 'processing_response'   // Processing AI response
  | 'storing'               // Storing in cache
  | 'completed'             // Successfully completed
  | 'failed'                // Failed with error
  | 'cancelled'             // User cancelled

/**
 * Flow state metadata
 */
export interface FlowStateMetadata {
  state: FlowState
  timestamp: number
  progress: number // 0-100
  message: string
  details?: {
    step?: string
    substep?: string
    eta?: number // Estimated time remaining in ms
    retryCount?: number
    fallbackAttempt?: number
  }
  error?: FlowError
  result?: FlowResult
}

/**
 * Flow configuration
 */
export interface FlowConfig {
  // Retry configuration
  maxRetries: number
  retryDelay: number
  enableFallback: boolean

  // Cache configuration
  enableCache: boolean
  cacheTTL: number

  // Fallback models
  fallbackModels: string[]

  // Timeout configuration
  extractionTimeout: number
  aiTimeout: number

  // UX configuration
  showProgress: boolean
  showErrors: boolean
  allowCancellation: boolean
}

/**
 * Flow input
 */
export interface FlowInput {
  element: HTMLElement
  options: {
    targetFramework: string
    language: 'typescript' | 'javascript'
    includeStyles: boolean
    includeTests: boolean
  }
}

/**
 * Flow output
 */
export interface FlowOutput {
  success: boolean
  result?: {
    html: string
    css: string
    code: string
    framework: string
    metadata: {
      processingTime: number
      cacheHit: boolean
      model: string
      tokens: {
        input: number
        output: number
        total: number
      }
    }
  }
  error?: FlowError
  stateHistory: FlowStateMetadata[]
}

/**
 * Flow error
 */
export interface FlowError {
  code: string
  message: string
  stage: FlowState
  recoverable: boolean
  retryPossible: boolean
  fallbackPossible: boolean
  details?: any
}

/**
 * Flow result
 */
export interface FlowResult {
  extracted: any
  cleaned: any
  detected: any
  prompt: any
  generated: any
  hash: string
  cacheKey: string
}

// ============================================================================
// Flow Manager
// ============================================================================

/**
 * Main flow manager
 */
export class PageWhisperFlow {
  private config: FlowConfig
  private currentState: FlowState = 'idle'
  private stateHistory: FlowStateMetadata[] = []
  private abortController?: AbortController

  constructor(config?: Partial<FlowConfig>) {
    this.config = this.buildConfig(config)
  }

  /**
   * Execute complete flow
   */
  async execute(input: FlowInput, onStateChange?: (state: FlowStateMetadata) => void): Promise<FlowOutput> {
    this.abortController = new AbortController()
    this.stateHistory = []

    try {
      // Phase 1: Selection & Extraction
      await this.phaseExtraction(input, onStateChange)

      // Phase 2: Processing & Detection
      const processedData = await this.phaseProcessing(input, onStateChange)

      // Phase 3: Hash & Cache Check
      const cacheResult = await this.phaseCacheCheck(processedData, onStateChange)

      // If cache hit, return early
      if (cacheResult.hit) {
        return this.buildSuccessOutput(cacheResult.data, true)
      }

      // Phase 4: AI Generation
      const generated = await this.phaseAIGeneration(processedData, onStateChange)

      // Phase 5: Store & Return
      await this.phaseStorage(processedData, generated, onStateChange)

      return this.buildSuccessOutput(generated, false)

    } catch (error) {
      const flowError = this.handleError(error)
      this.setState('failed', { error: flowError })
      return this.buildErrorOutput(flowError)
    }
  }

  /**
   * Phase 1: Extraction
   */
  private async phaseExtraction(input: FlowInput, onStateChange?: (state: FlowStateMetadata) => void): Promise<void> {
    this.setState('selecting', { progress: 5, message: 'Selecting element...' })
    onStateChange?.(this.getCurrentState())

    this.setState('extracting', { progress: 10, message: 'Extracting DOM structure...' })
    onStateChange?.(this.getCurrentState())

    // Simulate extraction (replace with actual CoreEngine call)
    await this.withTimeout(
      this.config.extractionTimeout,
      this.simulateExtraction(input.element),
      'Extraction timeout'
    )

    onStateChange?.(this.getCurrentState())
  }

  /**
   * Phase 2: Processing
   */
  private async phaseProcessing(input: FlowInput, onStateChange?: (state: FlowStateMetadata) => void): Promise<any> {
    // Detection
    this.setState('detecting', { progress: 20, message: 'Detecting frameworks...' })
    onStateChange?.(this.getCurrentState())

    await this.simulateDetection()

    // Cleaning
    this.setState('cleaning', { progress: 30, message: 'Cleaning HTML and CSS...' })
    onStateChange?.(this.getCurrentState())

    await this.simulateCleaning()

    // Hashing
    this.setState('hashing', { progress: 40, message: 'Generating hash...' })
    onStateChange?.(this.getCurrentState())

    const hash = await this.simulateHashing()

    return { hash }
  }

  /**
   * Phase 3: Cache Check
   */
  private async phaseCacheCheck(data: any, onStateChange?: (state: FlowStateMetadata) => void): Promise<{ hit: boolean; data?: any }> {
    this.setState('checking_cache', { progress: 45, message: 'Checking cache...' })
    onStateChange?.(this.getCurrentState())

    if (!this.config.enableCache) {
      return { hit: false }
    }

    // Simulate cache check
    await this.delay(100)

    const cacheKey = `cache_${data.hash}`
    const cached = await this.getFromCache(cacheKey)

    if (cached) {
      this.setState('cache_hit', { progress: 100, message: 'Found in cache!' })
      onStateChange?.(this.getCurrentState())
      return { hit: true, data: cached }
    }

    onStateChange?.(this.getCurrentState())
    return { hit: false }
  }

  /**
   * Phase 4: AI Generation
   */
  private async phaseAIGeneration(data: any, onStateChange?: (state: FlowStateMetadata) => void): Promise<any> {
    // Generate prompt
    this.setState('generating_prompt', { progress: 50, message: 'Building AI prompt...' })
    onStateChange?.(this.getCurrentState())

    await this.simulatePromptBuilding()

    // Call AI with retry logic
    let lastError: any
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      if (attempt > 0) {
        this.setState('retrying_ai', {
          progress: 60,
          message: `Retrying AI call... (${attempt}/${this.config.maxRetries})`,
          details: { retryCount: attempt }
        })
        onStateChange?.(this.getCurrentState())

        await this.delay(this.config.retryDelay * attempt)
      }

      this.setState('calling_ai', { progress: 70, message: 'Generating code with AI...' })
      onStateChange?.(this.getCurrentState())

      try {
        const result = await this.withTimeout(
          this.config.aiTimeout,
          this.simulateAICall(),
          'AI request timeout'
        )

        return result

      } catch (error) {
        lastError = error

        // Check if we should try fallback
        if (this.shouldTryFallback(error, attempt)) {
          return await this.phaseFallback(data, onStateChange)
        }

        // Continue retry if error is recoverable
        if (this.isRecoverableError(error)) {
          continue
        }

        // Non-recoverable error
        break
      }
    }

    throw lastError
  }

  /**
   * Phase 4b: Fallback to alternative model
   */
  private async phaseFallback(data: any, onStateChange?: (state: FlowStateMetadata) => void): Promise<any> {
    if (!this.config.enableFallback || this.config.fallbackModels.length === 0) {
      throw new Error('No fallback models available')
    }

    for (let i = 0; i < this.config.fallbackModels.length; i++) {
      const fallbackModel = this.config.fallbackModels[i]

      this.setState('fallback_model', {
        progress: 75,
        message: `Trying fallback model (${i + 1}/${this.config.fallbackModels.length})...`,
        details: { fallbackAttempt: i + 1 }
      })
      onStateChange?.(this.getCurrentState())

      try {
        await this.delay(1000) // Simulate fallback call

        const result = await this.simulateAICall(fallbackModel)

        // Success with fallback
        return result

      } catch (error) {
        // Try next fallback model
        continue
      }
    }

    throw new Error('All fallback models failed')
  }

  /**
   * Phase 5: Storage
   */
  private async phaseStorage(processedData: any, generated: any, onStateChange?: (state: FlowStateMetadata) => void): Promise<void> {
    this.setState('storing', { progress: 90, message: 'Storing in cache...' })
    onStateChange?.(this.getCurrentState())

    if (this.config.enableCache) {
      const cacheKey = `cache_${processedData.hash}`
      await this.saveToCache(cacheKey, generated, this.config.cacheTTL)
    }

    await this.delay(100)

    this.setState('completed', { progress: 100, message: 'Complete!' })
    onStateChange?.(this.getCurrentState())
  }

  /**
   * Cancel current operation
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort()
      this.setState('cancelled', { message: 'Operation cancelled by user' })
    }
  }

  // ==========================================================================
  // State Management
  // ==========================================================================

  private setState(state: FlowState, metadata?: Partial<FlowStateMetadata>): void {
    this.currentState = state

    const stateMetadata: FlowStateMetadata = {
      state,
      timestamp: Date.now(),
      progress: 0,
      message: '',
      ...metadata
    }

    this.stateHistory.push(stateMetadata)
  }

  private getCurrentState(): FlowStateMetadata {
    const last = this.stateHistory[this.stateHistory.length - 1]
    return last || {
      state: 'idle',
      timestamp: Date.now(),
      progress: 0,
      message: 'Idle'
    }
  }

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  private handleError(error: any): FlowError {
    const currentState = this.currentState

    // Determine error type
    if (error.name === 'AbortError') {
      return {
        code: 'CANCELLED',
        message: 'Operation was cancelled',
        stage: currentState,
        recoverable: false,
        retryPossible: false,
        fallbackPossible: false
      }
    }

    if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
      return {
        code: 'TIMEOUT',
        message: 'Operation timed out',
        stage: currentState,
        recoverable: true,
        retryPossible: true,
        fallbackPossible: true,
        details: { originalError: error.message }
      }
    }

    if (error.message?.includes('rate limit') || error.code === 'RATE_LIMIT_ERROR') {
      return {
        code: 'RATE_LIMITED',
        message: 'AI provider rate limit exceeded',
        stage: currentState,
        recoverable: true,
        retryPossible: true,
        fallbackPossible: true,
        details: { retryAfter: error.retryAfter }
      }
    }

    if (error.message?.includes('API') || error.code === 'API_ERROR') {
      return {
        code: 'API_ERROR',
        message: 'AI provider API error',
        stage: currentState,
        recoverable: true,
        retryPossible: true,
        fallbackPossible: true,
        details: { statusCode: error.statusCode }
      }
    }

    if (error.message?.includes('network') || error.name === 'TypeError') {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network connection error',
        stage: currentState,
        recoverable: true,
        retryPossible: true,
        fallbackPossible: true
      }
    }

    // Unknown error
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      stage: currentState,
      recoverable: false,
      retryPossible: false,
      fallbackPossible: false,
      details: { error }
    }
  }

  private isRecoverableError(error: any): boolean {
    const flowError = this.handleError(error)
    return flowError.recoverable
  }

  private shouldTryFallback(error: any, attempt: number): boolean {
    const flowError = this.handleError(error)

    return (
      this.config.enableFallback &&
      flowError.fallbackPossible &&
      attempt === this.config.maxRetries
    )
  }

  // ==========================================================================
  // Output Builders
  // ==========================================================================

  private buildSuccessOutput(result: any, cacheHit: boolean): FlowOutput {
    return {
      success: true,
      result: {
        html: result.html || '',
        css: result.css || '',
        code: result.code || '',
        framework: result.framework || 'unknown',
        metadata: {
          processingTime: this.calculateTotalTime(),
          cacheHit,
          model: result.model || 'claude-3-sonnet',
          tokens: {
            input: result.tokens?.input || 0,
            output: result.tokens?.output || 0,
            total: result.tokens?.total || 0
          }
        }
      },
      stateHistory: this.stateHistory
    }
  }

  private buildErrorOutput(error: FlowError): FlowOutput {
    return {
      success: false,
      error,
      stateHistory: this.stateHistory
    }
  }

  private calculateTotalTime(): number {
    if (this.stateHistory.length < 2) return 0

    const first = this.stateHistory[0].timestamp
    const last = this.stateHistory[this.stateHistory.length - 1].timestamp

    return last - first
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================

  private buildConfig(config?: Partial<FlowConfig>): FlowConfig {
    return {
      maxRetries: 3,
      retryDelay: 1000,
      enableFallback: true,
      enableCache: true,
      cacheTTL: 3600,
      fallbackModels: [
        'gpt-4-turbo',
        'claude-3-haiku',
        'llama-3-70b'
      ],
      extractionTimeout: 5000,
      aiTimeout: 30000,
      showProgress: true,
      showErrors: true,
      allowCancellation: true,
      ...config
    }
  }

  private async withTimeout<T>(ms: number, promise: Promise<T>, errorMessage: string): Promise<T> {
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(errorMessage)), ms)
    })

    return Promise.race([promise, timeout])
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // ==========================================================================
  // Simulations (replace with actual implementations)
  // ==========================================================================

  private async simulateExtraction(element: HTMLElement): Promise<void> {
    // TODO: Replace with CoreEngine.extractor.extract()
    await this.delay(200)
  }

  private async simulateDetection(): Promise<void> {
    // TODO: Replace with CoreEngine.detector.detect()
    await this.delay(150)
  }

  private async simulateCleaning(): Promise<void> {
    // TODO: Replace with CoreEngine.cleaner.clean()
    await this.delay(150)
  }

  private async simulateHashing(): Promise<string> {
    // TODO: Replace with CoreEngine.hashGenerator.hash()
    await this.delay(50)
    return 'hash_' + Math.random().toString(36)
  }

  private async simulatePromptBuilding(): Promise<void> {
    // TODO: Replace with CoreEngine.promptBuilder.build()
    await this.delay(100)
  }

  private async simulateAICall(model?: string): Promise<any> {
    // TODO: Replace with AISystem.generate()
    await this.delay(2000)

    return {
      html: '<div>Component</div>',
      css: '.component { color: blue; }',
      code: 'export default function Component() { return <div>Component</div>; }',
      framework: 'react',
      model: model || 'claude-3-sonnet',
      tokens: { input: 1000, output: 500, total: 1500 }
    }
  }

  private async getFromCache(key: string): Promise<any> {
    // TODO: Replace with CacheManager.get()
    await this.delay(50)
    return null // No cache hit in simulation
  }

  private async saveToCache(key: string, value: any, ttl: number): Promise<void> {
    // TODO: Replace with CacheManager.set()
    await this.delay(50)
  }
}

// ============================================================================
// UX Components (Examples)
// ============================================================================

/**
 * Loading UX Component
 */
export class LoadingUX {
  private stateElement: HTMLElement
  private progressElement: HTMLElement
  private messageElement: HTMLElement

  constructor(container: HTMLElement) {
    // Create UI elements
    this.stateElement = this.createElement('state')
    this.progressElement = this.createElement('progress-bar')
    this.messageElement = this.createElement('message')

    container.appendChild(this.stateElement)
    container.appendChild(this.progressElement)
    container.appendChild(this.messageElement)
  }

  update(state: FlowStateMetadata): void {
    this.updateProgress(state.progress)
    this.updateMessage(state.message)
    this.updateState(state.state)

    // Add animations based on state
    this.setAnimation(state.state)
  }

  showSuccess(result: any): void {
    this.updateMessage('✓ Complete!')
    this.updateProgress(100)
    this.setAnimation('completed')
  }

  showError(error: FlowError): void {
    this.updateMessage(`✗ Error: ${error.message}`)
    this.setAnimation('failed')

    if (error.retryPossible) {
      this.showRetryButton()
    }

    if (error.fallbackPossible) {
      this.showFallbackInfo()
    }
  }

  private updateProgress(percent: number): void {
    this.progressElement.style.width = `${percent}%`
    this.progressElement.setAttribute('aria-valuenow', String(percent))
  }

  private updateMessage(message: string): void {
    this.messageElement.textContent = message
  }

  private updateState(state: FlowState): void {
    const stateLabels: Record<FlowState, string> = {
      idle: 'Ready',
      selecting: 'Selecting element...',
      extracting: 'Extracting component...',
      detecting: 'Detecting frameworks...',
      cleaning: 'Cleaning code...',
      hashing: 'Generating hash...',
      checking_cache: 'Checking cache...',
      cache_hit: 'Cache hit!',
      generating_prompt: 'Building prompt...',
      calling_ai: 'Generating code...',
      retrying_ai: 'Retrying...',
      fallback_model: 'Trying alternative model...',
      processing_response: 'Processing response...',
      storing: 'Caching result...',
      completed: 'Complete!',
      failed: 'Failed',
      cancelled: 'Cancelled'
    }

    this.stateElement.textContent = stateLabels[state]
  }

  private setAnimation(state: FlowState): void {
    const loadingStates = ['extracting', 'detecting', 'cleaning', 'hashing', 'calling_ai']
    const hasLoader = loadingStates.includes(state)

    if (hasLoader) {
      this.progressElement.classList.add('loading')
    } else {
      this.progressElement.classList.remove('loading')
    }

    // Color coding
    this.progressElement.classList.remove('success', 'error', 'warning')

    if (state === 'completed' || state === 'cache_hit') {
      this.progressElement.classList.add('success')
    } else if (state === 'failed') {
      this.progressElement.classList.add('error')
    } else if (state === 'fallback_model') {
      this.progressElement.classList.add('warning')
    }
  }

  private showRetryButton(): void {
    const retryBtn = document.createElement('button')
    retryBtn.textContent = 'Retry'
    retryBtn.onclick = () => window.location.reload()
    this.messageElement.appendChild(retryBtn)
  }

  private showFallbackInfo(): void {
    const info = document.createElement('div')
    info.textContent = 'Trying alternative AI model...'
    info.className = 'fallback-info'
    this.messageElement.appendChild(info)
  }

  private createElement(type: string): HTMLElement {
    const element = document.createElement('div')
    element.className = `pw-ux-${type}`
    return element
  }
}

// ============================================================================
// CSS for UX Components
// ============================================================================

export const UX_STYLES = `
.pagewhisper-ux {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.pw-ux-state {
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.pw-ux-progress-bar {
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
  transition: width 0.3s ease;
}

.pw-ux-progress-bar.loading {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  animation: shimmer 1.5s infinite;
}

.pw-ux-progress-bar.success {
  background: #10b981;
}

.pw-ux-progress-bar.error {
  background: #ef4444;
}

.pw-ux-progress-bar.warning {
  background: #f59e0b;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.pw-ux-message {
  color: #666;
  font-size: 14px;
  margin-top: 8px;
}

.fallback-info {
  color: #f59e0b;
  font-size: 12px;
  margin-top: 4px;
}
`

// ============================================================================
// Export
// ============================================================================

export default PageWhisperFlow
