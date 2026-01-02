// AI prompt builders
export function buildResumeSystemPrompt(careerData: unknown): string {
  return `You are an expert resume writer. Generate a tailored resume based on the following career data:
${JSON.stringify(careerData, null, 2)}`;
}

export function buildCoverLetterSystemPrompt(careerData: unknown): string {
  return `You are an expert cover letter writer. Generate a tailored cover letter based on the following career data:
${JSON.stringify(careerData, null, 2)}`;
}

export function buildAnswerSystemPrompt(careerData: unknown): string {
  return `You are an expert at answering job application questions. Generate a tailored answer based on the following career data:
${JSON.stringify(careerData, null, 2)}`;
}
