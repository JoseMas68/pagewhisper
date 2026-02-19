/**
 * PageWhisper - Background Service Worker
 *
 * Handles extension lifecycle, message routing, and state management.
 */

import { ChromeAdapter } from '../adapters/chrome/ChromeAdapter'

// Global adapter instance
let adapter: ChromeAdapter | null = null

/**
 * Initialize extension on installation
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('PageWhisper installed:', details.reason)

  if (details.reason === 'install') {
    // First time installation
    await handleInstall()
  } else if (details.reason === 'update') {
    // Extension update
    await handleUpdate(details.previousVersion)
  }

  // Initialize adapter
  adapter = new ChromeAdapter()
  await adapter.initialize()
})

/**
 * Handle extension installation
 */
async function handleInstall() {
  // Set default settings
  await chrome.storage.local.set({
    settings: {
      apiKey: '',
      model: 'anthropic/claude-3-sonnet',
      targetFramework: 'react',
      language: 'typescript',
      includeStyles: true,
      includeTypes: true
    },
    stats: {
      componentsExtracted: 0,
      componentsConverted: 0
    }
  })

  // Open options page
  chrome.tabs.create({ url: chrome.runtime.getURL('options.html') })
}

/**
 * Handle extension update
 */
async function handleUpdate(previousVersion?: string) {
  console.log('Updated from version:', previousVersion)

  // Migration logic if needed
  if (previousVersion && shouldMigrate(previousVersion)) {
    await migrateSettings(previousVersion)
  }
}

/**
 * Check if migration is needed
 */
function shouldMigrate(fromVersion: string): boolean {
  const [major] = fromVersion.split('.').map(Number)
  return major < 0 // Migrate from v0.x.x
}

/**
 * Migrate settings from old version
 */
async function migrateSettings(fromVersion: string) {
  const data = await chrome.storage.local.get('settings')

  // Add migration logic here if settings structure changes
  console.log('Migrating settings from', fromVersion)

  await chrome.storage.local.set({ settings: data.settings || {} })
}

/**
 * Handle messages from content scripts and popup
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message)

  handleMessage(message, sender)
    .then(sendResponse)
    .catch((error) => {
      console.error('Error handling message:', error)
      sendResponse({ error: error.message })
    })

  return true // Keep message channel open for async response
})

/**
 * Handle incoming messages
 */
async function handleMessage(message: any, sender: chrome.runtime.MessageSender) {
  if (!adapter) {
    adapter = new ChromeAdapter()
    await adapter.initialize()
  }

  switch (message.type) {
    case 'EXTRACT_COMPONENT':
      return await adapter.extractComponent(sender.tab?.id)

    case 'PROCESS_COMPONENT':
      return await adapter.processComponent(message.data)

    case 'GET_SETTINGS':
      return await adapter.getSettings()

    case 'UPDATE_SETTINGS':
      return await adapter.updateSettings(message.settings)

    case 'GET_STATS':
      return await adapter.getStats()

    case 'CLEAR_CACHE':
      return await adapter.clearCache()

    case 'CHECK_API_KEY':
      return await adapter.checkApiKey()

    default:
      throw new Error(`Unknown message type: ${message.type}`)
  }
}

/**
 * Handle keyboard shortcuts
 */
chrome.commands.onCommand.addListener(async (command) => {
  console.log('Command received:', command)

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

  if (!tab.id) return

  switch (command) {
    case 'open-popup':
      chrome.action.openPopup()
      break

    case 'extract-component':
      // Send message to content script
      chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_SELECTION' })
      break
  }
})

/**
 * Handle tab updates (for detecting page changes)
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Page loaded:', tab.url)

    // Notify content script if needed
    try {
      await chrome.tabs.sendMessage(tabId, { type: 'PAGE_LOADED' })
    } catch (error) {
      // Content script not ready yet, that's ok
    }
  }
})

/**
 * Clean up on extension suspension
 */
self.addEventListener('beforeunload', () => {
  console.log('Extension suspending')
  if (adapter) {
    adapter.cleanup()
  }
})

/**
 * Keep service worker alive
 */
setInterval(() => {
  // Ping to keep service worker alive
  chrome.runtime.getPlatformInfo(() => {
    // Callback keeps worker alive
  })
}, 20000) // Every 20 seconds

export {}
