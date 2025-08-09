import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FileText, Mic, Youtube, Upload, History, Bot, BarChart3 } from "lucide-react";
import type { Document } from "@shared/schema";

export default function UploadSection() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return await apiRequest('POST', '/api/documents/upload', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      setUploadProgress(0);
      toast({
        title: "Upload successful! 🎉",
        description: "Your document has been processed and is ready for study materials.",
      });
    },
    onError: () => {
      setUploadProgress(0);
      toast({
        title: "Upload failed 😞",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const processYoutubeMutation = useMutation({
    mutationFn: async (url: string) => {
      return await apiRequest('POST', '/api/documents/youtube', { url });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      setYoutubeUrl("");
      toast({
        title: "YouTube video processed! 🎬",
        description: "Transcript extracted and ready for notes generation.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Processing failed 😞",
        description: error.message || "Failed to process YouTube video.",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Simulate upload progress
    setUploadProgress(10);
    setTimeout(() => setUploadProgress(50), 500);
    setTimeout(() => setUploadProgress(80), 1000);
    
    uploadDocumentMutation.mutate(file);
  };

  const handleYoutubeSubmit = () => {
    if (!youtubeUrl.trim()) {
      toast({
        title: "URL required",
        description: "Please enter a YouTube URL",
        variant: "destructive",
      });
      return;
    }
    processYoutubeMutation.mutate(youtubeUrl);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Upload Options */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="bg-white/70 backdrop-blur-sm shadow-lg border border-white/50">
          <CardContent className="p-6">
            <h2 className="font-display font-semibold text-xl text-gray-800 mb-4 flex items-center space-x-2">
              <Upload className="text-brainzy-pink" />
              <span>Upload Your Content</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Document Upload */}
              <label className="card-hover bg-gradient-to-br from-brainzy-pink/10 to-brainzy-coral/10 rounded-xl p-6 border-2 border-dashed border-brainzy-pink/30 cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileUpload}
                  data-testid="input-file-upload"
                />
                <div className="text-center">
                  <FileText className="text-3xl text-brainzy-pink mb-3 mx-auto" size={32} />
                  <h3 className="font-medium text-gray-800 mb-2">Documents</h3>
                  <p className="text-sm text-gray-600">PDF, DOCX, TXT files</p>
                </div>
              </label>
              
              {/* Audio Upload */}
              <label className="card-hover bg-gradient-to-br from-brainzy-purple/10 to-brainzy-lavender/10 rounded-xl p-6 border-2 border-dashed border-brainzy-purple/30 cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  accept="audio/*"
                  data-testid="input-audio-upload"
                />
                <div className="text-center">
                  <Mic className="text-3xl text-brainzy-purple mb-3 mx-auto" size={32} />
                  <h3 className="font-medium text-gray-800 mb-2">Audio</h3>
                  <p className="text-sm text-gray-600">Record or upload MP3</p>
                </div>
              </label>
              
              {/* YouTube */}
              <div className="card-hover bg-gradient-to-br from-brainzy-mint/10 to-brainzy-yellow/10 rounded-xl p-6 border-2 border-dashed border-brainzy-mint/30">
                <div className="text-center">
                  <Youtube className="text-3xl text-brainzy-mint mb-3 mx-auto" size={32} />
                  <h3 className="font-medium text-gray-800 mb-2">YouTube</h3>
                  <p className="text-sm text-gray-600">Paste video URL</p>
                </div>
              </div>
            </div>
            
            {/* YouTube URL Input */}
            <div className="bg-brainzy-light/50 rounded-xl p-4">
              <div className="flex space-x-3">
                <Input
                  type="url"
                  placeholder="Paste YouTube URL here..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="flex-1"
                  data-testid="input-youtube-url"
                />
                <Button
                  onClick={handleYoutubeSubmit}
                  disabled={processYoutubeMutation.isPending}
                  className="bg-gradient-to-r from-brainzy-pink to-brainzy-coral hover:shadow-lg"
                  data-testid="button-process-youtube"
                >
                  <span className="mr-2">✨</span>
                  {processYoutubeMutation.isPending ? "Processing..." : "Generate"}
                </Button>
              </div>
            </div>

            {/* Upload Progress */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Recent Uploads */}
        <Card className="bg-white/70 backdrop-blur-sm shadow-lg border border-white/50">
          <CardContent className="p-6">
            <h3 className="font-display font-semibold text-lg text-gray-800 mb-4 flex items-center space-x-2">
              <History className="text-brainzy-mint" />
              <span>Recent Uploads</span>
            </h3>
            
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center space-x-3 p-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : documents && documents.length > 0 ? (
              <div className="space-y-3">
                {documents.slice(0, 5).map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center space-x-3 p-3 bg-white/50 rounded-lg hover:bg-white/70 transition-colors cursor-pointer"
                    data-testid={`document-item-${doc.id}`}
                  >
                    <div className="w-10 h-10 bg-brainzy-pink/20 rounded-lg flex items-center justify-center">
                      <FileText className="text-brainzy-pink" size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{doc.title}</p>
                      <p className="text-sm text-gray-500">
                        {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'Unknown date'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-brainzy-mint/20 text-brainzy-mint px-2 py-1 rounded-full">
                        {doc.type.toUpperCase()}
                      </span>
                      <span className="text-gray-400">→</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Upload className="mx-auto mb-3 text-gray-400" size={48} />
                <p>No uploads yet. Upload your first document to get started!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Actions Sidebar */}
      <div className="space-y-6">
        {/* AI Assistant */}
        <Card className="bg-white/70 backdrop-blur-sm shadow-lg border border-white/50">
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-brainzy-yellow to-brainzy-coral rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce-gentle">
                <Bot className="text-white" size={28} />
              </div>
              <h3 className="font-display font-semibold text-lg text-gray-800">AI Study Buddy</h3>
              <p className="text-sm text-gray-600 mt-1">Ready to help you learn!</p>
            </div>
            <Button 
              className="w-full bg-gradient-to-r from-brainzy-yellow to-brainzy-coral hover:shadow-lg"
              data-testid="button-start-chat"
            >
              Start Chatting
            </Button>
          </CardContent>
        </Card>
        
        {/* Quick Stats */}
        <Card className="bg-white/70 backdrop-blur-sm shadow-lg border border-white/50">
          <CardContent className="p-6">
            <h3 className="font-display font-semibold text-lg text-gray-800 mb-4 flex items-center space-x-2">
              <BarChart3 className="text-brainzy-purple" />
              <span>Today's Progress</span>
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Documents Uploaded</span>
                <span className="font-semibold text-brainzy-pink" data-testid="stat-documents">
                  {documents?.length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Notes Created</span>
                <span className="font-semibold text-brainzy-purple" data-testid="stat-notes">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Study Sessions</span>
                <span className="font-semibold text-brainzy-mint" data-testid="stat-sessions">0</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
