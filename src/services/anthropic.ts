// Anthropic API integration
import Anthropic from "@anthropic-ai/sdk";
import type {
  MessageParam,
  TextBlockParam,
} from "@anthropic-ai/sdk/resources/messages";
import {
  getProfile,
  experienceRepository,
  skillRepository,
  projectRepository,
  educationRepository,
  type Profile,
  type Experience,
  type Skill,
  type Project,
  type Education,
} from "./mongodb.js";
import type { CareerData } from "../utils/prompts.js";
import { handleAnthropicError, AIServiceError } from "../utils/errors.js";

let client: Anthropic | null = null;

// Default model for AI generation
export const DEFAULT_MODEL = "claude-sonnet-4-20250514";

// Maximum tokens for generation
export const MAX_TOKENS = 4096;

export function getAnthropicClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new AIServiceError(
        "ANTHROPIC_API_KEY environment variable is not set"
      );
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens?: number;
  cacheCreationInputTokens?: number;
}

export interface GenerationResult {
  content: string;
  usage: TokenUsage;
}

export interface JobInfo {
  description: string;
  jobType: string;
}

/**
 * Creates a text block with prompt caching enabled.
 * Prompt caching reduces costs and latency for repeated system prompts.
 */
export function createCachedTextBlock(text: string): TextBlockParam {
  return {
    type: "text",
    text,
    cache_control: { type: "ephemeral" },
  };
}

/**
 * Generates content using the Anthropic API with prompt caching.
 * @param systemPrompt - The system prompt (will be cached)
 * @param userMessage - The user message
 * @returns GenerationResult with content and token usage
 * @throws AIServiceError if the Anthropic API call fails (Requirements: 6.5, 7.5, 8.5)
 */
export async function generateContent(
  systemPrompt: string,
  userMessage: string
): Promise<GenerationResult> {
  const anthropic = getAnthropicClient();

  try {
    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: MAX_TOKENS,
      system: [createCachedTextBlock(systemPrompt)],
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    // Extract text content from response
    const textContent = response.content.find((block) => block.type === "text");
    const content =
      textContent && "text" in textContent ? textContent.text : "";

    return {
      content,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cacheReadInputTokens: (
          response.usage as unknown as Record<string, number>
        ).cache_read_input_tokens,
        cacheCreationInputTokens: (
          response.usage as unknown as Record<string, number>
        ).cache_creation_input_tokens,
      },
    };
  } catch (error) {
    // Handle Anthropic API errors (Requirements: 6.5, 7.5, 8.5)
    handleAnthropicError(error);
  }
}

/**
 * Generates content with conversation history for revisions.
 * @param systemPrompt - The system prompt (will be cached)
 * @param messages - Array of conversation messages
 * @returns GenerationResult with content and token usage
 * @throws AIServiceError if the Anthropic API call fails (Requirements: 6.5, 7.5, 8.5)
 */
export async function generateContentWithHistory(
  systemPrompt: string,
  messages: MessageParam[]
): Promise<GenerationResult> {
  const anthropic = getAnthropicClient();

  try {
    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: MAX_TOKENS,
      system: [createCachedTextBlock(systemPrompt)],
      messages,
    });

    // Extract text content from response
    const textContent = response.content.find((block) => block.type === "text");
    const content =
      textContent && "text" in textContent ? textContent.text : "";

    return {
      content,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cacheReadInputTokens: (
          response.usage as unknown as Record<string, number>
        ).cache_read_input_tokens,
        cacheCreationInputTokens: (
          response.usage as unknown as Record<string, number>
        ).cache_creation_input_tokens,
      },
    };
  } catch (error) {
    // Handle Anthropic API errors (Requirements: 6.5, 7.5, 8.5)
    handleAnthropicError(error);
  }
}

export type { MessageParam };

/**
 * Fetches all career data from MongoDB for AI context.
 * This includes profile, experiences, skills, projects, and educations.
 * @returns CareerData object with all career information
 */
export async function fetchCareerData(): Promise<CareerData> {
  // Fetch all data in parallel for efficiency
  const [profile, experiences, skills, projects, educations] =
    await Promise.all([
      getProfile(),
      experienceRepository.findAll(),
      skillRepository.findAll(),
      projectRepository.findAll(),
      educationRepository.findAll(),
    ]);

  return {
    profile: profile as Profile | null,
    experiences: experiences as Experience[],
    skills: skills as Skill[],
    projects: projects as Project[],
    educations: educations as Education[],
  };
}

export type { CareerData, Profile, Experience, Skill, Project, Education };
