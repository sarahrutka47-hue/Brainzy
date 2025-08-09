import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MessageCircle, Send, Bot, User, BookOpen, Sparkles } from "lucide-react";
import type { ChatMessage, Document } from "@shared/schema";

interface ChatAssistantProps {
  selectedDocument?: string | null;
}

export default function ChatAssistant({ selectedDocument }: ChatAssistantProps) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: chatMessages, isLoading } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chat', selectedDocument],
    enabled: !!selectedDocument,
  });

  const { data: documents } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, documentId }: { message: string; documentId: string }) => {
      setIsTyping(true);
      return await apiRequest('POST', '/api/chat', { message, documentId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat', selectedDocument] });
      setMessage("");
      setIsTyping(false);
    },
    onError: (error: any) => {
      setIsTyping(false);
      toast({
        title: "Chat error 😞",
        description: error.message || "Failed to send message.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!message.trim() || !selectedDocument) return;
    
    sendMessageMutation.mutate({
      message: message.trim(),
      documentId: selectedDocument,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isTyping]);

  const selectedDocumentData = documents?.find(doc => doc.id === selectedDocument);

  const suggestedQuestions = [
    "Can you summarize the main points?",
    "What are the key concepts I should remember?",
    "Explain this topic in simpler terms",
    "What questions might be on a test about this?",
    "Give me examples to help understand this better"
  ];

  return (
    <Card className="bg-white/70 backdrop-blur-sm shadow-lg border border-white/50 h-[500px] flex flex-col">
      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-brainzy-pink to-brainzy-purple rounded-full flex items-center justify-center">
            <MessageCircle className="text-white" size={16} />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-800">Chat Assistant</h3>
            {selectedDocumentData && (
              <p className="text-xs text-gray-500 line-clamp-1">
                Discussing: {selectedDocumentData.title}
              </p>
            )}
          </div>
        </div>

        {!selectedDocument ? (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <Bot className="mx-auto mb-3 text-gray-400" size={48} />
              <h4 className="font-medium text-gray-700 mb-2">AI Study Assistant</h4>
              <p className="text-sm text-gray-500 mb-4">
                Select a document or note to start chatting with your AI study buddy!
              </p>
              <div className="flex items-center space-x-1 text-xs text-brainzy-mint">
                <Sparkles size={12} />
                <span>Powered by AI</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Messages Area */}
            <ScrollArea className="flex-1 mb-4 pr-2" data-testid="chat-messages">
              <div className="space-y-3">
                {/* Welcome Message */}
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-brainzy-yellow to-brainzy-coral rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot size={12} className="text-white" />
                  </div>
                  <div className="bg-brainzy-light/50 rounded-lg p-3 max-w-[85%]">
                    <p className="text-sm text-gray-700">
                      Hi! I'm here to help you understand your study materials. Ask me anything about "
                      <span className="font-medium">{selectedDocumentData?.title}</span>"! 📚
                    </p>
                  </div>
                </div>

                {/* Chat Messages */}
                {isLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brainzy-pink"></div>
                  </div>
                ) : chatMessages && chatMessages.length > 0 ? (
                  chatMessages.map((msg) => (
                    <div key={msg.id}>
                      {/* User Message */}
                      <div className="flex items-start space-x-2 justify-end mb-2">
                        <div className="bg-white/50 rounded-lg p-3 max-w-[85%]">
                          <p className="text-sm text-gray-700">{msg.message}</p>
                        </div>
                        <div className="w-6 h-6 bg-brainzy-mint rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <User size={12} className="text-white" />
                        </div>
                      </div>
                      
                      {/* AI Response */}
                      <div className="flex items-start space-x-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-brainzy-yellow to-brainzy-coral rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <Bot size={12} className="text-white" />
                        </div>
                        <div className="bg-brainzy-light/50 rounded-lg p-3 max-w-[85%]">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.response}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <BookOpen className="mx-auto mb-2 text-gray-400" size={32} />
                    <p className="text-sm text-gray-500 mb-3">
                      No conversation yet. Try asking one of these questions:
                    </p>
                    <div className="space-y-2">
                      {suggestedQuestions.slice(0, 3).map((question, index) => (
                        <button
                          key={index}
                          onClick={() => setMessage(question)}
                          className="block w-full text-left text-xs bg-white/50 hover:bg-white/70 rounded-lg p-2 transition-colors"
                          data-testid={`suggested-question-${index}`}
                        >
                          "{question}"
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex items-start space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-brainzy-yellow to-brainzy-coral rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot size={12} className="text-white" />
                    </div>
                    <div className="bg-brainzy-light/50 rounded-lg p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-brainzy-pink rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-brainzy-purple rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-brainzy-mint rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="flex space-x-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about this document..."
                className="flex-1 text-sm"
                disabled={sendMessageMutation.isPending}
                data-testid="chat-input"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || sendMessageMutation.isPending}
                size="sm"
                className="bg-brainzy-pink hover:bg-brainzy-coral text-white px-3"
                data-testid="button-send-message"
              >
                <Send size={16} />
              </Button>
            </div>

            {/* Quick Actions */}
            {chatMessages?.length === 0 && !isLoading && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
                <div className="flex flex-wrap gap-1">
                  {suggestedQuestions.slice(0, 2).map((question, index) => (
                    <button
                      key={index}
                      onClick={() => setMessage(question)}
                      className="text-xs bg-brainzy-mint/20 text-brainzy-mint hover:bg-brainzy-mint/30 rounded-full px-2 py-1 transition-colors"
                      data-testid={`quick-question-${index}`}
                    >
                      {question.length > 25 ? question.substring(0, 25) + '...' : question}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
