import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Brain, Clock, Shield, Target, TrendingUp, Zap, CheckCircle, MessageSquare } from "lucide-react";
import { supabase } from "@/lib/supabase";

const Index = () => {
  const navigate = useNavigate();
  const [testimonials, setTestimonials] = useState<any[]>([]);

  useEffect(() => {
    const loadTestimonials = async () => {
      const { data } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(3);
      if (data) setTestimonials(data);
    };
    loadTestimonials();
  }, []);

  const features = [
    {
      icon: <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />,
      title: "Smart Assessment",
      description: "AI-powered exam system with intelligent question selection"
    },
    {
      icon: <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-secondary" />,
      title: "Timed Exams",
      description: "Real-time countdown with automatic submission"
    },
    {
      icon: <Target className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />,
      title: "Instant Results",
      description: "Get your scores immediately after submission"
    },
    {
      icon: <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-secondary" />,
      title: "Secure Platform",
      description: "Enterprise-grade security for your data"
    },
    {
      icon: <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />,
      title: "Progress Tracking",
      description: "Monitor your performance over time"
    },
    {
      icon: <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-secondary" />,
      title: "Fast & Responsive",
      description: "Lightning-fast exam delivery on any device"
    },
  ];

  // Default testimonials if none from database
  const defaultTestimonials = [
    {
      name: "Ahmed Mohamed",
      role: "Student - 3 Sec",
      content: "ExamPro has revolutionized how we take exams. The platform is intuitive and reliable.",
      avatar: "AM"
    },
    {
      name: "Sara Hassan",
      role: "Student - 2 Sec",
      content: "The analytics and instant results are outstanding. It saves so much time.",
      avatar: "SH"
    },
    {
      name: "Omar Ali",
      role: "Student - 1 Sec",
      content: "Perfect for practice. The instant results feature is a game-changer.",
      avatar: "OA"
    },
  ];

  const displayTestimonials = testimonials.length > 0 ? testimonials : defaultTestimonials;

  return (
    <div className="min-h-screen animated-bg overflow-x-hidden">
      {/* Navigation */}
      <nav className="glass-card border-b border-primary/20 sticky top-0 z-50 backdrop-blur-xl">
        <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-primary pulse-glow" />
            <h1 className="text-lg sm:text-2xl font-display gradient-text">ExamPro</h1>
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
            <Button 
              onClick={() => navigate('/auth')}
              variant="ghost"
              size="sm"
              className="hover:bg-primary/10 h-8 sm:h-9 px-2 sm:px-3"
            >
              Sign In
            </Button>
            <Button 
              onClick={() => navigate('/auth')}
              size="sm"
              className="btn-glow bg-primary hover:bg-primary/90 h-8 sm:h-9 px-3 sm:px-4"
            >
              <span className="hidden sm:inline">Get Started</span>
              <span className="sm:hidden">Start</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-3 sm:px-4 py-10 sm:py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <h2 className="text-2xl sm:text-4xl lg:text-6xl font-display mb-3 sm:mb-6 leading-tight">
              The Future of{" "}
              <span className="gradient-text">Online Exams</span>
            </h2>
            <p className="text-sm sm:text-lg text-muted-foreground mb-5 sm:mb-8 max-w-xl mx-auto lg:mx-0">
              Secure, intelligent, and lightning-fast examination platform designed for the modern era.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Button 
                onClick={() => navigate('/auth')}
                className="btn-glow bg-primary hover:bg-primary/90 h-11 sm:h-12 px-6 sm:px-8"
              >
                Start Exam
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/auth')}
                className="border-secondary/50 hover:bg-secondary/20 h-11 sm:h-12 px-6 sm:px-8"
              >
                Admin Login
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mt-5 sm:mt-8 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span>No Setup Required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span>Instant Results</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="glass-card p-6 sm:p-8 border-primary/30 float-animation">
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-primary/30 rounded-full mb-2"></div>
                    <div className="h-2 bg-primary/20 rounded-full w-2/3"></div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                    <Target className="w-5 h-5 sm:w-6 sm:h-6 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-secondary/30 rounded-full mb-2"></div>
                    <div className="h-2 bg-secondary/20 rounded-full w-3/4"></div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-primary/30 rounded-full mb-2"></div>
                    <div className="h-2 bg-primary/20 rounded-full w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-3 sm:px-4 py-10 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-12"
        >
          <h3 className="text-xl sm:text-3xl font-display mb-2 sm:mb-4">Powerful Features</h3>
          <p className="text-sm sm:text-lg text-muted-foreground">Everything you need for modern assessments</p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass-card border-primary/20 hover:border-primary/50 transition-all h-full hover:shadow-glow-cyan">
                <CardContent className="p-4 sm:p-6">
                  <div className="mb-3 pulse-glow inline-block">{feature.icon}</div>
                  <h4 className="text-sm sm:text-lg font-display mb-1 sm:mb-2">{feature.title}</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-3 sm:px-4 py-10 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-12"
        >
          <h3 className="text-xl sm:text-3xl font-display mb-2 sm:mb-4">Loved by Thousands</h3>
          <p className="text-sm sm:text-lg text-muted-foreground">See what our users have to say</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {displayTestimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass-card border-secondary/20 h-full">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-3 sm:mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-primary flex items-center justify-center text-sm sm:text-lg font-display shrink-0">
                      {testimonial.avatar}
                    </div>
                    <div className="min-w-0">
                      <h5 className="font-medium text-sm sm:text-base truncate">{testimonial.name}</h5>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground italic line-clamp-3">"{testimonial.content}"</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-3 sm:px-4 py-10 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card border-primary/30 p-6 sm:p-10 text-center"
        >
          <h3 className="text-xl sm:text-3xl font-display mb-2 sm:mb-4">Ready to Get Started?</h3>
          <p className="text-sm sm:text-lg text-muted-foreground mb-5 sm:mb-8">
            Join thousands of users taking exams on ExamPro today
          </p>
          <Button 
            onClick={() => navigate('/auth')}
            className="btn-glow bg-primary hover:bg-primary/90 h-11 sm:h-12 px-8 sm:px-12"
          >
            Start Your First Exam
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-primary/20 mt-10 sm:mt-16">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              <span className="font-display text-sm">ExamPro</span>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/contact')}
                className="text-muted-foreground hover:text-primary h-8 px-2"
              >
                Contact
              </Button>
              <p className="text-xs text-muted-foreground">
                © 2024 ExamPro
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;