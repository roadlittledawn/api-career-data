# Career Data API

A GraphQL API for managing career data (experiences, skills, projects, education) with AI-powered document generation using Claude. This serves as the primary backend API for personal career management tools and portfolio websites.

## Overview

This API provides a centralized data management layer for career-related information stored in MongoDB Atlas. It offers both traditional CRUD operations and AI-powered content generation capabilities for resumes, cover letters, and application questions.

### Used By

This API is consumed by several frontend applications:
- **website-author-career-data** - Portfolio website showcasing career history
- **clang-mcp** - Claude Code MCP server for career data management
- **writing-samples-website** - Technical writing portfolio site

## Features

- **GraphQL API** - Type-safe queries and mutations for career data
- **MongoDB Integration** - Persistent storage in MongoDB Atlas
- **AI-Powered Generation** - Resume, cover letter, and application answer generation using Claude
- **AWS Lambda Deployment** - Serverless architecture with Function URLs
- **TypeScript** - Full type safety and modern JavaScript features
- **CI/CD** - Automated testing and deployment via GitHub Actions

## Architecture

- **Runtime**: Node.js 20.x (ES Modules)
- **Framework**: Fastify with Mercurius (GraphQL)
- **Database**: MongoDB Atlas
- **AI**: Anthropic Claude API
- **Deployment**: AWS Lambda (us-west-2)
- **Bundler**: esbuild

## Prerequisites

- Node.js 20.x or higher
- npm or yarn
- MongoDB Atlas account
- Anthropic API key
- AWS account (for deployment)

## Local Development

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### Environment Variables

Create a `.env` file with the following variables:

```bash
# Environment
NODE_ENV=development

# API Authentication
API_ACCESS_KEY=your-secret-api-key

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=career-data

# Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-your-api-key
```

### Running Locally

```bash
# Start development server with hot reload
npm run dev

# Server will start at http://localhost:3000/graphql
```

### GraphiQL Interface

When running in development mode (`NODE_ENV=development`), GraphiQL is available at:
```
http://localhost:3000/graphiql
```

Add the authentication header:
```
X-API-Key: your-secret-api-key
```

## Available Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload

# Building
npm run build            # Build Lambda deployment package
npm run build:check      # Type check + build

# Testing
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode

# Quality Checks
npm run lint             # Run ESLint
npm run typecheck        # Run TypeScript type checking
```

## API Usage

### Authentication

All requests require an API key in the `X-API-Key` header:

```bash
curl -X POST https://your-lambda-url/graphql \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"query": "{ experiences { id company title } }"}'
```

### Example Queries

**Get all experiences:**
```graphql
query {
  experiences {
    id
    company
    title
    startDate
    endDate
    technologies
  }
}
```

**Get profile:**
```graphql
query {
  profile {
    id
    personalInfo {
      name
      email
      location
    }
    positioning {
      headline
      summary
    }
  }
}
```

**Generate resume:**
```graphql
mutation {
  generateResume(
    jobInfo: {
      description: "Senior Software Engineer role..."
      jobType: "software_engineer"
    }
  ) {
    content
    usage {
      inputTokens
      outputTokens
    }
  }
}
```

## Deployment

### Production Environment

- **Platform**: AWS Lambda
- **Region**: us-west-2 (Oregon)
- **Function Name**: api-career-data
- **URL**: https://rndo54zjrsxy7ppxxobie7pgki0vlibt.lambda-url.us-west-2.on.aws/graphql

### CI/CD Pipeline

The project uses GitHub Actions for automated testing and deployment:

**PR Validation** (`.github/workflows/pr-validate.yml`)
- Runs on PRs to `develop` and `main`
- Lint & type checking
- Unit tests
- Build verification

**Deploy** (`.github/workflows/deploy.yml`)
- Runs on push to `main`
- Builds Lambda deployment package
- Deploys to AWS Lambda
- Verifies deployment

### Manual Deployment

```bash
# Build the deployment package
npm run build

# Deploy to Lambda (requires AWS CLI configured)
aws lambda update-function-code \
  --function-name api-career-data \
  --zip-file fileb://function.zip \
  --region us-west-2
```

## Project Structure

```
api-career-data/
├── src/
│   ├── index.ts              # Lambda handler entry point
│   ├── server.ts             # Fastify server configuration
│   ├── schema/
│   │   ├── index.ts          # GraphQL schema definition
│   │   └── resolvers.ts      # GraphQL resolvers
│   ├── services/
│   │   ├── mongodb.ts        # MongoDB connection & repositories
│   │   └── anthropic.ts      # Claude API integration
│   ├── middleware/
│   │   └── auth.ts           # API key authentication
│   └── utils/
│       ├── errors.ts         # Error handling utilities
│       └── prompts.ts        # AI prompt templates
├── scripts/
│   └── bundle.js             # esbuild bundler for Lambda
├── .github/workflows/        # CI/CD workflows
├── dist/                     # Build output
└── function.zip              # Lambda deployment package
```

## Data Model

### Collections

- **profile** - Personal information and positioning
- **experiences** - Work history and achievements
- **skills** - Technical and professional skills
- **projects** - Portfolio projects
- **educations** - Educational background

### Key Features

- **Role Types** - Support for multiple career paths (technical writer, engineer, manager)
- **Featured Items** - Flag important experiences/projects for highlighting
- **Rich Metadata** - Technologies, keywords, achievements with metrics
- **AI Context** - Optimized data structure for Claude-powered generation

## Environment Variables (Lambda)

The Lambda function requires these environment variables:

| Variable | Description |
| --- | --- |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `MONGODB_DB_NAME` | MongoDB database name |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |
| `API_ACCESS_KEY` | Secret key for API authentication |

## Security

- **API Key Authentication** - All endpoints require valid API key
- **CORS Enabled** - Configured for cross-origin requests
- **Secrets Management** - Environment variables for sensitive data
- **IAM Permissions** - Least-privilege access for Lambda execution

## Contributing

This is a personal project, but suggestions and issues are welcome.

## License

ISC

## Related Projects

- [website-author-career-data](https://github.com/roadlittledawn/website-author-career-data) - Portfolio website
- [clang-mcp](https://github.com/roadlittledawn/clang-mcp) - MCP server for career data
- [writing-samples-website](https://github.com/roadlittledawn/writing-samples-website) - Writing portfolio
