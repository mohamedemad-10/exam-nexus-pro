import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Eye, Edit, Save, Trash2, BookOpen, CheckCircle, XCircle, Loader2, Clock, FileText, ArrowLeft, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/integrations/supabase/types";

type Exam = Database['public']['Tables']['exams']['Row'];
type Question = Database['public']['Tables']['questions']['Row'];
type Passage = Database['public']['Tables']['passages']['Row'];

interface ExamPreviewProps {
  exam: Exam;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export const ExamPreview = ({ exam, open, onOpenChange, onUpdate }: ExamPreviewProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [passages, setPassages] = useState<Passage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isActive, setIsActive] = useState(exam.is_active);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadData();
      setIsActive(exam.is_active);
    }
  }, [open, exam.id]);

  const loadData = async () => {
    setLoading(true);
    const [questionsRes, passagesRes] = await Promise.all([
      supabase.from('questions').select('*').eq('exam_id', exam.id).order('order_index'),
      supabase.from('passages').select('*').eq('exam_id', exam.id).order('order_index'),
    ]);
    
    if (questionsRes.data) setQuestions(questionsRes.data);
    if (passagesRes.data) setPassages(passagesRes.data);
    setLoading(false);
  };

  const handleUpdateQuestion = async (question: Question) => {
    setSaving(true);
    const { error } = await supabase
      .from('questions')
      .update({
        question_text: question.question_text,
        option_a: question.option_a,
        option_b: question.option_b,
        option_c: question.option_c,
        option_d: question.option_d,
        correct_answer: question.correct_answer,
      })
      .eq('id', question.id);

    if (error) {
      toast.error("Failed to update question");
    } else {
      toast.success("Question updated");
      setEditingQuestion(null);
      await loadData();
      onUpdate();
    }
    setSaving(false);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Delete this question?")) return;
    
    const { error } = await supabase.from('questions').delete().eq('id', questionId);
    if (error) {
      toast.error("Failed to delete question");
    } else {
      toast.success("Question deleted");
      await loadData();
      onUpdate();
    }
  };

  const handlePublishToggle = async () => {
    setSaving(true);
    const newStatus = !isActive;
    
    const { error } = await supabase
      .from('exams')
      .update({ is_active: newStatus })
      .eq('id', exam.id);

    if (error) {
      toast.error("Failed to update exam status");
    } else {
      setIsActive(newStatus);
      toast.success(newStatus ? "Exam published!" : "Exam unpublished");
      onUpdate();
    }
    setSaving(false);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const currentPassage = currentQuestion?.passage_id 
    ? passages.find(p => p.id === currentQuestion.passage_id) 
    : null;

  const getQuestionType = (q: Question) => {
    if (q.option_a === 'True' && q.option_b === 'False') return 'True/False';
    if (!q.option_c && !q.option_d) return '2 Choices';
    return '4 Choices';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-primary/30 max-w-4xl mx-2 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="font-display text-xl flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Exam Preview
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{exam.title}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="publish-toggle" className="text-sm">
                  {isActive ? 'Published' : 'Draft'}
                </Label>
                <Switch
                  id="publish-toggle"
                  checked={isActive}
                  onCheckedChange={handlePublishToggle}
                  disabled={saving}
                />
              </div>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">No questions in this exam yet</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Exam Info */}
            <div className="flex flex-wrap gap-3 mb-4 p-3 bg-muted/20 rounded-lg">
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {exam.duration_minutes} min
              </Badge>
              <Badge variant="outline">Pass: {exam.passing_score}%</Badge>
              <Badge variant="outline">{questions.length} questions</Badge>
              <Badge variant="outline">{passages.length} passages</Badge>
              {isActive ? (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  <CheckCircle className="w-3 h-3 mr-1" /> Published
                </Badge>
              ) : (
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                  <XCircle className="w-3 h-3 mr-1" /> Draft
                </Badge>
              )}
            </div>

            {/* Question Navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Prev
              </Button>
              <span className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                disabled={currentQuestionIndex === questions.length - 1}
              >
                Next <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {/* Question Grid */}
            <div className="flex flex-wrap gap-1 mb-4">
              {questions.map((q, idx) => (
                <Button
                  key={q.id}
                  variant={idx === currentQuestionIndex ? "default" : "outline"}
                  size="sm"
                  className="w-8 h-8 p-0 text-xs"
                  onClick={() => setCurrentQuestionIndex(idx)}
                >
                  {idx + 1}
                </Button>
              ))}
            </div>

            {/* Current Question */}
            {currentQuestion && (
              <Card className="glass-card border-primary/30">
                {currentPassage && (
                  <div className="p-4 bg-secondary/10 border-b border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-4 h-4 text-secondary" />
                      <span className="text-sm font-medium text-secondary">{currentPassage.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">
                      {currentPassage.content}
                    </p>
                  </div>
                )}
                
                <CardContent className="p-4">
                  {editingQuestion?.id === currentQuestion.id ? (
                    <div className="space-y-4">
                      <div>
                        <Label>Question Text</Label>
                        <Textarea
                          value={editingQuestion.question_text}
                          onChange={(e) => setEditingQuestion({...editingQuestion, question_text: e.target.value})}
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Option A</Label>
                          <Input
                            value={editingQuestion.option_a}
                            onChange={(e) => setEditingQuestion({...editingQuestion, option_a: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label>Option B</Label>
                          <Input
                            value={editingQuestion.option_b}
                            onChange={(e) => setEditingQuestion({...editingQuestion, option_b: e.target.value})}
                          />
                        </div>
                        {editingQuestion.option_c && (
                          <div>
                            <Label>Option C</Label>
                            <Input
                              value={editingQuestion.option_c}
                              onChange={(e) => setEditingQuestion({...editingQuestion, option_c: e.target.value})}
                            />
                          </div>
                        )}
                        {editingQuestion.option_d && (
                          <div>
                            <Label>Option D</Label>
                            <Input
                              value={editingQuestion.option_d}
                              onChange={(e) => setEditingQuestion({...editingQuestion, option_d: e.target.value})}
                            />
                          </div>
                        )}
                      </div>
                      <div>
                        <Label>Correct Answer</Label>
                        <Select 
                          value={editingQuestion.correct_answer} 
                          onValueChange={(v) => setEditingQuestion({...editingQuestion, correct_answer: v})}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A">A</SelectItem>
                            <SelectItem value="B">B</SelectItem>
                            {editingQuestion.option_c && <SelectItem value="C">C</SelectItem>}
                            {editingQuestion.option_d && <SelectItem value="D">D</SelectItem>}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => handleUpdateQuestion(editingQuestion)} disabled={saving}>
                          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                          Save
                        </Button>
                        <Button variant="outline" onClick={() => setEditingQuestion(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <Badge variant="outline" className="mb-2">{getQuestionType(currentQuestion)}</Badge>
                          <p className="text-base font-medium">{currentQuestion.question_text}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setEditingQuestion(currentQuestion)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteQuestion(currentQuestion.id)} className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {[
                          { label: 'A', value: currentQuestion.option_a },
                          { label: 'B', value: currentQuestion.option_b },
                          { label: 'C', value: currentQuestion.option_c },
                          { label: 'D', value: currentQuestion.option_d },
                        ].filter(opt => opt.value).map(opt => (
                          <div 
                            key={opt.label}
                            className={`p-3 rounded-lg border ${
                              currentQuestion.correct_answer === opt.label 
                                ? 'border-green-500 bg-green-500/10' 
                                : 'border-border/50 bg-muted/20'
                            }`}
                          >
                            <span className={`font-bold mr-2 ${
                              currentQuestion.correct_answer === opt.label ? 'text-green-400' : 'text-muted-foreground'
                            }`}>
                              {opt.label}.
                            </span>
                            {opt.value}
                            {currentQuestion.correct_answer === opt.label && (
                              <CheckCircle className="w-4 h-4 text-green-400 inline ml-2" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
