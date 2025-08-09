import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || "your-api-key-here" 
});

export interface GeneratedNote {
  title: string;
  content: string;
  subject: string;
  wordCount: number;
  tags: string[];
}

export interface GeneratedFlashcard {
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface GeneratedQuiz {
  title: string;
  description: string;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export async function generateNotesFromContent(content: string, title: string): Promise<GeneratedNote> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert study assistant. Create well-structured, comprehensive notes from the provided content. Format the notes with clear headings, bullet points, and key concepts. Include relevant emojis to make the notes more engaging and memorable. Respond with JSON in this format: { 'title': string, 'content': string, 'subject': string, 'wordCount': number, 'tags': string[] }"
        },
        {
          role: "user",
          content: `Create detailed study notes from this content titled "${title}":\n\n${content}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      title: result.title || title,
      content: result.content || "",
      subject: result.subject || "General",
      wordCount: result.wordCount || 0,
      tags: result.tags || []
    };
  } catch (error) {
    throw new Error("Failed to generate notes: " + (error as Error).message);
  }
}

export async function generateFlashcardsFromContent(content: string, count: number = 10): Promise<GeneratedFlashcard[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert study assistant. Create ${count} flashcards from the provided content. Make questions clear and concise, with comprehensive answers. Vary the difficulty levels appropriately. Respond with JSON in this format: { 'flashcards': [{ 'question': string, 'answer': string, 'difficulty': 'easy' | 'medium' | 'hard' }] }`
        },
        {
          role: "user",
          content: `Create ${count} flashcards from this content:\n\n${content}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.flashcards || [];
  } catch (error) {
    throw new Error("Failed to generate flashcards: " + (error as Error).message);
  }
}

export async function generateQuizFromContent(content: string, questionCount: number = 10): Promise<GeneratedQuiz> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert quiz creator. Create a ${questionCount}-question multiple choice quiz from the provided content. Each question should have 4 options with only one correct answer. Include explanations for the correct answers. Respond with JSON in this format: { 'title': string, 'description': string, 'questions': [{ 'question': string, 'options': string[], 'correctAnswer': number, 'explanation': string }] }`
        },
        {
          role: "user",
          content: `Create a ${questionCount}-question quiz from this content:\n\n${content}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      title: result.title || "Generated Quiz",
      description: result.description || "Quiz generated from uploaded content",
      questions: result.questions || []
    };
  } catch (error) {
    throw new Error("Failed to generate quiz: " + (error as Error).message);
  }
}

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  try {
    // Create a temporary file-like object for OpenAI
    const audioFile = new File([audioBuffer], "audio.mp3", { type: "audio/mpeg" });
    
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
    });

    return transcription.text;
  } catch (error) {
    throw new Error("Failed to transcribe audio: " + (error as Error).message);
  }
}

export async function chatWithDocument(question: string, documentContent: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful study assistant. Answer questions about the provided document content. Be accurate, helpful, and engaging. Use emojis where appropriate to make responses more friendly."
        },
        {
          role: "user",
          content: `Document content:\n${documentContent}\n\nQuestion: ${question}`
        }
      ],
    });

    return response.choices[0].message.content || "I couldn't generate a response.";
  } catch (error) {
    throw new Error("Failed to chat with document: " + (error as Error).message);
  }
}
