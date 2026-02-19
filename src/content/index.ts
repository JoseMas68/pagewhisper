/**
 * PageWhisper - Content Script
 *
 * Injected into web pages to enable component extraction.
 */

console.log('PageWhisper content script loaded')

// Track selection state
let isSelecting = false
let selectedElement: HTMLElement | null = null
let overlay: HTMLElement | null = null

/**
 * Initialize content script
 */
function initialize() {
  setupMessageListener()
  setupKeyboardShortcuts()
  createOverlay()
}

/**
 * Setup message listener from background/popup
 */
function setupMessageListener() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Content script received message:', message)

    handleMessage(message)
      .then(sendResponse)
      .catch((error) => {
        console.error('Error handling message:', error)
        sendResponse({ error: error.message })
      })

    return true // Keep message channel open
  })
}

/**
 * Handle incoming messages
 */
async function handleMessage(message: any) {
  switch (message.type) {
    case 'PAGE_LOADED':
      console.log('Page loaded, PageWhisper ready')
      return { ready: true }

    case 'TOGGLE_SELECTION':
      toggleSelection()
      return { selecting: isSelecting }

    case 'EXTRACT_ELEMENT':
      const element = document.querySelector(message.selector)
      if (!element) {
        throw new Error(`Element not found: ${message.selector}`)
      }
      return extractElement(element as HTMLElement)

    case 'HIGHLIGHT_ELEMENT':
      highlightElement(message.selector)
      return { success: true }

    case 'REMOVE_HIGHLIGHT':
      removeHighlight()
      return { success: true }

    default:
      throw new Error(`Unknown message type: ${message.type}`)
  }
}

/**
 * Toggle element selection mode
 */
function toggleSelection() {
  isSelecting = !isSelecting

  if (isSelecting) {
    document.body.style.cursor = 'crosshair'
    setupElementHover()
    showOverlay('Click on an element to extract it')
  } else {
    document.body.style.cursor = ''
    removeElementHover()
    hideOverlay()
    removeHighlight()
  }
}

/**
 * Setup hover effect for element selection
 */
function setupElementHover() {
  document.addEventListener('mouseover', handleMouseOver)
  document.addEventListener('mouseout', handleMouseOut)
  document.addEventListener('click', handleClick)
}

/**
 * Remove hover effect
 */
function removeElementHover() {
  document.removeEventListener('mouseover', handleMouseOver)
  document.removeEventListener('mouseout', handleMouseOut)
  document.removeEventListener('click', handleClick)
}

/**
 * Handle mouse over element
 */
function handleMouseOver(event: Event) {
  if (!isSelecting) return

  const target = event.target as HTMLElement
  if (target === overlay || overlay?.contains(target)) return

  target.style.outline = '2px solid #3b82f6'
  target.style.outlineOffset = '2px'
}

/**
 * Handle mouse out element
 */
function handleMouseOut(event: Event) {
  if (!isSelecting) return

  const target = event.target as HTMLElement
  target.style.outline = ''
  target.style.outlineOffset = ''
}

/**
 * Handle click on element
 */
function handleClick(event: MouseEvent) {
  if (!isSelecting) return

  event.preventDefault()
  event.stopPropagation()

  const target = event.target as HTMLElement
  selectedElement = target

  // Remove outline
  target.style.outline = ''
  target.style.outlineOffset = ''

  // Extract element
  extractElement(target).then((result) => {
    // Send result to background
    chrome.runtime.sendMessage({
      type: 'ELEMENT_EXTRACTED',
      data: result
    })

    // Show success message
    showOverlay('Component extracted! Check the popup to convert it.')
  })

  // Turn off selection mode
  toggleSelection()
}

/**
 * Extract element data
 */
async function extractElement(element: HTMLElement) {
  // Get computed styles
  const computedStyles = window.getComputedStyle(element)

  // Get all CSS rules that apply to this element
  const styles = getCSSForElement(element)

  // Get bounding rect
  const rect = element.getBoundingClientRect()

  return {
    tagName: element.tagName,
    id: element.id,
    className: element.className,
    attributes: getAttributes(element),
    textContent: element.textContent?.trim().substring(0, 100),
    innerHTML: element.innerHTML,
    styles: {
      display: computedStyles.display,
      position: computedStyles.position,
      width: computedStyles.width,
      height: computedStyles.height,
      color: computedStyles.color,
      backgroundColor: computedStyles.backgroundColor,
      padding: computedStyles.padding,
      margin: computedStyles.margin,
      border: computedStyles.border,
      borderRadius: computedStyles.borderRadius,
      fontSize: computedStyles.fontSize,
      fontWeight: computedStyles.fontWeight
    },
    boundingRect: {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left,
      bottom: rect.bottom,
      right: rect.right
    },
    css: styles
  }
}

/**
 * Get element attributes
 */
function getAttributes(element: HTMLElement): Record<string, string> {
  const attributes: Record<string, string> = {}

  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i]
    attributes[attr.name] = attr.value
  }

  return attributes
}

/**
 * Get all CSS rules for element
 */
function getCSSForElement(element: HTMLElement): string {
  const rules: string[] = []

  // Get inline styles
  if (element.getAttribute('style')) {
    rules.push(`/* Inline */\n${element.getAttribute('style')}`)
  }

  // Get styles from all stylesheets
  try {
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules || sheet.rules) {
          if (rule instanceof CSSStyleRule) {
            // Check if rule matches element
            if (element.matches(rule.selectorText)) {
              rules.push(`/* ${rule.selectorText} */\n${rule.style.cssText}`)
            }
          }
        }
      } catch (error) {
        // CORS restrictions, skip this stylesheet
        console.warn('Cannot access stylesheet:', error)
      }
    }
  } catch (error) {
    console.warn('Error getting CSS:', error)
  }

  return rules.join('\n\n')
}

/**
 * Highlight element with overlay
 */
function highlightElement(selector: string) {
  const element = document.querySelector(selector) as HTMLElement
  if (!element) return

  element.style.outline = '3px solid #10b981'
  element.style.outlineOffset = '3px'
  element.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.5)'

  // Scroll element into view
  element.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

/**
 * Remove element highlight
 */
function removeHighlight() {
  const highlighted = document.querySelectorAll('[style*="outline"]')
  highlighted.forEach((el) => {
    const element = el as HTMLElement
    element.style.outline = ''
    element.style.outlineOffset = ''
    element.style.boxShadow = ''
  })
}

/**
 * Create overlay for messages
 */
function createOverlay() {
  overlay = document.createElement('div')
  overlay.id = 'pagewhisper-overlay'
  overlay.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #1f2937;
    color: #f3f4f6;
    padding: 12px 20px;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 2147483647;
    display: none;
    max-width: 300px;
  `
  document.body.appendChild(overlay)
}

/**
 * Show overlay message
 */
function showOverlay(message: string) {
  if (!overlay) return

  overlay.textContent = message
  overlay.style.display = 'block'

  // Auto-hide after 3 seconds
  setTimeout(() => {
    hideOverlay()
  }, 3000)
}

/**
 * Hide overlay
 */
function hideOverlay() {
  if (!overlay) return
  overlay.style.display = 'none'
}

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (event) => {
    // Alt+Shift+E to toggle extraction mode
    if (event.altKey && event.shiftKey && event.key === 'E') {
      event.preventDefault()
      toggleSelection()
    }
  })
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize)
} else {
  initialize()
}

export {}
