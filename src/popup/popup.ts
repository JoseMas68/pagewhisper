/**
 * PageWhisper - Popup Script
 *
 * Handles popup UI and interactions with background script.
 */

console.log('PageWhisper popup loaded')

// DOM elements
let apiStatus: HTMLElement
let selectElementBtn: HTMLButtonElement
let convertBtn: HTMLButtonElement
let previewSection: HTMLElement
let loadingSection: HTMLElement
let resultSection: HTMLElement
let codeOutput: HTMLElement
let copyBtn: HTMLButtonElement
let saveBtn: HTMLButtonElement

// State
let selectedComponent: any = null
let currentSettings: any = null

/**
 * Initialize popup
 */
function initialize() {
  // Get DOM elements
  apiStatus = document.getElementById('api-status')!
  selectElementBtn = document.getElementById('select-element')!
  convertBtn = document.getElementById('convert-component')!
  previewSection = document.getElementById('preview-section')!
  loadingSection = document.getElementById('loading-section')!
  resultSection = document.getElementById('result-section')!
  codeOutput = document.getElementById('code-output')!
  copyBtn = document.getElementById('copy-code')!
  saveBtn = document.getElementById('save-file')!

  // Setup event listeners
  setupEventListeners()

  // Check API key
  checkApiKeyStatus()

  // Get current settings
  getSettings()

  // Check if there's a selected component
  checkSelectedComponent()
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  selectElementBtn.addEventListener('click', handleSelectElement)
  convertBtn.addEventListener('click', handleConvert)
  copyBtn.addEventListener('click', handleCopy)
  saveBtn.addEventListener('click', handleSave)
}

/**
 * Check API key status
 */
async function checkApiKeyStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'CHECK_API_KEY' })

    updateApiStatus(response.valid)
  } catch (error) {
    console.error('Error checking API key:', error)
    updateApiStatus(false)
  }
}

/**
 * Update API status display
 */
function updateApiStatus(valid: boolean) {
  if (valid) {
    apiStatus.className = 'api-status valid'
    apiStatus.innerHTML = `
      <div class="status-icon">✓</div>
      <div class="status-text">API key configured</div>
    `
  } else {
    apiStatus.className = 'api-status invalid'
    apiStatus.innerHTML = `
      <div class="status-icon">⚠️</div>
      <div class="status-text">
        <a href="options.html" style="color: inherit; text-decoration: underline;">Configure API key</a>
      </div>
    `
  }
}

/**
 * Get current settings
 */
async function getSettings() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' })
    currentSettings = response.settings

    // Update UI with current settings
    if (currentSettings) {
      const frameworkSelect = document.getElementById('framework') as HTMLSelectElement
      const languageSelect = document.getElementById('language') as HTMLSelectElement
      const includeStyles = document.getElementById('include-styles') as HTMLInputElement
      const includeTypes = document.getElementById('include-types') as HTMLInputElement
      const includeTests = document.getElementById('include-tests') as HTMLInputElement

      frameworkSelect.value = currentSettings.targetFramework || 'react'
      languageSelect.value = currentSettings.language || 'typescript'
      includeStyles.checked = currentSettings.includeStyles !== false
      includeTypes.checked = currentSettings.includeTypes !== false
      includeTests.checked = currentSettings.includeTests || false
    }
  } catch (error) {
    console.error('Error getting settings:', error)
  }
}

/**
 * Check if there's a selected component
 */
async function checkSelectedComponent() {
  // This would check storage for a previously selected component
  // For now, we'll wait for user to select
}

/**
 * Handle select element button
 */
async function handleSelectElement() {
  try {
    // Send message to content script to toggle selection mode
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

    if (!tab.id) {
      showError('No active tab found')
      return
    }

    await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_SELECTION' })

    // Close popup to let user select element
    window.close()
  } catch (error) {
    console.error('Error selecting element:', error)
    showError('Failed to select element. Make sure you\'re on a web page.')
  }
}

/**
 * Handle convert button
 */
async function handleConvert() {
  if (!selectedComponent) {
    showError('No component selected')
    return
  }

  // Get options from UI
  const framework = (document.getElementById('framework') as HTMLSelectElement).value
  const language = (document.getElementById('language') as HTMLSelectElement).value
  const includeStyles = (document.getElementById('include-styles') as HTMLInputElement).checked
  const includeTypes = (document.getElementById('include-types') as HTMLInputElement).checked
  const includeTests = (document.getElementById('include-tests') as HTMLInputElement).checked

  // Show loading
  previewSection.style.display = 'none'
  loadingSection.style.display = 'flex'
  resultSection.style.display = 'none'

  try {
    // Send conversion request to background
    const response = await chrome.runtime.sendMessage({
      type: 'PROCESS_COMPONENT',
      data: {
        component: selectedComponent,
        options: {
          targetFramework: framework,
          language,
          includeStyles,
          includeTypes,
          includeTests
        }
      }
    })

    if (response.error) {
      throw new Error(response.error)
    }

    // Show result
    showResult(response.result)
  } catch (error) {
    console.error('Error converting component:', error)
    showError((error as Error).message)

    // Show preview again
    loadingSection.style.display = 'none'
    previewSection.style.display = 'flex'
  }
}

/**
 * Show conversion result
 */
function showResult(result: any) {
  loadingSection.style.display = 'none'
  resultSection.style.display = 'flex'

  codeOutput.textContent = result.code || result.content || 'Conversion complete'
}

/**
 * Handle copy button
 */
async function handleCopy() {
  const code = codeOutput.textContent

  if (!code) return

  try {
    await navigator.clipboard.writeText(code)

    // Update button text temporarily
    const originalText = copyBtn.innerHTML
    copyBtn.innerHTML = '✓ Copied!'
    setTimeout(() => {
      copyBtn.innerHTML = originalText
    }, 2000)
  } catch (error) {
    console.error('Error copying:', error)
    showError('Failed to copy to clipboard')
  }
}

/**
 * Handle save file button
 */
function handleSave() {
  const code = codeOutput.textContent

  if (!code) return

  // Create blob and download
  const blob = new Blob([code], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `component.${currentSettings?.language === 'typescript' ? 'tsx' : 'jsx'}`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Show error message
 */
function showError(message: string) {
  // You could implement a toast notification here
  alert(message)
}

/**
 * Listen for messages from content script
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ELEMENT_EXTRACTED') {
    selectedComponent = message.data
    showSelectedComponent(message.data)
  }
})

/**
 * Show selected component info
 */
function showSelectedComponent(component: any) {
  previewSection.style.display = 'flex'

  // Update component info
  const elementType = document.getElementById('element-type')!
  const elementClasses = document.getElementById('element-classes')!

  elementType.textContent = component.tagName || 'Unknown'
  elementClasses.textContent = component.className || 'None'
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize)
} else {
  initialize()
}

export {}
