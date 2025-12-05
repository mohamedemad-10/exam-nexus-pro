import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { signIn, supabase } from "@/lib/supabase";
import { getStoredFingerprint } from "@/lib/deviceFingerprint";
import { Brain, Loader2 } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
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
      
      // Check if this device is already registered to another user
      const { data: existingDevice } = await supabase
        .from("device_registrations")
        .select("user_id, profiles(email)")
        .eq("device_fingerprint", deviceFingerprint)
        .maybeSingle();

      const { data, error } = await signIn(loginEmail, loginPassword);
      
      if (error) {
        toast.error(error.message);
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
    <div className="min-h-screen flex items-center justify-center animated-bg p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-6 sm:mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-block"
          >
            <Brain className="w-12 h-12 sm:w-16 sm:h-16 text-primary mx-auto mb-3 sm:mb-4 pulse-glow" />
          </motion.div>
          <h1 className="text-3xl sm:text-4xl font-display gradient-text mb-1 sm:mb-2">ExamPro</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Access your examination portal</p>
        </div>

        <Card className="glass-card border-primary/20">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="font-display text-xl sm:text-2xl">Sign In</CardTitle>
            <CardDescription className="text-sm">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="your@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className="bg-background/50"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full btn-glow bg-primary hover:bg-primary/90"
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

        <p className="text-center text-sm text-muted-foreground mt-6">
          Contact administrator if you need an account
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
