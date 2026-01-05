// GraphQL schema composition
export const schema = `
  scalar DateTime

  # ==========================================
  # Supporting Types
  # ==========================================

  type PersonalInfo {
    name: String!
    email: String!
    phone: String
    location: String
    linkedin: String
    github: String
    website: String
  }

  type Positioning {
    headline: String!
    summary: String!
    targetRoles: [String!]!
    targetIndustries: [String!]!
  }

  type Achievement {
    description: String!
    metrics: String
    impact: String
  }

  type DeleteResult {
    success: Boolean!
    id: ID!
  }

  # ==========================================
  # Entity Types
  # ==========================================

  type Profile {
    id: ID!
    personalInfo: PersonalInfo!
    positioning: Positioning!
    valuePropositions: [String!]!
    professionalMission: String!
    uniqueSellingPoints: [String!]!
    updatedAt: DateTime!
  }

  type Experience {
    id: ID!
    company: String!
    location: String!
    title: String!
    industry: String
    startDate: DateTime!
    endDate: DateTime
    roleTypes: [String!]!
    responsibilities: [String!]!
    achievements: [Achievement!]!
    technologies: [String!]!
    featured: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Skill {
    id: ID!
    name: String!
    roleRelevance: String!
    level: String!
    rating: Int!
    yearsOfExperience: Int!
    tags: [String!]!
    keywords: [String!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Project {
    id: ID!
    name: String!
    type: String!
    date: DateTime
    featured: Boolean!
    overview: String!
    challenge: String
    approach: String
    outcome: String
    impact: String
    technologies: [String!]!
    keywords: [String!]!
    roleTypes: [String!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Education {
    id: ID!
    institution: String!
    degree: String!
    field: String!
    graduationYear: Int!
    relevantCoursework: [String!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # ==========================================
  # AI Generation Types
  # ==========================================

  type TokenUsage {
    inputTokens: Int!
    outputTokens: Int!
    cacheReadInputTokens: Int
    cacheCreationInputTokens: Int
  }

  type GenerationResult {
    content: String!
    usage: TokenUsage!
  }

  # ==========================================
  # Input Types for Mutations
  # ==========================================

  input PersonalInfoInput {
    name: String!
    email: String!
    phone: String
    location: String
    linkedin: String
    github: String
    website: String
  }

  input PositioningInput {
    headline: String!
    summary: String!
    targetRoles: [String!]!
    targetIndustries: [String!]!
  }

  input AchievementInput {
    description: String!
    metrics: String
    impact: String
  }

  input ProfileInput {
    personalInfo: PersonalInfoInput!
    positioning: PositioningInput!
    valuePropositions: [String!]!
    professionalMission: String!
    uniqueSellingPoints: [String!]!
  }

  input ExperienceInput {
    company: String!
    location: String!
    title: String!
    industry: String
    startDate: DateTime!
    endDate: DateTime
    roleTypes: [String!]!
    responsibilities: [String!]!
    achievements: [AchievementInput!]!
    technologies: [String!]!
    featured: Boolean!
  }

  input SkillInput {
    name: String!
    roleRelevance: String!
    level: String!
    rating: Int!
    yearsOfExperience: Int!
    tags: [String!]!
    keywords: [String!]!
  }

  input ProjectInput {
    name: String!
    type: String!
    date: DateTime
    featured: Boolean!
    overview: String!
    challenge: String
    approach: String
    outcome: String
    impact: String
    technologies: [String!]!
    keywords: [String!]!
    roleTypes: [String!]!
  }

  input EducationInput {
    institution: String!
    degree: String!
    field: String!
    graduationYear: Int!
    relevantCoursework: [String!]!
  }

  input JobInfoInput {
    description: String!
    jobType: String!
  }

  # ==========================================
  # Filter Input Types for Queries
  # ==========================================

  input ExperienceFilter {
    company: String
    title: String
    industry: String
    roleType: String
    technology: String
    featured: Boolean
  }

  input SkillFilter {
    name: String
    roleRelevance: String
    level: String
    tag: String
    keyword: String
  }

  input ProjectFilter {
    name: String
    type: String
    technology: String
    keyword: String
    roleType: String
    featured: Boolean
  }

  input EducationFilter {
    institution: String
    degree: String
    field: String
  }

  # ==========================================
  # Queries
  # ==========================================

  type Query {
    # Profile
    profile: Profile

    # Experiences
    experiences(filter: ExperienceFilter): [Experience!]!
    experience(id: ID!): Experience

    # Skills
    skills(filter: SkillFilter): [Skill!]!
    skill(id: ID!): Skill

    # Projects
    projects(filter: ProjectFilter): [Project!]!
    project(id: ID!): Project

    # Educations
    educations(filter: EducationFilter): [Education!]!
    education(id: ID!): Education
  }

  # ==========================================
  # Mutations
  # ==========================================

  type Mutation {
    # Profile
    updateProfile(input: ProfileInput!): Profile!

    # Experiences
    createExperience(input: ExperienceInput!): Experience!
    updateExperience(id: ID!, input: ExperienceInput!): Experience!
    deleteExperience(id: ID!): DeleteResult!

    # Skills
    createSkill(input: SkillInput!): Skill!
    updateSkill(id: ID!, input: SkillInput!): Skill!
    deleteSkill(id: ID!): DeleteResult!

    # Projects
    createProject(input: ProjectInput!): Project!
    updateProject(id: ID!, input: ProjectInput!): Project!
    deleteProject(id: ID!): DeleteResult!

    # Educations
    createEducation(input: EducationInput!): Education!
    updateEducation(id: ID!, input: EducationInput!): Education!
    deleteEducation(id: ID!): DeleteResult!

    # AI Generation - Resume
    generateResume(jobInfo: JobInfoInput!, additionalContext: String): GenerationResult!
    reviseResume(jobInfo: JobInfoInput!, feedback: String!): GenerationResult!

    # AI Generation - Cover Letter
    generateCoverLetter(jobInfo: JobInfoInput!, additionalContext: String): GenerationResult!
    reviseCoverLetter(jobInfo: JobInfoInput!, feedback: String!): GenerationResult!

    # AI Generation - Application Answer
    generateAnswer(jobInfo: JobInfoInput!, question: String!, currentAnswer: String): GenerationResult!
    reviseAnswer(jobInfo: JobInfoInput!, question: String!, currentAnswer: String!, feedback: String!): GenerationResult!
  }
`;
