import { useState } from "react";
import { Brain, Crown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UploadSection from "@/components/upload-section";
import NotesSection from "@/components/notes-section";
import FlashcardsSection from "@/components/flashcards-section";
import QuizSection from "@/components/quiz-section";
import MusicSection from "@/components/music-section";

export default function Home() {
  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-brainzy-pink to-brainzy-purple rounded-xl flex items-center justify-center animate-float">
                <Brain className="text-white text-lg" />
              </div>
              <h1 className="font-display font-bold text-2xl bg-gradient-to-r from-brainzy-pink to-brainzy-purple bg-clip-text text-transparent">
                Brainzy
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                className="flex items-center space-x-2 bg-brainzy-mint/20 text-brainzy-mint px-4 py-2 rounded-full hover:bg-brainzy-mint/30 transition-colors"
                data-testid="button-free-forever"
              >
                <Crown className="w-4 h-4" />
                <span className="font-medium">Free Forever</span>
              </button>
              <div className="w-8 h-8 bg-gradient-to-br from-brainzy-coral to-brainzy-lavender rounded-full"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-white/60 backdrop-blur-sm rounded-2xl p-2 mb-8 shadow-lg border border-white/50">
            <TabsTrigger value="upload" data-testid="tab-upload">
              <div className="flex items-center space-x-2">
                <span className="text-lg">☁️</span>
                <span>Upload</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="notes" data-testid="tab-notes">
              <div className="flex items-center space-x-2">
                <span className="text-lg">📝</span>
                <span>Notes</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="flashcards" data-testid="tab-flashcards">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🃏</span>
                <span>Flashcards</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="quiz" data-testid="tab-quiz">
              <div className="flex items-center space-x-2">
                <span className="text-lg">❓</span>
                <span>Quiz</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="music" data-testid="tab-music">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🎵</span>
                <span>Music</span>
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <UploadSection />
          </TabsContent>

          <TabsContent value="notes">
            <NotesSection />
          </TabsContent>

          <TabsContent value="flashcards">
            <FlashcardsSection />
          </TabsContent>

          <TabsContent value="quiz">
            <QuizSection />
          </TabsContent>

          <TabsContent value="music">
            <MusicSection />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
