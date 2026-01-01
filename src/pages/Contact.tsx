import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Brain, ArrowLeft, Mail, Phone, MapPin, Send, Loader2, LogOut, Home, LayoutDashboard, UserPlus } from "lucide-react";

const GRADE_OPTIONS = [
  { value: '3prp', label: '3 Prep' },
  { value: '1sec', label: '1 Sec' },
  { value: '2sec', label: '2 Sec' },
  { value: '3sec', label: '3 Sec' },
];

const Contact = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [requestType, setRequestType] = useState<'account' | 'support'>('account');
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    grade: "",
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsLoggedIn(true);
        setRequestType('support');
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email, phone')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setUserName(profile.full_name || '');
          setForm(prev => ({
            ...prev,
            name: profile.full_name || '',
            email: profile.email || '',
            phone: profile.phone || '',
          }));
        }
      }
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    navigate('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validation for account request
    if (requestType === 'account') {
      const nameParts = form.name.trim().split(/\s+/);
      if (nameParts.length < 3) {
        toast.error("Please enter your full name (at least 3 names)");
        setLoading(false);
        return;
      }
      if (!form.grade) {
        toast.error("Please select your grade");
        setLoading(false);
        return;
      }
    }

    try {
      const messageContent = requestType === 'account' 
        ? `[ACCOUNT REQUEST]\nGrade: ${GRADE_OPTIONS.find(g => g.value === form.grade)?.label || form.grade}\n\n${form.message || 'I would like to request a new account.'}`
        : form.message;

      const { error } = await supabase.from("contact_messages").insert({
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        message: messageContent,
      });

      if (error) throw error;

      toast.success(
        requestType === 'account' 
          ? "Account request submitted! You will receive your login ID soon." 
          : "Message sent successfully! We'll get back to you soon."
      );
      setForm(prev => ({ ...prev, message: "", grade: "" }));
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Failed to send. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen animated-bg">
      {/* Header */}
      <header className="glass-card border-b border-primary/20 sticky top-0 z-50 backdrop-blur-xl">
        <div className="container mx-auto px-3 sm:px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3">
            <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-primary pulse-glow" />
            <h1 className="text-lg sm:text-2xl font-display gradient-text">ExamPro</h1>
          </div>
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <>
                <Button
                  onClick={() => navigate('/dashboard')}
                  variant="outline"
                  size="sm"
                  className="border-primary/50 hover:bg-primary/20 h-8 sm:h-9 px-2 sm:px-3"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline ml-2">Dashboard</span>
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  className="hover:bg-destructive/10 text-destructive h-8 sm:h-9 px-2 sm:px-3"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline ml-2">Logout</span>
                </Button>
              </>
            ) : (
              <Button
                onClick={() => navigate("/")}
                variant="ghost"
                size="sm"
                className="hover:bg-primary/10 h-8 sm:h-9"
              >
                <Home className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Home</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-10 max-w-6xl">
        {/* Welcome for logged in users */}
        {isLoggedIn && userName && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 sm:mb-6 p-3 sm:p-4 glass-card border-primary/30 rounded-xl"
          >
            <p className="text-sm text-muted-foreground">
              Hello, <span className="text-primary font-medium">{userName}</span>! How can we help you?
            </p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 sm:mb-8"
        >
          <h2 className="text-2xl sm:text-4xl font-display gradient-text mb-2">
            {isLoggedIn ? 'Get Support' : 'Get Started'}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            {isLoggedIn 
              ? 'Need help? Send us a message.' 
              : 'Request your account or get in touch with us.'}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass-card border-primary/20">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="font-display text-lg sm:text-xl flex items-center gap-2">
                  {!isLoggedIn && requestType === 'account' ? (
                    <>
                      <UserPlus className="w-5 h-5 text-primary" />
                      Request Account
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5 text-primary" />
                      Send Message
                    </>
                  )}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {!isLoggedIn && requestType === 'account'
                    ? "Fill in your details to receive your login ID"
                    : "We'll respond as soon as possible"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                {/* Request Type Toggle - Only for non-logged in users */}
                {!isLoggedIn && (
                  <div className="flex gap-2 mb-4">
                    <Button
                      type="button"
                      variant={requestType === 'account' ? 'default' : 'outline'}
                      className={`flex-1 h-9 text-xs sm:text-sm ${requestType === 'account' ? 'btn-glow' : ''}`}
                      onClick={() => setRequestType('account')}
                    >
                      <UserPlus className="w-4 h-4 mr-1.5" />
                      New Account
                    </Button>
                    <Button
                      type="button"
                      variant={requestType === 'support' ? 'default' : 'outline'}
                      className={`flex-1 h-9 text-xs sm:text-sm ${requestType === 'support' ? 'btn-glow' : ''}`}
                      onClick={() => setRequestType('support')}
                    >
                      <Mail className="w-4 h-4 mr-1.5" />
                      Support
                    </Button>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-xs sm:text-sm">
                        Full Name * {requestType === 'account' && !isLoggedIn && <span className="text-muted-foreground">(3 names)</span>}
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder={requestType === 'account' ? "First Middle Last" : "Your name"}
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                        className="bg-background/50 h-10 text-sm"
                        readOnly={isLoggedIn && !!form.name}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs sm:text-sm">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                        className="bg-background/50 h-10 text-sm"
                        readOnly={isLoggedIn && !!form.email}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-xs sm:text-sm">Phone *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="01234567890"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        required={requestType === 'account'}
                        className="bg-background/50 h-10 text-sm"
                      />
                    </div>
                    {requestType === 'account' && !isLoggedIn && (
                      <div className="space-y-1.5">
                        <Label className="text-xs sm:text-sm">Grade *</Label>
                        <Select value={form.grade} onValueChange={(v) => setForm({ ...form, grade: v })}>
                          <SelectTrigger className="bg-background/50 h-10 text-sm">
                            <SelectValue placeholder="Select your grade" />
                          </SelectTrigger>
                          <SelectContent>
                            {GRADE_OPTIONS.map(g => (
                              <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="message" className="text-xs sm:text-sm">
                      {requestType === 'account' && !isLoggedIn ? 'Additional Notes (Optional)' : 'Message *'}
                    </Label>
                    <Textarea
                      id="message"
                      placeholder={requestType === 'account' && !isLoggedIn 
                        ? "Any additional information..." 
                        : "How can we help you?"}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      required={requestType === 'support' || isLoggedIn}
                      rows={3}
                      className="bg-background/50 text-sm resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full btn-glow bg-primary hover:bg-primary/90 h-10 sm:h-11"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        {requestType === 'account' && !isLoggedIn ? 'Request Account' : 'Send Message'}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3 sm:space-y-4"
          >
            <Card className="glass-card border-secondary/20">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-sm sm:text-base mb-1">Email</h3>
                    <a href="mailto:mohamed.emad.deve@gmail.com" className="text-muted-foreground text-xs sm:text-sm hover:text-primary transition-colors break-all">
                      mohamed.emad.deve@gmail.com
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-secondary/20">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm sm:text-base mb-1">Phone</h3>
                    <a href="tel:01558042651" className="text-muted-foreground text-xs sm:text-sm hover:text-secondary transition-colors">
                      01558042651
                    </a>
                    <p className="text-muted-foreground text-[10px] sm:text-xs mt-1">Available 24/7</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-secondary/20">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm sm:text-base mb-1">Location</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm">
                      Egypt
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {!isLoggedIn && (
              <Card className="glass-card border-primary/30">
                <CardContent className="p-4 sm:p-5 text-center">
                  <Brain className="w-10 h-10 sm:w-12 sm:h-12 text-primary mx-auto mb-3 pulse-glow" />
                  <h3 className="font-display text-sm sm:text-base mb-2">Already have an account?</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm mb-3">
                    Sign in with your User ID
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-primary/50 hover:bg-primary/20"
                    onClick={() => navigate("/auth")}
                  >
                    Sign In
                  </Button>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Contact;