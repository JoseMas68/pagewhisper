# PageWhisper - Complete Technical Flow

## State Machine Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                          USER FLOW                                       │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  [USER CLICKS ELEMENT]                                                     │
│         │                                                                  │
│         ▼                                                                  │
│  ┌─────────────────┐                                                       │
│  │   SELECTING     │  User highlights element on page                      │
│  │   Progress: 5%  │  UX: Show selection highlight                          │
│  └────────┬────────┘                                                       │
│           │                                                                  │
│           ▼                                                                  │
│  ┌─────────────────┐                                                       │
│  │   EXTRACTING    │  Extract DOM structure and styles                     │
│  │   Progress: 10% │  Core: DOMExtractor.extract()                         │
│  │   Timeout: 5s   │  UX: "Extracting component..."                         │
│  └────────┬────────┘                                                       │
│           │                                                                  │
│           ▼                                                                  │
│  ┌─────────────────┐                                                       │
│  │   DETECTING     │  Detect frameworks and libraries                      │
│  │   Progress: 20% │  Core: FrameworkDetector.detect()                     │
│  │                 │  UX: "Detecting frameworks..."                         │
│  └────────┬────────┘                                                       │
│           │                                                                  │
│           ▼                                                                  │
│  ┌─────────────────┐                                                       │
│  │   CLEANING      │  Clean and optimize HTML/CSS                          │
│  │   Progress: 30% │  Core: DOMCleaner.clean()                             │
│  │                 │  UX: "Cleaning code..."                                │
│  └────────┬────────┘                                                       │
│           │                                                                  │
│           ▼                                                                  │
│  ┌─────────────────┐                                                       │
│  │   HASHING       │  Generate deterministic hash                          │
│  │   Progress: 40% │  Core: HashGenerator.hash()                           │
│  │                 │  UX: "Generating hash..."                              │
│  └────────┬────────┘                                                       │
│           │                                                                  │
│           ▼                                                                  │
│  ┌─────────────────────────────────────┐                                   │
│  │       CHECKING CACHE                │                                   │
│  │       Progress: 45%                 │  Core: CacheManager.get()          │
│  └───────┬─────────────────────────────┘                                   │
│          │                                                                │
│          ├──[CACHE HIT]───┐                                               │
│          │                 │                                               │
│          │                 ▼                                               │
│          │    ┌─────────────────┐                                         │
│          │    │  CACHE_HIT      │  Return cached result                    │
│          │    │  Progress: 100% │  UX: "Found in cache! ✓"                  │
│          │    │  Time: ~100ms   │  Total time: < 1s                         │
│          │    └─────────────────┘                                         │
│          │                                                                  │
│          └──[CACHE MISS]──┐                                               │
│                            │                                               │
│                            ▼                                               │
│              ┌─────────────────┐                                          │
│              │ GENERATING_PROMPT│  Build AI prompt with template          │
│              │ Progress: 50%    │  Core: PromptBuilder.build()            │
│              └────────┬─────────┘                                          │
│                       │                                                    │
│                       ▼                                                    │
│              ┌─────────────────┐                                          │
│              │   CALLING_AI    │  Call AI API with retry logic             │
│              │   Progress: 70% │  AI: AISystem.generate()                 │
│              │   Timeout: 30s  │  UX: "Generating code with AI..."          │
│              └────────┬─────────┘                                          │
│                       │                                                    │
│                       ├──[SUCCESS]─────────────────┐                       │
│                       │                          │                       │
│                       │                          ▼                       │
│                       │          ┌─────────────────┐                     │
│                       │          │ PROCESSING_RESP │  Parse AI response    │
│                       │          │ Progress: 85%    │  Extract code         │
│                       │          └────────┬─────────┘  Validate output     │
│                       │                   │                               │
│                       │                   ▼                               │
│                       │          ┌─────────────────┐                     │
│                       │          │   STORING      │  Store in cache       │
│                       │          │ Progress: 90%    │  Core: CacheManager.set()                    │
│                       │          └────────┬─────────┘                     │
│                       │                   │                               │
│                       │                   ▼                               │
│                       │          ┌─────────────────┐                     │
│                       │          │   COMPLETED    │  Return result        │
│                       │          │ Progress: 100%  │  UX: "Complete! ✓"   │
│                       │          │ Time: ~3-5s     │  Total time: 3-5s     │
│                       │          └─────────────────┘                     │
│                       │                                                          │
│                       └──[ERROR]──────────────────────────────┐           │
│                                                                  │           │
│                                                                  ▼           │
│                                                    ┌─────────────────────┐
│                                                    │   ERROR_HANDLING    │
│                                                    └─────────┬───────────┘
│                                                              │
│                         ┌──────────────────────────────────────┼──────┐
│                         │                                      │      │
│                         ▼                                      ▼      ▼
│              ┌──────────────────┐              ┌──────────────────┐
│              │  RETRY_AI        │              │ FALLBACK_MODEL   │
│              │  Progress: 60%   │              │ Progress: 75%     │
│              │  Attempt: N/M    │              │ Model: GPT-4      │
│              │  Delay: 1s * N   │              │ Try: 1/3         │
│              └────────┬─────────┘              └────────┬─────────┘
│                       │                                  │
│                       └──────────────┬───────────────────┘
│                                      │
│                                      ▼
│                            ┌─────────────────┐
│                            │    FAILED       │  Return error
│                            │  Progress: 0%   │  UX: Show error msg
│                            │                 │  Show retry button
│                            └─────────────────┘
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     ERROR CLASSIFICATION                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ERROR TYPE              │ RECOVERABLE │ RETRY │ FALLBACK        │
│  ─────────────────────────────────────────────────────────────  │
│  TIMEOUT                │ Yes         │ Yes   │ Yes              │
│  RATE_LIMITED           │ Yes         │ Yes   │ Yes              │
│  NETWORK_ERROR          │ Yes         │ Yes   │ Yes              │
│  API_ERROR (5xx)        │ Yes         │ Yes   │ Yes              │
│  API_ERROR (4xx)        │ No          │ No    │ No               │
│  EXTRACTION_ERROR       │ No          │ No    │ No               │
│  VALIDATION_ERROR       │ No          │ No    │ No               │
│  CANCELLED              │ No          │ No    │ No               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     RETRY LOGIC                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Attempt 1: Primary Model (claude-3-sonnet)                     │
│    └─ Error? → Wait 1s → Attempt 2                             │
│                                                                 │
│  Attempt 2: Primary Model (claude-3-sonnet)                     │
│    └─ Error? → Wait 2s → Attempt 3                             │
│                                                                 │
│  Attempt 3: Primary Model (claude-3-sonnet)                     │
│    └─ Error? → Try Fallback                                    │
│                                                                 │
│  Fallback 1: GPT-4 Turbo                                       │
│    └─ Error? → Fallback 2                                      │
│                                                                 │
│  Fallback 2: Claude 3 Haiku                                    │
│    └─ Error? → Fallback 3                                      │
│                                                                 │
│  Fallback 3: Llama 3 70b                                       │
│    └─ Error? → FAILED                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## UX Loading States

```
┌─────────────────────────────────────────────────────────────────┐
│                     PROGRESS INDICATOR                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [████████████████████░░░░░] 75%                               │
│  "Generating code with AI..."                                   │
│                                                                 │
│  • State: CALLING_AI                                            │
│  • Progress: 75%                                                │
│  • ETA: ~2s                                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     STATE TRANSITIONS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SELECTING     ───0.5s──→  EXTRACTING                            │
│  EXTRACTING    ───0.2s──→  DETECTING                             │
│  DETECTING     ───0.15s──→  CLEANING                             │
│  CLEANING      ───0.15s──→  HASHING                              │
│  HASHING       ───0.05s──→  CHECKING_CACHE                       │
│  CHECKING_CACHE ──0.1s───→  [HIT/MISS]                           │
│    ┌─HIT──→  CACHE_HIT    (instant, <1s total)                  │
│    └─MISS─→  GENERATING_PROMPT                                  │
│  GENERATING_PROMPT ─0.1s──→  CALLING_AI                          │
│  CALLING_AI    ───2-5s──→  PROCESSING_RESPONSE                   │
│  PROCESSING_RESPONSE ─0.2s→  STORING                             │
│  STORING       ───0.1s──→  COMPLETED                             │
│                                                                 │
│  Total time:                                                      │
│    • Cache hit: ~1s                                              │
│    • Cache miss: 3-5s                                            │
│    • With retry: 5-15s                                           │
│    • With fallback: 8-20s                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Fallback Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                     MODEL FALLBACK CHAIN                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PRIMARY (Preferred)                                             │
│  ├── claude-3-sonnet     │ Best quality, good speed              │
│  │   Cost: $3/1M tokens   │ Used for 90% of requests             │
│  │   Timeout: 30s        │                                         │
│  └──────────────────────┘                                         │
│         │ Failure?                                                   │
│         ▼                                                           │
│  FALLBACK 1 (High Quality)                                         │
│  ├── gpt-4-turbo         │ Excellent quality                       │
│  │   Cost: $10/1M tokens   │ Used when Claude unavailable          │
│  │   Timeout: 30s        │                                         │
│  └──────────────────────┘                                         │
│         │ Failure?                                                   │
│         ▼                                                           │
│  FALLBACK 2 (Fast)                                                 │
│  ├── claude-3-haiku      │ Good quality, very fast                │
│  │   Cost: $0.25/1M tokens │ Used for speed-critical requests      │
│  │   Timeout: 20s        │                                         │
│  └──────────────────────┘                                         │
│         │ Failure?                                                   │
│         ▼                                                           │
│  FALLBACK 3 (Open Source)                                          │
│  ├── llama-3-70b         │ Good quality, no rate limit            │
│  │   Cost: $0.70/1M tokens │ Used when other models fail           │
│  │   Timeout: 60s        │                                         │
│  └──────────────────────┘                                         │
│         │ Failure?                                                   │
│         ▼                                                           │
│  FAILED                                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

FALLBACK TRIGGERS:
• Timeout after 30s
• Rate limit error (429)
• API error (500+)
• Network error
• 3 consecutive retries failed
```

## State Metadata

```typescript
interface FlowStateMetadata {
  // Current state
  state: FlowState

  // Timestamp when state was entered
  timestamp: number

  // Progress percentage (0-100)
  progress: number

  // User-facing message
  message: string

  // Optional details
  details?: {
    // Current step name
    step?: string

    // Current substep
    substep?: string

    // Estimated time remaining (ms)
    eta?: number

    // Current retry attempt
    retryCount?: number

    // Current fallback attempt
    fallbackAttempt?: number

    // Model being used
    model?: string

    // Tokens used (so far)
    tokens?: {
      input: number
      output: number
      total: number
    }
  }

  // Error if state is 'failed'
  error?: FlowError

  // Result if state is 'completed'
  result?: FlowResult
}
```

## Cache Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                     CACHE FLOW                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. GENERATE CACHE KEY                                           │
│     ├── Hash input (HTML + CSS + options)                        │
│     ├── Hash detection context                                   │
│     ├── Hash generation options                                  │
│     └── Combine: SHA256(hash1 + hash2 + hash3)                  │
│                                                                 │
│  2. CHECK CACHE                                                  │
│     ├── Lookup by key                                           │
│     ├── Check TTL (not expired)                                 │
│     ├── Return cached if hit                                    │
│     └── Continue if miss                                        │
│                                                                 │
│  3. STORE IN CACHE                                               │
│     ├── After successful AI generation                          │
│     ├── Store with TTL (default: 1 hour)                        │
│     ├── Include metadata (model, tokens, cost)                 │
│     └── Return to user                                          │
│                                                                 │
│  CACHE STATISTICS TRACKED:                                       │
│  ├── hit count                                                  │
│  ├── miss count                                                 │
│  ├── hit rate (%)                                              │
│  ├── total entries                                             │
│  ├── total size (bytes)                                         │
│  └── last cleanup time                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## User Experience

```
┌─────────────────────────────────────────────────────────────────┐
│                     UX SCENARIOS                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SCENARIO 1: SUCCESS (Cache Hit)                                 │
│  ────────────────────────────────────────────────────────────  │
│  User clicks element →                                          │
│    [Instant result < 1s]                                         │
│    "Found in cache! ✓"                                          │
│    Shows generated code                                         │
│                                                                 │
│  SCENARIO 2: SUCCESS (Cache Miss, Primary Model)                │
│  ────────────────────────────────────────────────────────────  │
│  User clicks element →                                          │
│    [Extracting... 10%]                                           │
│    [Detecting... 20%]                                            │
│    [Cleaning... 30%]                                             │
│    [Generating code with AI... 70%]                              │
│    [Complete! ✓ 3.2s]                                            │
│    Shows generated code                                         │
│                                                                 │
│  SCENARIO 3: SUCCESS (With Retry)                                │
│  ────────────────────────────────────────────────────────────  │
│  User clicks element →                                          │
│    [Generating code with AI... 70%]                              │
│    [Retrying... (1/3) 60%]                                       │
│    [Generating code with AI... 70%]                              │
│    [Complete! ✓ 5.1s]                                            │
│    Shows generated code                                         │
│    "Used 2 attempts" badge                                      │
│                                                                 │
│  SCENARIO 4: SUCCESS (With Fallback)                             │
│  ────────────────────────────────────────────────────────────  │
│  User clicks element →                                          │
│    [Generating code with AI... 70%]                              │
│    [Retrying... (3/3) 60%]                                       │
│    [Trying fallback model (1/2)... 75%]                          │
│    [Generating code with AI... 70%]                              │
│    [Complete! ✓ 8.7s]                                            │
│    Shows generated code                                         │
│    "Used fallback model: GPT-4 Turbo"                           │
│                                                                 │
│  SCENARIO 5: FAILURE                                             │
│  ────────────────────────────────────────────────────────────  │
│  User clicks element →                                          │
│    [Generating code with AI... 70%]                              │
│    [Retrying... (3/3)]                                           │
│    [Trying fallback model (3/3)...]                              │
│    [✗ Failed: All models unavailable]                           │
│    Shows error message                                          │
│    [Try Again] button                                           │
│    [Report Issue] link                                          │
│                                                                 │
│  SCENARIO 6: CANCELLATION                                        │
│  ────────────────────────────────────────────────────────────  │
│  User clicks element →                                          │
│    [Extracting... 10%]                                           │
│    [Detecting... 20%]                                            │
│    User clicks [Cancel] →                                        │
│    [✗ Cancelled]                                                │
│    Returns to idle state                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```
