export const subQuestionPrompt = (query: string, searchResults: { results: { content: string }[] }) => `Transform the topic "${query}" into a title, main question and generate two related sub-questions.

Here are some key points to consider:
${searchResults.results.map((r) => r.content).join("\n")}

Requirements:
1. Title should be concise and descriptive (max 50 characters)
2. Main question should be broad and capture the essence of the topic
3. Sub-questions should be more specific and explore different aspects
4. All questions should be clear and concise (5-15 words)
5. Questions should encourage exploration and discussion
6. Avoid yes/no questions
7. Sub-questions should naturally follow from the main question

Example format (DO NOT copy these exact questions, create appropriate ones for the topic):
{
  "title": "Industrial Revolution Impact",
  "mainQuestion": "How did the Industrial Revolution transform society?",
  "subQuestions": [
    "What were the key technological innovations that drove change?",
    "How did the Industrial Revolution affect social class structures?"
  ]
}

IMPORTANT: Return only a valid JSON object with the title, mainQuestion and subQuestions fields, without any additional text or explanations.`;

export const summaryPrompt = (mainQuestion: string) => `Create a very short summary (max 300 characters) answering this question: "${mainQuestion}"

Requirements:
1. Be concise
2. Focus on the key point
3. Use simple language
4. Stay under 300 characters
5. Return only the summary text, no quotes or additional text`;

export const subQuestionOnlyPrompt = (query: string) => `Transform the topic "${query}" into two related sub-questions.

Requirements:
1. Sub-questions should be more specific and explore different aspects
2. All questions should be clear and concise (5-15 words)
3. Questions should encourage exploration and discussion
4. Avoid yes/no questions
5. Sub-questions should naturally follow from the main question

Example format (DO NOT copy these exact questions, create appropriate ones for the topic):
{
  "subQuestions": [
    "What were the key technological innovations that drove change?",
    "How did the Industrial Revolution affect social class structures?"
  ]
}

IMPORTANT: Return only a valid JSON object with the subQuestions field, without any additional text or explanations.`;
