/**
 * PageWhisper - Technical Flows
 *
 * Complete flow definitions for component extraction and AI generation.
 * @module flows
 */

// Main flow manager
export { PageWhisperFlow } from './CompleteFlow'

// UX components
export { LoadingUX, UX_STYLES } from './CompleteFlow'

// Types
export type {
  FlowState,
  FlowStateMetadata,
  FlowConfig,
  FlowInput,
  FlowOutput,
  FlowError,
  FlowResult
} from './CompleteFlow'

// Default export
export { PageWhisperFlow as default } from './CompleteFlow'
