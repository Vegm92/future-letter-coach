import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Mail, Target, Sparkles, Clock, Users } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";
import { HeroSectionProps } from "@/shared/types";

const HeroSection = ({ onGetStarted }: HeroSectionProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI-Powered Goal Coaching
                </Badge>
                
                <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
                    FutureLetter AI
                  </span>
                  <br />
                  <span className="text-foreground">
                    Goal-Based Email Coach
                  </span>
                </h1>
                
                <p className="text-xl text-muted-foreground leading-relaxed max-w-md">
                  Self-growth journaling meets AI nudges. Designed for solopreneurs & business owners to write future letters, track goals, and get personalized motivation.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={onGetStarted} 
                  variant="hero" 
                  size="xl"
                  className="group"
                >
                  Get Started Free
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                
                <Button variant="outline" size="xl">
                  Watch Demo
                </Button>
              </div>

              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>500+ active users</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4" />
                  <span>1000+ goals achieved</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                <img
                  src={heroImage}
                  alt="Person writing a future letter"
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"></div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
                <div className="flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Letter Scheduled</p>
                    <p className="text-xs text-muted-foreground">Delivers in 30 days</p>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-success" />
                  <div>
                    <p className="text-sm font-medium">Goal Enhanced</p>
                    <p className="text-xs text-muted-foreground">AI improved clarity</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Transform your goals into reality with our AI-powered coaching system
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center group hover:shadow-lg transition-all duration-300 hover:scale-105">
              <CardContent className="p-8">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Write Future Letters</h3>
                <p className="text-muted-foreground">
                  Write letters to your future self tied to specific goals. AI enhances clarity and creates milestone breakdowns.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center group hover:shadow-lg transition-all duration-300 hover:scale-105">
              <CardContent className="p-8">
                <div className="bg-success/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-success/20 transition-colors">
                  <Target className="h-8 w-8 text-success" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Track Progress</h3>
                <p className="text-muted-foreground">
                  Automatic milestone reminders and progress tracking keep you motivated and on track toward your goals.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center group hover:shadow-lg transition-all duration-300 hover:scale-105">
              <CardContent className="p-8">
                <div className="bg-warning/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-warning/20 transition-colors">
                  <Sparkles className="h-8 w-8 text-warning" />
                </div>
                <h3 className="text-xl font-semibold mb-3">AI Motivation</h3>
                <p className="text-muted-foreground">
                  Smart nudges and encouragement when you need it most. AI detects inactivity and sends personalized motivation.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-primary/5 to-primary-glow/5 border-primary/20">
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Transform Your Goals?
              </h2>
              <p className="text-muted-foreground mb-8">
                Join hundreds of solopreneurs and business owners who are achieving their goals with FutureLetter AI.
              </p>
              <Button onClick={onGetStarted} variant="hero" size="xl">
                Start Your Journey
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default HeroSection;