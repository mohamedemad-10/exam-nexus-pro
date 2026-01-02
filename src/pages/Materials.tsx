import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase, checkIsAdmin } from "@/lib/supabase";
import { 
  Brain, ArrowLeft, BookOpen, Clock, Target, TrendingUp, 
  GraduationCap, Filter, ChevronRight, Sparkles
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Exam = Database['public']['Tables']['exams']['Row'];

const GRADE_OPTIONS = [
  { value: 'all', label: 'All Classes', icon: Sparkles },
  { value: '1sec', label: '1st Secondary', icon: GraduationCap },
  { value: '2sec', label: '2nd Secondary', icon: GraduationCap },
  { value: '3sec', label: '3rd Secondary', icon: GraduationCap },
  { value: 'general', label: 'General', icon: BookOpen },
];

const SUBJECTS = [
  { value: 'all', label: 'All Subjects' },
  { value: 'math', label: 'Mathematics' },
  { value: 'physics', label: 'Physics' },
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'biology', label: 'Biology' },
  { value: 'english', label: 'English' },
  { value: 'arabic', label: 'Arabic' },
  { value: 'history', label: 'History' },
  { value: 'geography', label: 'Geography' },
  { value: 'general', label: 'General' },
];

const Materials = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState(searchParams.get('grade') || 'all');
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') || 'all');

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      setUser(session.user);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (profileData) {
        setProfile(profileData);
        // Set initial grade filter based on user's class
        if (profileData.class && selectedGrade === 'all') {
          setSelectedGrade(profileData.class);
        }
      }

      await loadExams();
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const loadExams = async () => {
    const { data } = await supabase
      .from('exams')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (data) setExams(data);
  };

  const filteredExams = exams.filter(exam => {
    const gradeMatch = selectedGrade === 'all' || 
      (exam as any).grade === selectedGrade || 
      (exam as any).grade === 'general';
    const subjectMatch = selectedSubject === 'all' || 
      (exam as any).subject === selectedSubject ||
      (exam as any).subject === 'general';
    return gradeMatch && subjectMatch;
  });

  const getGradeLabel = (grade: string) => {
    const option = GRADE_OPTIONS.find(g => g.value === grade);
    return option?.label || grade;
  };

  const getSubjectLabel = (subject: string) => {
    const option = SUBJECTS.find(s => s.value === subject);
    return option?.label || subject;
  };

  const handleGradeChange = (grade: string) => {
    setSelectedGrade(grade);
    setSearchParams(prev => {
      if (grade === 'all') {
        prev.delete('grade');
      } else {
        prev.set('grade', grade);
      }
      return prev;
    });
  };

  const handleSubjectChange = (subject: string) => {
    setSelectedSubject(subject);
    setSearchParams(prev => {
      if (subject === 'all') {
        prev.delete('subject');
      } else {
        prev.set('subject', subject);
      }
      return prev;
    });
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
              <Button onClick={() => navigate('/dashboard')} variant="ghost" size="sm" className="shrink-0">
                <ArrowLeft className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <div className="flex items-center gap-2 min-w-0">
                <BookOpen className="w-5 h-5 sm:w-7 sm:h-7 text-primary shrink-0" />
                <h1 className="text-base sm:text-xl font-display gradient-text truncate">Materials</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6"
        >
          <h2 className="text-lg sm:text-2xl font-display mb-1">
            Study <span className="gradient-text">Materials</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Browse exams by class and subject
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4 sm:mb-6 space-y-3"
        >
          {/* Grade Filter */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5" />
              Class
            </label>
            <div className="flex flex-wrap gap-2">
              {GRADE_OPTIONS.map(grade => (
                <Button
                  key={grade.value}
                  variant={selectedGrade === grade.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleGradeChange(grade.value)}
                  className={`h-8 sm:h-9 px-3 text-xs sm:text-sm ${
                    selectedGrade === grade.value 
                      ? 'bg-primary text-primary-foreground' 
                      : 'border-border/50 hover:bg-primary/10'
                  }`}
                >
                  {grade.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" />
              Subject
            </label>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map(subject => (
                <Button
                  key={subject.value}
                  variant={selectedSubject === subject.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSubjectChange(subject.value)}
                  className={`h-7 sm:h-8 px-2.5 text-xs ${
                    selectedSubject === subject.value 
                      ? 'bg-secondary text-secondary-foreground' 
                      : 'border-border/50 hover:bg-secondary/10'
                  }`}
                >
                  {subject.label}
                </Button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Results Count */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xs sm:text-sm text-muted-foreground mb-4"
        >
          {filteredExams.length} exam{filteredExams.length !== 1 ? 's' : ''} found
        </motion.p>

        {/* Exams Grid */}
        {filteredExams.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="glass-card text-center py-10 sm:py-16">
              <CardContent>
                <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-sm sm:text-base text-muted-foreground">
                  No exams found for the selected filters
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setSelectedGrade('all');
                    setSelectedSubject('all');
                    setSearchParams({});
                  }}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredExams.map((exam, index) => (
              <motion.div
                key={exam.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <Card className="glass-card border-primary/20 hover:border-primary/50 transition-all hover:shadow-glow-cyan h-full flex flex-col group cursor-pointer"
                      onClick={() => navigate(`/exam/${exam.id}`)}>
                  <CardHeader className="p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="font-display text-sm sm:text-base line-clamp-2 group-hover:text-primary transition-colors">
                        {exam.title}
                      </CardTitle>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </div>
                    <CardDescription className="line-clamp-2 text-xs sm:text-sm">
                      {exam.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-0 mt-auto">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {(exam as any).grade && (exam as any).grade !== 'general' && (
                        <span className="px-2 py-0.5 text-[10px] sm:text-xs bg-primary/20 text-primary rounded">
                          {getGradeLabel((exam as any).grade)}
                        </span>
                      )}
                      {(exam as any).subject && (exam as any).subject !== 'general' && (
                        <span className="px-2 py-0.5 text-[10px] sm:text-xs bg-secondary/20 text-secondary rounded">
                          {getSubjectLabel((exam as any).subject)}
                        </span>
                      )}
                    </div>
                    
                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {exam.duration_minutes}m
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="w-3.5 h-3.5" />
                        Pass: {exam.passing_score}%
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Materials;
