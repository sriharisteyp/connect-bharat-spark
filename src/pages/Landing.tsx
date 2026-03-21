import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Users, MessageCircle, Shield, Globe, ArrowRight, Sparkles, Heart, Zap, Play, Camera, Bell, Star } from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Connect Globally',
    description: 'Join a vibrant community sharing stories, ideas, and moments.',
  },
  {
    icon: MessageCircle,
    title: 'Real Conversations',
    description: 'Private messaging with voice notes, images & typing indicators.',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Your data is secured. Built with security and trust at the core.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Optimized for speed. Works smoothly on any connection.',
  },
  {
    icon: Camera,
    title: 'Stories & Reels',
    description: 'Share 24-hour stories and short video reels like never before.',
  },
  {
    icon: Bell,
    title: 'Stay Updated',
    description: 'Real-time notifications for likes, comments, follows & messages.',
  },
];

const stats = [
  { value: '1M+', label: 'Active Users' },
  { value: '500K+', label: 'Daily Posts' },
  { value: '150+', label: 'Countries' },
  { value: '99.9%', label: 'Uptime' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-hero flex items-center justify-center shadow-md">
                <Globe className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground tracking-tight">Linko</span>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/auth">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link to="/auth">
                <Button size="sm" className="bg-gradient-hero hover:opacity-90 shadow-md">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-16 sm:pt-36 sm:pb-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-20 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 -right-32 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px]" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-center lg:text-left"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20"
              >
                <Sparkles className="w-4 h-4" />
                Your Social Universe
              </motion.div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-foreground leading-[1.1] mb-6 tracking-tight">
                Where you <span className="text-primary">connect</span>,
                <br className="hidden sm:block" />
                share & <span className="bg-gradient-hero bg-clip-text text-transparent">shine</span>
              </h1>
              
              <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Stories, reels, group chats, voice messages & real-time conversations — all in one place. 
                Built for the community, by the community.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link to="/auth">
                  <Button size="lg" className="bg-gradient-hero hover:opacity-90 w-full sm:w-auto gap-2 text-base h-12 px-8 shadow-lg shadow-primary/20">
                    Join Linko
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/about">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2 text-base h-12 px-8">
                    <Star className="w-5 h-5 text-accent" />
                    Meet the Creator
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Right: Phone mockup */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative hidden lg:flex justify-center"
            >
              <div className="relative">
                <div className="w-[280px] h-[560px] bg-card rounded-[3rem] border-[6px] border-foreground/10 shadow-2xl overflow-hidden relative">
                  <div className="h-10 bg-gradient-hero flex items-center justify-center">
                    <div className="w-20 h-5 bg-foreground/20 rounded-full" />
                  </div>
                  
                  <div className="p-3 space-y-3">
                    <div className="flex gap-2">
                      {[1, 2, 3, 4].map((_, i) => (
                        <motion.div 
                          key={i}
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                          className="w-12 h-12 rounded-full bg-gradient-hero opacity-60"
                        />
                      ))}
                    </div>
                    
                    <div className="bg-muted/50 rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/30" />
                        <div className="flex-1">
                          <div className="h-2.5 w-20 bg-foreground/15 rounded" />
                          <div className="h-2 w-14 bg-foreground/10 rounded mt-1" />
                        </div>
                      </div>
                      <div className="h-28 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg" />
                      <div className="flex gap-3">
                        <Heart className="w-4 h-4 text-accent fill-accent" />
                        <MessageCircle className="w-4 h-4 text-muted-foreground" />
                        <Play className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="bg-muted/50 rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-accent/30" />
                        <div className="flex-1">
                          <div className="h-2.5 w-24 bg-foreground/15 rounded" />
                          <div className="h-2 w-16 bg-foreground/10 rounded mt-1" />
                        </div>
                      </div>
                      <div className="h-2.5 w-full bg-foreground/10 rounded" />
                      <div className="h-2.5 w-3/4 bg-foreground/10 rounded" />
                    </div>
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-card border-t border-border flex items-center justify-around px-4">
                    {[Globe, Users, Camera, Bell, MessageCircle].map((Icon, i) => (
                      <Icon key={i} className={`w-4 h-4 ${i === 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                    ))}
                  </div>
                </div>

                <motion.div
                  animate={{ y: [0, -8, 0], rotate: [0, 3, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-4 -right-16 bg-card rounded-2xl shadow-xl p-3 border border-border"
                >
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-accent fill-accent" />
                    <span className="font-bold text-sm text-foreground">2.8K</span>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 6, 0], rotate: [0, -2, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute -bottom-2 -left-20 bg-primary rounded-2xl shadow-xl p-3"
                >
                  <div className="flex items-center gap-2 text-primary-foreground">
                    <MessageCircle className="w-4 h-4" />
                    <span className="font-medium text-sm">New message!</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-muted/40 border-y border-border/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl sm:text-4xl font-extrabold bg-gradient-hero bg-clip-text text-transparent">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4 tracking-tight">
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              A complete social experience — crafted for you.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="group bg-card rounded-2xl p-6 border border-border hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Chat showcase */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-6 tracking-tight">
                Chat like you're <span className="text-primary">right there</span>
              </h2>
              <div className="space-y-4">
                {[
                  { icon: MessageCircle, text: 'Send voice notes, images & text in real-time' },
                  { icon: Users, text: 'Group chats — join CRACK HEADS and meet everyone!' },
                  { icon: Bell, text: 'Never miss a message with instant notifications' },
                  { icon: Shield, text: 'End-to-end privacy — your chats stay yours' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 + 0.2 }}
                    className="flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-foreground font-medium">{item.text}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-card rounded-2xl border border-border p-6 shadow-xl"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">A</div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary border-2 border-card" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">Arjun Patel</p>
                    <p className="text-xs text-primary">Online</p>
                  </div>
                </div>
                
                <div className="space-y-2.5 py-2">
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2 max-w-[75%]">
                      <p className="text-sm text-foreground">Hey! Did you see the new reel I posted? 🎬</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-primary rounded-2xl rounded-br-sm px-4 py-2 max-w-[75%]">
                      <p className="text-sm text-primary-foreground">Yes! It was amazing! 🔥🔥</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[75%]">
                      <div className="flex items-center gap-2">
                        <Play className="w-4 h-4 text-primary" />
                        <div className="flex-1 h-1 bg-primary/30 rounded-full overflow-hidden">
                          <div className="h-full w-2/3 bg-primary rounded-full" />
                        </div>
                        <span className="text-xs text-muted-foreground">0:12</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-primary rounded-2xl rounded-br-sm px-4 py-2 max-w-[75%]">
                      <p className="text-sm text-primary-foreground">Let's collab on the next one!</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-hero rounded-3xl p-8 sm:p-14 text-center relative overflow-hidden shadow-2xl shadow-primary/10"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-primary-foreground mb-4 tracking-tight">
                Ready to Join Linko?
              </h2>
              <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto text-lg">
                Create your free account and start connecting today.
              </p>
              <Link to="/auth">
                <Button size="lg" variant="secondary" className="gap-2 text-base h-12 px-8 shadow-lg">
                  Create Free Account
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-hero flex items-center justify-center">
              <Globe className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">Linko</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 Linko. Made with ❤️ by{' '}
            <Link to="/about" className="text-primary hover:underline">Sri Hari S A</Link>
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
