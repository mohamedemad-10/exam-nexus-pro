import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { getStoredFingerprint } from "@/lib/deviceFingerprint";
import { Brain, Loader2, User, Lock, ArrowLeft } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loginId, setLoginId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const deviceFingerprint = getStoredFingerprint();
      
      // First, find the user by their user_id to get the email
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, user_id")
        .eq("user_id", loginId.toUpperCase())
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: loginPassword,
      });
      
      if (error) {
        toast.error("Invalid credentials");
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

      toast.success("Welcome back!");
      navigate('/dashboard');
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
            <CardHeader className="p-4 sm:p-6 text-center">
              <CardTitle className="font-display text-lg sm:text-xl gradient-text">Sign In</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Enter your User ID and password
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <form onSubmit={handleLogin} className="space-y-4">
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
                    className="bg-background/50 border-border/50 focus:border-primary h-10 sm:h-11 text-center font-mono text-base sm:text-lg tracking-widest uppercase"
                    maxLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                    <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary" />
                    Password
                  </Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="bg-background/50 border-border/50 focus:border-primary h-10 sm:h-11"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full btn-glow bg-gradient-to-r from-primary to-secondary hover:opacity-90 h-10 sm:h-11 text-sm sm:text-base font-semibold"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-xs sm:text-sm text-muted-foreground mt-4 sm:mt-6 px-4"
          >
            Don't have an account? Contact your administrator to get your User ID and password.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;