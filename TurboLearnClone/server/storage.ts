import { type User, type InsertUser, type Document, type InsertDocument, type Note, type InsertNote, type FlashcardSet, type InsertFlashcardSet, type Flashcard, type InsertFlashcard, type Quiz, type InsertQuiz, type QuizAttempt, type InsertQuizAttempt, type ChatMessage, type InsertChatMessage } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Document methods
  getDocument(id: string): Promise<Document | undefined>;
  getDocumentsByUser(userId: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(id: string): Promise<boolean>;

  // Note methods
  getNote(id: string): Promise<Note | undefined>;
  getNotesByUser(userId: string): Promise<Note[]>;
  getNotesByDocument(documentId: string): Promise<Note[]>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: string, updates: Partial<Note>): Promise<Note | undefined>;
  deleteNote(id: string): Promise<boolean>;

  // Flashcard methods
  getFlashcardSet(id: string): Promise<FlashcardSet | undefined>;
  getFlashcardSetsByUser(userId: string): Promise<FlashcardSet[]>;
  createFlashcardSet(set: InsertFlashcardSet): Promise<FlashcardSet>;
  getFlashcardsBySet(setId: string): Promise<Flashcard[]>;
  createFlashcard(card: InsertFlashcard): Promise<Flashcard>;
  updateFlashcard(id: string, updates: Partial<Flashcard>): Promise<Flashcard | undefined>;

  // Quiz methods
  getQuiz(id: string): Promise<Quiz | undefined>;
  getQuizzesByUser(userId: string): Promise<Quiz[]>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  getQuizAttemptsByUser(userId: string): Promise<QuizAttempt[]>;
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;

  // Chat methods
  getChatMessagesByDocument(documentId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private documents: Map<string, Document> = new Map();
  private notes: Map<string, Note> = new Map();
  private flashcardSets: Map<string, FlashcardSet> = new Map();
  private flashcards: Map<string, Flashcard> = new Map();
  private quizzes: Map<string, Quiz> = new Map();
  private quizAttempts: Map<string, QuizAttempt> = new Map();
  private chatMessages: Map<string, ChatMessage> = new Map();

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date(),
      spotifyAccessToken: null,
      spotifyRefreshToken: null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Document methods
  async getDocument(id: string): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getDocumentsByUser(userId: string): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(doc => doc.userId === userId);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = randomUUID();
    const document: Document = { 
      ...insertDocument, 
      id, 
      createdAt: new Date(),
      metadata: insertDocument.metadata || null,
      originalUrl: insertDocument.originalUrl || null
    };
    this.documents.set(id, document);
    return document;
  }

  async deleteDocument(id: string): Promise<boolean> {
    return this.documents.delete(id);
  }

  // Note methods
  async getNote(id: string): Promise<Note | undefined> {
    return this.notes.get(id);
  }

  async getNotesByUser(userId: string): Promise<Note[]> {
    return Array.from(this.notes.values()).filter(note => note.userId === userId);
  }

  async getNotesByDocument(documentId: string): Promise<Note[]> {
    return Array.from(this.notes.values()).filter(note => note.documentId === documentId);
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const id = randomUUID();
    const now = new Date();
    const note: Note = { 
      ...insertNote, 
      id, 
      createdAt: now,
      updatedAt: now,
      documentId: insertNote.documentId || null,
      subject: insertNote.subject || null,
      tags: insertNote.tags || null,
      wordCount: insertNote.wordCount || 0
    };
    this.notes.set(id, note);
    return note;
  }

  async updateNote(id: string, updates: Partial<Note>): Promise<Note | undefined> {
    const note = this.notes.get(id);
    if (!note) return undefined;
    
    const updatedNote = { ...note, ...updates, updatedAt: new Date() };
    this.notes.set(id, updatedNote);
    return updatedNote;
  }

  async deleteNote(id: string): Promise<boolean> {
    return this.notes.delete(id);
  }

  // Flashcard methods
  async getFlashcardSet(id: string): Promise<FlashcardSet | undefined> {
    return this.flashcardSets.get(id);
  }

  async getFlashcardSetsByUser(userId: string): Promise<FlashcardSet[]> {
    return Array.from(this.flashcardSets.values()).filter(set => set.userId === userId);
  }

  async createFlashcardSet(insertSet: InsertFlashcardSet): Promise<FlashcardSet> {
    const id = randomUUID();
    const set: FlashcardSet = { 
      ...insertSet, 
      id, 
      createdAt: new Date(),
      documentId: insertSet.documentId || null,
      description: insertSet.description || null,
      cardCount: insertSet.cardCount || 0
    };
    this.flashcardSets.set(id, set);
    return set;
  }

  async getFlashcardsBySet(setId: string): Promise<Flashcard[]> {
    return Array.from(this.flashcards.values()).filter(card => card.setId === setId);
  }

  async createFlashcard(insertCard: InsertFlashcard): Promise<Flashcard> {
    const id = randomUUID();
    const card: Flashcard = { 
      ...insertCard, 
      id,
      difficulty: insertCard.difficulty || "medium",
      lastReviewed: insertCard.lastReviewed || null,
      nextReview: insertCard.nextReview || null,
      repetitions: insertCard.repetitions || 0,
      easinessFactor: insertCard.easinessFactor || 250
    };
    this.flashcards.set(id, card);
    return card;
  }

  async updateFlashcard(id: string, updates: Partial<Flashcard>): Promise<Flashcard | undefined> {
    const card = this.flashcards.get(id);
    if (!card) return undefined;
    
    const updatedCard = { ...card, ...updates };
    this.flashcards.set(id, updatedCard);
    return updatedCard;
  }

  // Quiz methods
  async getQuiz(id: string): Promise<Quiz | undefined> {
    return this.quizzes.get(id);
  }

  async getQuizzesByUser(userId: string): Promise<Quiz[]> {
    return Array.from(this.quizzes.values()).filter(quiz => quiz.userId === userId);
  }

  async createQuiz(insertQuiz: InsertQuiz): Promise<Quiz> {
    const id = randomUUID();
    const quiz: Quiz = { 
      ...insertQuiz, 
      id, 
      createdAt: new Date(),
      documentId: insertQuiz.documentId || null,
      description: insertQuiz.description || null,
      timeLimit: insertQuiz.timeLimit || null
    };
    this.quizzes.set(id, quiz);
    return quiz;
  }

  async getQuizAttemptsByUser(userId: string): Promise<QuizAttempt[]> {
    return Array.from(this.quizAttempts.values()).filter(attempt => attempt.userId === userId);
  }

  async createQuizAttempt(insertAttempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const id = randomUUID();
    const attempt: QuizAttempt = { 
      ...insertAttempt, 
      id, 
      completedAt: new Date(),
      timeSpent: insertAttempt.timeSpent || null
    };
    this.quizAttempts.set(id, attempt);
    return attempt;
  }

  // Chat methods
  async getChatMessagesByDocument(documentId: string): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values()).filter(msg => msg.documentId === documentId);
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = { 
      ...insertMessage, 
      id, 
      createdAt: new Date(),
      documentId: insertMessage.documentId || null
    };
    this.chatMessages.set(id, message);
    return message;
  }
}

export const storage = new MemStorage();
