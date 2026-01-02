# Implementation Plan

- [-] 1. Initialize project structure and dependencies

  - Create package.json with Fastify, Mercurius, MongoDB, Anthropic SDK, and TypeScript dependencies
  - Configure TypeScript with tsconfig.json for Node.js 20 and ES modules
  - Set up Vitest and fast-check for testing
  - Create directory structure: `src/`, `src/schema/`, `src/services/`, `src/middleware/`, `src/__tests__/`
  - _Requirements: 11.1_

- [ ] 2. Implement authentication middleware

  - [ ] 2.1 Create API key validation middleware
    - Implement Fastify preHandler hook that extracts `X-API-Key` header
    - Compare against `API_ACCESS_KEY` environment variable
    - Return 401 with appropriate error message on failure
    - _Requirements: 9.1, 9.2, 9.3_
  - [ ]\* 2.2 Write property test for authentication
    - **Property 9: Authentication Enforcement**
    - **Validates: Requirements 9.1, 9.3**

- [ ] 3. Implement MongoDB service

  - [ ] 3.1 Create MongoDB connection manager
    - Implement connection caching for Lambda warm starts
    - Create `getCollection` helper for typed collection access
    - Handle connection errors gracefully
    - _Requirements: 10.3_
  - [ ] 3.2 Implement CRUD operations for all entity types
    - Create generic repository functions: `findAll`, `findById`, `create`, `update`, `delete`
    - Implement sorting logic per entity type (experiences by startDate, skills by name, etc.)
    - Implement filter query building for each entity type
    - _Requirements: 1.1, 2.1, 2.2, 3.1, 3.2, 4.1, 4.2, 5.1, 5.2_

- [ ] 4. Define GraphQL schema

  - [ ] 4.1 Create type definitions
    - Define all entity types: Profile, Experience, Skill, Project, Education
    - Define input types for mutations
    - Define filter input types for queries
    - Define AI generation types: JobInfoInput, GenerationResult, TokenUsage
    - _Requirements: 11.3_
  - [ ] 4.2 Define queries and mutations
    - Add queries: profile, experiences, experience, skills, skill, projects, project, educations, education
    - Add CRUD mutations for all entity types
    - Add AI generation mutations: generateResume, reviseResume, generateCoverLetter, reviseCoverLetter, generateAnswer, reviseAnswer
    - _Requirements: 11.3_

- [ ] 5. Implement GraphQL resolvers for CRUD operations

  - [ ] 5.1 Implement profile resolvers
    - Query resolver for fetching profile (returns null if not exists)
    - Mutation resolver for updating profile with validation
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [ ] 5.2 Implement experience resolvers
    - Query resolvers for list (with filters) and single experience
    - Mutation resolvers for create, update, delete with validation
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  - [ ] 5.3 Implement skill resolvers
    - Query resolvers for list (with filters) and single skill
    - Mutation resolvers for create, update, delete with validation
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  - [ ] 5.4 Implement project resolvers
    - Query resolvers for list (with filters) and single project
    - Mutation resolvers for create, update, delete with validation
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  - [ ] 5.5 Implement education resolvers
    - Query resolvers for list (with filters) and single education
    - Mutation resolvers for create, update, delete with validation
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  - [ ]\* 5.6 Write property tests for CRUD operations
    - **Property 1: CRUD Round-Trip Consistency**
    - **Property 2: Update Persistence**
    - **Property 3: Delete Removes Entity**
    - **Property 4: Query Sorting Invariant**
    - **Property 5: Filter Result Subset**
    - **Property 6: Required Field Validation**
    - **Validates: Requirements 1.2, 2.1-2.6, 3.1-3.6, 4.1-4.6, 5.1-5.6**

- [ ] 6. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement Anthropic service for AI generation

  - [ ] 7.1 Create Anthropic client wrapper
    - Initialize Anthropic SDK with API key from environment
    - Create helper for building system prompts from career data
    - Implement prompt caching configuration
    - _Requirements: 6.1, 7.1, 8.1_
  - [ ] 7.2 Implement prompt builders
    - Port resume system prompt from existing Netlify function
    - Port cover letter system prompt from existing Netlify function
    - Port answer system prompt from existing Netlify function
    - _Requirements: 6.1, 7.1, 8.1_
  - [ ] 7.3 Implement career data fetcher
    - Create function to fetch all career data for AI context
    - Include profile, experiences, skills, projects
    - _Requirements: 6.1, 7.1, 8.1_

- [ ] 8. Implement AI generation resolvers

  - [ ] 8.1 Implement resume generation resolvers
    - generateResume mutation with job info validation
    - reviseResume mutation with feedback handling
    - Include token usage in response
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [ ] 8.2 Implement cover letter generation resolvers
    - generateCoverLetter mutation with job info validation
    - reviseCoverLetter mutation with feedback handling
    - Include token usage in response
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  - [ ] 8.3 Implement answer generation resolvers
    - generateAnswer mutation with job info and question validation
    - reviseAnswer mutation with feedback handling
    - Include token usage in response
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  - [ ]\* 8.4 Write property tests for AI generation
    - **Property 7: AI Generation Response Format**
    - **Property 8: AI Generation Input Validation**
    - **Validates: Requirements 6.1-6.4, 7.1-7.4, 8.1-8.4**

- [ ] 9. Implement error handling

  - [ ] 9.1 Create GraphQL error formatters
    - Map internal errors to GraphQL error codes
    - Implement error logging for server-side debugging
    - Sanitize error messages for client responses
    - _Requirements: 11.4, 6.5, 7.5, 8.5_

- [ ] 10. Create Fastify server and Lambda handler

  - [ ] 10.1 Set up Fastify with Mercurius
    - Configure Fastify instance with CORS
    - Register Mercurius plugin with schema and resolvers
    - Add authentication preHandler hook
    - _Requirements: 11.1, 11.2_
  - [ ] 10.2 Create Lambda handler
    - Use @fastify/aws-lambda adapter
    - Export handler function for Lambda runtime
    - _Requirements: 10.1, 10.2_

- [ ] 11. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Set up build and deployment

  - [ ] 12.1 Configure build process
    - Set up esbuild or similar bundler for Lambda deployment
    - Create build script that outputs to `dist/`
    - Configure for Node.js 20 and ES modules
    - _Requirements: 10.1_
  - [ ] 12.2 Create PR validation workflow
    - Create `.github/workflows/pr-validate.yml`
    - Add jobs for lint, type check, test, and build
    - Configure to run on pull requests to `main`
    - _Requirements: 10.1_
  - [ ] 12.3 Create deploy workflow
    - Create `.github/workflows/deploy.yml`
    - Add build job and deploy job using AWS CLI
    - Configure to run on push to `main`
    - Document required GitHub secrets
    - _Requirements: 10.1, 10.4_

- [ ] 13. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
