import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFuzzySearch } from '@/hooks/useFuzzySearch';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Loader2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Profile } from '@/hooks/useProfile';

// Fetch all profiles for fuzzy search
function useAllProfiles() {
  return useQuery({
    queryKey: ['profiles', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(500);

      if (error) throw error;
      return data as Profile[];
    },
    staleTime: 60000, // Cache for 1 minute
  });
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const { data: allProfiles, isLoading } = useAllProfiles();
  
  // Use fuzzy search for better matching (handles typos like "Arjn" → "Arjun")
  const filteredProfiles = useFuzzySearch(allProfiles, query, {
    keys: ['full_name', 'username'],
    threshold: 0.4,
  });

  const showResults = query.length >= 2;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Find People</h1>
          <p className="text-sm text-muted-foreground">Search by name or username</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users... (try typing with typos!)"
          className="pl-12 h-12 text-base"
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
        </div>
      )}

      {/* Results */}
      {!isLoading && showResults && filteredProfiles.length > 0 && (
        <div className="space-y-2 animate-fade-in">
          <p className="text-sm text-muted-foreground px-1">
            {filteredProfiles.length} result{filteredProfiles.length !== 1 ? 's' : ''} found
          </p>
          {filteredProfiles.map((profile) => (
            <Link key={profile.id} to={`/user/${profile.username}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="py-3 flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={profile.avatar_url || ''} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                      {profile.full_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{profile.full_name}</p>
                    <p className="text-sm text-muted-foreground truncate">@{profile.username}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* No Results */}
      {!isLoading && showResults && filteredProfiles.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground mb-1">No users found</p>
            <p className="text-sm text-muted-foreground">
              Try a different search term
            </p>
          </CardContent>
        </Card>
      )}

      {/* Initial State */}
      {!showResults && !isLoading && (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
              <Search className="w-8 h-8 text-primary" />
            </div>
            <p className="font-medium text-foreground mb-1">Search for people</p>
            <p className="text-sm text-muted-foreground">
              Enter at least 2 characters to search
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
