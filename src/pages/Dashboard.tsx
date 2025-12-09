import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase, signOut, checkIsAdmin } from "@/lib/supabase";
import { Brain, Clock, Target, TrendingUp, LogOut, Shield, BookOpen, MessageSquare } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Exam = Database['public']['Tables']['exams']['Row'];
type Attempt = Database['public']['Tables']['user_exam_attempts']['Row'];

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [exams, setExams] = useState<Exam[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      setUser(session.user);

      // Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (profileData) setProfile(profileData);

      // Check admin status
      const adminStatus = await checkIsAdmin(session.user.id);
      setIsAdmin(adminStatus);

      // Fetch active exams
      const { data: examsData } = await supabase
        .from('exams')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (examsData) setExams(examsData);

      // Fetch user attempts
      const { data: attemptsData } = await supabase
        .from('user_exam_attempts')
        .select('*')
        .eq('user_id', session.user.id)
        .order('started_at', { ascending: false })
        .limit(5);

      if (attemptsData) setAttempts(attemptsData);

      setLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate('/auth');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out successfully");
      navigate('/');
    }
  };

  const handleStartExam = (examId: string) => {
    navigate(`/exam/${examId}`);
  };

  const getGradeLabel = (grade: string) => {
    switch(grade) {
      case '3prp': return '3 Prep';
      case '1sec': return '1 Sec';
      case '2sec': return '2 Sec';
      case '3sec': return '3 Sec';
      case 'general': return 'General';
      default: return grade;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center animated-bg">
        <Brain className="w-12 h-12 sm:w-16 sm:h-16 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-bg">
      {/* Header */}
      <header className="glass-card border-b border-primary/20 sticky top-0 z-50 backdrop-blur-xl">
        <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-4">
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-primary pulse-glow shrink-0" />
              <h1 className="text-base sm:text-2xl font-display gradient-text truncate">ExamPro</h1>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-3">
              <Button
                onClick={() => navigate('/contact')}
                variant="ghost"
                size="sm"
                className="hover:bg-primary/10 h-8 sm:h-9 px-2 sm:px-3"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Contact</span>
              </Button>
              {isAdmin && (
                <Button
                  onClick={() => navigate('/admin')}
                  variant="outline"
                  size="sm"
                  className="border-secondary/50 hover:bg-secondary/20 h-8 sm:h-9 px-2 sm:px-3"
                >
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline ml-2">Admin</span>
                </Button>
              )}
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-primary/50 hover:bg-primary/20 h-8 sm:h-9 px-2 sm:px-3"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <h2 className="text-xl sm:text-3xl font-display mb-1 sm:mb-2">
            Welcome, <span className="gradient-text">
              {profile?.full_name || user?.email?.split('@')[0]}
            </span>!
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {profile?.class && (
              <span className="inline-block px-2.5 py-1 bg-secondary/20 text-secondary rounded text-xs font-medium">
                {getGradeLabel(profile.class)}
              </span>
            )}
            <p className="text-xs sm:text-sm text-muted-foreground">
              Choose an exam to start testing your knowledge
            </p>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass-card border-primary/30">
              <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 pb-1 sm:pb-2">
                <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground">Exams</CardTitle>
                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className="text-xl sm:text-3xl font-display gradient-text">{exams.length}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass-card border-secondary/30">
              <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 pb-1 sm:pb-2">
                <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground">Done</CardTitle>
                <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary" />
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className="text-xl sm:text-3xl font-display text-secondary">{attempts.filter(a => a.completed_at).length}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass-card border-primary/30">
              <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 pb-1 sm:pb-2">
                <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground">Avg</CardTitle>
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className="text-xl sm:text-3xl font-display gradient-text">
                  {attempts.length > 0
                    ? Math.round(attempts.reduce((acc, a) => acc + (a.percentage || 0), 0) / attempts.length)
                    : 0}%
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Available Exams */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-lg sm:text-2xl font-display mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            Available Exams
          </h3>

          {exams.length === 0 ? (
            <Card className="glass-card text-center py-8 sm:py-12">
              <CardContent>
                <Brain className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-sm sm:text-base text-muted-foreground">No exams available at the moment</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {exams.map((exam, index) => (
                <motion.div
                  key={exam.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <Card className="glass-card border-primary/20 hover:border-primary/50 transition-all hover:shadow-glow-cyan h-full flex flex-col">
                    <CardHeader className="p-3 sm:p-4">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="font-display text-sm sm:text-base line-clamp-1">{exam.title}</CardTitle>
                        {(exam as any).grade && (exam as any).grade !== 'general' && (
                          <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs bg-secondary/20 text-secondary rounded shrink-0">
                            {getGradeLabel((exam as any).grade)}
                          </span>
                        )}
                      </div>
                      <CardDescription className="line-clamp-2 text-xs sm:text-sm">{exam.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0 mt-auto">
                      <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {exam.duration_minutes}m
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="w-3.5 h-3.5" />
                          {exam.passing_score}%
                        </div>
                      </div>
                      <Button
                        onClick={() => handleStartExam(exam.id)}
                        className="w-full btn-glow bg-primary hover:bg-primary/90 h-9 sm:h-10 text-xs sm:text-sm"
                      >
                        Start Exam
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Attempts */}
        {attempts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8 sm:mt-10"
          >
            <h3 className="text-lg sm:text-2xl font-display mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-secondary" />
              Recent Attempts
            </h3>

            <Card className="glass-card overflow-hidden">
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {attempts.map((attempt) => {
                    const exam = exams.find(e => e.id === attempt.exam_id);
                    return (
                      <div key={attempt.id} 
                           className="p-3 sm:p-4 hover:bg-primary/5 transition-colors cursor-pointer"
                           onClick={() => navigate(`/results/${attempt.id}`)}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-sm sm:text-base truncate">{exam?.title || 'Exam'}</h4>
                            <p className="text-[10px] sm:text-sm text-muted-foreground">
                              {new Date(attempt.started_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <div className={`text-lg sm:text-2xl font-display ${
                              (attempt.percentage || 0) >= (exam?.passing_score || 70)
                                ? 'text-primary'
                                : 'text-destructive'
                            }`}>
                              {attempt.percentage?.toFixed(0)}%
                            </div>
                            <p className="text-[10px] sm:text-sm text-muted-foreground">
                              {attempt.correct_answers}/{attempt.total_questions}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;