import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Trash2, Loader2 } from 'lucide-react';
import { useVoiceRecorder, useUploadVoiceMessage, formatDuration } from '@/hooks/useVoiceMessages';
import { cn } from '@/lib/utils';

interface VoiceMessageRecorderProps {
  onSend: (audioUrl: string) => void;
  disabled?: boolean;
}

export function VoiceMessageRecorder({ onSend, disabled }: VoiceMessageRecorderProps) {
  const { isRecording, recordingDuration, startRecording, stopRecording, cancelRecording } = useVoiceRecorder();
  const uploadVoice = useUploadVoiceMessage();
  const [isSending, setIsSending] = useState(false);

  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const handleStopAndSend = async () => {
    try {
      setIsSending(true);
      const blob = await stopRecording();
      const audioUrl = await uploadVoice.mutateAsync(blob);
      onSend(audioUrl);
    } catch (error) {
      console.error('Failed to send voice message:', error);
    } finally {
      setIsSending(false);
    }
  };

  if (isRecording) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1 bg-destructive/10 rounded-full px-4 py-2">
          <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          <span className="text-sm font-medium text-destructive">
            {formatDuration(recordingDuration)}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={cancelRecording}
          className="text-muted-foreground"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          onClick={handleStopAndSend}
          disabled={isSending}
          className="bg-primary"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Square className="h-4 w-4" fill="currentColor" />
          )}
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleStartRecording}
      disabled={disabled}
      className={cn("text-muted-foreground hover:text-primary")}
    >
      <Mic className="h-5 w-5" />
    </Button>
  );
}
