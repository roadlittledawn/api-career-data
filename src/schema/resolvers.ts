// GraphQL resolvers for Career Data API
import { GraphQLError } from "graphql";
import {
  getProfile,
  updateProfile,
  experienceRepository,
  skillRepository,
  projectRepository,
  educationRepository,
  ObjectId,
  type Profile,
  type Experience,
  type Skill,
  type Project,
  type Education,
  type ExperienceFilter,
  type SkillFilter,
  type ProjectFilter,
  type EducationFilter,
  type WithId,
} from "../services/mongodb.js";
import {
  fetchCareerData,
  generateContent,
  generateContentWithHistory,
  type GenerationResult,
  type MessageParam,
} from "../services/anthropic.js";
import {
  buildResumeSystemPrompt,
  buildCoverLetterSystemPrompt,
  buildAnswerSystemPrompt,
} from "../utils/prompts.js";
import {
  ErrorCodes,
  ValidationError,
  NotFoundError,
  toGraphQLError,
  logError,
} from "../utils/errors.js";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Transforms a MongoDB document to a GraphQL-compatible object.
 * Converts _id to id string.
 */
function toGraphQL<T extends { _id?: ObjectId }>(
  doc: WithId<T>
): Omit<T, "_id"> & { id: string } {
  const { _id, ...rest } = doc;
  return { ...rest, id: _id!.toHexString() } as Omit<T, "_id"> & { id: string };
}

/**
 * Validates that a string is a valid MongoDB ObjectId.
 */
function validateObjectId(id: string, entityName: string): void {
  if (!ObjectId.isValid(id)) {
    throw new GraphQLError(`Invalid ${entityName} ID format`, {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }
}

/**
 * Throws a not found error for an entity.
 */
function throwNotFound(entityName: string, id: string): never {
  throw new GraphQLError(`${entityName} with ID ${id} not found`, {
    extensions: { code: "NOT_FOUND" },
  });
}

// ============================================================================
// Input Types
// ============================================================================

interface ProfileInput {
  personalInfo: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  positioning: {
    headline: string;
    summary: string;
    targetRoles: string[];
    targetIndustries: string[];
  };
  valuePropositions: string[];
  professionalMission: string;
  uniqueSellingPoints: string[];
}

interface ExperienceInput {
  company: string;
  location: string;
  title: string;
  industry?: string;
  startDate: Date;
  endDate?: Date;
  roleTypes: string[];
  responsibilities: string[];
  achievements: { description: string; metrics?: string; impact?: string }[];
  technologies: string[];
  featured: boolean;
}

interface SkillInput {
  name: string;
  roleRelevance: string;
  level: string;
  rating: number;
  yearsOfExperience: number;
  tags: string[];
  keywords: string[];
}

interface ProjectInput {
  name: string;
  type: string;
  date?: Date;
  featured: boolean;
  overview: string;
  challenge?: string;
  approach?: string;
  outcome?: string;
  impact?: string;
  technologies: string[];
  keywords: string[];
  roleTypes: string[];
}

interface EducationInput {
  institution: string;
  degree: string;
  field: string;
  graduationYear: number;
  relevantCoursework: string[];
}

interface JobInfoInput {
  description: string;
  jobType: string;
}

// ============================================================================
// Validation Functions
// ============================================================================

function validateProfileInput(input: ProfileInput): void {
  const missingFields: string[] = [];

  if (!input.personalInfo) missingFields.push("personalInfo");
  else {
    if (!input.personalInfo.name) missingFields.push("personalInfo.name");
    if (!input.personalInfo.email) missingFields.push("personalInfo.email");
  }

  if (!input.positioning) missingFields.push("positioning");
  else {
    if (!input.positioning.headline) missingFields.push("positioning.headline");
    if (!input.positioning.summary) missingFields.push("positioning.summary");
  }

  if (!input.valuePropositions || !Array.isArray(input.valuePropositions)) {
    missingFields.push("valuePropositions");
  }
  if (!input.professionalMission) missingFields.push("professionalMission");
  if (!input.uniqueSellingPoints || !Array.isArray(input.uniqueSellingPoints)) {
    missingFields.push("uniqueSellingPoints");
  }

  if (missingFields.length > 0) {
    throw new GraphQLError(
      `Missing required fields: ${missingFields.join(", ")}`,
      { extensions: { code: "BAD_USER_INPUT", missingFields } }
    );
  }
}

function validateExperienceInput(input: ExperienceInput): void {
  const missingFields: string[] = [];

  if (!input.company) missingFields.push("company");
  if (!input.location) missingFields.push("location");
  if (!input.title) missingFields.push("title");
  if (!input.startDate) missingFields.push("startDate");
  if (!input.roleTypes || !Array.isArray(input.roleTypes)) {
    missingFields.push("roleTypes");
  }
  if (!input.responsibilities || !Array.isArray(input.responsibilities)) {
    missingFields.push("responsibilities");
  }
  if (!input.achievements || !Array.isArray(input.achievements)) {
    missingFields.push("achievements");
  }
  if (!input.technologies || !Array.isArray(input.technologies)) {
    missingFields.push("technologies");
  }
  if (input.featured === undefined) missingFields.push("featured");

  if (missingFields.length > 0) {
    throw new GraphQLError(
      `Missing required fields: ${missingFields.join(", ")}`,
      { extensions: { code: "BAD_USER_INPUT", missingFields } }
    );
  }
}

function validateSkillInput(input: SkillInput): void {
  const missingFields: string[] = [];

  if (!input.name) missingFields.push("name");
  if (!input.roleRelevance) missingFields.push("roleRelevance");
  if (!input.level) missingFields.push("level");
  if (input.rating === undefined) missingFields.push("rating");
  if (input.yearsOfExperience === undefined) {
    missingFields.push("yearsOfExperience");
  }
  if (!input.tags || !Array.isArray(input.tags)) missingFields.push("tags");
  if (!input.keywords || !Array.isArray(input.keywords)) {
    missingFields.push("keywords");
  }

  if (missingFields.length > 0) {
    throw new GraphQLError(
      `Missing required fields: ${missingFields.join(", ")}`,
      { extensions: { code: "BAD_USER_INPUT", missingFields } }
    );
  }
}

function validateProjectInput(input: ProjectInput): void {
  const missingFields: string[] = [];

  if (!input.name) missingFields.push("name");
  if (!input.type) missingFields.push("type");
  if (input.featured === undefined) missingFields.push("featured");
  if (!input.overview) missingFields.push("overview");
  if (!input.technologies || !Array.isArray(input.technologies)) {
    missingFields.push("technologies");
  }
  if (!input.keywords || !Array.isArray(input.keywords)) {
    missingFields.push("keywords");
  }
  if (!input.roleTypes || !Array.isArray(input.roleTypes)) {
    missingFields.push("roleTypes");
  }

  if (missingFields.length > 0) {
    throw new GraphQLError(
      `Missing required fields: ${missingFields.join(", ")}`,
      { extensions: { code: "BAD_USER_INPUT", missingFields } }
    );
  }
}

function validateEducationInput(input: EducationInput): void {
  const missingFields: string[] = [];

  if (!input.institution) missingFields.push("institution");
  if (!input.degree) missingFields.push("degree");
  if (!input.field) missingFields.push("field");
  if (input.graduationYear === undefined) missingFields.push("graduationYear");
  if (!input.relevantCoursework || !Array.isArray(input.relevantCoursework)) {
    missingFields.push("relevantCoursework");
  }

  if (missingFields.length > 0) {
    throw new GraphQLError(
      `Missing required fields: ${missingFields.join(", ")}`,
      { extensions: { code: "BAD_USER_INPUT", missingFields } }
    );
  }
}

/**
 * Validates job info input for AI generation requests.
 * Requirements: 6.4, 7.4, 8.4
 */
function validateJobInfoInput(jobInfo: JobInfoInput): void {
  const missingFields: string[] = [];

  if (!jobInfo.description || jobInfo.description.trim() === "") {
    missingFields.push("description");
  }
  if (!jobInfo.jobType || jobInfo.jobType.trim() === "") {
    missingFields.push("jobType");
  }

  if (missingFields.length > 0) {
    throw new GraphQLError(
      `Missing required fields in jobInfo: ${missingFields.join(", ")}`,
      { extensions: { code: "BAD_USER_INPUT", missingFields } }
    );
  }
}

/**
 * Validates that a question is provided for answer generation.
 * Requirements: 8.4
 */
function validateQuestion(question: string | undefined): void {
  if (!question || question.trim() === "") {
    throw new GraphQLError("Missing required field: question", {
      extensions: { code: "BAD_USER_INPUT", missingFields: ["question"] },
    });
  }
}

/**
 * Validates that feedback is provided for revision requests.
 */
function validateFeedback(feedback: string | undefined): void {
  if (!feedback || feedback.trim() === "") {
    throw new GraphQLError("Missing required field: feedback", {
      extensions: { code: "BAD_USER_INPUT", missingFields: ["feedback"] },
    });
  }
}

// ============================================================================
// Resolvers
// ============================================================================

export const resolvers = {
  // Custom scalar for DateTime
  DateTime: {
    __parseValue(value: string): Date {
      return new Date(value);
    },
    __serialize(value: Date): string {
      return value instanceof Date ? value.toISOString() : value;
    },
    __parseLiteral(ast: { kind: string; value: string }): Date | null {
      if (ast.kind === "StringValue") {
        return new Date(ast.value);
      }
      return null;
    },
  },

  Query: {
    // ========================================================================
    // Profile Queries (Requirements 1.1, 1.3)
    // ========================================================================
    profile: async () => {
      const profile = await getProfile();
      return profile ? toGraphQL(profile) : null;
    },

    // ========================================================================
    // Experience Queries (Requirements 2.1, 2.2)
    // ========================================================================
    experiences: async (
      _: unknown,
      args: { filter?: ExperienceFilter }
    ): Promise<(Omit<Experience, "_id"> & { id: string })[]> => {
      const experiences = await experienceRepository.findAll(args.filter);
      return experiences.map(toGraphQL);
    },

    experience: async (
      _: unknown,
      args: { id: string }
    ): Promise<(Omit<Experience, "_id"> & { id: string }) | null> => {
      validateObjectId(args.id, "experience");
      const experience = await experienceRepository.findById(args.id);
      return experience ? toGraphQL(experience) : null;
    },

    // ========================================================================
    // Skill Queries (Requirements 3.1, 3.2)
    // ========================================================================
    skills: async (
      _: unknown,
      args: { filter?: SkillFilter }
    ): Promise<(Omit<Skill, "_id"> & { id: string })[]> => {
      const skills = await skillRepository.findAll(args.filter);
      return skills.map(toGraphQL);
    },

    skill: async (
      _: unknown,
      args: { id: string }
    ): Promise<(Omit<Skill, "_id"> & { id: string }) | null> => {
      validateObjectId(args.id, "skill");
      const skill = await skillRepository.findById(args.id);
      return skill ? toGraphQL(skill) : null;
    },

    // ========================================================================
    // Project Queries (Requirements 4.1, 4.2)
    // ========================================================================
    projects: async (
      _: unknown,
      args: { filter?: ProjectFilter }
    ): Promise<(Omit<Project, "_id"> & { id: string })[]> => {
      const projects = await projectRepository.findAll(args.filter);
      return projects.map(toGraphQL);
    },

    project: async (
      _: unknown,
      args: { id: string }
    ): Promise<(Omit<Project, "_id"> & { id: string }) | null> => {
      validateObjectId(args.id, "project");
      const project = await projectRepository.findById(args.id);
      return project ? toGraphQL(project) : null;
    },

    // ========================================================================
    // Education Queries (Requirements 5.1, 5.2)
    // ========================================================================
    educations: async (
      _: unknown,
      args: { filter?: EducationFilter }
    ): Promise<(Omit<Education, "_id"> & { id: string })[]> => {
      const educations = await educationRepository.findAll(args.filter);
      return educations.map(toGraphQL);
    },

    education: async (
      _: unknown,
      args: { id: string }
    ): Promise<(Omit<Education, "_id"> & { id: string }) | null> => {
      validateObjectId(args.id, "education");
      const education = await educationRepository.findById(args.id);
      return education ? toGraphQL(education) : null;
    },
  },

  Mutation: {
    // ========================================================================
    // Profile Mutations (Requirements 1.2, 1.4)
    // ========================================================================
    updateProfile: async (
      _: unknown,
      args: { input: ProfileInput }
    ): Promise<Omit<Profile, "_id"> & { id: string }> => {
      validateProfileInput(args.input);
      const profile = await updateProfile(args.input);
      return toGraphQL(profile);
    },

    // ========================================================================
    // Experience Mutations (Requirements 2.3, 2.4, 2.5, 2.6)
    // ========================================================================
    createExperience: async (
      _: unknown,
      args: { input: ExperienceInput }
    ): Promise<Omit<Experience, "_id"> & { id: string }> => {
      validateExperienceInput(args.input);
      const experience = await experienceRepository.create(args.input);
      return toGraphQL(experience);
    },

    updateExperience: async (
      _: unknown,
      args: { id: string; input: ExperienceInput }
    ): Promise<Omit<Experience, "_id"> & { id: string }> => {
      validateObjectId(args.id, "experience");
      validateExperienceInput(args.input);
      const experience = await experienceRepository.update(args.id, args.input);
      if (!experience) {
        throwNotFound("Experience", args.id);
      }
      return toGraphQL(experience);
    },

    deleteExperience: async (
      _: unknown,
      args: { id: string }
    ): Promise<{ success: boolean; id: string }> => {
      validateObjectId(args.id, "experience");
      const deleted = await experienceRepository.delete(args.id);
      if (!deleted) {
        throwNotFound("Experience", args.id);
      }
      return { success: true, id: args.id };
    },

    // ========================================================================
    // Skill Mutations (Requirements 3.3, 3.4, 3.5, 3.6)
    // ========================================================================
    createSkill: async (
      _: unknown,
      args: { input: SkillInput }
    ): Promise<Omit<Skill, "_id"> & { id: string }> => {
      validateSkillInput(args.input);
      const skill = await skillRepository.create(args.input);
      return toGraphQL(skill);
    },

    updateSkill: async (
      _: unknown,
      args: { id: string; input: SkillInput }
    ): Promise<Omit<Skill, "_id"> & { id: string }> => {
      validateObjectId(args.id, "skill");
      validateSkillInput(args.input);
      const skill = await skillRepository.update(args.id, args.input);
      if (!skill) {
        throwNotFound("Skill", args.id);
      }
      return toGraphQL(skill);
    },

    deleteSkill: async (
      _: unknown,
      args: { id: string }
    ): Promise<{ success: boolean; id: string }> => {
      validateObjectId(args.id, "skill");
      const deleted = await skillRepository.delete(args.id);
      if (!deleted) {
        throwNotFound("Skill", args.id);
      }
      return { success: true, id: args.id };
    },

    // ========================================================================
    // Project Mutations (Requirements 4.3, 4.4, 4.5, 4.6)
    // ========================================================================
    createProject: async (
      _: unknown,
      args: { input: ProjectInput }
    ): Promise<Omit<Project, "_id"> & { id: string }> => {
      validateProjectInput(args.input);
      const project = await projectRepository.create(args.input);
      return toGraphQL(project);
    },

    updateProject: async (
      _: unknown,
      args: { id: string; input: ProjectInput }
    ): Promise<Omit<Project, "_id"> & { id: string }> => {
      validateObjectId(args.id, "project");
      validateProjectInput(args.input);
      const project = await projectRepository.update(args.id, args.input);
      if (!project) {
        throwNotFound("Project", args.id);
      }
      return toGraphQL(project);
    },

    deleteProject: async (
      _: unknown,
      args: { id: string }
    ): Promise<{ success: boolean; id: string }> => {
      validateObjectId(args.id, "project");
      const deleted = await projectRepository.delete(args.id);
      if (!deleted) {
        throwNotFound("Project", args.id);
      }
      return { success: true, id: args.id };
    },

    // ========================================================================
    // Education Mutations (Requirements 5.3, 5.4, 5.5, 5.6)
    // ========================================================================
    createEducation: async (
      _: unknown,
      args: { input: EducationInput }
    ): Promise<Omit<Education, "_id"> & { id: string }> => {
      validateEducationInput(args.input);
      const education = await educationRepository.create(args.input);
      return toGraphQL(education);
    },

    updateEducation: async (
      _: unknown,
      args: { id: string; input: EducationInput }
    ): Promise<Omit<Education, "_id"> & { id: string }> => {
      validateObjectId(args.id, "education");
      validateEducationInput(args.input);
      const education = await educationRepository.update(args.id, args.input);
      if (!education) {
        throwNotFound("Education", args.id);
      }
      return toGraphQL(education);
    },

    deleteEducation: async (
      _: unknown,
      args: { id: string }
    ): Promise<{ success: boolean; id: string }> => {
      validateObjectId(args.id, "education");
      const deleted = await educationRepository.delete(args.id);
      if (!deleted) {
        throwNotFound("Education", args.id);
      }
      return { success: true, id: args.id };
    },

    // ========================================================================
    // AI Generation - Resume (Requirements 6.1, 6.2, 6.3, 6.4)
    // ========================================================================
    generateResume: async (
      _: unknown,
      args: {
        jobInfo: JobInfoInput;
        additionalContext?: string;
      }
    ): Promise<GenerationResult> => {
      // Validate job info (Requirement 6.4)
      validateJobInfoInput(args.jobInfo);

      // Fetch career data from MongoDB (Requirement 6.1)
      const careerData = await fetchCareerData();

      // Build system prompt with career data
      const systemPrompt = buildResumeSystemPrompt(careerData);

      // Build user message with job info
      let userMessage = `Please create a tailored resume for the following job opportunity:

**Job Type:** ${args.jobInfo.jobType}

**Job Description:**
${args.jobInfo.description}`;

      if (args.additionalContext) {
        userMessage += `

**Additional Context:**
${args.additionalContext}`;
      }

      // Call Anthropic API and return result with token usage (Requirement 6.1, 6.3)
      const result = await generateContent(systemPrompt, userMessage);
      return result;
    },

    reviseResume: async (
      _: unknown,
      args: {
        jobInfo: JobInfoInput;
        feedback: string;
      }
    ): Promise<GenerationResult> => {
      // Validate inputs (Requirement 6.4)
      validateJobInfoInput(args.jobInfo);
      validateFeedback(args.feedback);

      // Fetch career data from MongoDB
      const careerData = await fetchCareerData();

      // Build system prompt with career data
      const systemPrompt = buildResumeSystemPrompt(careerData);

      // Build conversation history for revision (Requirement 6.2)
      const messages: MessageParam[] = [
        {
          role: "user",
          content: `Please create a tailored resume for the following job opportunity:

**Job Type:** ${args.jobInfo.jobType}

**Job Description:**
${args.jobInfo.description}`,
        },
        {
          role: "assistant",
          content:
            "I've created a resume based on the job description. Please provide feedback for revisions.",
        },
        {
          role: "user",
          content: `Please revise the resume based on the following feedback:

${args.feedback}`,
        },
      ];

      // Call Anthropic API with conversation history (Requirement 6.2, 6.3)
      const result = await generateContentWithHistory(systemPrompt, messages);
      return result;
    },

    // ========================================================================
    // AI Generation - Cover Letter (Requirements 7.1, 7.2, 7.3, 7.4)
    // ========================================================================
    generateCoverLetter: async (
      _: unknown,
      args: {
        jobInfo: JobInfoInput;
        additionalContext?: string;
      }
    ): Promise<GenerationResult> => {
      // Validate job info (Requirement 7.4)
      validateJobInfoInput(args.jobInfo);

      // Fetch career data from MongoDB (Requirement 7.1)
      const careerData = await fetchCareerData();

      // Build system prompt with career data
      const systemPrompt = buildCoverLetterSystemPrompt(careerData);

      // Build user message with job info
      let userMessage = `Please create a tailored cover letter for the following job opportunity:

**Job Type:** ${args.jobInfo.jobType}

**Job Description:**
${args.jobInfo.description}`;

      if (args.additionalContext) {
        userMessage += `

**Additional Context:**
${args.additionalContext}`;
      }

      // Call Anthropic API and return result with token usage (Requirement 7.1, 7.3)
      const result = await generateContent(systemPrompt, userMessage);
      return result;
    },

    reviseCoverLetter: async (
      _: unknown,
      args: {
        jobInfo: JobInfoInput;
        feedback: string;
      }
    ): Promise<GenerationResult> => {
      // Validate inputs (Requirement 7.4)
      validateJobInfoInput(args.jobInfo);
      validateFeedback(args.feedback);

      // Fetch career data from MongoDB
      const careerData = await fetchCareerData();

      // Build system prompt with career data
      const systemPrompt = buildCoverLetterSystemPrompt(careerData);

      // Build conversation history for revision (Requirement 7.2)
      const messages: MessageParam[] = [
        {
          role: "user",
          content: `Please create a tailored cover letter for the following job opportunity:

**Job Type:** ${args.jobInfo.jobType}

**Job Description:**
${args.jobInfo.description}`,
        },
        {
          role: "assistant",
          content:
            "I've created a cover letter based on the job description. Please provide feedback for revisions.",
        },
        {
          role: "user",
          content: `Please revise the cover letter based on the following feedback:

${args.feedback}`,
        },
      ];

      // Call Anthropic API with conversation history (Requirement 7.2, 7.3)
      const result = await generateContentWithHistory(systemPrompt, messages);
      return result;
    },

    // ========================================================================
    // AI Generation - Application Answer (Requirements 8.1, 8.2, 8.3, 8.4)
    // ========================================================================
    generateAnswer: async (
      _: unknown,
      args: {
        jobInfo: JobInfoInput;
        question: string;
        currentAnswer?: string;
      }
    ): Promise<GenerationResult> => {
      // Validate inputs (Requirement 8.4)
      validateJobInfoInput(args.jobInfo);
      validateQuestion(args.question);

      // Fetch career data from MongoDB (Requirement 8.1)
      const careerData = await fetchCareerData();

      // Build system prompt with career data
      const systemPrompt = buildAnswerSystemPrompt(careerData);

      // Build user message with job info and question
      let userMessage = `Please help me answer the following job application question:

**Job Type:** ${args.jobInfo.jobType}

**Job Description:**
${args.jobInfo.description}

**Question:**
${args.question}`;

      if (args.currentAnswer) {
        userMessage += `

**Current Answer (to improve upon):**
${args.currentAnswer}`;
      }

      // Call Anthropic API and return result with token usage (Requirement 8.1, 8.3)
      const result = await generateContent(systemPrompt, userMessage);
      return result;
    },

    reviseAnswer: async (
      _: unknown,
      args: {
        jobInfo: JobInfoInput;
        question: string;
        currentAnswer: string;
        feedback: string;
      }
    ): Promise<GenerationResult> => {
      // Validate inputs (Requirement 8.4)
      validateJobInfoInput(args.jobInfo);
      validateQuestion(args.question);
      validateFeedback(args.feedback);

      // Fetch career data from MongoDB
      const careerData = await fetchCareerData();

      // Build system prompt with career data
      const systemPrompt = buildAnswerSystemPrompt(careerData);

      // Build conversation history for revision (Requirement 8.2)
      const messages: MessageParam[] = [
        {
          role: "user",
          content: `Please help me answer the following job application question:

**Job Type:** ${args.jobInfo.jobType}

**Job Description:**
${args.jobInfo.description}

**Question:**
${args.question}`,
        },
        {
          role: "assistant",
          content: args.currentAnswer,
        },
        {
          role: "user",
          content: `Please revise the answer based on the following feedback:

${args.feedback}`,
        },
      ];

      // Call Anthropic API with conversation history (Requirement 8.2, 8.3)
      const result = await generateContentWithHistory(systemPrompt, messages);
      return result;
    },
  },
};
