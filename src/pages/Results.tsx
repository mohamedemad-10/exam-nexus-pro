import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";
import { Brain, Trophy, XCircle, CheckCircle, ArrowLeft } from "lucide-react";
import confetti from "canvas-confetti";
import type { Database } from "@/integrations/supabase/types";

type Attempt = Database['public']['Tables']['user_exam_attempts']['Row'];
type UserAnswer = Database['public']['Tables']['user_answers']['Row'];
type Question = Database['public']['Tables']['questions']['Row'];
type Exam = Database['public']['Tables']['exams']['Row'];

const Results = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [answers, setAnswers] = useState<(UserAnswer & { question: Question })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadResults = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      // Fetch attempt
      const { data: attemptData } = await supabase
        .from('user_exam_attempts')
        .select('*')
        .eq('id', attemptId)
        .single();

      if (!attemptData || attemptData.user_id !== session.user.id) {
        navigate('/dashboard');
        return;
      }

      setAttempt(attemptData);

      // Fetch exam
      const { data: examData } = await supabase
        .from('exams')
        .select('*')
        .eq('id', attemptData.exam_id)
        .single();

      if (examData) setExam(examData);

      // Fetch answers with questions
      const { data: answersData } = await supabase
        .from('user_answers')
        .select(`
          *,
          question:questions(*)
        `)
        .eq('attempt_id', attemptId);

      if (answersData) {
        setAnswers(answersData as any);
      }

      setLoading(false);
    };

    loadResults();
  }, [attemptId, navigate]);

  // Trigger confetti for good scores
  useEffect(() => {
    if (!loading && attempt && exam) {
      const percentage = attempt.percentage || 0;
      const passed = percentage >= (exam.passing_score || 70);
      
      if (passed && percentage >= 80) {
        // Excellent score - big celebration
        const duration = 3000;
        const end = Date.now() + duration;

        const frame = () => {
          confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#6366f1', '#8b5cf6', '#ec4899']
          });
          confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#6366f1', '#8b5cf6', '#ec4899']
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        };
        frame();
      } else if (passed) {
        // Just passed - simple confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#8b5cf6', '#ec4899']
        });
      }
    }
  }, [loading, attempt, exam]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center animated-bg">
        <Brain className="w-16 h-16 text-primary animate-pulse" />
      </div>
    );
  }

  const percentage = attempt?.percentage || 0;
  const passed = percentage >= (exam?.passing_score || 70);
  const correctCount = attempt?.correct_answers || 0;
  const totalQuestions = attempt?.total_questions || 0;

  return (
    <div className="min-h-screen animated-bg pb-20">
      {/* Header */}
      <header className="glass-card border-b border-primary/20">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="ghost"
            size="sm"
            className="hover:bg-primary/10"
          >
            <ArrowLeft className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl">
        {/* Score Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className={`glass-card mb-6 sm:mb-8 ${
            passed ? 'border-primary/50' : 'border-destructive/50'
          }`}>
            <CardContent className="p-6 sm:p-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mb-4 sm:mb-6"
              >
                {passed ? (
                  <Trophy className="w-16 h-16 sm:w-24 sm:h-24 text-primary mx-auto pulse-glow" />
                ) : (
                  <XCircle className="w-16 h-16 sm:w-24 sm:h-24 text-destructive mx-auto" />
                )}
              </motion.div>

              <h1 className="text-2xl sm:text-4xl font-display mb-2">
                {passed ? 'Congratulations!' : 'Keep Trying!'}
              </h1>
              <p className="text-base sm:text-xl text-muted-foreground mb-6 sm:mb-8">
                {exam?.title}
              </p>

              <div className="max-w-md mx-auto mb-6 sm:mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs sm:text-sm text-muted-foreground">Your Score</span>
                  <span className={`text-xl sm:text-2xl font-display ${
                    passed ? 'gradient-text' : 'text-destructive'
                  }`}>
                    {percentage.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={percentage} 
                  className={`h-2 sm:h-3 ${passed ? '' : '[&>div]:bg-destructive'}`}
                />
                <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                  Passing score: {exam?.passing_score}%
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-md mx-auto mb-6 sm:mb-8">
                <div className="glass-card p-3 sm:p-4">
                  <div className="text-xl sm:text-3xl font-display text-primary">{totalQuestions}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Total</div>
                </div>
                <div className="glass-card p-3 sm:p-4">
                  <div className="text-xl sm:text-3xl font-display text-primary">{correctCount}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Correct</div>
                </div>
                <div className="glass-card p-3 sm:p-4">
                  <div className="text-xl sm:text-3xl font-display text-destructive">{totalQuestions - correctCount}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Wrong</div>
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  onClick={() => navigate('/dashboard')}
                  variant="outline"
                  size="sm"
                  className="border-primary/30"
                >
                  Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Detailed Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-xl sm:text-2xl font-display mb-4 sm:mb-6">Detailed Results</h2>
          
          <div className="space-y-3 sm:space-y-4">
            {answers.map((answer, index) => {
              const question = answer.question;
              const isCorrect = answer.is_correct;

              return (
                <motion.div
                  key={answer.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                >
                  <Card className={`glass-card ${
                    isCorrect ? 'border-primary/30' : 'border-destructive/30'
                  }`}>
                    <CardHeader className="p-4 sm:p-6">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="flex-1 text-sm sm:text-lg leading-relaxed">
                          <span className="text-muted-foreground mr-2">Q{index + 1}.</span>
                          {question.question_text}
                        </CardTitle>
                        {isCorrect ? (
                          <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-destructive flex-shrink-0" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 p-4 sm:p-6 pt-0 sm:pt-0">
                      {['A', 'B', 'C', 'D'].map((option) => {
                        const optionKey = `option_${option.toLowerCase()}` as keyof Question;
                        const optionText = question[optionKey] as string;
                        const isUserAnswer = answer.selected_answer === option;
                        const isCorrectAnswer = question.correct_answer === option;

                        let className = "p-2 sm:p-3 rounded-lg border ";
                        if (isCorrectAnswer) {
                          className += "border-primary/50 bg-primary/10";
                        } else if (isUserAnswer && !isCorrect) {
                          className += "border-destructive/50 bg-destructive/10";
                        } else {
                          className += "border-border/30";
                        }

                        return (
                          <div key={option} className={className}>
                            <div className="flex flex-wrap items-start gap-1 sm:gap-2">
                              <span className="font-display min-w-[20px] sm:min-w-[24px] text-sm sm:text-base">{option}.</span>
                              <span className="flex-1 text-sm sm:text-base">{optionText}</span>
                              {isUserAnswer && !isCorrect && (
                                <span className="text-[10px] sm:text-xs text-destructive whitespace-nowrap">Your answer</span>
                              )}
                              {isCorrectAnswer && (
                                <span className="text-[10px] sm:text-xs text-primary whitespace-nowrap">Correct</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Results;
