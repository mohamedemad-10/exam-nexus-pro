import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Brain, Clock, ChevronLeft, ChevronRight, Send } from "lucide-react";
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

type Question = Database['public']['Tables']['questions']['Row'];
type Exam = Database['public']['Tables']['exams']['Row'];

const Exam = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadExam = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      // Check if user has already completed this exam
      const { data: existingAttempts } = await supabase
        .from('user_exam_attempts')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('exam_id', examId)
        .not('completed_at', 'is', null);

      if (existingAttempts && existingAttempts.length > 0) {
        toast.error("You have already completed this exam. Contact admin for retake permission.");
        navigate('/dashboard');
        return;
      }

      // Fetch exam
      const { data: examData } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();

      if (!examData) {
        toast.error("Exam not found");
        navigate('/dashboard');
        return;
      }

      setExam(examData);
      setTimeLeft(examData.duration_minutes * 60);

      // Fetch questions
      const { data: questionsData } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', examId)
        .order('order_index', { ascending: true });

      if (questionsData) {
        setQuestions(questionsData);
      }

      // Create attempt
      const { data: attemptData } = await supabase
        .from('user_exam_attempts')
        .insert({
          user_id: session.user.id,
          exam_id: examId!,
          total_questions: questionsData?.length || 0,
        })
        .select()
        .single();

      if (attemptData) {
        setAttemptId(attemptData.id);
      }

      setLoading(false);
    };

    loadExam();
  }, [examId, navigate]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0 || !attemptId) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, attemptId]);

  const handleAnswerSelect = (answer: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }));
  };

  const handleSubmit = useCallback(async () => {
    if (!attemptId || submitting) return;

    setSubmitting(true);
    const startTime = exam?.duration_minutes ? (exam.duration_minutes * 60 - timeLeft) : 0;

    try {
      // Insert user answers and calculate score
      let correctCount = 0;
      const answerInserts = questions.map(q => {
        const userAnswer = answers[q.id];
        const isCorrect = userAnswer === q.correct_answer;
        if (isCorrect) correctCount++;

        return {
          attempt_id: attemptId,
          question_id: q.id,
          selected_answer: userAnswer || null,
          is_correct: isCorrect,
        };
      });

      await supabase.from('user_answers').insert(answerInserts);

      // Update attempt with results
      const percentage = (correctCount / questions.length) * 100;
      await supabase
        .from('user_exam_attempts')
        .update({
          completed_at: new Date().toISOString(),
          correct_answers: correctCount,
          score: correctCount,
          percentage: percentage,
          time_taken_seconds: startTime,
        })
        .eq('id', attemptId);

      toast.success("Exam submitted successfully!");
      navigate(`/results/${attemptId}`);
    } catch (error) {
      console.error("Error submitting exam:", error);
      toast.error("Failed to submit exam");
      setSubmitting(false);
    }
  }, [attemptId, answers, questions, timeLeft, exam, navigate, submitting]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const currentQuestion = questions[currentQuestionIndex];

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
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex justify-between items-center gap-2">
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-xl font-display truncate">{exam?.title}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Q {currentQuestionIndex + 1}/{questions.length}
              </p>
            </div>
            <div className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg shrink-0 ${
              timeLeft < 60 ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'
            }`}>
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-display text-sm sm:text-lg font-bold">{formatTime(timeLeft)}</span>
            </div>
          </div>
          <Progress value={progress} className="mt-3 sm:mt-4 h-1.5 sm:h-2" />
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="glass-card border-primary/30">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-2xl font-display leading-relaxed">
                  {currentQuestion?.question_text}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
                {['A', 'B', 'C', 'D'].map((option) => {
                  const optionKey = `option_${option.toLowerCase()}` as keyof Question;
                  const optionText = currentQuestion?.[optionKey] as string;
                  const isSelected = answers[currentQuestion?.id] === option;

                  return (
                    <motion.div
                      key={option}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <Button
                        variant={isSelected ? "default" : "outline"}
                        className={`w-full justify-start text-left h-auto py-3 sm:py-4 px-4 sm:px-6 ${
                          isSelected 
                            ? 'btn-glow bg-primary hover:bg-primary/90 border-primary' 
                            : 'border-primary/30 hover:border-primary/50'
                        }`}
                        onClick={() => handleAnswerSelect(option)}
                      >
                        <span className="font-display text-base sm:text-lg mr-3 sm:mr-4">{option}.</span>
                        <span className="text-sm sm:text-base">{optionText}</span>
                      </Button>
                    </motion.div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between mt-4 sm:mt-8 gap-3">
              <Button
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                variant="outline"
                size="sm"
                className="border-primary/30 px-3 sm:px-4"
              >
                <ChevronLeft className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Previous</span>
              </Button>

              {currentQuestionIndex === questions.length - 1 ? (
                <Button
                  onClick={() => setShowSubmitDialog(true)}
                  className="btn-glow bg-secondary hover:bg-secondary/90 px-4 sm:px-6"
                  size="sm"
                  disabled={submitting}
                >
                  <Send className="w-4 h-4 sm:mr-2" />
                  <span className="hidden xs:inline">Submit</span>
                  <span className="xs:hidden">Submit</span>
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                  className="btn-glow bg-primary hover:bg-primary/90 px-3 sm:px-4"
                  size="sm"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4 sm:ml-2" />
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent className="glass-card border-primary/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl">Submit Exam?</AlertDialogTitle>
            <AlertDialogDescription>
              You have answered {Object.keys(answers).length} out of {questions.length} questions.
              Are you sure you want to submit? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-glow bg-primary hover:bg-primary/90"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Exam;
