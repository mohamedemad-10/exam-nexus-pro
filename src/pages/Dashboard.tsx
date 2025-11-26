import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase, signOut, checkIsAdmin } from "@/lib/supabase";
import { Brain, Clock, Target, TrendingUp, LogOut, Shield, BookOpen } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Exam = Database['public']['Tables']['exams']['Row'];
type Attempt = Database['public']['Tables']['user_exam_attempts']['Row'];

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center animated-bg">
        <Brain className="w-16 h-16 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-bg">
      {/* Header */}
      <header className="glass-card border-b border-primary/20 sticky top-0 z-50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-primary pulse-glow" />
            <h1 className="text-2xl font-display gradient-text">ExamPro</h1>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Button
                onClick={() => navigate('/admin')}
                variant="outline"
                className="border-secondary/50 hover:bg-secondary/20"
              >
                <Shield className="w-4 h-4 mr-2" />
                Admin Panel
              </Button>
            )}
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-primary/50 hover:bg-primary/20"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h2 className="text-4xl font-display mb-2">
            Welcome back, <span className="gradient-text">{user?.email?.split('@')[0]}</span>!
          </h2>
          <p className="text-muted-foreground">Choose an exam to start testing your knowledge</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6 mb-12">
          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
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

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass-card border-secondary/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
                <Target className="w-4 h-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-display text-secondary">{attempts.filter(a => a.completed_at).length}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass-card border-primary/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg Score</CardTitle>
                <TrendingUp className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-display gradient-text">
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
          <h3 className="text-2xl font-display mb-6 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Available Exams
          </h3>

          {exams.length === 0 ? (
            <Card className="glass-card text-center py-12">
              <CardContent>
                <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No exams available at the moment</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exams.map((exam, index) => (
                <motion.div
                  key={exam.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <Card className="glass-card border-primary/20 hover:border-primary/50 transition-all hover:shadow-glow-cyan">
                    <CardHeader>
                      <CardTitle className="font-display">{exam.title}</CardTitle>
                      <CardDescription className="line-clamp-2">{exam.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {exam.duration_minutes} mins
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          Pass: {exam.passing_score}%
                        </div>
                      </div>
                      <Button
                        onClick={() => handleStartExam(exam.id)}
                        className="w-full btn-glow bg-primary hover:bg-primary/90"
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
            className="mt-12"
          >
            <h3 className="text-2xl font-display mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-secondary" />
              Recent Attempts
            </h3>

            <Card className="glass-card">
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {attempts.map((attempt) => {
                    const exam = exams.find(e => e.id === attempt.exam_id);
                    return (
                      <div key={attempt.id} className="p-4 hover:bg-primary/5 transition-colors cursor-pointer"
                           onClick={() => navigate(`/results/${attempt.id}`)}>
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{exam?.title || 'Exam'}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(attempt.started_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className={`text-2xl font-display ${
                              (attempt.percentage || 0) >= (exam?.passing_score || 70)
                                ? 'text-primary'
                                : 'text-destructive'
                            }`}>
                              {attempt.percentage?.toFixed(0)}%
                            </div>
                            <p className="text-sm text-muted-foreground">
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
