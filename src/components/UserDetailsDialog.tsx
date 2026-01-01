import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { 
  User, BookOpen, Clock, CheckCircle, XCircle, Smartphone, 
  Calendar, TrendingUp, Award, Loader2
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database['public']['Tables']['profiles']['Row'];

interface UserDetailsDialogProps {
  user: Profile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ExamAttempt {
  id: string;
  exam_id: string;
  score: number | null;
  total_questions: number;
  correct_answers: number | null;
  percentage: number | null;
  started_at: string;
  completed_at: string | null;
  time_taken_seconds: number | null;
  exam_title?: string;
}

interface LoginHistoryItem {
  id: string;
  login_at: string;
  device_fingerprint: string | null;
}

interface DeviceRegistration {
  id: string;
  device_fingerprint: string;
  created_at: string;
}

const GRADE_LABELS: Record<string, string> = {
  '3prp': '3 Prep',
  '1sec': '1 Sec',
  '2sec': '2 Sec',
  '3sec': '3 Sec',
  'general': 'General',
};

export const UserDetailsDialog = ({ user, open, onOpenChange }: UserDetailsDialogProps) => {
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([]);
  const [devices, setDevices] = useState<DeviceRegistration[]>([]);

  useEffect(() => {
    if (user && open) {
      loadUserData();
    }
  }, [user, open]);

  const loadUserData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Load exam attempts
      const { data: attemptsData } = await supabase
        .from('user_exam_attempts')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });

      if (attemptsData && attemptsData.length > 0) {
        // Get exam titles
        const examIds = [...new Set(attemptsData.map(a => a.exam_id))];
        const { data: examsData } = await supabase
          .from('exams')
          .select('id, title')
          .in('id', examIds);

        const enrichedAttempts = attemptsData.map(a => ({
          ...a,
          exam_title: examsData?.find(e => e.id === a.exam_id)?.title || 'Unknown Exam'
        }));
        setAttempts(enrichedAttempts);
      } else {
        setAttempts([]);
      }

      // Load login history
      const { data: loginData } = await supabase
        .from('login_history')
        .select('*')
        .eq('user_id', user.id)
        .order('login_at', { ascending: false })
        .limit(50);

      setLoginHistory(loginData || []);

      // Load device registrations
      const { data: devicesData } = await supabase
        .from('device_registrations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setDevices(devicesData || []);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const avgScore = attempts.length > 0
    ? Math.round(attempts.reduce((acc, a) => acc + (a.percentage || 0), 0) / attempts.length)
    : 0;

  const passedExams = attempts.filter(a => (a.percentage || 0) >= 70).length;

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-primary/30 max-w-2xl max-h-[90vh] overflow-hidden mx-2">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            {user.full_name || 'User Details'}
          </DialogTitle>
          <DialogDescription className="flex flex-wrap gap-2 items-center">
            <Badge variant="outline" className="font-mono">{user.user_id}</Badge>
            {user.class && <Badge className="bg-secondary/20 text-secondary">{GRADE_LABELS[user.class] || user.class}</Badge>}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
              <Card className="bg-primary/10 border-primary/30">
                <CardContent className="p-2 sm:p-3 text-center">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 mx-auto text-primary mb-1" />
                  <p className="text-lg sm:text-xl font-display text-primary">{attempts.length}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Attempts</p>
                </CardContent>
              </Card>
              <Card className="bg-secondary/10 border-secondary/30">
                <CardContent className="p-2 sm:p-3 text-center">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mx-auto text-secondary mb-1" />
                  <p className="text-lg sm:text-xl font-display text-secondary">{avgScore}%</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Avg Score</p>
                </CardContent>
              </Card>
              <Card className="bg-primary/10 border-primary/30">
                <CardContent className="p-2 sm:p-3 text-center">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5 mx-auto text-primary mb-1" />
                  <p className="text-lg sm:text-xl font-display text-primary">{passedExams}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Passed</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="exams" className="flex-1">
              <TabsList className="w-full justify-start mb-2">
                <TabsTrigger value="exams" className="text-xs sm:text-sm">Exams</TabsTrigger>
                <TabsTrigger value="logins" className="text-xs sm:text-sm">Logins</TabsTrigger>
                <TabsTrigger value="devices" className="text-xs sm:text-sm">Devices</TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[40vh]">
                <TabsContent value="exams" className="mt-0">
                  {attempts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">No exam attempts yet</p>
                  ) : (
                    <div className="space-y-2">
                      {attempts.map((attempt) => (
                        <Card key={attempt.id} className="border-border/50">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{attempt.exam_title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(attempt.started_at)}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <div className={`text-lg font-display flex items-center gap-1 ${
                                  (attempt.percentage || 0) >= 70 ? 'text-primary' : 'text-destructive'
                                }`}>
                                  {(attempt.percentage || 0) >= 70 ? (
                                    <CheckCircle className="w-4 h-4" />
                                  ) : (
                                    <XCircle className="w-4 h-4" />
                                  )}
                                  {attempt.percentage?.toFixed(0)}%
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {attempt.correct_answers}/{attempt.total_questions} • {formatDuration(attempt.time_taken_seconds)}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="logins" className="mt-0">
                  {loginHistory.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">No login history</p>
                  ) : (
                    <div className="space-y-2">
                      {loginHistory.map((login) => (
                        <Card key={login.id} className="border-border/50">
                          <CardContent className="p-3 flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm">{formatDate(login.login_at)}</p>
                              <p className="text-xs text-muted-foreground font-mono truncate">
                                {login.device_fingerprint?.substring(0, 16)}...
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="devices" className="mt-0">
                  {devices.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">No registered devices</p>
                  ) : (
                    <div className="space-y-2">
                      {devices.map((device) => (
                        <Card key={device.id} className="border-border/50">
                          <CardContent className="p-3 flex items-center gap-3">
                            <Smartphone className="w-4 h-4 text-secondary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground font-mono truncate">
                                {device.device_fingerprint}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Registered: {formatDate(device.created_at)}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>

            {/* User Info */}
            <div className="border-t border-border/50 pt-3 mt-2">
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>
                  <span className="text-foreground font-medium">Email:</span> {user.email}
                </div>
                <div>
                  <span className="text-foreground font-medium">Phone:</span> {user.phone || '-'}
                </div>
                <div className="col-span-2">
                  <span className="text-foreground font-medium">Joined:</span> {formatDate(user.created_at)}
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};