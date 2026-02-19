# PageWhisper

> Extract and convert web components to clean, production-ready code using AI.

## 🎯 Overview

PageWhisper is a Chrome Extension (Manifest V3) that intelligently extracts web components, detects frameworks, and converts them to reusable code using advanced AI models.

## ✨ Features

- **Smart Extraction**: Extract DOM components with complete context
- **Framework Detection**: Automatically detect React, Vue, Angular, and more
- **AI-Powered Conversion**: Convert to any framework using state-of-the-art AI
- **Code Cleaning**: Optimized, clean, production-ready output
- **Intelligent Caching**: Fast responses with deterministic caching
- **Multi-Model Support**: Claude, GPT-4, Gemini, and more

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/pagewhisper.git
cd pagewhisper

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### Development

```bash
# Watch mode with HMR
npm run dev

# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Run E2E tests
npm run test:e2e

# Type check
npm run type-check

# Lint code
npm run lint
```

## 📁 Project Structure

```
pagewhisper/
├── core/                   # Browser-agnostic core engine
│   ├── types/             # TypeScript type definitions
│   ├── extractor/         # DOM extraction
│   ├── cleaner/           # HTML/CSS cleaning
│   ├── detector/          # Framework detection
│   ├── prompts/           # Prompt templates
│   └── utils/             # Utilities
├── ai/                    # AI provider layer
│   ├── types/             # AI type definitions
│   ├── providers/         # AI providers (OpenRouter, etc.)
│   ├── cache/             # Caching system
│   ├── prompts/           # Prompt versioning
│   └── retry/             # Retry logic
├── flows/                 # Technical flows
│   └── CompleteFlow.ts    # End-to-end orchestration
├── adapters/              # Platform adapters
│   └── chrome/            # Chrome MV3 adapter
├── src/                   # Chrome extension source
│   ├── background/        # Service worker
│   ├── content/           # Content scripts
│   ├── popup/             # Extension UI
│   └── options/           # Settings page
└── tests/                 # Test suite
    ├── unit/              # Unit tests
    ├── integration/       # Integration tests
    └── e2e/               # E2E tests
```

## 🏗️ Architecture

PageWhisper follows an **evolutionary architecture** supporting three stages:

### Stage A: Internal Tool (Current)
- Direct OpenRouter API integration
- Local configuration
- Team use only

### Stage B: Chrome Web Store Product
- Public release ready
- Production polish
- User-friendly setup

### Stage C: SaaS Platform
- Backend integration
- Multi-user support
- Team collaboration

## 🛠️ Tech Stack

- **Platform**: Chrome Extension MV3
- **Languages**: TypeScript (strict mode)
- **Build Tool**: Vite
- **Testing**: Vitest + Playwright
- **AI Provider**: OpenRouter (multi-provider support)
- **Code Quality**: ESLint + Prettier + Husky

## 📋 Development Roadmap

See [ROADMAP.md](ROADMAP.md) for complete sprint planning and technical roadmap.

### Current Sprint

**Sprint 0**: Project Setup (v0.0.1)
- ✅ TypeScript configuration
- ✅ ESLint + Prettier setup
- ✅ Git hooks (Husky)
- ✅ Build system (Vite)
- ✅ Testing infrastructure
- ⏳ CI/CD pipeline
- ⏳ Documentation

### Upcoming Sprints

1. **Sprint 1**: Core Engine (v0.1.0)
2. **Sprint 2**: AI System (v0.2.0)
3. **Sprint 3**: Chrome Adapter (v0.3.0)
4. **Sprint 4**: Basic UI (v0.4.0)
5. **Sprint 5**: Integration MVP (v0.5.0) ★

## 🤝 Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

### Git Workflow

```bash
# Create feature branch
git checkout develop
git checkout -b feature/sprint-01-core-engine

# Make changes and commit
git add .
git commit -m "feat: implement DOMExtractor"

# Push and create PR
git push origin feature/sprint-01-core-engine
```

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

Built with ❤️ by the PageWhisper team.

---

**Status**: 🚧 In Development (Sprint 0)
**Version**: 0.0.1
**Next Milestone**: v0.1.0 (Core Engine)
