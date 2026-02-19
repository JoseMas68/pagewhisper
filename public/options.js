/**
 * PageWhisper - Options/Settings Page Script
 */

console.log('PageWhisper options page loaded')

// DOM elements
let apiKeyInput: HTMLInputElement
let modelSelect: HTMLSelectElement
let frameworkSelect: HTMLSelectElement
let languageSelect: HTMLSelectElement
let maxTokensInput: HTMLInputElement
let temperatureInput: HTMLInputElement
let temperatureValue: HTMLElement
let includeStyles: HTMLInputElement
let includeTypes: HTMLInputElement
let includeTests: HTMLInputElement
let includeComments: HTMLInputElement
let enableCache: HTMLInputElement
let apiStatus: HTMLElement
let statusIndicator: HTMLElement
let statusText: HTMLElement

/**
 * Initialize options page
 */
function initialize() {
  // Get DOM elements
  apiKeyInput = document.getElementById('api-key')!
  modelSelect = document.getElementById('model')!
  frameworkSelect = document.getElementById('framework')!
  languageSelect = document.getElementById('language')!
  maxTokensInput = document.getElementById('max-tokens')!
  temperatureInput = document.getElementById('temperature')!
  temperatureValue = document.getElementById('temp-value')!
  includeStyles = document.getElementById('include-styles')!
  includeTypes = document.getElementById('include-types')!
  includeTests = document.getElementById('include-tests')!
  includeComments = document.getElementById('include-comments')!
  enableCache = document.getElementById('enable-cache')!
  apiStatus = document.getElementById('api-status')!
  statusIndicator = document.getElementById('status-indicator')!
  statusText = document.getElementById('status-text')!

  // Setup event listeners
  setupEventListeners()

  // Load current settings
  loadSettings()

  // Load statistics
  loadStatistics()
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Toggle API key visibility
  document.getElementById('toggle-key')!.addEventListener('click', toggleApiKeyVisibility)

  // Temperature slider
  temperatureInput.addEventListener('input', () => {
    temperatureValue.textContent = temperatureInput.value
  })

  // Save settings
  document.getElementById('save-settings')!.addEventListener('click', saveSettings)

  // Reset settings
  document.getElementById('reset-settings')!.addEventListener('click', resetSettings)

  // Clear cache
  document.getElementById('clear-cache')!.addEventListener('click', clearCache)

  // Reset statistics
  document.getElementById('clear-stats')!.addEventListener('click', resetStatistics)
}

/**
 * Load settings from storage
 */
async function loadSettings() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' })
    const settings = response.settings || {}

    // Populate form fields
    if (settings.apiKey) {
      apiKeyInput.value = settings.apiKey
    }

    modelSelect.value = settings.model || 'anthropic/claude-3-sonnet'
    frameworkSelect.value = settings.targetFramework || 'react'
    languageSelect.value = settings.language || 'typescript'
    maxTokensInput.value = settings.maxTokens || 4000
    temperatureInput.value = settings.temperature || 0.7
    temperatureValue.textContent = temperatureInput.value

    includeStyles.checked = settings.includeStyles !== false
    includeTypes.checked = settings.includeTypes !== false
    includeTests.checked = settings.includeTests || false
    includeComments.checked = settings.includeComments || false
    enableCache.checked = settings.enableCache !== false

    // Check API key status
    checkApiKeyStatus()
  } catch (error) {
    console.error('Error loading settings:', error)
    showToast('Failed to load settings', 'error')
  }
}

/**
 * Save settings
 */
async function saveSettings() {
  const settings = {
    apiKey: apiKeyInput.value.trim(),
    model: modelSelect.value,
    targetFramework: frameworkSelect.value,
    language: languageSelect.value,
    maxTokens: parseInt(maxTokensInput.value),
    temperature: parseFloat(temperatureInput.value),
    includeStyles: includeStyles.checked,
    includeTypes: includeTypes.checked,
    includeTests: includeTests.checked,
    includeComments: includeComments.checked,
    enableCache: enableCache.checked
  }

  try {
    await chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      settings
    })

    showToast('Settings saved successfully', 'success')
    checkApiKeyStatus()
  } catch (error) {
    console.error('Error saving settings:', error)
    showToast('Failed to save settings', 'error')
  }
}

/**
 * Reset settings to defaults
 */
async function resetSettings() {
  if (!confirm('Are you sure you want to reset all settings to defaults?')) {
    return
  }

  const defaultSettings = {
    apiKey: '',
    model: 'anthropic/claude-3-sonnet',
    targetFramework: 'react',
    language: 'typescript',
    maxTokens: 4000,
    temperature: 0.7,
    includeStyles: true,
    includeTypes: true,
    includeTests: false,
    includeComments: false,
    enableCache: true
  }

  try {
    await chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: defaultSettings
    })

    // Reload the page to reflect changes
    location.reload()
  } catch (error) {
    console.error('Error resetting settings:', error)
    showToast('Failed to reset settings', 'error')
  }
}

/**
 * Clear cache
 */
async function clearCache() {
  if (!confirm('Are you sure you want to clear the AI cache?')) {
    return
  }

  try {
    await chrome.runtime.sendMessage({ type: 'CLEAR_CACHE' })
    showToast('Cache cleared successfully', 'success')
  } catch (error) {
    console.error('Error clearing cache:', error)
    showToast('Failed to clear cache', 'error')
  }
}

/**
 * Check API key status
 */
async function checkApiKeyStatus() {
  const apiKey = apiKeyInput.value.trim()

  if (!apiKey) {
    updateApiStatus('invalid', 'No API key configured')
    return
  }

  updateApiStatus('checking', 'Validating API key...')

  try {
    const response = await chrome.runtime.sendMessage({ type: 'CHECK_API_KEY' })

    if (response.valid) {
      updateApiStatus('valid', 'API key is valid')
    } else {
      updateApiStatus('invalid', 'Invalid API key')
    }
  } catch (error) {
    console.error('Error checking API key:', error)
    updateApiStatus('invalid', 'Failed to validate API key')
  }
}

/**
 * Update API status display
 */
function updateApiStatus(status: 'valid' | 'invalid' | 'checking', message: string) {
  statusIndicator.className = 'status-indicator ' + status
  statusText.textContent = message

  if (status === 'checking') {
    statusIndicator.classList.add('checking')
  }
}

/**
 * Load statistics
 */
async function loadStatistics() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_STATS' })
    const stats = response.stats || {
      componentsExtracted: 0,
      componentsConverted: 0
    }

    document.getElementById('stat-extracted')!.textContent = stats.componentsExtracted.toString()
    document.getElementById('stat-converted')!.textContent = stats.componentsConverted.toString()
    document.getElementById('stat-saved')!.textContent = '0' // TODO: Implement cache stats
  } catch (error) {
    console.error('Error loading statistics:', error)
  }
}

/**
 * Reset statistics
 */
async function resetStatistics() {
  if (!confirm('Are you sure you want to reset all statistics?')) {
    return
  }

  try {
    await chrome.storage.local.set({
      stats: {
        componentsExtracted: 0,
        componentsConverted: 0
      }
    })

    loadStatistics()
    showToast('Statistics reset successfully', 'success')
  } catch (error) {
    console.error('Error resetting statistics:', error)
    showToast('Failed to reset statistics', 'error')
  }
}

/**
 * Toggle API key visibility
 */
function toggleApiKeyVisibility() {
  if (apiKeyInput.type === 'password') {
    apiKeyInput.type = 'text'
  } else {
    apiKeyInput.type = 'password'
  }
}

/**
 * Show toast notification
 */
function showToast(message: string, type: 'success' | 'error' = 'success') {
  const toast = document.getElementById('toast')!
  const toastIcon = toast.querySelector('.toast-icon')!
  const toastMessage = toast.querySelector('.toast-message')!

  toast.className = 'toast ' + type
  toastIcon.textContent = type === 'success' ? '✓' : '✕'
  toastMessage.textContent = message

  toast.classList.add('show')

  setTimeout(() => {
    toast.classList.remove('show')
  }, 3000)
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize)
} else {
  initialize()
}

export {}
