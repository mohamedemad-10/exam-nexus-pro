import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Brain, ArrowLeft, Mail, Phone, MapPin, Send, Loader2 } from "lucide-react";

const Contact = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("contact_messages").insert({
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        message: form.message,
      });

      if (error) throw error;

      toast.success("Message sent successfully! We'll get back to you soon.");
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen animated-bg">
      {/* Header */}
      <header className="glass-card border-b border-primary/20 sticky top-0 z-50 backdrop-blur-xl">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3">
            <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-primary pulse-glow" />
            <h1 className="text-xl sm:text-2xl font-display gradient-text">ExamPro</h1>
          </div>
          <Button
            onClick={() => navigate("/")}
            variant="ghost"
            size="sm"
            className="hover:bg-primary/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-16 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h2 className="text-3xl sm:text-5xl font-display gradient-text mb-4">Contact Us</h2>
          <p className="text-sm sm:text-lg text-muted-foreground">
            Have questions? We'd love to hear from you.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass-card border-primary/20">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="font-display text-xl sm:text-2xl">Send us a message</CardTitle>
                <CardDescription className="text-sm">
                  Fill out the form and we'll get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your full name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 234 567 890"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      placeholder="How can we help you?"
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      required
                      rows={5}
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
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Message
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
            className="space-y-6"
          >
            <Card className="glass-card border-secondary/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg mb-1">Email</h3>
                    <a href="mailto:mohamed.emad.deve@gmail.com" className="text-muted-foreground text-sm sm:text-base hover:text-primary transition-colors">
                      mohamed.emad.deve@gmail.com
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-secondary/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
                    <Phone className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg mb-1">Phone</h3>
                    <a href="tel:01558042651" className="text-muted-foreground text-sm sm:text-base hover:text-secondary transition-colors">
                      01558042651
                    </a>
                    <p className="text-muted-foreground text-xs mt-1">Available 24/7</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-secondary/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg mb-1">Address</h3>
                    <p className="text-muted-foreground text-sm sm:text-base">
                      123 Education Street<br />
                      Tech Park, Suite 456<br />
                      San Francisco, CA 94102
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-primary/30">
              <CardContent className="p-6 text-center">
                <Brain className="w-12 h-12 text-primary mx-auto mb-4 pulse-glow" />
                <h3 className="font-display text-xl mb-2">Need immediate help?</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Our support team is available 24/7 to assist you with any questions.
                </p>
                <Button
                  variant="outline"
                  className="border-primary/50 hover:bg-primary/20"
                  onClick={() => navigate("/auth")}
                >
                  Sign in to Dashboard
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
