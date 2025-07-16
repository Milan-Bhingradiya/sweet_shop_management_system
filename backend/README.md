# Sweet Management System - Backend

A modern REST API for sweet/confectionery management built with **Test-Driven Development (TDD)** approach for interview assessment.

## Tech Stack

- **Runtime**: [Bun](https://bun.sh) v1.2.16+ - Fast all-in-one JavaScript runtime
- **Framework**: Express.js with TypeScript
- **Database**: Prisma ORM (configured for future use)
- **Testing**: TDD approach (tests to be implemented) jest + supertest
- **Code Quality**: Prettier for formatting

## Getting Started

### Prerequisites

- Bun v1.2.16 or later
- Node.js v18+ (for compatibility)

### Installation

```bash
# Install dependencies
bun install
```

### Development

```bash
# Run in development mode with hot reload
bun run dev

# Or run normally
bun run start
```

### Scripts

```bash
# Development with hot reload
bun run dev

# Production start
bun run start

# Build for production
bun run build

# Format code
bun run format

# Check formatting
bun run format:check
```

## Project Structure

```
src/
├── app.ts          # Express app configuration
├── server.ts       # Server entry point
├── routes/         # API routes (to be implemented)
├── controllers/    # Request handlers (to be implemented)
├── models/         # Data models (to be implemented)
├── middleware/     # Custom middleware (to be implemented)
├── utils/          # Utility functions (to be implemented)
└── tests/          # Test files (TDD approach)
```

## TDD Development Approach

This project follows Test-Driven Development methodology:

1. **Red** - Write failing tests first
2. **Green** - Write minimal code to pass tests
3. **Refactor** - Improve code while keeping tests green

## will do

- ✅ Basic Express setup with TypeScript
- ✅ CORS configuration
- ✅ JSON middleware
- ⏳ Database models (Prisma)
- ⏳ API routes implementation
- ⏳ Test suite setup
- ⏳ Controllers and business logic

## Notes

This project demonstrates:

- Modern JavaScript runtime usage (Bun)
- TypeScript integration
- RESTful API design principles
- TDD methodology
- Clean code structure
- Professional development setup
