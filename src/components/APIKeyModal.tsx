import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Key, Save } from 'lucide-react';
import { setAPIKey, getAPIKeys } from '@/utils/apiConfig';
import { useToast } from '@/hooks/use-toast';

export const APIKeyModal: React.FC = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [geminiKey, setGeminiKey] = useState('');
  const [replicateKey, setReplicateKey] = useState('');

  const handleOpen = () => {
    const keys = getAPIKeys();
    setGeminiKey(keys.geminiApiKey || '');
    setReplicateKey(keys.replicateApiKey || '');
    setOpen(true);
  };

  const handleSave = () => {
    if (geminiKey) setAPIKey('gemini', geminiKey);
    if (replicateKey) setAPIKey('replicate', replicateKey);
    
    toast({
      title: "API Keys saved",
      description: "Your API keys have been stored securely.",
    });
    
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={handleOpen}>
          <Key className="w-4 h-4 mr-2" />
          API Keys
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configure API Keys</DialogTitle>
          <DialogDescription>
            Enter your API keys to enable AI features. Keys are stored locally in your browser.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gemini-key">Gemini API Key</Label>
            <Input
              id="gemini-key"
              type="password"
              placeholder="Your Gemini API key..."
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Used for skybox generation and image enhancement
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="replicate-key">Replicate API Key</Label>
            <Input
              id="replicate-key"
              type="password"
              placeholder="Your Replicate API key..."
              value={replicateKey}
              onChange={(e) => setReplicateKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Used for video generation with Veo-3-Fast
            </p>
          </div>
          <Button onClick={handleSave} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            Save Keys
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};