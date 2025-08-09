import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Layers, Plus, BarChart3, Folder, RotateCcw, Check, X, Minus } from "lucide-react";
import type { FlashcardSet, Flashcard, Document } from "@shared/schema";

export default function FlashcardsSection() {
  const [currentSet, setCurrentSet] = useState<FlashcardSet | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [studyStats, setStudyStats] = useState({ correct: 0, total: 0 });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: flashcardSets, isLoading } = useQuery<FlashcardSet[]>({
    queryKey: ['/api/flashcard-sets'],
  });

  const { data: currentCards } = useQuery<Flashcard[]>({
    queryKey: ['/api/flashcard-sets', currentSet?.id, 'cards'],
    enabled: !!currentSet?.id,
  });

  const { data: documents } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
  });

  const generateFlashcardsMutation = useMutation({
    mutationFn: async ({ documentId, count }: { documentId: string; count: number }) => {
      return await apiRequest('POST', '/api/flashcard-sets/generate', { documentId, count });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/flashcard-sets'] });
      toast({
        title: "Flashcards generated! 🃏",
        description: "Your study cards are ready for review.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation failed 😞",
        description: error.message || "Failed to generate flashcards.",
        variant: "destructive",
      });
    },
  });

  const updateFlashcardMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Flashcard> }) => {
      return await apiRequest('PUT', `/api/flashcards/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/flashcard-sets', currentSet?.id, 'cards'] });
    },
  });

  const handleCardFlip = () => {
    setShowAnswer(!showAnswer);
  };

  const handleDifficultyRating = (difficulty: 'easy' | 'medium' | 'hard') => {
    if (!currentCards || !currentCards[currentCardIndex]) return;

    const card = currentCards[currentCardIndex];
    const isCorrect = difficulty === 'easy';
    
    // Update spaced repetition data
    const now = new Date();
    const nextReview = new Date(now.getTime() + (difficulty === 'easy' ? 3 : difficulty === 'medium' ? 1 : 0.5) * 24 * 60 * 60 * 1000);
    
    updateFlashcardMutation.mutate({
      id: card.id,
      updates: {
        difficulty,
        lastReviewed: now,
        nextReview,
        repetitions: (card.repetitions || 0) + 1,
      },
    });

    // Update study stats
    setStudyStats(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));

    // Move to next card
    if (currentCardIndex < (currentCards.length - 1)) {
      setCurrentCardIndex(currentCardIndex + 1);
      setShowAnswer(false);
    } else {
      // End of deck
      toast({
        title: "Deck completed! 🎉",
        description: `You got ${studyStats.correct + (isCorrect ? 1 : 0)} out of ${studyStats.total + 1} correct.`,
      });
      setCurrentSet(null);
      setCurrentCardIndex(0);
      setStudyStats({ correct: 0, total: 0 });
    }
  };

  const startStudySession = (set: FlashcardSet) => {
    setCurrentSet(set);
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setStudyStats({ correct: 0, total: 0 });
  };

  const progress = currentCards ? ((currentCardIndex) / currentCards.length) * 100 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        {currentSet && currentCards ? (
          // Study Mode
          <Card className="bg-white/70 backdrop-blur-sm shadow-lg border border-white/50 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-semibold text-xl text-gray-800 flex items-center space-x-2">
                  <Layers className="text-brainzy-purple" />
                  <span>{currentSet.title}</span>
                </h2>
                <div className="flex items-center space-x-3">
                  <div className="bg-brainzy-purple/20 text-brainzy-purple px-3 py-1 rounded-full text-sm font-medium">
                    Card {currentCardIndex + 1} of {currentCards.length}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentSet(null)}
                    data-testid="button-exit-study"
                  >
                    Exit Study
                  </Button>
                </div>
              </div>
              
              {/* Flashcard Display */}
              <div className="text-center mb-6">
                <div 
                  className="inline-block perspective-1000 cursor-pointer"
                  onClick={handleCardFlip}
                  data-testid="flashcard-container"
                >
                  <div className="flashcard w-80 h-48 bg-gradient-to-br from-brainzy-purple/10 to-brainzy-lavender/20 rounded-2xl border-2 border-brainzy-purple/20 flex items-center justify-center hover:scale-105 transition-transform duration-300">
                    <div className="text-center p-6">
                      {!showAnswer ? (
                        <>
                          <h3 className="font-display font-semibold text-lg text-gray-800 mb-2">
                            {currentCards[currentCardIndex]?.question}
                          </h3>
                          <p className="text-sm text-gray-600">Click to reveal answer</p>
                        </>
                      ) : (
                        <>
                          <h3 className="font-display font-semibold text-lg text-gray-800 mb-2">Answer:</h3>
                          <p className="text-gray-700">{currentCards[currentCardIndex]?.answer}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {showAnswer && (
                  <div className="flex items-center justify-center space-x-4 mt-6">
                    <Button
                      onClick={() => handleDifficultyRating('hard')}
                      className="bg-red-100 hover:bg-red-200 text-red-600 border-red-200"
                      variant="outline"
                      data-testid="button-difficulty-hard"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Hard
                    </Button>
                    <Button
                      onClick={() => handleDifficultyRating('medium')}
                      className="bg-yellow-100 hover:bg-yellow-200 text-yellow-600 border-yellow-200"
                      variant="outline"
                      data-testid="button-difficulty-medium"
                    >
                      <Minus className="w-4 h-4 mr-2" />
                      Medium
                    </Button>
                    <Button
                      onClick={() => handleDifficultyRating('easy')}
                      className="bg-green-100 hover:bg-green-200 text-green-600 border-green-200"
                      variant="outline"
                      data-testid="button-difficulty-easy"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Easy
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Progress */}
              <div className="bg-brainzy-light/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm text-gray-600">
                    {currentCardIndex}/{currentCards.length} cards
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
                
                {studyStats.total > 0 && (
                  <div className="flex justify-between text-sm text-gray-600 mt-2">
                    <span>Correct: {studyStats.correct}</span>
                    <span>Accuracy: {Math.round((studyStats.correct / studyStats.total) * 100)}%</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          // Flashcard Sets Overview
          <Card className="bg-white/70 backdrop-blur-sm shadow-lg border border-white/50 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-semibold text-xl text-gray-800 flex items-center space-x-2">
                  <Layers className="text-brainzy-purple" />
                  <span>Flashcards</span>
                </h2>
                <Button 
                  className="bg-gradient-to-r from-brainzy-purple to-brainzy-lavender hover:shadow-lg"
                  data-testid="button-create-flashcard-set"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Set
                </Button>
              </div>
              
              {/* Generate from Documents */}
              {documents && documents.length > 0 && (
                <div className="mb-6 p-4 bg-brainzy-light/30 rounded-xl">
                  <h3 className="font-medium text-gray-800 mb-3">Generate Flashcards from Documents</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {documents.slice(0, 4).map((doc) => (
                      <Button
                        key={doc.id}
                        variant="outline"
                        className="justify-start text-left h-auto p-3"
                        onClick={() => generateFlashcardsMutation.mutate({ documentId: doc.id, count: 10 })}
                        disabled={generateFlashcardsMutation.isPending}
                        data-testid={`button-generate-flashcards-${doc.id}`}
                      >
                        <div>
                          <div className="font-medium text-sm">{doc.title}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {generateFlashcardsMutation.isPending ? "Generating..." : "Generate 10 flashcards"}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Flashcard Sets Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 rounded-xl h-32 mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : flashcardSets && flashcardSets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {flashcardSets.map((set) => (
                    <div
                      key={set.id}
                      className="card-hover bg-white/60 rounded-xl p-4 border border-white/50 cursor-pointer"
                      onClick={() => startStudySession(set)}
                      data-testid={`flashcard-set-${set.id}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-3 h-3 bg-brainzy-purple rounded-full"></div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-gray-400 hover:text-brainzy-purple"
                          onClick={(e) => e.stopPropagation()}
                        >
                          ⋯
                        </Button>
                      </div>
                      
                      <h3 className="font-medium text-gray-800 mb-2 line-clamp-2">{set.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{set.cardCount} cards</p>
                      
                      <div className="flex items-center mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-1 mr-2">
                          <div className="bg-brainzy-purple h-1 rounded-full" style={{ width: "60%" }}></div>
                        </div>
                        <span className="text-xs text-gray-500">60%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Layers className="mx-auto mb-4 text-gray-400" size={64} />
                  <h3 className="text-lg font-medium mb-2">No flashcard sets yet</h3>
                  <p className="mb-4">Generate flashcards from your documents to start studying!</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Flashcard Sets & Stats Sidebar */}
      <div className="space-y-6">
        {!currentSet && (
          <Card className="bg-white/70 backdrop-blur-sm shadow-lg border border-white/50">
            <CardContent className="p-4">
              <h3 className="font-medium text-gray-800 mb-4 flex items-center space-x-2">
                <Folder className="text-brainzy-mint" />
                <span>Your Sets</span>
              </h3>
              
              <div className="space-y-3">
                {flashcardSets?.slice(0, 3).map((set) => (
                  <div
                    key={set.id}
                    className="bg-white/50 rounded-lg p-3 hover:bg-white/70 transition-colors cursor-pointer"
                    onClick={() => startStudySession(set)}
                    data-testid={`sidebar-flashcard-set-${set.id}`}
                  >
                    <h4 className="font-medium text-gray-800 text-sm line-clamp-1">{set.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">{set.cardCount} cards</p>
                    <div className="flex items-center mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-1 mr-2">
                        <div className="bg-brainzy-mint h-1 rounded-full" style={{ width: "60%" }}></div>
                      </div>
                      <span className="text-xs text-gray-500">60%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Study Stats */}
        <Card className="bg-white/70 backdrop-blur-sm shadow-lg border border-white/50">
          <CardContent className="p-4">
            <h3 className="font-medium text-gray-800 mb-4 flex items-center space-x-2">
              <BarChart3 className="text-brainzy-coral" />
              <span>Study Stats</span>
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Cards Studied Today</span>
                <span className="font-semibold text-brainzy-purple" data-testid="stat-cards-today">
                  {studyStats.total}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Current Streak</span>
                <span className="font-semibold text-brainzy-mint" data-testid="stat-streak">5 days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Accuracy</span>
                <span className="font-semibold text-brainzy-coral" data-testid="stat-accuracy">
                  {studyStats.total > 0 ? Math.round((studyStats.correct / studyStats.total) * 100) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
