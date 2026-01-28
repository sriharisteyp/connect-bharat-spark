import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ArrowLeft, Loader2, Users, Shield, Zap, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { validateEmailForSignup } from '@/utils/tempMailBlocker';
import { supabase } from '@/integrations/supabase/client';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
});

const testimonials = [
  {
    quote: "DesiConnect helped me reconnect with my college friends after years. The experience is so smooth!",
    author: "Rahul Verma",
    role: "Software Engineer, Bangalore",
    avatar: "RV",
  },
  {
    quote: "Finally a platform that understands Indian users. Fast, secure, and beautifully designed.",
    author: "Sneha Kapoor",
    role: "Content Creator, Mumbai",
    avatar: "SK",
  },
  {
    quote: "The privacy features give me confidence to share my thoughts freely. Proud to be part of this community!",
    author: "Arun Nair",
    role: "Teacher, Kochi",
    avatar: "AN",
  },
];

const features = [
  { icon: Users, text: "Join 1M+ Indians" },
  { icon: Shield, text: "Data stays in India" },
  { icon: Zap, text: "Blazing fast" },
];

export default function AuthPage() {
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Redirect if already logged in
  if (user) {
    navigate('/', { replace: true });
    return null;
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      loginSchema.parse({ email, password });
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      toast.error(error.message || 'Failed to sign in');
    } else {
      toast.success('Welcome back!');
      navigate('/');
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;
    const username = formData.get('username') as string;

    // Check for temporary email
    const emailValidation = validateEmailForSignup(email);
    if (!emailValidation.valid) {
      toast.error(emailValidation.error);
      return;
    }

    try {
      signupSchema.parse({ email, password, fullName, username });
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    setLoading(true);
    const { error } = await signUp(email, password, fullName, username);
    setLoading(false);

    if (error) {
      if (error.message?.includes('already registered')) {
        toast.error('This email is already registered. Please sign in instead.');
      } else {
        toast.error(error.message || 'Failed to sign up');
      }
    } else {
      toast.success('Account created! Welcome to DesiConnect!');
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Testimonials (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[55%] bg-gradient-hero relative overflow-hidden">
        {/* Pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA4IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50" />
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-primary-foreground/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 backdrop-blur flex items-center justify-center">
              <Globe className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-primary-foreground">DesiConnect</span>
          </Link>

          {/* Testimonial Carousel */}
          <div className="flex-1 flex flex-col justify-center max-w-lg">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <p className="text-2xl lg:text-3xl font-medium text-primary-foreground leading-relaxed">
                  "{testimonials[currentTestimonial].quote}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary-foreground/20 backdrop-blur flex items-center justify-center text-primary-foreground font-bold text-lg">
                    {testimonials[currentTestimonial].avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-primary-foreground text-lg">
                      {testimonials[currentTestimonial].author}
                    </p>
                    <p className="text-primary-foreground/70">
                      {testimonials[currentTestimonial].role}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Carousel dots */}
            <div className="flex gap-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentTestimonial
                      ? 'w-8 bg-primary-foreground'
                      : 'bg-primary-foreground/40 hover:bg-primary-foreground/60'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="flex gap-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-primary-foreground/80">
                <feature.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex flex-col min-h-screen bg-background">
        {/* Mobile header */}
        <div className="lg:hidden p-4 flex items-center justify-between border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-hero flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">DesiConnect</span>
          </div>
          <div className="w-5" /> {/* Spacer for centering */}
        </div>

        {/* Form container */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md space-y-8">
            {/* Header */}
            <div className="text-center lg:text-left">
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                Welcome to DesiConnect
              </h1>
              <p className="text-muted-foreground">
                Connect with friends across India
              </p>
            </div>

            {/* Auth Tabs */}
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="text-base">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="text-base">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-0">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
                    <Input 
                      id="login-email" 
                      name="email" 
                      type="email" 
                      placeholder="you@example.com" 
                      required 
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                    <Input 
                      id="login-password" 
                      name="password" 
                      type="password" 
                      placeholder="••••••••" 
                      required 
                      className="h-12"
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 text-base bg-gradient-hero hover:opacity-90" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Signing in...
                      </>
                    ) : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-0">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="text-sm font-medium">Full Name</Label>
                      <Input 
                        id="signup-name" 
                        name="fullName" 
                        placeholder="Your name" 
                        required 
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-username" className="text-sm font-medium">Username</Label>
                      <Input 
                        id="signup-username" 
                        name="username" 
                        placeholder="username" 
                        required 
                        className="h-12"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
                    <Input 
                      id="signup-email" 
                      name="email" 
                      type="email" 
                      placeholder="you@example.com" 
                      required 
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
                    <Input 
                      id="signup-password" 
                      name="password" 
                      type="password" 
                      placeholder="••••••••" 
                      required 
                      className="h-12"
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 text-base bg-gradient-hero hover:opacity-90" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Creating account...
                      </>
                    ) : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Terms */}
            <p className="text-xs text-center text-muted-foreground">
              By continuing, you agree to our{' '}
              <a href="#" className="text-primary hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
              <br />
              <span className="text-muted-foreground/70">Your data is stored securely in India.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
