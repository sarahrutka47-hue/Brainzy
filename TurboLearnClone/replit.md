# Brainzy - AI-Powered Study Assistant

## Overview

Brainzy is a modern web application designed to help students enhance their study experience through AI-powered features. The platform allows users to upload documents (text files, PDFs, audio recordings, and YouTube videos), which are then processed to generate structured study materials including notes, flashcards, and quizzes. Additionally, the application provides a chat interface for document-based Q&A and integrates with Spotify for background music during study sessions.

The application follows a full-stack architecture with a React frontend and Express.js backend, utilizing PostgreSQL for data persistence and OpenAI's GPT models for content generation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state management
- **UI Framework**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API endpoints
- **Database ORM**: Drizzle ORM for type-safe database operations
- **File Upload**: Multer for handling multipart form data
- **Session Management**: Express sessions with PostgreSQL store

### Data Storage
- **Primary Database**: PostgreSQL via Neon Database serverless
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Storage Pattern**: In-memory storage abstraction with PostgreSQL implementation
- **Data Models**: Users, Documents, Notes, Flashcard Sets, Flashcards, Quizzes, Quiz Attempts, and Chat Messages

### Authentication & Authorization
- **Session-based Authentication**: Using express-session with PostgreSQL store
- **User Management**: Basic user registration and login system
- **Authorization**: Simple user-based access control for resources

### AI Content Generation
- **AI Provider**: OpenAI GPT-4o for content generation
- **Content Types**: 
  - Structured notes from documents
  - Flashcard sets with question/answer pairs
  - Multiple choice quizzes with explanations
  - Document-based chat responses
- **Audio Processing**: OpenAI Whisper API for audio transcription

## External Dependencies

### Third-party APIs
- **OpenAI API**: Content generation, chat completion, and audio transcription
- **Spotify Web API**: Music integration for study playlists and playback control
- **YouTube**: Video transcript extraction and metadata retrieval (placeholder implementation)

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Connection**: Uses connection pooling via @neondatabase/serverless

### Development Tools
- **Replit Integration**: Development environment with cartographer plugin
- **Vite Plugins**: Runtime error overlay and development tooling
- **TypeScript**: Full type safety across frontend, backend, and shared schemas

### UI/UX Libraries
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **React Hook Form**: Form validation and management
- **Embla Carousel**: Touch-friendly carousel component
- **React Day Picker**: Date selection component

### Utility Libraries
- **Zod**: Runtime type validation and schema definition
- **Class Variance Authority**: Type-safe CSS class composition
- **clsx & tailwind-merge**: Conditional CSS class management
- **date-fns**: Date manipulation utilities