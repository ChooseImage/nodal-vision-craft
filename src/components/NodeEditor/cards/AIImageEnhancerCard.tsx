import React, { useState } from 'react';
import { NodeProps } from 'reactflow';
import { BaseCard } from './BaseCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Image } from 'lucide-react';
import { DataSchemas } from '../NodeEditor';
import { enhanceImage } from '@/utils/geminiAPI';
import { useToast } from '@/hooks/use-toast';

interface AIImageEnhancerData {
  label: string;
}

export const AIImageEnhancerCard: React.FC<NodeProps<AIImageEnhancerData>> = ({ data }) => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);

  const handleEnhance = async () => {
    setIsEnhancing(true);
    
    try {
      // In a real implementation, we'd get the base image from connected input
      const mockBaseImage = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";
      
      const result = await enhanceImage(mockBaseImage, prompt);
      if (result.success) {
        setEnhancedImage(result.imageUrl);
        toast({
          title: "Image enhanced successfully",
          description: "Your AI-enhanced image is ready.",
        });
      } else {
        toast({
          title: "Enhancement failed",
          description: result.error || "Failed to enhance image",
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
      setIsEnhancing(false);
    }
  };

  const inputs = [
    {
      id: 'base-image-input',
      label: 'Base Image',
      schema: DataSchemas.RENDERED_IMAGE,
      position: 'left' as const,
    }
  ];

  const outputs = [
    {
      id: 'enhanced-image-output',
      label: 'Enhanced Image',
      schema: DataSchemas.ENHANCED_IMAGE,
      position: 'right' as const,
    }
  ];

  return (
    <BaseCard
      title="AI Image Enhancer"
      icon={<Sparkles className="w-4 h-4 text-port-enhanced" />}
      inputs={inputs}
      outputs={outputs}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs">Enhancement Prompt</Label>
          <Input
            placeholder="cinematic lighting, epic, hyperrealistic"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="text-xs"
          />
        </div>

        <Button 
          size="sm" 
          className="w-full gap-2"
          onClick={handleEnhance}
          disabled={isEnhancing}
        >
          <Sparkles className="w-4 h-4" />
          {isEnhancing ? 'Enhancing...' : 'Enhance Image'}
        </Button>

        {/* Enhanced Image Preview */}
        {enhancedImage && (
          <div className="space-y-2">
            <Label className="text-xs">Enhanced Result</Label>
            <div className="relative bg-muted rounded-lg overflow-hidden">
              <img
                src={enhancedImage}
                alt="Enhanced image"
                className="w-full h-24 object-cover"
              />
              <div className="absolute bottom-1 right-1 text-xs text-white bg-black/50 px-1 rounded">
                AI Enhanced
              </div>
            </div>
          </div>
        )}
      </div>
    </BaseCard>
  );
};