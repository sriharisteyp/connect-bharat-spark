import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, Code, Sparkles, ExternalLink } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">About DesiConnect</h1>

      {/* Developer Card */}
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-hero" />
        <CardHeader className="-mt-12 pb-2">
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 ring-4 ring-background">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">SH</AvatarFallback>
            </Avatar>
            <CardTitle className="mt-4">Sri Hari S A</CardTitle>
            <p className="text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-4 w-4" />
              Thiruvananthapuram, Kerala, India 🇮🇳
            </p>
          </div>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Code className="h-3 w-3" />
              Developer
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              14 Years Old
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Heart className="h-3 w-3" />
              Passionate Coder
            </Badge>
          </div>

          <p className="text-muted-foreground max-w-md mx-auto">
            Hi! I'm Sri Hari, a 14-year-old developer from Thiruvananthapuram (TVM), Kerala, India. 
            I built DesiConnect as a social network made for India — connecting Bharat, one conversation at a time! 🙏
          </p>

          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-3">About This Project</h3>
            <p className="text-sm text-muted-foreground">
              DesiConnect is a modern social media platform inspired by Instagram and other social networks, 
              but designed specifically with Indian users in mind. It features Stories, Reels, Posts, 
              real-time messaging, voice notes, and much more!
            </p>
          </div>

          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-3">Features</h3>
            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              <div className="p-2 bg-muted rounded-lg">📱 Stories (24h)</div>
              <div className="p-2 bg-muted rounded-lg">🎬 Reels</div>
              <div className="p-2 bg-muted rounded-lg">💬 Real-time Chat</div>
              <div className="p-2 bg-muted rounded-lg">🎤 Voice Messages</div>
              <div className="p-2 bg-muted rounded-lg">📷 Image Sharing</div>
              <div className="p-2 bg-muted rounded-lg">🔔 Push Notifications</div>
              <div className="p-2 bg-muted rounded-lg">👥 Friends & Follow</div>
              <div className="p-2 bg-muted rounded-lg">🌙 Dark Mode</div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">Made with ❤️ in India</p>
            <p className="text-xs text-muted-foreground">DesiConnect v1.0 © 2025</p>
          </div>
        </CardContent>
      </Card>

      {/* Quote */}
      <Card>
        <CardContent className="py-6 text-center">
          <blockquote className="italic text-lg text-muted-foreground">
            "Age is just a number. What matters is the passion to create and the will to learn."
          </blockquote>
          <p className="mt-2 text-sm font-medium">— Sri Hari S A</p>
        </CardContent>
      </Card>
    </div>
  );
}
