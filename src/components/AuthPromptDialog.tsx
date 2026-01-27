import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LogIn, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AuthPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

export function AuthPromptDialog({
  open,
  onOpenChange,
  title = "Sign in required",
  description = "Please sign in or create an account to continue.",
}: AuthPromptDialogProps) {
  const navigate = useNavigate();

  const handleLogin = () => {
    onOpenChange(false);
    navigate('/auth');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Button onClick={handleLogin} className="gap-2">
            <LogIn className="h-4 w-4" />
            Sign In
          </Button>
          <Button variant="outline" onClick={handleLogin} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Create Account
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
