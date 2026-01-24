import { useState } from 'react';
import { useSearchProfiles } from '@/hooks/useProfile';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const { data: profiles, isLoading } = useSearchProfiles(query);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users by name or username..."
          className="pl-10"
        />
      </div>

      {isLoading && query.length >= 2 && (
        <div className="text-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
        </div>
      )}

      {!isLoading && profiles && profiles.length > 0 && (
        <div className="space-y-2">
          {profiles.map((profile) => (
            <Link key={profile.id} to={`/user/${profile.username}`}>
              <Card className="hover:bg-muted/50 transition-colors">
                <CardContent className="py-3 flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={profile.avatar_url || ''} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {profile.full_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{profile.full_name}</p>
                    <p className="text-sm text-muted-foreground">@{profile.username}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {!isLoading && query.length >= 2 && profiles?.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No users found matching "{query}"
          </CardContent>
        </Card>
      )}

      {query.length < 2 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Enter at least 2 characters to search
          </CardContent>
        </Card>
      )}
    </div>
  );
}
