import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDocumentSchema, insertNoteSchema, insertFlashcardSetSchema, insertFlashcardSchema, insertQuizSchema, insertQuizAttemptSchema, insertChatMessageSchema } from "@shared/schema";
import { generateNotesFromContent, generateFlashcardsFromContent, generateQuizFromContent, transcribeAudio, chatWithDocument } from "./services/openai";
import { getYouTubeTranscript, getYouTubeVideoInfo } from "./services/youtube";
import { getSpotifyAccessToken, searchSpotifyTracks, getStudyPlaylists } from "./services/spotify";
import multer from "multer";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Document routes
  app.get("/api/documents", async (req, res) => {
    try {
      // For demo purposes, using a default user ID
      const userId = "demo-user";
      const documents = await storage.getDocumentsByUser(userId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post("/api/documents/upload", upload.single("file"), async (req: MulterRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = "demo-user";
      const content = req.file.buffer.toString('utf-8');
      
      const documentData = insertDocumentSchema.parse({
        userId,
        title: req.file.originalname,
        type: req.file.mimetype.includes('pdf') ? 'pdf' : 'txt',
        content,
        metadata: { size: req.file.size, originalName: req.file.originalname }
      });

      const document = await storage.createDocument(documentData);
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  app.post("/api/documents/youtube", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ message: "YouTube URL is required" });
      }

      const userId = "demo-user";
      const transcript = await getYouTubeTranscript(url);
      const videoInfo = await getYouTubeVideoInfo(url);

      const documentData = insertDocumentSchema.parse({
        userId,
        title: videoInfo.title,
        type: 'youtube',
        originalUrl: url,
        content: transcript,
        metadata: { duration: videoInfo.duration, description: videoInfo.description }
      });

      const document = await storage.createDocument(documentData);
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Failed to process YouTube video: " + (error as Error).message });
    }
  });

  app.post("/api/documents/audio", upload.single("audio"), async (req: MulterRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No audio file uploaded" });
      }

      const userId = "demo-user";
      const transcript = await transcribeAudio(req.file.buffer);

      const documentData = insertDocumentSchema.parse({
        userId,
        title: req.file.originalname || "Audio Recording",
        type: 'audio',
        content: transcript,
        metadata: { size: req.file.size, duration: "unknown" }
      });

      const document = await storage.createDocument(documentData);
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Failed to process audio: " + (error as Error).message });
    }
  });

  // Notes routes
  app.get("/api/notes", async (req, res) => {
    try {
      const userId = "demo-user";
      const notes = await storage.getNotesByUser(userId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  app.post("/api/notes/generate", async (req, res) => {
    try {
      const { documentId } = req.body;
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const generatedNote = await generateNotesFromContent(document.content, document.title);
      
      const noteData = insertNoteSchema.parse({
        userId: document.userId,
        documentId: document.id,
        title: generatedNote.title,
        content: generatedNote.content,
        subject: generatedNote.subject,
        tags: generatedNote.tags,
        wordCount: generatedNote.wordCount
      });

      const note = await storage.createNote(noteData);
      res.json(note);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate notes: " + (error as Error).message });
    }
  });

  app.post("/api/notes", async (req, res) => {
    try {
      const noteData = insertNoteSchema.parse({
        ...req.body,
        userId: "demo-user"
      });
      const note = await storage.createNote(noteData);
      res.json(note);
    } catch (error) {
      res.status(500).json({ message: "Failed to create note" });
    }
  });

  app.put("/api/notes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const note = await storage.updateNote(id, updates);
      
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      res.json(note);
    } catch (error) {
      res.status(500).json({ message: "Failed to update note" });
    }
  });

  // Flashcard routes
  app.get("/api/flashcard-sets", async (req, res) => {
    try {
      const userId = "demo-user";
      const sets = await storage.getFlashcardSetsByUser(userId);
      res.json(sets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch flashcard sets" });
    }
  });

  app.post("/api/flashcard-sets/generate", async (req, res) => {
    try {
      const { documentId, count = 10 } = req.body;
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const generatedCards = await generateFlashcardsFromContent(document.content, count);
      
      const setData = insertFlashcardSetSchema.parse({
        userId: document.userId,
        documentId: document.id,
        title: `${document.title} - Flashcards`,
        description: `Generated flashcards from ${document.title}`,
        cardCount: generatedCards.length
      });

      const set = await storage.createFlashcardSet(setData);

      // Create individual flashcards
      for (const cardData of generatedCards) {
        const flashcardData = insertFlashcardSchema.parse({
          setId: set.id,
          question: cardData.question,
          answer: cardData.answer,
          difficulty: cardData.difficulty
        });
        await storage.createFlashcard(flashcardData);
      }

      res.json(set);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate flashcards: " + (error as Error).message });
    }
  });

  app.get("/api/flashcard-sets/:id/cards", async (req, res) => {
    try {
      const { id } = req.params;
      const cards = await storage.getFlashcardsBySet(id);
      res.json(cards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch flashcards" });
    }
  });

  app.put("/api/flashcards/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const card = await storage.updateFlashcard(id, updates);
      
      if (!card) {
        return res.status(404).json({ message: "Flashcard not found" });
      }
      
      res.json(card);
    } catch (error) {
      res.status(500).json({ message: "Failed to update flashcard" });
    }
  });

  // Quiz routes
  app.get("/api/quizzes", async (req, res) => {
    try {
      const userId = "demo-user";
      const quizzes = await storage.getQuizzesByUser(userId);
      res.json(quizzes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quizzes" });
    }
  });

  app.post("/api/quizzes/generate", async (req, res) => {
    try {
      const { documentId, questionCount = 10 } = req.body;
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const generatedQuiz = await generateQuizFromContent(document.content, questionCount);
      
      const quizData = insertQuizSchema.parse({
        userId: document.userId,
        documentId: document.id,
        title: generatedQuiz.title,
        description: generatedQuiz.description,
        questions: generatedQuiz.questions,
        timeLimit: 30 // 30 minutes default
      });

      const quiz = await storage.createQuiz(quizData);
      res.json(quiz);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate quiz: " + (error as Error).message });
    }
  });

  app.post("/api/quiz-attempts", async (req, res) => {
    try {
      const attemptData = insertQuizAttemptSchema.parse({
        ...req.body,
        userId: "demo-user"
      });
      const attempt = await storage.createQuizAttempt(attemptData);
      res.json(attempt);
    } catch (error) {
      res.status(500).json({ message: "Failed to save quiz attempt" });
    }
  });

  // Chat routes
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, documentId } = req.body;
      
      if (!documentId) {
        return res.status(400).json({ message: "Document ID is required" });
      }

      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const response = await chatWithDocument(message, document.content);
      
      const chatData = insertChatMessageSchema.parse({
        userId: "demo-user",
        documentId,
        message,
        response
      });

      const chatMessage = await storage.createChatMessage(chatData);
      res.json(chatMessage);
    } catch (error) {
      res.status(500).json({ message: "Failed to process chat message: " + (error as Error).message });
    }
  });

  app.get("/api/chat/:documentId", async (req, res) => {
    try {
      const { documentId } = req.params;
      const messages = await storage.getChatMessagesByDocument(documentId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  // Spotify routes
  app.get("/api/spotify/token", async (req, res) => {
    try {
      const token = await getSpotifyAccessToken();
      res.json({ access_token: token });
    } catch (error) {
      res.status(500).json({ message: "Failed to get Spotify token: " + (error as Error).message });
    }
  });

  app.get("/api/spotify/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ message: "Search query is required" });
      }

      const token = await getSpotifyAccessToken();
      const tracks = await searchSpotifyTracks(q as string, token);
      res.json(tracks);
    } catch (error) {
      res.status(500).json({ message: "Failed to search Spotify: " + (error as Error).message });
    }
  });

  app.get("/api/spotify/study-playlists", async (req, res) => {
    try {
      const token = await getSpotifyAccessToken();
      const playlists = await getStudyPlaylists(token);
      res.json(playlists);
    } catch (error) {
      res.status(500).json({ message: "Failed to get study playlists: " + (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
