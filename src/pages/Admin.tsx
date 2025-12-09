import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase, checkIsAdmin } from "@/lib/supabase";
import { 
  Brain, ArrowLeft, Plus, Trash2, Edit, Save, BookOpen, 
  Users, BarChart3, Clock, Shield, TrendingUp, Award, RotateCcw, Eye, 
  CheckCircle, XCircle, UserPlus, Mail, FileText, Upload, Image, Loader2, MessageSquare, Reply, Star
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
type Profile = Database['public']['Tables']['profiles']['Row'];
type ContactMessage = Database['public']['Tables']['contact_messages']['Row'];
type UserAnswer = Database['public']['Tables']['user_answers']['Row'] & {
  questions?: Question;
};
type UserAttempt = Database['public']['Tables']['user_exam_attempts']['Row'] & {
  profiles?: { full_name: string | null; email: string };
  exams?: { title: string };
};

const GRADE_OPTIONS = [
  { value: '3prp', label: '3 Prep' },
  { value: '1sec', label: '1 Sec' },
  { value: '2sec', label: '2 Sec' },
  { value: '3sec', label: '3 Sec' },
  { value: 'general', label: 'General' },
];

// Generate random 8-char ID
const generateRandomId = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const Admin = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAttempts, setUserAttempts] = useState<UserAttempt[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExamDialog, setShowExamDialog] = useState(false);
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showPdfDialog, setShowPdfDialog] = useState(false);
  const [showPassageDialog, setShowPassageDialog] = useState(false);
  const [showTestimonialDialog, setShowTestimonialDialog] = useState(false);
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [replyMessage, setReplyMessage] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [deleteExamId, setDeleteExamId] = useState<string | null>(null);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [showAnswersDialog, setShowAnswersDialog] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState<UserAttempt | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [loadingAnswers, setLoadingAnswers] = useState(false);
  const [processingPdf, setProcessingPdf] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [adminUserIds, setAdminUserIds] = useState<string[]>([]);

  const [passageForm, setPassageForm] = useState({
    title: '',
    content: '',
  });
  const [examForm, setExamForm] = useState({
    title: '',
    description: '',
    duration_minutes: 60,
    passing_score: 70,
    grade: 'general',
  });

  const [userForm, setUserForm] = useState({
    full_name: '',
    phone: '',
    class: '',
  });

  const [testimonialForm, setTestimonialForm] = useState({
    name: '',
    role: '',
    content: '',
    avatar: '',
  });

  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);

  const [passages, setPassages] = useState<any[]>([]);
  
  const [questionForms, setQuestionForms] = useState([{
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A',
    image_url: '',
    passage_id: '',
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
      await Promise.all([
        loadExams(),
        loadUserAttempts(),
        loadUsers(),
        loadContactMessages(),
        loadTestimonials(),
        loadAdminUsers(),
      ]);
      setLoading(false);
    };

    checkAuthAndAdmin();
  }, [navigate]);

  const loadAdminUsers = async () => {
    const { data } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');
    if (data) {
      setAdminUserIds(data.map(r => r.user_id));
    }
  };

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

  const loadUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setUsers(data);
  };

  const loadContactMessages = async () => {
    const { data } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setContactMessages(data);
  };

  const loadTestimonials = async () => {
    const { data } = await supabase
      .from('testimonials')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setTestimonials(data);
  };

  const loadUserAttempts = async () => {
    const { data } = await supabase
      .from('user_exam_attempts')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(50);

    if (data) {
      const uniqueUserIds = [...new Set(data.map(a => a.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', uniqueUserIds);

      const uniqueExamIds = [...new Set(data.map(a => a.exam_id))];
      const { data: examsData } = await supabase
        .from('exams')
        .select('id, title')
        .in('id', uniqueExamIds);

      const enrichedData = data.map(attempt => ({
        ...attempt,
        profiles: profilesData?.find(p => p.id === attempt.user_id),
        exams: examsData?.find(e => e.id === attempt.exam_id),
      }));

      setUserAttempts(enrichedData as UserAttempt[]);
    }
  };

  const loadPassages = async (examId: string) => {
    const { data } = await supabase
      .from('passages')
      .select('*')
      .eq('exam_id', examId)
      .order('order_index', { ascending: true });
    if (data) setPassages(data);
  };

  const handleAddPassage = async () => {
    if (!selectedExam || !passageForm.title.trim() || !passageForm.content.trim()) {
      toast.error("Please fill in passage title and content");
      return;
    }

    const { error } = await supabase.from('passages').insert({
      exam_id: selectedExam.id,
      title: passageForm.title,
      content: passageForm.content,
      order_index: passages.length,
    });

    if (error) {
      toast.error("Failed to add passage");
    } else {
      toast.success("Passage added successfully");
      setShowPassageDialog(false);
      setPassageForm({ title: '', content: '' });
      await loadPassages(selectedExam.id);
    }
  };

  const handleDeletePassage = async (passageId: string) => {
    if (!confirm("Delete this passage?")) return;
    
    const { error } = await supabase.from('passages').delete().eq('id', passageId);
    if (error) {
      toast.error("Failed to delete passage");
    } else {
      toast.success("Passage deleted");
      if (selectedExam) await loadPassages(selectedExam.id);
    }
  };

  const validateFullName = (name: string): boolean => {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 3 && parts.every(p => p.length > 0);
  };

  const handleCreateUser = async () => {
    if (!userForm.full_name) {
      toast.error("Full name is required");
      return;
    }

    if (!validateFullName(userForm.full_name)) {
      toast.error("Full name must contain 3 names (e.g. First Middle Last)");
      return;
    }

    if (!userForm.class) {
      toast.error("Please select a grade/class");
      return;
    }

    // Generate random ID and use same as password
    const randomId = generateRandomId();

    setCreatingUser(true);
    setCreatedUserId(null);
    setCreatedPassword(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const SUPABASE_URL = "https://lhdwmdebrqezcyjnrbnb.supabase.co";
      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          ...userForm,
          password: randomId, // Password same as ID
        }),
      });

      const result = await response.json();
      if (result.error) {
        toast.error(result.error);
      } else {
        setCreatedUserId(result.loginId);
        setCreatedPassword(randomId);
        toast.success(`User created! Login ID: ${result.loginId}`);
        await loadUsers();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create user");
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    // Check if user is admin
    if (adminUserIds.includes(userId)) {
      toast.error("Cannot delete admin accounts");
      return;
    }

    if (!confirm(`Delete user "${userName}"? This action cannot be undone.`)) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const SUPABASE_URL = "https://lhdwmdebrqezcyjnrbnb.supabase.co";
      const response = await fetch(`${SUPABASE_URL}/functions/v1/delete-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("User deleted successfully");
        await Promise.all([loadUsers(), loadUserAttempts()]);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete user");
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Delete this message?")) return;
    
    const { error } = await supabase.from('contact_messages').delete().eq('id', messageId);
    if (error) {
      toast.error("Failed to delete message");
    } else {
      toast.success("Message deleted");
      await loadContactMessages();
    }
  };

  const handleReplyMessage = (msg: ContactMessage) => {
    setReplyMessage(msg);
    setReplyText('');
    setShowReplyDialog(true);
  };

  const sendReply = () => {
    if (!replyMessage || !replyText.trim()) return;
    
    // Open email client with pre-filled reply
    const subject = encodeURIComponent(`Re: Message from ExamPro`);
    const body = encodeURIComponent(`Dear ${replyMessage.name},\n\n${replyText}\n\nBest regards,\nExamPro Team`);
    window.open(`mailto:${replyMessage.email}?subject=${subject}&body=${body}`);
    
    toast.success("Email client opened with reply");
    setShowReplyDialog(false);
    handleMarkMessageRead(replyMessage.id);
  };

  const handleCreateTestimonial = async () => {
    if (!testimonialForm.name || !testimonialForm.content || !testimonialForm.role) {
      toast.error("Please fill in all fields");
      return;
    }

    const avatar = testimonialForm.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const { error } = await supabase.from('testimonials').insert({
      name: testimonialForm.name,
      role: testimonialForm.role,
      content: testimonialForm.content,
      avatar,
    });

    if (error) {
      toast.error("Failed to add testimonial");
    } else {
      toast.success("Testimonial added!");
      setShowTestimonialDialog(false);
      setTestimonialForm({ name: '', role: '', content: '', avatar: '' });
      await loadTestimonials();
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (!confirm("Delete this testimonial?")) return;
    
    const { error } = await supabase.from('testimonials').delete().eq('id', id);
    if (error) {
      toast.error("Failed to delete testimonial");
    } else {
      toast.success("Testimonial deleted");
      await loadTestimonials();
    }
  };

  const handleCreateExam = async () => {
    if (!user) return;

    if (editingExam) {
      const { error } = await supabase
        .from('exams')
        .update(examForm)
        .eq('id', editingExam.id);

      if (error) {
        toast.error("Failed to update exam");
      } else {
        toast.success("Exam updated successfully");
        setShowExamDialog(false);
        setExamForm({ title: '', description: '', duration_minutes: 60, passing_score: 70, grade: 'general' });
        setEditingExam(null);
        await loadExams();
      }
    } else {
      const { error } = await supabase
        .from('exams')
        .insert({ ...examForm, created_by: user.id });

      if (error) {
        toast.error("Failed to create exam");
      } else {
        toast.success("Exam created successfully");
        setShowExamDialog(false);
        setExamForm({ title: '', description: '', duration_minutes: 60, passing_score: 70, grade: 'general' });
        await loadExams();
      }
    }
  };

  const handleEditExam = (exam: Exam) => {
    setEditingExam(exam);
    setExamForm({
      title: exam.title,
      description: exam.description || '',
      duration_minutes: exam.duration_minutes,
      passing_score: exam.passing_score,
      grade: (exam as any).grade || 'general',
    });
    setShowExamDialog(true);
  };

  const handleAddQuestions = async () => {
    if (!selectedExam) return;

    const validQuestions = questionForms.filter(q => 
      q.question_text.trim() && q.option_a.trim() && q.option_b.trim() && 
      q.option_c.trim() && q.option_d.trim()
    );

    if (validQuestions.length === 0) {
      toast.error("Please fill in at least one complete question");
      return;
    }

    const questionsToInsert = validQuestions.map((q, index) => ({
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_answer: q.correct_answer,
      image_url: q.image_url || null,
      passage_id: q.passage_id || null,
      exam_id: selectedExam.id,
      order_index: questions.length + index,
    }));

    const { error } = await supabase.from('questions').insert(questionsToInsert);

    if (error) {
      console.error("Error adding questions:", error);
      toast.error("Failed to add questions: " + error.message);
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
        image_url: '',
        passage_id: '',
      }]);
      await loadQuestions(selectedExam.id);
    }
  };

  const handleImageUpload = async (index: number, file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `questions/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('exam-images')
      .upload(filePath, file);

    if (uploadError) {
      toast.error("Failed to upload image");
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('exam-images')
      .getPublicUrl(filePath);

    const updated = [...questionForms];
    updated[index] = { ...updated[index], image_url: publicUrl };
    setQuestionForms(updated);
    toast.success("Image uploaded");
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error("Please upload a PDF file");
      return;
    }

    setProcessingPdf(true);

    try {
      // Read PDF as ArrayBuffer and convert to base64
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64 = btoa(binary);
      
      const { data: { session } } = await supabase.auth.getSession();
      const SUPABASE_URL = "https://lhdwmdebrqezcyjnrbnb.supabase.co";
      const response = await fetch(`${SUPABASE_URL}/functions/v1/pdf-to-exam`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ 
          pdfBase64: base64,
          examTitle: file.name.replace('.pdf', ''),
        }),
      });

      const result = await response.json();
      
      if (result.error) {
        toast.error(result.error);
      } else if (result.questions && result.questions.length > 0) {
        setQuestionForms(result.questions.map((q: any) => ({
          question_text: q.question_text || '',
          option_a: q.option_a || '',
          option_b: q.option_b || '',
          option_c: q.option_c || '',
          option_d: q.option_d || '',
          correct_answer: q.correct_answer || 'A',
          image_url: '',
          passage_id: '',
        })));
        toast.success(`Extracted ${result.questions.length} questions from PDF`);
        setShowPdfDialog(false);
        setShowQuestionDialog(true);
      } else {
        toast.error("No questions could be extracted from the PDF");
      }
    } catch (error: any) {
      console.error("PDF processing error:", error);
      toast.error("Failed to process PDF");
    } finally {
      setProcessingPdf(false);
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
      image_url: '',
      passage_id: '',
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
    const { error } = await supabase.from('exams').delete().eq('id', examId);
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

  const handleAllowRetake = async (attemptId: string, userName: string) => {
    if (!confirm(`Allow ${userName || 'this user'} to retake the exam?`)) return;
    
    const { error } = await supabase
      .from('user_exam_attempts')
      .delete()
      .eq('id', attemptId);

    if (error) {
      toast.error("Failed to allow retake: " + error.message);
    } else {
      toast.success("User can now retake the exam!");
      await loadUserAttempts();
    }
  };

  const handleViewAnswers = async (attempt: UserAttempt) => {
    setSelectedAttempt(attempt);
    setLoadingAnswers(true);
    setShowAnswersDialog(true);

    const { data: answers } = await supabase
      .from('user_answers')
      .select('*')
      .eq('attempt_id', attempt.id);

    if (answers) {
      const questionIds = answers.map(a => a.question_id);
      const { data: questionsData } = await supabase
        .from('questions')
        .select('*')
        .in('id', questionIds);

      const enrichedAnswers = answers.map(answer => ({
        ...answer,
        questions: questionsData?.find(q => q.id === answer.question_id),
      }));
      setUserAnswers(enrichedAnswers as UserAnswer[]);
    }
    setLoadingAnswers(false);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    const { error } = await supabase.from('questions').delete().eq('id', questionId);
    if (error) {
      toast.error("Failed to delete question");
    } else {
      toast.success("Question deleted");
      if (selectedExam) await loadQuestions(selectedExam.id);
    }
  };

  const handleMarkMessageRead = async (messageId: string) => {
    await supabase.from('contact_messages').update({ is_read: true }).eq('id', messageId);
    await loadContactMessages();
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
      <header className="glass-card border-b border-primary/20 sticky top-0 z-50 backdrop-blur-xl">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 md:gap-4">
              <Button onClick={() => navigate('/dashboard')} variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Dashboard</span>
              </Button>
              <div className="flex items-center gap-2 md:gap-3">
                <Shield className="w-6 h-6 md:w-8 md:h-8 text-secondary pulse-glow" />
                <h1 className="text-lg md:text-2xl font-display gradient-text">Admin Panel</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-6 mb-6">
          <Card className="glass-card border-primary/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Exams</CardTitle>
              <BookOpen className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-display gradient-text">{exams.length}</div>
            </CardContent>
          </Card>
          <Card className="glass-card border-secondary/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Users</CardTitle>
              <Users className="w-4 h-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-display text-secondary">{users.length}</div>
            </CardContent>
          </Card>
          <Card className="glass-card border-primary/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Attempts</CardTitle>
              <BarChart3 className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-display gradient-text">{userAttempts.length}</div>
            </CardContent>
          </Card>
          <Card className="glass-card border-secondary/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Messages</CardTitle>
              <MessageSquare className="w-4 h-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-display text-secondary">
                {contactMessages.filter(m => !m.is_read).length}
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-primary/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Reviews</CardTitle>
              <Star className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-display gradient-text">{testimonials.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="exams" className="space-y-6">
          <TabsList className="glass-card w-full justify-start overflow-x-auto">
            <TabsTrigger value="exams" className="text-xs sm:text-sm">Exams</TabsTrigger>
            <TabsTrigger value="users" className="text-xs sm:text-sm">Users</TabsTrigger>
            <TabsTrigger value="results" className="text-xs sm:text-sm">Results</TabsTrigger>
            <TabsTrigger value="messages" className="text-xs sm:text-sm">Messages</TabsTrigger>
            <TabsTrigger value="testimonials" className="text-xs sm:text-sm">Reviews</TabsTrigger>
          </TabsList>

          {/* Exams Tab */}
          <TabsContent value="exams">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Exams List */}
              <div>
                <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                  <h2 className="text-xl font-display">Exams</h2>
                  <Dialog open={showExamDialog} onOpenChange={(open) => {
                    setShowExamDialog(open);
                    if (!open) {
                      setEditingExam(null);
                      setExamForm({ title: '', description: '', duration_minutes: 60, passing_score: 70, grade: 'general' });
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button className="btn-glow bg-primary hover:bg-primary/90" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Create
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-card border-primary/30 max-w-md mx-2">
                      <DialogHeader>
                        <DialogTitle className="font-display text-xl">
                          {editingExam ? 'Edit Exam' : 'Create Exam'}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Title</Label>
                          <Input
                            value={examForm.title}
                            onChange={(e) => setExamForm({...examForm, title: e.target.value})}
                            placeholder="Exam title"
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={examForm.description}
                            onChange={(e) => setExamForm({...examForm, description: e.target.value})}
                            placeholder="Exam description"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Duration (mins)</Label>
                            <Input
                              type="number"
                              value={examForm.duration_minutes}
                              onChange={(e) => setExamForm({...examForm, duration_minutes: parseInt(e.target.value)})}
                            />
                          </div>
                          <div>
                            <Label>Pass Score (%)</Label>
                            <Input
                              type="number"
                              value={examForm.passing_score}
                              onChange={(e) => setExamForm({...examForm, passing_score: parseInt(e.target.value)})}
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Grade</Label>
                          <Select value={examForm.grade} onValueChange={(v) => setExamForm({...examForm, grade: v})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select grade" />
                            </SelectTrigger>
                            <SelectContent>
                              {GRADE_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleCreateExam} className="w-full btn-glow bg-primary">
                          <Save className="w-4 h-4 mr-2" />
                          {editingExam ? 'Update' : 'Create'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                  {exams.map((exam) => (
                    <Card 
                      key={exam.id}
                      className={`glass-card cursor-pointer transition-all ${
                        selectedExam?.id === exam.id ? 'border-primary/50 shadow-glow-cyan' : 'border-primary/20'
                      }`}
                      onClick={() => {
                        setSelectedExam(exam);
                        loadQuestions(exam.id);
                        loadPassages(exam.id);
                      }}
                    >
                      <CardHeader className="p-4">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base truncate">{exam.title}</CardTitle>
                            <CardDescription className="text-xs line-clamp-1">{exam.description}</CardDescription>
                          </div>
                          <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" onClick={() => handleEditExam(exam)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setDeleteExamId(exam.id)} className="text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                          <span><Clock className="w-3 h-3 inline mr-1" />{exam.duration_minutes}m</span>
                          <span>Pass: {exam.passing_score}%</span>
                          <span className="px-1.5 py-0.5 bg-secondary/20 text-secondary rounded">
                            {GRADE_OPTIONS.find(g => g.value === (exam as any).grade)?.label || 'General'}
                          </span>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Questions Panel */}
              <div>
                {selectedExam ? (
                  <>
                    <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                      <h2 className="text-xl font-display">Questions & Passages</h2>
                      <div className="flex flex-wrap gap-2">
                        <Dialog open={showPassageDialog} onOpenChange={setShowPassageDialog}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <BookOpen className="w-4 h-4 mr-2" />
                              Passage
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="glass-card border-primary/30 max-w-lg mx-2">
                            <DialogHeader>
                              <DialogTitle className="font-display">Add Passage</DialogTitle>
                              <DialogDescription>Add a reading passage for questions</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Title</Label>
                                <Input value={passageForm.title} onChange={(e) => setPassageForm({...passageForm, title: e.target.value})} placeholder="Passage title" />
                              </div>
                              <div>
                                <Label>Content</Label>
                                <Textarea value={passageForm.content} onChange={(e) => setPassageForm({...passageForm, content: e.target.value})} placeholder="Passage text..." rows={6} />
                              </div>
                              {passages.length > 0 && (
                                <div className="border-t pt-3">
                                  <Label className="text-xs text-muted-foreground mb-2 block">Existing Passages</Label>
                                  {passages.map((p) => (
                                    <div key={p.id} className="flex justify-between items-center py-1">
                                      <span className="text-sm">{p.title}</span>
                                      <Button variant="ghost" size="sm" onClick={() => handleDeletePassage(p.id)} className="text-destructive h-6 w-6 p-0"><Trash2 className="w-3 h-3" /></Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <Button onClick={handleAddPassage} className="w-full btn-glow bg-primary"><Save className="w-4 h-4 mr-2" />Save Passage</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Dialog open={showPdfDialog} onOpenChange={setShowPdfDialog}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <FileText className="w-4 h-4 mr-2" />
                              PDF
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="glass-card border-primary/30 max-w-md mx-2">
                            <DialogHeader>
                              <DialogTitle className="font-display">Import from PDF</DialogTitle>
                              <DialogDescription>
                                Upload a PDF to extract questions using AI
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Input
                                type="file"
                                accept=".pdf"
                                onChange={handlePdfUpload}
                                disabled={processingPdf}
                              />
                              {processingPdf && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Processing PDF with AI...
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
                          <DialogTrigger asChild>
                            <Button className="btn-glow bg-secondary hover:bg-secondary/90" size="sm">
                              <Plus className="w-4 h-4 mr-2" />
                              Add
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="glass-card border-primary/30 max-w-4xl max-h-[85vh] overflow-y-auto mx-2">
                            <DialogHeader>
                              <DialogTitle className="font-display text-xl">Add Questions</DialogTitle>
                              <DialogDescription className="text-sm">
                                Add questions for {selectedExam.title}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              {questionForms.map((form, index) => (
                                <Card key={index} className="glass-card border-secondary/30 p-4">
                                  <div className="flex justify-between items-center mb-3">
                                    <h3 className="font-display">Q{index + 1}</h3>
                                    {questionForms.length > 1 && (
                                      <Button variant="ghost" size="sm" onClick={() => removeQuestionSlot(index)} className="text-destructive">
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                  <div className="space-y-3">
                                    {passages.length > 0 && (
                                      <div>
                                        <Label className="text-xs">Link to Passage (optional)</Label>
                                        <Select value={form.passage_id || "none"} onValueChange={(v) => updateQuestionForm(index, 'passage_id', v === "none" ? "" : v)}>
                                          <SelectTrigger className="h-8 text-xs">
                                            <SelectValue placeholder="No passage" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="none">No passage</SelectItem>
                                            {passages.map(p => (
                                              <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    )}
                                    <div>
                                      <Label className="text-xs">Question</Label>
                                      <Textarea value={form.question_text} onChange={(e) => updateQuestionForm(index, 'question_text', e.target.value)} className="min-h-[60px]" placeholder="Enter question text" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <Label className="text-xs">A</Label>
                                        <Input value={form.option_a} onChange={(e) => updateQuestionForm(index, 'option_a', e.target.value)} placeholder="Option A" />
                                      </div>
                                      <div>
                                        <Label className="text-xs">B</Label>
                                        <Input value={form.option_b} onChange={(e) => updateQuestionForm(index, 'option_b', e.target.value)} placeholder="Option B" />
                                      </div>
                                      <div>
                                        <Label className="text-xs">C</Label>
                                        <Input value={form.option_c} onChange={(e) => updateQuestionForm(index, 'option_c', e.target.value)} placeholder="Option C" />
                                      </div>
                                      <div>
                                        <Label className="text-xs">D</Label>
                                        <Input value={form.option_d} onChange={(e) => updateQuestionForm(index, 'option_d', e.target.value)} placeholder="Option D" />
                                      </div>
                                    </div>
                                    <div className="flex gap-3">
                                      <div className="flex-1">
                                        <Label className="text-xs">Correct</Label>
                                        <Select value={form.correct_answer} onValueChange={(v) => updateQuestionForm(index, 'correct_answer', v)}>
                                          <SelectTrigger className="h-8">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="A">A</SelectItem>
                                            <SelectItem value="B">B</SelectItem>
                                            <SelectItem value="C">C</SelectItem>
                                            <SelectItem value="D">D</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="flex-1">
                                        <Label className="text-xs">Image</Label>
                                        <Input type="file" accept="image/*" className="h-8 text-xs" onChange={(e) => {
                                          const f = e.target.files?.[0];
                                          if (f) handleImageUpload(index, f);
                                        }} />
                                      </div>
                                    </div>
                                    {form.image_url && (
                                      <img src={form.image_url} alt="Preview" className="h-16 rounded object-cover" />
                                    )}
                                  </div>
                                </Card>
                              ))}
                              <div className="flex gap-3">
                                <Button variant="outline" onClick={addQuestionSlot} className="flex-1">
                                  <Plus className="w-4 h-4 mr-2" />Add Another
                                </Button>
                                <Button onClick={handleAddQuestions} className="flex-1 btn-glow bg-primary">
                                  <Save className="w-4 h-4 mr-2" />Save All
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                      {questions.length === 0 ? (
                        <Card className="glass-card text-center py-8">
                          <CardContent>
                            <p className="text-muted-foreground text-sm">No questions yet</p>
                          </CardContent>
                        </Card>
                      ) : (
                        questions.map((question, index) => (
                          <Card key={question.id} className="glass-card border-primary/20 p-3">
                            <div className="flex justify-between items-start gap-2 mb-2">
                              <p className="font-medium text-sm">Q{index + 1}. {question.question_text}</p>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteQuestion(question.id)} className="text-destructive shrink-0 h-6 w-6 p-0">
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                            {question.image_url && (
                              <img src={question.image_url} alt="Question" className="h-16 rounded object-cover mb-2" />
                            )}
                            <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                              {['A', 'B', 'C', 'D'].map(opt => {
                                const key = `option_${opt.toLowerCase()}` as keyof Question;
                                const isCorrect = question.correct_answer === opt;
                                return (
                                  <div key={opt} className={`p-1.5 rounded ${isCorrect ? 'bg-primary/10 text-primary' : ''}`}>
                                    <span className="font-medium">{opt}.</span> {question[key] as string}
                                  </div>
                                );
                              })}
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </>
                ) : (
                  <Card className="glass-card text-center py-12">
                    <CardContent>
                      <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <p className="text-muted-foreground text-sm">Select an exam to manage questions</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-display">User Management</h2>
              <Dialog open={showUserDialog} onOpenChange={(open) => {
                setShowUserDialog(open);
                if (!open) {
                  setCreatedUserId(null);
                  setCreatedPassword(null);
                  setUserForm({ full_name: '', phone: '', class: '' });
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="btn-glow bg-primary hover:bg-primary/90" size="sm">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-card border-primary/30 max-w-md mx-2">
                  <DialogHeader>
                    <DialogTitle className="font-display text-xl">
                      {createdUserId ? 'User Created!' : 'Create User'}
                    </DialogTitle>
                    <DialogDescription>
                      {createdUserId ? 'Share these credentials with the user' : 'Add a new user to the system'}
                    </DialogDescription>
                  </DialogHeader>
                  
                  {createdUserId ? (
                    <div className="space-y-4">
                      <Card className="bg-primary/10 border-primary/30 p-4">
                        <div className="text-center space-y-3">
                          <p className="text-sm text-muted-foreground">User Login ID</p>
                          <p className="text-3xl font-mono font-bold gradient-text tracking-widest">{createdUserId}</p>
                          <p className="text-sm text-muted-foreground mt-4">Password (same as ID)</p>
                          <p className="text-2xl font-mono font-bold text-secondary tracking-widest">{createdPassword}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Share these credentials with the user. ID and Password are the same.
                          </p>
                        </div>
                      </Card>
                      <Button onClick={() => {
                        navigator.clipboard.writeText(`ID: ${createdUserId}\nPassword: ${createdPassword}`);
                        toast.success("Credentials copied to clipboard!");
                      }} variant="outline" className="w-full">
                        Copy Credentials
                      </Button>
                      <Button onClick={() => {
                        setShowUserDialog(false);
                        setCreatedUserId(null);
                        setCreatedPassword(null);
                        setUserForm({ full_name: '', phone: '', class: '' });
                      }} className="w-full btn-glow bg-primary">
                        Done
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label>Full Name * (3 names required)</Label>
                        <Input
                          value={userForm.full_name}
                          onChange={(e) => setUserForm({...userForm, full_name: e.target.value})}
                          placeholder="First Middle Last"
                        />
                        <p className="text-xs text-muted-foreground mt-1">e.g. Mohamed Ahmed Hassan</p>
                      </div>
                      <div>
                        <Label>Grade/Class *</Label>
                        <Select value={userForm.class} onValueChange={(v) => setUserForm({...userForm, class: v})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select grade" />
                          </SelectTrigger>
                          <SelectContent>
                            {GRADE_OPTIONS.map(g => (
                              <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input
                          value={userForm.phone}
                          onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                          placeholder="+201234567890"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground bg-secondary/10 p-2 rounded">
                        Password will be auto-generated (same as Login ID)
                      </p>
                      <Button onClick={handleCreateUser} className="w-full btn-glow bg-primary" disabled={creatingUser}>
                        {creatingUser ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Create User
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>

            <Card className="glass-card">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-border/50 bg-muted/20">
                      <tr>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">User ID</th>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">Name</th>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Grade</th>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Phone</th>
                        <th className="text-right p-3 text-xs font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {users.map((u: any) => {
                        const isAdmin = adminUserIds.includes(u.id);
                        return (
                          <tr key={u.id} className="hover:bg-primary/5">
                            <td className="p-3">
                              <span className="font-mono text-sm font-bold text-primary">{u.user_id || 'N/A'}</span>
                              {isAdmin && <span className="ml-2 text-xs bg-secondary/20 text-secondary px-1.5 py-0.5 rounded">Admin</span>}
                            </td>
                            <td className="p-3">
                              <p className="font-medium text-sm">{u.full_name || 'N/A'}</p>
                              <p className="text-xs text-muted-foreground md:hidden">{u.class || ''}</p>
                            </td>
                            <td className="p-3 text-sm text-muted-foreground hidden md:table-cell">
                              <span className="px-2 py-1 rounded-full bg-secondary/20 text-secondary text-xs">
                                {GRADE_OPTIONS.find(g => g.value === u.class)?.label || u.class || '-'}
                              </span>
                            </td>
                            <td className="p-3 text-sm text-muted-foreground hidden lg:table-cell">{u.phone || '-'}</td>
                            <td className="p-3 text-right">
                              {!isAdmin && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteUser(u.id, u.full_name || u.user_id)}
                                  className="text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results">
            <h2 className="text-xl font-display mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-secondary" />
              Exam Results
            </h2>

            {userAttempts.length === 0 ? (
              <Card className="glass-card text-center py-12">
                <CardContent>
                  <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground text-sm">No results yet</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="glass-card">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-border/50 bg-muted/20">
                        <tr>
                          <th className="text-left p-3 text-xs font-medium text-muted-foreground">User</th>
                          <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Exam</th>
                          <th className="text-center p-3 text-xs font-medium text-muted-foreground">Score</th>
                          <th className="text-right p-3 text-xs font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {userAttempts.map((attempt) => (
                          <tr key={attempt.id} className="hover:bg-primary/5">
                            <td className="p-3">
                              <p className="font-medium text-sm">{attempt.profiles?.full_name || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground md:hidden">{attempt.exams?.title}</p>
                            </td>
                            <td className="p-3 text-sm hidden md:table-cell">{attempt.exams?.title}</td>
                            <td className="p-3 text-center">
                              <div className={`text-lg font-display ${(attempt.percentage || 0) >= 70 ? 'text-primary' : 'text-destructive'}`}>
                                {attempt.percentage?.toFixed(0)}%
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button size="sm" variant="ghost" onClick={() => handleViewAnswers(attempt)} className="text-secondary">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleAllowRetake(attempt.id, attempt.profiles?.full_name || '')} className="text-primary">
                                  <RotateCcw className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <h2 className="text-xl font-display mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-secondary" />
              Contact Messages
            </h2>

            {contactMessages.length === 0 ? (
              <Card className="glass-card text-center py-12">
                <CardContent>
                  <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground text-sm">No messages yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {contactMessages.map((msg) => (
                  <Card key={msg.id} className={`glass-card ${!msg.is_read ? 'border-primary/50' : 'border-border/20'}`}>
                    <CardHeader className="p-4">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-base">{msg.name}</CardTitle>
                            {!msg.is_read && (
                              <span className="px-2 py-0.5 text-xs bg-primary/20 text-primary rounded">New</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{msg.email} {msg.phone && `• ${msg.phone}`}</p>
                        </div>
                        <p className="text-xs text-muted-foreground shrink-0">
                          {new Date(msg.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-sm text-muted-foreground">{msg.message}</p>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" onClick={() => handleReplyMessage(msg)}>
                          <Reply className="w-4 h-4 mr-2" />
                          Reply
                        </Button>
                        {!msg.is_read && (
                          <Button size="sm" variant="outline" onClick={() => handleMarkMessageRead(msg.id)}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark Read
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteMessage(msg.id)} className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Testimonials Tab */}
          <TabsContent value="testimonials">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-display flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                Testimonials (Homepage Reviews)
              </h2>
              <Dialog open={showTestimonialDialog} onOpenChange={setShowTestimonialDialog}>
                <DialogTrigger asChild>
                  <Button className="btn-glow bg-primary hover:bg-primary/90" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Review
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-card border-primary/30 max-w-md mx-2">
                  <DialogHeader>
                    <DialogTitle className="font-display text-xl">Add Testimonial</DialogTitle>
                    <DialogDescription>
                      This review will appear on the homepage
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={testimonialForm.name}
                        onChange={(e) => setTestimonialForm({...testimonialForm, name: e.target.value})}
                        placeholder="Ahmed Mohamed"
                      />
                    </div>
                    <div>
                      <Label>Role/Title</Label>
                      <Input
                        value={testimonialForm.role}
                        onChange={(e) => setTestimonialForm({...testimonialForm, role: e.target.value})}
                        placeholder="Student - 3 Sec"
                      />
                    </div>
                    <div>
                      <Label>Review Content</Label>
                      <Textarea
                        value={testimonialForm.content}
                        onChange={(e) => setTestimonialForm({...testimonialForm, content: e.target.value})}
                        placeholder="Write a positive review..."
                        rows={3}
                      />
                    </div>
                    <Button onClick={handleCreateTestimonial} className="w-full btn-glow bg-primary">
                      <Save className="w-4 h-4 mr-2" />
                      Add Testimonial
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {testimonials.length === 0 ? (
              <Card className="glass-card text-center py-12">
                <CardContent>
                  <Star className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground text-sm">No testimonials yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {testimonials.map((t) => (
                  <Card key={t.id} className="glass-card border-primary/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-display">
                          {t.avatar}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-sm">{t.name}</h5>
                          <p className="text-xs text-muted-foreground">{t.role}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteTestimonial(t.id)} className="text-destructive h-8 w-8 p-0">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground italic">"{t.content}"</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Exam Dialog */}
      <AlertDialog open={!!deleteExamId} onOpenChange={() => setDeleteExamId(null)}>
        <AlertDialogContent className="glass-card border-destructive/30">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exam?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the exam and all its questions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteExamId && handleDeleteExam(deleteExamId)} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reply Dialog */}
      <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
        <DialogContent className="glass-card border-primary/30 max-w-md mx-2">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Reply to {replyMessage?.name}</DialogTitle>
            <DialogDescription>{replyMessage?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/20 p-3 rounded text-sm text-muted-foreground">
              "{replyMessage?.message}"
            </div>
            <div>
              <Label>Your Reply</Label>
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your response..."
                rows={4}
              />
            </div>
            <Button onClick={sendReply} className="w-full btn-glow bg-primary">
              <Reply className="w-4 h-4 mr-2" />
              Open Email Client
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Answers Dialog */}
      <Dialog open={showAnswersDialog} onOpenChange={setShowAnswersDialog}>
        <DialogContent className="glass-card border-primary/30 max-w-2xl max-h-[85vh] overflow-y-auto mx-2">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {selectedAttempt?.profiles?.full_name}'s Answers
            </DialogTitle>
            <DialogDescription>
              {selectedAttempt?.exams?.title} - Score: {selectedAttempt?.percentage?.toFixed(0)}%
            </DialogDescription>
          </DialogHeader>
          {loadingAnswers ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {userAnswers.map((answer, index) => (
                <Card key={answer.id} className={`p-4 ${answer.is_correct ? 'border-primary/30' : 'border-destructive/30'}`}>
                  <div className="flex items-start gap-2 mb-2">
                    {answer.is_correct ? (
                      <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    )}
                    <p className="font-medium text-sm">Q{index + 1}. {answer.questions?.question_text}</p>
                  </div>
                  <div className="ml-7 space-y-1 text-xs">
                    <p>
                      <span className="text-muted-foreground">Selected:</span>{' '}
                      <span className={answer.is_correct ? 'text-primary' : 'text-destructive'}>
                        {answer.selected_answer || 'No answer'}
                      </span>
                    </p>
                    {!answer.is_correct && (
                      <p>
                        <span className="text-muted-foreground">Correct:</span>{' '}
                        <span className="text-primary">{answer.questions?.correct_answer}</span>
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;