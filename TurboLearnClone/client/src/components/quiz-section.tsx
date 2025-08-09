import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { HelpCircle, TrendingUp, Clock, Play, CheckCircle, XCircle } from "lucide-react";
import type { Quiz, QuizAttempt, Document } from "@shared/schema";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export default function QuizSection() {
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [quizStartTime, setQuizStartTime] = useState<Date | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: quizzes, isLoading } = useQuery<Quiz[]>({
    queryKey: ['/api/quizzes'],
  });

  const { data: documents } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
  });

  const { data: quizAttempts } = useQuery<QuizAttempt[]>({
    queryKey: ['/api/quiz-attempts'],
  });

  const generateQuizMutation = useMutation({
    mutationFn: async ({ documentId, questionCount }: { documentId: string; questionCount: number }) => {
      return await apiRequest('POST', '/api/quizzes/generate', { documentId, questionCount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quizzes'] });
      toast({
        title: "Quiz generated! 📝",
        description: "Your personalized quiz is ready to take.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation failed 😞",
        description: error.message || "Failed to generate quiz.",
        variant: "destructive",
      });
    },
  });

  const submitQuizMutation = useMutation({
    mutationFn: async (attemptData: {
      quizId: string;
      answers: number[];
      score: number;
      totalQuestions: number;
      timeSpent: number;
    }) => {
      return await apiRequest('POST', '/api/quiz-attempts', attemptData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quiz-attempts'] });
      toast({
        title: "Quiz completed! 🎉",
        description: "Your results have been saved.",
      });
    },
  });

  const startQuiz = (quiz: Quiz) => {
    setCurrentQuiz(quiz);
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setShowResult(false);
    setQuizStartTime(new Date());
    
    if (quiz.timeLimit) {
      setTimeLeft(quiz.timeLimit * 60); // Convert minutes to seconds
    }
  };

  const selectAnswer = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (!currentQuiz) return;
    
    const questions = currentQuiz.questions as QuizQuestion[];
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      finishQuiz();
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const finishQuiz = () => {
    if (!currentQuiz || !quizStartTime) return;
    
    const questions = currentQuiz.questions as QuizQuestion[];
    let correctCount = 0;
    
    selectedAnswers.forEach((answer, index) => {
      if (answer === questions[index]?.correctAnswer) {
        correctCount++;
      }
    });
    
    const timeSpent = Math.floor((new Date().getTime() - quizStartTime.getTime()) / 1000);
    const score = Math.round((correctCount / questions.length) * 100);
    
    submitQuizMutation.mutate({
      quizId: currentQuiz.id,
      answers: selectedAnswers,
      score,
      totalQuestions: questions.length,
      timeSpent,
    });
    
    setShowResult(true);
  };

  const exitQuiz = () => {
    setCurrentQuiz(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setShowResult(false);
    setTimeLeft(null);
    setQuizStartTime(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuizScore = (quizId: string) => {
    const attempts = quizAttempts?.filter(attempt => attempt.quizId === quizId) || [];
    if (attempts.length === 0) return null;
    return Math.max(...attempts.map(attempt => attempt.score));
  };

  if (currentQuiz && !showResult) {
    const questions = currentQuiz.questions as QuizQuestion[];
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    const correctAnswers = selectedAnswers.filter((answer, index) => 
      answer === questions[index]?.correctAnswer
    ).length;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-white/70 backdrop-blur-sm shadow-lg border border-white/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-semibold text-xl text-gray-800 flex items-center space-x-2">
                  <HelpCircle className="text-brainzy-mint" />
                  <span>Quiz Time!</span>
                </h2>
                <div className="flex items-center space-x-3">
                  <Badge className="bg-brainzy-mint/20 text-brainzy-mint">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </Badge>
                  {timeLeft !== null && (
                    <div className="text-sm text-gray-600 flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span data-testid="quiz-timer">{formatTime(timeLeft)}</span>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    onClick={exitQuiz}
                    data-testid="button-exit-quiz"
                  >
                    Exit Quiz
                  </Button>
                </div>
              </div>
              
              {/* Quiz Question */}
              <div className="mb-8">
                <div className="bg-gradient-to-r from-brainzy-mint/10 to-brainzy-yellow/10 rounded-xl p-6 mb-6">
                  <h3 className="font-display font-medium text-lg text-gray-800 mb-4">
                    {currentQuestion.question}
                  </h3>
                  
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => selectAnswer(index)}
                        className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
                          selectedAnswers[currentQuestionIndex] === index
                            ? 'bg-brainzy-mint/20 border-brainzy-mint/50 shadow-sm'
                            : 'bg-white/60 hover:bg-brainzy-mint/10 border-white/50 hover:border-brainzy-mint/30'
                        }`}
                        data-testid={`quiz-option-${index}`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-6 h-6 border-2 rounded-full flex items-center justify-center ${
                            selectedAnswers[currentQuestionIndex] === index
                              ? 'border-brainzy-mint bg-brainzy-mint'
                              : 'border-gray-300'
                          }`}>
                            {selectedAnswers[currentQuestionIndex] === index && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <span>{String.fromCharCode(65 + index)}) {option}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={previousQuestion}
                    disabled={currentQuestionIndex === 0}
                    data-testid="button-previous-question"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={nextQuestion}
                    disabled={selectedAnswers[currentQuestionIndex] === undefined}
                    className="bg-gradient-to-r from-brainzy-mint to-brainzy-yellow hover:shadow-lg"
                    data-testid="button-next-question"
                  >
                    {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Quiz Progress Sidebar */}
        <div className="space-y-6">
          <Card className="bg-white/70 backdrop-blur-sm shadow-lg border border-white/50">
            <CardContent className="p-4">
              <h3 className="font-medium text-gray-800 mb-4 flex items-center space-x-2">
                <TrendingUp className="text-brainzy-coral" />
                <span>Quiz Progress</span>
              </h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Answered</span>
                    <span className="font-semibold text-brainzy-mint">
                      {selectedAnswers.filter(a => a !== undefined).length}/{questions.length}
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
                
                <div className="grid grid-cols-5 gap-1">
                  {questions.map((_, index) => (
                    <div
                      key={index}
                      className={`w-8 h-2 rounded-full ${
                        index === currentQuestionIndex
                          ? 'bg-brainzy-yellow'
                          : selectedAnswers[index] !== undefined
                          ? 'bg-brainzy-mint'
                          : 'bg-gray-200'
                      }`}
                      data-testid={`progress-indicator-${index}`}
                    />
                  ))}
                </div>
                
                {selectedAnswers.filter(a => a !== undefined).length > 0 && (
                  <div className="text-center">
                    <span className="text-sm text-gray-600">
                      Current answers: {correctAnswers} correct
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showResult && currentQuiz) {
    const questions = currentQuiz.questions as QuizQuestion[];
    const correctCount = selectedAnswers.filter((answer, index) => 
      answer === questions[index]?.correctAnswer
    ).length;
    const score = Math.round((correctCount / questions.length) * 100);

    return (
      <div className="max-w-2xl mx-auto">
        <Card className="bg-white/70 backdrop-blur-sm shadow-lg border border-white/50">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              {score >= 80 ? (
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
              ) : score >= 60 ? (
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HelpCircle className="w-10 h-10 text-yellow-500" />
                </div>
              ) : (
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-10 h-10 text-red-500" />
                </div>
              )}
              
              <h2 className="font-display font-bold text-2xl text-gray-800 mb-2">
                Quiz Completed! 🎉
              </h2>
              <p className="text-gray-600">You scored {score}% on {currentQuiz.title}</p>
            </div>
            
            <div className="bg-brainzy-light/30 rounded-xl p-6 mb-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-brainzy-mint" data-testid="result-score">
                    {score}%
                  </div>
                  <div className="text-sm text-gray-600">Score</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-brainzy-purple" data-testid="result-correct">
                    {correctCount}
                  </div>
                  <div className="text-sm text-gray-600">Correct</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-brainzy-coral" data-testid="result-total">
                    {questions.length}
                  </div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={exitQuiz}
                className="flex-1"
                data-testid="button-back-to-quizzes"
              >
                Back to Quizzes
              </Button>
              <Button
                onClick={() => startQuiz(currentQuiz)}
                className="flex-1 bg-gradient-to-r from-brainzy-mint to-brainzy-yellow"
                data-testid="button-retake-quiz"
              >
                Retake Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card className="bg-white/70 backdrop-blur-sm shadow-lg border border-white/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-semibold text-xl text-gray-800 flex items-center space-x-2">
                <HelpCircle className="text-brainzy-mint" />
                <span>Available Quizzes</span>
              </h2>
            </div>
            
            {/* Generate from Documents */}
            {documents && documents.length > 0 && (
              <div className="mb-6 p-4 bg-brainzy-light/30 rounded-xl">
                <h3 className="font-medium text-gray-800 mb-3">Generate Quiz from Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {documents.slice(0, 4).map((doc) => (
                    <Button
                      key={doc.id}
                      variant="outline"
                      className="justify-start text-left h-auto p-3"
                      onClick={() => generateQuizMutation.mutate({ documentId: doc.id, questionCount: 10 })}
                      disabled={generateQuizMutation.isPending}
                      data-testid={`button-generate-quiz-${doc.id}`}
                    >
                      <div>
                        <div className="font-medium text-sm">{doc.title}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {generateQuizMutation.isPending ? "Generating..." : "Generate 10 questions"}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Quiz List */}
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 rounded-lg h-24"></div>
                  </div>
                ))}
              </div>
            ) : quizzes && quizzes.length > 0 ? (
              <div className="space-y-4">
                {quizzes.map((quiz) => {
                  const questions = quiz.questions as QuizQuestion[];
                  const bestScore = getQuizScore(quiz.id);
                  
                  return (
                    <div
                      key={quiz.id}
                      className="bg-white/60 rounded-xl p-4 border border-white/50 hover:bg-white/80 transition-colors"
                      data-testid={`quiz-item-${quiz.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium text-gray-800">{quiz.title}</h3>
                            {bestScore !== null && (
                              <Badge className="bg-brainzy-mint/20 text-brainzy-mint">
                                Best: {bestScore}%
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{quiz.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>{questions.length} questions</span>
                            {quiz.timeLimit && <span>{quiz.timeLimit} min</span>}
                            <span>Medium difficulty</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => startQuiz(quiz)}
                          className="ml-4 bg-gradient-to-r from-brainzy-mint to-brainzy-yellow hover:shadow-lg"
                          data-testid={`button-start-quiz-${quiz.id}`}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Start Quiz
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <HelpCircle className="mx-auto mb-4 text-gray-400" size={64} />
                <h3 className="text-lg font-medium mb-2">No quizzes available</h3>
                <p className="mb-4">Generate your first quiz from uploaded documents!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Quiz Stats Sidebar */}
      <div className="space-y-6">
        <Card className="bg-white/70 backdrop-blur-sm shadow-lg border border-white/50">
          <CardContent className="p-4">
            <h3 className="font-medium text-gray-800 mb-4 flex items-center space-x-2">
              <TrendingUp className="text-brainzy-coral" />
              <span>Quiz Statistics</span>
            </h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Quizzes Taken</span>
                <span className="font-semibold text-brainzy-purple" data-testid="stat-quizzes-taken">
                  {quizAttempts?.length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Average Score</span>
                <span className="font-semibold text-brainzy-mint" data-testid="stat-average-score">
                  {quizAttempts?.length ? 
                    Math.round(quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / quizAttempts.length) + '%' 
                    : '0%'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Best Score</span>
                <span className="font-semibold text-brainzy-coral" data-testid="stat-best-score">
                  {quizAttempts?.length ? 
                    Math.max(...quizAttempts.map(attempt => attempt.score)) + '%' 
                    : '0%'
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Recent Quiz Results */}
        {quizAttempts && quizAttempts.length > 0 && (
          <Card className="bg-white/70 backdrop-blur-sm shadow-lg border border-white/50">
            <CardContent className="p-4">
              <h3 className="font-medium text-gray-800 mb-4">Recent Results</h3>
              
              <div className="space-y-3">
                {quizAttempts.slice(-3).reverse().map((attempt) => {
                  const quiz = quizzes?.find(q => q.id === attempt.quizId);
                  return (
                    <div
                      key={attempt.id}
                      className="bg-white/50 rounded-lg p-3"
                      data-testid={`recent-attempt-${attempt.id}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-medium text-gray-800 text-sm line-clamp-1">
                          {quiz?.title || 'Quiz'}
                        </h4>
                        <Badge className={`text-xs ${
                          attempt.score >= 80 ? 'bg-green-100 text-green-800' :
                          attempt.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {attempt.score}%
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">
                        {attempt.score}/{attempt.totalQuestions} correct • {' '}
                        {attempt.completedAt ? new Date(attempt.completedAt).toLocaleDateString() : 'Unknown date'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
