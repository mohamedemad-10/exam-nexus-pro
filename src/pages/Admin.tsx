import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase, checkIsAdmin } from "@/lib/supabase";
import { 
  Brain, ArrowLeft, Plus, Trash2, Edit, Save, BookOpen, 
  Users, BarChart3, Clock, Shield 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Database } from "@/integrations/supabase/types";

type Exam = Database['public']['Tables']['exams']['Row'];
type Question = Database['public']['Tables']['questions']['Row'];

const Admin = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExamDialog, setShowExamDialog] = useState(false);
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [deleteExamId, setDeleteExamId] = useState<string | null>(null);
  
  // Form states
  const [examForm, setExamForm] = useState({
    title: '',
    description: '',
    duration_minutes: 60,
    passing_score: 70,
  });
  
  const [questionForms, setQuestionForms] = useState([{
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A',
  }]);

  useEffect(() => {
    const checkAuthAndAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      const isAdmin = await checkIsAdmin(session.user.id);
      if (!isAdmin) {
        toast.error("Access denied. Admin privileges required.");
        navigate('/dashboard');
        return;
      }

      setUser(session.user);
      await loadExams();
      setLoading(false);
    };

    checkAuthAndAdmin();
  }, [navigate]);

  const loadExams = async () => {
    const { data } = await supabase
      .from('exams')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setExams(data);
  };

  const loadQuestions = async (examId: string) => {
    const { data } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', examId)
      .order('order_index', { ascending: true });

    if (data) setQuestions(data);
  };

  const handleCreateExam = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('exams')
      .insert({
        ...examForm,
        created_by: user.id,
      });

    if (error) {
      toast.error("Failed to create exam");
    } else {
      toast.success("Exam created successfully");
      setShowExamDialog(false);
      setExamForm({
        title: '',
        description: '',
        duration_minutes: 60,
        passing_score: 70,
      });
      await loadExams();
    }
  };

  const handleAddQuestions = async () => {
    if (!selectedExam) return;

    // Filter out empty questions
    const validQuestions = questionForms.filter(q => 
      q.question_text.trim() && q.option_a.trim() && q.option_b.trim() && 
      q.option_c.trim() && q.option_d.trim()
    );

    if (validQuestions.length === 0) {
      toast.error("Please fill in at least one complete question");
      return;
    }

    const questionsToInsert = validQuestions.map((q, index) => ({
      ...q,
      exam_id: selectedExam.id,
      order_index: questions.length + index,
    }));

    const { error } = await supabase
      .from('questions')
      .insert(questionsToInsert);

    if (error) {
      toast.error("Failed to add questions");
    } else {
      toast.success(`${validQuestions.length} question(s) added successfully`);
      setShowQuestionDialog(false);
      setQuestionForms([{
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_answer: 'A',
      }]);
      await loadQuestions(selectedExam.id);
    }
  };

  const addQuestionSlot = () => {
    setQuestionForms([...questionForms, {
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'A',
    }]);
  };

  const removeQuestionSlot = (index: number) => {
    if (questionForms.length === 1) return;
    setQuestionForms(questionForms.filter((_, i) => i !== index));
  };

  const updateQuestionForm = (index: number, field: string, value: string) => {
    const updated = [...questionForms];
    updated[index] = { ...updated[index], [field]: value };
    setQuestionForms(updated);
  };

  const handleDeleteExam = async (examId: string) => {
    const { error } = await supabase
      .from('exams')
      .delete()
      .eq('id', examId);

    if (error) {
      toast.error("Failed to delete exam");
    } else {
      toast.success("Exam deleted successfully");
      await loadExams();
      if (selectedExam?.id === examId) {
        setSelectedExam(null);
        setQuestions([]);
      }
    }
    setDeleteExamId(null);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', questionId);

    if (error) {
      toast.error("Failed to delete question");
    } else {
      toast.success("Question deleted successfully");
      if (selectedExam) await loadQuestions(selectedExam.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center animated-bg">
        <Brain className="w-16 h-16 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-bg pb-20">
      {/* Header */}
      <header className="glass-card border-b border-primary/20 sticky top-0 z-50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/dashboard')}
                variant="ghost"
                className="hover:bg-primary/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-secondary pulse-glow" />
                <h1 className="text-2xl font-display gradient-text">Admin Panel</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="glass-card border-primary/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Exams</CardTitle>
                <BookOpen className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-display gradient-text">{exams.length}</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Exams List */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-display">Exams</h2>
              <Dialog open={showExamDialog} onOpenChange={setShowExamDialog}>
                <DialogTrigger asChild>
                  <Button className="btn-glow bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Exam
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-card border-primary/30">
                  <DialogHeader>
                    <DialogTitle className="font-display text-2xl">Create New Exam</DialogTitle>
                    <DialogDescription>
                      Add a new exam to your platform
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={examForm.title}
                        onChange={(e) => setExamForm({...examForm, title: e.target.value})}
                        placeholder="JavaScript Fundamentals"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={examForm.description}
                        onChange={(e) => setExamForm({...examForm, description: e.target.value})}
                        placeholder="Test your knowledge of JavaScript basics"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Duration (minutes)</Label>
                        <Input
                          type="number"
                          value={examForm.duration_minutes}
                          onChange={(e) => setExamForm({...examForm, duration_minutes: parseInt(e.target.value)})}
                        />
                      </div>
                      <div>
                        <Label>Passing Score (%)</Label>
                        <Input
                          type="number"
                          value={examForm.passing_score}
                          onChange={(e) => setExamForm({...examForm, passing_score: parseInt(e.target.value)})}
                        />
                      </div>
                    </div>
                    <Button onClick={handleCreateExam} className="w-full btn-glow bg-primary hover:bg-primary/90">
                      <Save className="w-4 h-4 mr-2" />
                      Create Exam
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {exams.map((exam) => (
                <Card 
                  key={exam.id}
                  className={`glass-card cursor-pointer transition-all ${
                    selectedExam?.id === exam.id 
                      ? 'border-primary/50 shadow-glow-cyan' 
                      : 'border-primary/20 hover:border-primary/40'
                  }`}
                  onClick={() => {
                    setSelectedExam(exam);
                    loadQuestions(exam.id);
                  }}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="font-display">{exam.title}</CardTitle>
                        <CardDescription className="line-clamp-2">{exam.description}</CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteExamId(exam.id);
                        }}
                        className="text-destructive hover:bg-destructive/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {exam.duration_minutes} mins
                      </div>
                      <div className="flex items-center gap-1">
                        <BarChart3 className="w-4 h-4" />
                        Pass: {exam.passing_score}%
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Questions Panel */}
          <div>
            {selectedExam ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-display">Questions</h2>
                  <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
                    <DialogTrigger asChild>
                      <Button className="btn-glow bg-secondary hover:bg-secondary/90">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Question
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-card border-primary/30 max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="font-display text-2xl">Add Questions (Bulk Entry)</DialogTitle>
                        <DialogDescription>
                          Add multiple questions at once for {selectedExam.title}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6">
                        {questionForms.map((form, index) => (
                          <Card key={index} className="glass-card border-secondary/30 p-4">
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="font-display text-lg">Question {index + 1}</h3>
                              {questionForms.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeQuestionSlot(index)}
                                  className="text-destructive hover:bg-destructive/20"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                            <div className="space-y-4">
                              <div>
                                <Label>Question Text</Label>
                                <Textarea
                                  value={form.question_text}
                                  onChange={(e) => updateQuestionForm(index, 'question_text', e.target.value)}
                                  placeholder="Enter your question here..."
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Option A</Label>
                                  <Input
                                    value={form.option_a}
                                    onChange={(e) => updateQuestionForm(index, 'option_a', e.target.value)}
                                    placeholder="First option"
                                  />
                                </div>
                                <div>
                                  <Label>Option B</Label>
                                  <Input
                                    value={form.option_b}
                                    onChange={(e) => updateQuestionForm(index, 'option_b', e.target.value)}
                                    placeholder="Second option"
                                  />
                                </div>
                                <div>
                                  <Label>Option C</Label>
                                  <Input
                                    value={form.option_c}
                                    onChange={(e) => updateQuestionForm(index, 'option_c', e.target.value)}
                                    placeholder="Third option"
                                  />
                                </div>
                                <div>
                                  <Label>Option D</Label>
                                  <Input
                                    value={form.option_d}
                                    onChange={(e) => updateQuestionForm(index, 'option_d', e.target.value)}
                                    placeholder="Fourth option"
                                  />
                                </div>
                              </div>
                              <div>
                                <Label>Correct Answer</Label>
                                <select
                                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                                  value={form.correct_answer}
                                  onChange={(e) => updateQuestionForm(index, 'correct_answer', e.target.value)}
                                >
                                  <option value="A">A</option>
                                  <option value="B">B</option>
                                  <option value="C">C</option>
                                  <option value="D">D</option>
                                </select>
                              </div>
                            </div>
                          </Card>
                        ))}
                        
                        <div className="flex gap-3">
                          <Button 
                            onClick={addQuestionSlot} 
                            variant="outline"
                            className="flex-1"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Another Question
                          </Button>
                          <Button 
                            onClick={handleAddQuestions} 
                            className="flex-1 btn-glow bg-secondary hover:bg-secondary/90"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Save All Questions ({questionForms.length})
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-4">
                  {questions.length === 0 ? (
                    <Card className="glass-card text-center py-12">
                      <CardContent>
                        <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <p className="text-muted-foreground">No questions yet. Add your first question!</p>
                      </CardContent>
                    </Card>
                  ) : (
                    questions.map((question, index) => (
                      <Card key={question.id} className="glass-card border-secondary/20">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg font-medium">
                              <span className="text-muted-foreground mr-2">Q{index + 1}.</span>
                              {question.question_text}
                            </CardTitle>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteQuestion(question.id)}
                              className="text-destructive hover:bg-destructive/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-1 text-sm">
                          {['A', 'B', 'C', 'D'].map((option) => {
                            const optionKey = `option_${option.toLowerCase()}` as keyof Question;
                            const isCorrect = question.correct_answer === option;
                            return (
                              <div key={option} className={`p-2 rounded ${isCorrect ? 'bg-primary/10 text-primary' : ''}`}>
                                <span className="font-medium">{option}.</span> {question[optionKey] as string}
                              </div>
                            );
                          })}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </>
            ) : (
              <Card className="glass-card text-center py-12">
                <CardContent>
                  <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">Select an exam to manage its questions</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteExamId !== null} onOpenChange={() => setDeleteExamId(null)}>
        <AlertDialogContent className="glass-card border-destructive/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl">Delete Exam?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the exam and all its questions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteExamId && handleDeleteExam(deleteExamId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;
