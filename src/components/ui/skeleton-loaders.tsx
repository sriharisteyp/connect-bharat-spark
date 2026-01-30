import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function PostSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <div className="flex gap-4 pt-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ReelSkeleton() {
  return (
    <Card className="overflow-hidden animate-pulse">
      <CardContent className="p-0">
        <div className="flex items-center gap-3 p-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="aspect-[9/16] w-full" />
        <div className="p-3 space-y-2">
          <div className="flex gap-4">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-12" />
          </div>
          <Skeleton className="h-4 w-3/4" />
        </div>
      </CardContent>
    </Card>
  );
}

export function MessageSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 animate-pulse">
      <div className="relative">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-3 w-48" />
      </div>
    </div>
  );
}

export function StorySkeleton() {
  return (
    <div className="flex gap-3 p-4 overflow-hidden">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex flex-col items-center gap-1 animate-pulse">
          <Skeleton className="w-16 h-16 rounded-full" />
          <Skeleton className="w-12 h-3 rounded" />
        </div>
      ))}
    </div>
  );
}

export function ChatMessageSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
          <Skeleton className={`h-12 rounded-2xl ${i % 2 === 0 ? 'w-48' : 'w-56'}`} />
        </div>
      ))}
    </div>
  );
}

export function ConversationSkeleton() {
  return (
    <div className="space-y-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <MessageSkeleton key={i} />
      ))}
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div className="space-y-4">
      <StorySkeleton />
      {[1, 2, 3].map((i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  );
}

export function ReelGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <ReelSkeleton key={i} />
      ))}
    </div>
  );
}
