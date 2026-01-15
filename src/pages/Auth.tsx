import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { getStoredFingerprint } from "@/lib/deviceFingerprint";
import { Brain, Loader2, User, ArrowLeft, GraduationCap, Mail, Lock } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loginId, setLoginId] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherPassword, setTeacherPassword] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      }
    };
    checkUser();
  }, [navigate]);

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const deviceFingerprint = getStoredFingerprint();
      const uppercaseId = loginId.toUpperCase().trim();
      
      // Find the user by their user_id to get the email
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, user_id")
        .eq("user_id", uppercaseId)
        .maybeSingle();

      if (profileError || !profile) {
        toast.error("Invalid User ID");
        setLoading(false);
        return;
      }

      // Check if this device is already registered to another user
      const { data: existingDevice } = await supabase
        .from("device_registrations")
        .select("user_id")
        .eq("device_fingerprint", deviceFingerprint)
        .maybeSingle();

      // Sign in with the email associated with the user_id
      // Password is same as user_id
      const { data, error } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: uppercaseId,
      });
      
      if (error) {
        toast.error("Invalid User ID");
        setLoading(false);
        return;
      }

      if (!data.user) {
        toast.error("Login failed");
        setLoading(false);
        return;
      }

      // Check device restriction
      if (existingDevice && existingDevice.user_id !== data.user.id) {
        await supabase.auth.signOut();
        toast.error("This device is already registered to another account. Contact admin for assistance.");
        setLoading(false);
        return;
      }

      // Register device if not already registered
      if (!existingDevice) {
        await supabase.from("device_registrations").insert({
          user_id: data.user.id,
          device_fingerprint: deviceFingerprint,
        });
      }

      // Record login history
      await supabase.from("login_history").insert({
        user_id: data.user.id,
        device_fingerprint: deviceFingerprint,
      });

      toast.success("Welcome back!");
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || "An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: teacherEmail.trim(),
        password: teacherPassword,
      });

      if (error) {
        toast.error("Invalid email or password");
        setLoading(false);
        return;
      }

      if (!data.user) {
        toast.error("Login failed");
        setLoading(false);
        return;
      }

      // Check if user is admin or teacher
      const { data: roleData } = await supabase
        .rpc('has_admin_access', { _user_id: data.user.id });

      if (!roleData) {
        await supabase.auth.signOut();
        toast.error("Access denied. Teacher/Admin account required.");
        setLoading(false);
        return;
      }

      toast.success("Welcome back, Teacher!");
      navigate('/admin');
    } catch (error: any) {
      toast.error(error.message || "An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col animated-bg">
      {/* Header */}
      <header className="p-3 sm:p-4">
        <Button
          onClick={() => navigate("/")}
          variant="ghost"
          size="sm"
          className="hover:bg-primary/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Home
        </Button>
      </header>

      <div className="flex-1 flex items-center justify-center p-3 sm:p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm sm:max-w-md"
        >
          <div className="text-center mb-5 sm:mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-block"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow-cyan">
                <Brain className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" />
              </div>
            </motion.div>
            <h1 className="text-2xl sm:text-3xl font-display gradient-text mb-1">ExamPro</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Access your examination portal</p>
          </div>

          <Card className="glass-card border-primary/30 shadow-glow-cyan">
            <CardHeader className="p-4 sm:p-6 text-center pb-2">
              <CardTitle className="font-display text-lg sm:text-xl gradient-text">Sign In</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Choose your login method
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-2">
              <Tabs defaultValue="student" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="student" className="text-xs sm:text-sm">
                    <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Student
                  </TabsTrigger>
                  <TabsTrigger value="teacher" className="text-xs sm:text-sm">
                    <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Teacher
                  </TabsTrigger>
                </TabsList>

                {/* Student Login */}
                <TabsContent value="student">
                  <form onSubmit={handleStudentLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-id" className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                        <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                        User ID
                      </Label>
                      <Input
                        id="login-id"
                        type="text"
                        placeholder="e.g., ABC12345"
                        value={loginId}
                        onChange={(e) => setLoginId(e.target.value.toUpperCase())}
                        required
                        className="bg-background/50 border-border/50 focus:border-primary h-12 sm:h-14 text-center font-mono text-lg sm:text-xl tracking-widest uppercase"
                        maxLength={8}
                        autoComplete="off"
                      />
                      <p className="text-xs text-muted-foreground text-center">
                        Your ID was provided by the administrator
                      </p>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full btn-glow bg-gradient-to-r from-primary to-secondary hover:opacity-90 h-11 sm:h-12 text-sm sm:text-base font-semibold"
                      disabled={loading || loginId.length < 8}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        'Sign In as Student'
                      )}
                    </Button>
                  </form>
                </TabsContent>

                {/* Teacher Login */}
                <TabsContent value="teacher">
                  <form onSubmit={handleTeacherLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="teacher-email" className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                        <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary" />
                        Email
                      </Label>
                      <Input
                        id="teacher-email"
                        type="email"
                        placeholder="teacher@example.com"
                        value={teacherEmail}
                        onChange={(e) => setTeacherEmail(e.target.value)}
                        required
                        className="bg-background/50 border-border/50 focus:border-secondary h-10 sm:h-11"
                        autoComplete="email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="teacher-password" className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                        <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary" />
                        Password
                      </Label>
                      <Input
                        id="teacher-password"
                        type="password"
                        placeholder="••••••••"
                        value={teacherPassword}
                        onChange={(e) => setTeacherPassword(e.target.value)}
                        required
                        className="bg-background/50 border-border/50 focus:border-secondary h-10 sm:h-11"
                        autoComplete="current-password"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full btn-glow bg-gradient-to-r from-secondary to-primary hover:opacity-90 h-11 sm:h-12 text-sm sm:text-base font-semibold"
                      disabled={loading || !teacherEmail || !teacherPassword}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        'Sign In as Teacher'
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-xs sm:text-sm text-muted-foreground mt-4 sm:mt-6 px-4"
          >
            Don't have an account?{" "}
            <Button variant="link" className="p-0 h-auto text-primary" onClick={() => navigate('/contact')}>
              Contact us
            </Button>{" "}
            to request your User ID.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
