import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { StickyNote, Filter, Plus, MessageCircle, Edit, Save } from "lucide-react";
import ChatAssistant from "./chat-assistant";
import type { Note, Document } from "@shared/schema";

export default function NotesSection() {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notes, isLoading } = useQuery<Note[]>({
    queryKey: ['/api/notes'],
  });

  const { data: documents } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
  });

  const createNoteMutation = useMutation({
    mutationFn: async (noteData: { title: string; content: string; subject?: string }) => {
      return await apiRequest('POST', '/api/notes', noteData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      toast({
        title: "Note created! 📝",
        description: "Your new note has been saved.",
      });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Note> }) => {
      return await apiRequest('PUT', `/api/notes/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      setIsEditing(false);
      toast({
        title: "Note updated! ✨",
        description: "Your changes have been saved.",
      });
    },
  });

  const generateNoteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      return await apiRequest('POST', '/api/notes/generate', { documentId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      toast({
        title: "AI note generated! 🤖",
        description: "Your smart notes are ready for review.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation failed 😞",
        description: error.message || "Failed to generate notes.",
        variant: "destructive",
      });
    },
  });

  const handleEditStart = (note: Note) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!selectedNote) return;
    
    updateNoteMutation.mutate({
      id: selectedNote.id,
      updates: {
        title: editTitle,
        content: editContent,
        wordCount: editContent.split(' ').length,
      },
    });
  };

  const subjectColors = {
    Biology: "bg-green-100 text-green-800",
    Chemistry: "bg-purple-100 text-purple-800",
    Physics: "bg-blue-100 text-blue-800",
    Math: "bg-orange-100 text-orange-800",
    History: "bg-yellow-100 text-yellow-800",
    General: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Notes List */}
      <div className="lg:col-span-3">
        <Card className="bg-white/70 backdrop-blur-sm shadow-lg border border-white/50 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-semibold text-xl text-gray-800 flex items-center space-x-2">
                <StickyNote className="text-brainzy-pink" />
                <span>Your Notes</span>
              </h2>
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  className="bg-brainzy-mint/20 text-brainzy-mint border-brainzy-mint/30 hover:bg-brainzy-mint/30"
                  data-testid="button-filter-notes"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button 
                  className="bg-gradient-to-r from-brainzy-pink to-brainzy-coral hover:shadow-lg"
                  onClick={() => createNoteMutation.mutate({ 
                    title: "New Note", 
                    content: "Start writing your notes here...",
                    subject: "General"
                  })}
                  data-testid="button-new-note"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Note
                </Button>
              </div>
            </div>
            
            {/* Generate from Documents */}
            {documents && documents.length > 0 && (
              <div className="mb-6 p-4 bg-brainzy-light/30 rounded-xl">
                <h3 className="font-medium text-gray-800 mb-3">Generate Notes from Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {documents.slice(0, 4).map((doc) => (
                    <Button
                      key={doc.id}
                      variant="outline"
                      className="justify-start text-left h-auto p-3"
                      onClick={() => generateNoteMutation.mutate(doc.id)}
                      disabled={generateNoteMutation.isPending}
                      data-testid={`button-generate-note-${doc.id}`}
                    >
                      <div>
                        <div className="font-medium text-sm">{doc.title}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {generateNoteMutation.isPending ? "Generating..." : "Click to generate notes"}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Notes Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 rounded-xl h-48 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : notes && notes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="card-hover bg-white/60 rounded-xl p-4 border border-white/50 cursor-pointer"
                    onClick={() => setSelectedNote(note)}
                    data-testid={`note-card-${note.id}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-brainzy-pink rounded-full"></div>
                        <Badge 
                          className={subjectColors[note.subject as keyof typeof subjectColors] || subjectColors.General}
                        >
                          {note.subject || "General"}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditStart(note);
                        }}
                        className="text-gray-400 hover:text-brainzy-pink"
                        data-testid={`button-edit-note-${note.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <h3 className="font-medium text-gray-800 mb-2 line-clamp-2">{note.title}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                      {note.content.substring(0, 120)}...
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{note.updatedAt ? new Date(note.updatedAt).toLocaleDateString() : 'Unknown date'}</span>
                      <span>{note.wordCount} words</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <StickyNote className="mx-auto mb-4 text-gray-400" size={64} />
                <h3 className="text-lg font-medium mb-2">No notes yet</h3>
                <p className="mb-4">Create your first note or generate one from uploaded documents!</p>
                <Button 
                  className="bg-gradient-to-r from-brainzy-pink to-brainzy-coral"
                  onClick={() => createNoteMutation.mutate({ 
                    title: "My First Note", 
                    content: "Welcome to Brainzy! Start taking notes here...",
                    subject: "General"
                  })}
                  data-testid="button-create-first-note"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Note
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Note Editor Modal */}
        {isEditing && selectedNote && (
          <Card className="bg-white/90 backdrop-blur-sm shadow-xl border border-white/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-lg">Edit Note</h3>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    data-testid="button-cancel-edit"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveEdit}
                    disabled={updateNoteMutation.isPending}
                    className="bg-gradient-to-r from-brainzy-pink to-brainzy-coral"
                    data-testid="button-save-note"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateNoteMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Note title"
                  className="font-medium"
                  data-testid="input-note-title"
                />
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Write your notes here..."
                  className="min-h-[300px] resize-none"
                  data-testid="textarea-note-content"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Chat Assistant Sidebar */}
      <div className="space-y-6">
        <ChatAssistant selectedDocument={selectedNote?.documentId} />
      </div>
    </div>
  );
}
