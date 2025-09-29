import React, { useState } from 'react';
import { NodeProps } from 'reactflow';
import { BaseCard } from './BaseCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Video, Play } from 'lucide-react';
import { DataSchemas } from '../NodeEditor';
import { generateVideo } from '@/utils/replicateAPI';
import { useToast } from '@/hooks/use-toast';

interface AIVideoGeneratorData {
  label: string;
}

export const AIVideoGeneratorCard: React.FC<NodeProps<AIVideoGeneratorData>> = ({ data }) => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    
    try {
      // In a real implementation, we'd get the first frame from connected input
      const mockFirstFrame = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";
      
      const result = await generateVideo({
        firstFrame: mockFirstFrame,
        prompt: prompt,
      });
      
      if (result.success) {
        setGeneratedVideo(result.videoUrl);
        toast({
          title: "Video generated successfully",
          description: "Your AI-generated video is ready.",
        });
      } else {
        toast({
          title: "Generation failed",
          description: result.error || "Failed to generate video",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const inputs = [
    {
      id: 'first-frame-input',
      label: 'First Frame',
      schema: DataSchemas.ENHANCED_IMAGE,
      position: 'left' as const,
    }
  ];

  const outputs = [
    {
      id: 'video-output',
      label: 'Generated Video',
      schema: DataSchemas.GENERATED_VIDEO,
      position: 'right' as const,
    }
  ];

  return (
    <BaseCard
      title="AI Video Generator"
      icon={<Video className="w-4 h-4 text-port-video" />}
      inputs={inputs}
      outputs={outputs}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs">Video Generation Prompt</Label>
          <Input
            placeholder="a slow dolly zoom forward"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="text-xs"
            required
          />
        </div>

        <Button 
          size="sm" 
          className="w-full gap-2"
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
        >
          <Video className="w-4 h-4" />
          {isGenerating ? 'Generating Video...' : 'Generate Video'}
        </Button>

        {/* Video Preview */}
        {generatedVideo && (
          <div className="space-y-2">
            <Label className="text-xs">Generated Video</Label>
            <div className="relative bg-muted rounded-lg overflow-hidden">
              <video
                src={generatedVideo}
                controls
                className="w-full h-32 object-cover"
                poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23333'/%3E%3C/svg%3E"
              />
              <div className="absolute bottom-1 right-1 text-xs text-white bg-black/50 px-1 rounded flex items-center gap-1">
                <Play className="w-3 h-3" />
                AI Video
              </div>
            </div>
          </div>
        )}
      </div>
    </BaseCard>
  );
};