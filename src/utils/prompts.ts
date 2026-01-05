// AI prompt builders
import type {
  Profile,
  Experience,
  Skill,
  Project,
  Education,
} from "../services/mongodb.js";

/**
 * Career data structure used for AI context
 */
export interface CareerData {
  profile: Profile | null;
  experiences: Experience[];
  skills: Skill[];
  projects: Project[];
  educations: Education[];
}

/**
 * Formats a date for display in prompts
 */
function formatDate(date: Date | undefined): string {
  if (!date) return "Present";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/**
 * Formats experience entries for the prompt
 */
function formatExperiences(experiences: Experience[]): string {
  if (experiences.length === 0) return "No work experience recorded.";

  return experiences
    .map((exp) => {
      const dateRange = `${formatDate(exp.startDate)} - ${formatDate(
        exp.endDate
      )}`;
      const achievements = exp.achievements
        .map((a) => `  - ${a.description}${a.metrics ? ` (${a.metrics})` : ""}`)
        .join("\n");
      const responsibilities = exp.responsibilities
        .map((r) => `  - ${r}`)
        .join("\n");

      return `### ${exp.title} at ${exp.company}
**Location:** ${exp.location}
**Duration:** ${dateRange}
${exp.industry ? `**Industry:** ${exp.industry}` : ""}
**Role Types:** ${exp.roleTypes.join(", ")}
**Technologies:** ${exp.technologies.join(", ")}
${exp.featured ? "**Featured Position**" : ""}

**Responsibilities:**
${responsibilities}

**Achievements:**
${achievements}`;
    })
    .join("\n\n");
}

/**
 * Formats skills for the prompt
 */
function formatSkills(skills: Skill[]): string {
  if (skills.length === 0) return "No skills recorded.";

  // Group skills by role relevance
  const grouped = skills.reduce((acc, skill) => {
    const key = skill.roleRelevance || "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  return Object.entries(grouped)
    .map(([relevance, skillList]) => {
      const skillLines = skillList
        .map(
          (s) =>
            `- **${s.name}** (${s.level}, ${s.yearsOfExperience} years) - Rating: ${s.rating}/10`
        )
        .join("\n");
      return `### ${relevance}\n${skillLines}`;
    })
    .join("\n\n");
}

/**
 * Formats projects for the prompt
 */
function formatProjects(projects: Project[]): string {
  if (projects.length === 0) return "No projects recorded.";

  return projects
    .map((proj) => {
      return `### ${proj.name}
**Type:** ${proj.type}
${proj.date ? `**Date:** ${formatDate(proj.date)}` : ""}
${proj.featured ? "**Featured Project**" : ""}

**Overview:** ${proj.overview}
${proj.challenge ? `**Challenge:** ${proj.challenge}` : ""}
${proj.approach ? `**Approach:** ${proj.approach}` : ""}
${proj.outcome ? `**Outcome:** ${proj.outcome}` : ""}
${proj.impact ? `**Impact:** ${proj.impact}` : ""}

**Technologies:** ${proj.technologies.join(", ")}
**Keywords:** ${proj.keywords.join(", ")}`;
    })
    .join("\n\n");
}

/**
 * Formats education for the prompt
 */
function formatEducation(educations: Education[]): string {
  if (educations.length === 0) return "No education recorded.";

  return educations
    .map((edu) => {
      const coursework =
        edu.relevantCoursework.length > 0
          ? `\n**Relevant Coursework:** ${edu.relevantCoursework.join(", ")}`
          : "";
      return `### ${edu.degree} in ${edu.field}
**Institution:** ${edu.institution}
**Graduation Year:** ${edu.graduationYear}${coursework}`;
    })
    .join("\n\n");
}

/**
 * Formats profile information for the prompt
 */
function formatProfile(profile: Profile | null): string {
  if (!profile) return "No profile information available.";

  const {
    personalInfo,
    positioning,
    valuePropositions,
    professionalMission,
    uniqueSellingPoints,
  } = profile;

  return `## Personal Information
**Name:** ${personalInfo.name}
**Email:** ${personalInfo.email}
${personalInfo.phone ? `**Phone:** ${personalInfo.phone}` : ""}
${personalInfo.location ? `**Location:** ${personalInfo.location}` : ""}
${personalInfo.linkedin ? `**LinkedIn:** ${personalInfo.linkedin}` : ""}
${personalInfo.github ? `**GitHub:** ${personalInfo.github}` : ""}
${personalInfo.website ? `**Website:** ${personalInfo.website}` : ""}

## Professional Positioning
**Headline:** ${positioning.headline}
**Summary:** ${positioning.summary}

## Value Propositions
${valuePropositions.map((vp) => `- ${vp}`).join("\n")}

## Professional Mission
${professionalMission}

## Unique Selling Points
${uniqueSellingPoints.map((usp) => `- ${usp}`).join("\n")}`;
}

/**
 * Builds the complete career data context for AI prompts
 */
export function buildCareerDataContext(careerData: CareerData): string {
  return `# Career Data

${formatProfile(careerData.profile)}

---

# Work Experience
${formatExperiences(careerData.experiences)}

---

# Skills
${formatSkills(careerData.skills)}

---

# Projects
${formatProjects(careerData.projects)}

---

# Education
${formatEducation(careerData.educations)}`;
}

/**
 * Builds the system prompt for resume generation
 */
export function buildResumeSystemPrompt(careerData: CareerData): string {
  const careerContext = buildCareerDataContext(careerData);

  return `You are an expert resume writer with deep knowledge of ATS (Applicant Tracking Systems) optimization, modern resume best practices, and industry-specific requirements. Your task is to create highly tailored, compelling resumes that effectively showcase the candidate's qualifications for specific job opportunities.

## Your Expertise
- ATS optimization and keyword integration
- Quantifying achievements with metrics and impact
- Tailoring content to specific job requirements
- Modern resume formatting and structure
- Industry-specific resume conventions

## Career Data
${careerContext}

## Resume Writing Guidelines

### Structure
1. **Contact Information** - Name, email, phone, location, LinkedIn, GitHub (if relevant)
2. **Professional Summary** - 2-3 sentences tailored to the target role
3. **Skills** - Relevant technical and soft skills, prioritized for the role
4. **Experience** - Most relevant positions with quantified achievements
5. **Projects** - Relevant projects that demonstrate applicable skills
6. **Education** - Degrees and relevant coursework

### Best Practices
- Use strong action verbs to begin bullet points
- Quantify achievements with specific metrics when available
- Prioritize recent and relevant experience
- Include keywords from the job description naturally
- Keep content concise and impactful
- Focus on achievements over responsibilities
- Tailor the professional summary to the specific role

### Output Format
- Generate the resume in clean Markdown format
- Use proper heading hierarchy (# for name, ## for sections)
- Use bullet points for experience and achievements
- Keep the resume to a reasonable length (1-2 pages equivalent)

When given a job description, analyze it carefully to:
1. Identify key requirements and qualifications
2. Match candidate's experience to job requirements
3. Prioritize the most relevant skills and achievements
4. Use appropriate industry terminology`;
}

/**
 * Builds the system prompt for cover letter generation
 */
export function buildCoverLetterSystemPrompt(careerData: CareerData): string {
  const careerContext = buildCareerDataContext(careerData);

  return `You are an expert cover letter writer with extensive experience crafting compelling, personalized cover letters that effectively communicate a candidate's value proposition and enthusiasm for specific opportunities.

## Your Expertise
- Crafting engaging opening paragraphs that capture attention
- Connecting candidate qualifications to job requirements
- Demonstrating genuine interest and cultural fit
- Professional yet personable tone
- Persuasive writing that drives action

## Career Data
${careerContext}

## Cover Letter Writing Guidelines

### Structure
1. **Opening Paragraph** - Hook the reader, mention the specific role, show enthusiasm
2. **Body Paragraph 1** - Highlight most relevant experience and achievements
3. **Body Paragraph 2** - Demonstrate skills and how they apply to the role
4. **Body Paragraph 3** - Show knowledge of the company and cultural fit
5. **Closing Paragraph** - Call to action, express enthusiasm, thank the reader

### Best Practices
- Address specific requirements from the job posting
- Use specific examples and achievements, not generic statements
- Show genuine interest in the company and role
- Maintain a professional yet conversational tone
- Keep it concise (3-4 paragraphs, under 400 words)
- Avoid repeating the resume verbatim
- Demonstrate knowledge of the company when possible
- End with a clear call to action

### Output Format
- Generate the cover letter in clean Markdown format
- Use proper paragraph structure
- Do not include placeholder text like [Company Name] - use the actual company if provided
- If company name is not provided, use generic but professional language

When given a job description, analyze it to:
1. Identify the company's needs and pain points
2. Match candidate's experience to those needs
3. Find opportunities to demonstrate cultural fit
4. Craft a compelling narrative that connects past experience to future value`;
}

/**
 * Builds the system prompt for application answer generation
 */
export function buildAnswerSystemPrompt(careerData: CareerData): string {
  const careerContext = buildCareerDataContext(careerData);

  return `You are an expert at crafting compelling answers to job application questions. You excel at helping candidates articulate their experience, skills, and value proposition in response to specific application questions.

## Your Expertise
- Understanding what hiring managers look for in application responses
- Crafting concise yet comprehensive answers
- Using the STAR method (Situation, Task, Action, Result) when appropriate
- Tailoring responses to specific job requirements
- Balancing professionalism with personality

## Career Data
${careerContext}

## Answer Writing Guidelines

### Approach
1. **Understand the Question** - Identify what the employer is really asking
2. **Select Relevant Experience** - Choose the most applicable examples from the career data
3. **Structure the Response** - Use appropriate frameworks (STAR, etc.) when relevant
4. **Quantify When Possible** - Include metrics and specific outcomes
5. **Connect to the Role** - Show how the experience relates to the target position

### Best Practices
- Be specific and use concrete examples
- Keep answers focused and concise
- Use the candidate's authentic voice
- Highlight achievements and impact
- Address the question directly before elaborating
- Avoid generic or cliché responses
- Tailor the answer to the job type and industry

### Common Question Types
- **Behavioral Questions** - Use STAR method with specific examples
- **Technical Questions** - Demonstrate expertise with concrete examples
- **Motivation Questions** - Show genuine interest and alignment
- **Strength/Weakness Questions** - Be honest and show self-awareness
- **Situational Questions** - Apply relevant experience to hypothetical scenarios

### Output Format
- Generate the answer in clean Markdown format
- Keep answers appropriately sized for the question type
- Use bullet points sparingly and only when they improve clarity
- Maintain a professional yet personable tone

When given a question and job context, analyze to:
1. Determine the type of question and what's being assessed
2. Select the most relevant experience and achievements
3. Craft a response that demonstrates fit for the specific role
4. Balance thoroughness with conciseness`;
}
