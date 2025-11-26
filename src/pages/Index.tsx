import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Brain, Clock, Shield, Target, TrendingUp, Zap, CheckCircle } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Brain className="w-8 h-8 text-primary" />,
      title: "Smart Assessment",
      description: "AI-powered exam system with intelligent question selection"
    },
    {
      icon: <Clock className="w-8 h-8 text-secondary" />,
      title: "Timed Exams",
      description: "Real-time countdown with automatic submission"
    },
    {
      icon: <Target className="w-8 h-8 text-primary" />,
      title: "Instant Results",
      description: "Get your scores immediately after submission"
    },
    {
      icon: <Shield className="w-8 h-8 text-secondary" />,
      title: "Secure Platform",
      description: "Enterprise-grade security for your data"
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-primary" />,
      title: "Progress Tracking",
      description: "Monitor your performance over time"
    },
    {
      icon: <Zap className="w-8 h-8 text-secondary" />,
      title: "Fast & Responsive",
      description: "Lightning-fast exam delivery on any device"
    },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Software Engineer",
      content: "ExamPro has revolutionized how we conduct technical assessments. The platform is intuitive and reliable.",
      avatar: "SJ"
    },
    {
      name: "Michael Chen",
      role: "University Professor",
      content: "The analytics and reporting features are outstanding. It saves me hours of manual grading.",
      avatar: "MC"
    },
    {
      name: "Emily Rodriguez",
      role: "HR Manager",
      content: "Perfect for screening candidates. The instant results feature is a game-changer.",
      avatar: "ER"
    },
  ];

  return (
    <div className="min-h-screen animated-bg">
      {/* Navigation */}
      <nav className="glass-card border-b border-primary/20 sticky top-0 z-50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-primary pulse-glow" />
            <h1 className="text-2xl font-display gradient-text">ExamPro</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => navigate('/auth')}
              variant="ghost"
              className="hover:bg-primary/10"
            >
              Sign In
            </Button>
            <Button 
              onClick={() => navigate('/auth')}
              className="btn-glow bg-primary hover:bg-primary/90"
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-5xl lg:text-7xl font-display mb-6 leading-tight">
              The Future of{" "}
              <span className="gradient-text">Online Exams</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Secure, intelligent, and lightning-fast examination platform designed for the modern era.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg"
                onClick={() => navigate('/auth')}
                className="btn-glow bg-primary hover:bg-primary/90 text-lg px-8"
              >
                Start Exam
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => navigate('/auth')}
                className="border-secondary/50 hover:bg-secondary/20 text-lg px-8"
              >
                Admin Login
              </Button>
            </div>
            <div className="flex items-center gap-6 mt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                <span>No Setup Required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                <span>Instant Results</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="glass-card p-8 border-primary/30 float-animation">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Brain className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-primary/30 rounded-full mb-2"></div>
                    <div className="h-2 bg-primary/20 rounded-full w-2/3"></div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                    <Target className="w-6 h-6 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-secondary/30 rounded-full mb-2"></div>
                    <div className="h-2 bg-secondary/20 rounded-full w-3/4"></div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-primary" />
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
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h3 className="text-4xl font-display mb-4">Powerful Features</h3>
          <p className="text-xl text-muted-foreground">Everything you need for modern assessments</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass-card border-primary/20 hover:border-primary/50 transition-all h-full hover:shadow-glow-cyan">
                <CardContent className="p-6">
                  <div className="mb-4 pulse-glow inline-block">{feature.icon}</div>
                  <h4 className="text-xl font-display mb-2">{feature.title}</h4>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h3 className="text-4xl font-display mb-4">Loved by Thousands</h3>
          <p className="text-xl text-muted-foreground">See what our users have to say</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass-card border-secondary/20 h-full">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-lg font-display">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <h5 className="font-medium">{testimonial.name}</h5>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground italic">"{testimonial.content}"</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card border-primary/30 p-12 text-center"
        >
          <h3 className="text-4xl font-display mb-4">Ready to Get Started?</h3>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of users taking exams on ExamPro today
          </p>
          <Button 
            size="lg"
            onClick={() => navigate('/auth')}
            className="btn-glow bg-primary hover:bg-primary/90 text-lg px-12"
          >
            Start Your First Exam
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-primary/20 mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <Brain className="w-6 h-6 text-primary" />
              <span className="font-display">ExamPro</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 ExamPro. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
