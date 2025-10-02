import React, { useState, useEffect } from 'react';
import { NodeProps } from 'reactflow';
import { BaseCard } from './BaseCard';
import { Video, Play } from 'lucide-react';
import { DataSchemas } from '../NodeEditor';
import { useNodeData } from '../NodeDataContext';
import { generateVideoFromImage } from '@/utils/genAI';
import { useDevMode } from '@/contexts/DevModeContext';

interface GenAIClipData {
  label: string;
  sourceImage?: string;
  videoPrompt?: string;
}

export const GenAIClipCard: React.FC<NodeProps<GenAIClipData>> = ({ data, id }) => {
  const { updateNodeData } = useNodeData();
  const { isDevMode } = useDevMode();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);

  // Auto-generate video when component mounts with source data
  useEffect(() => {
    if (data.sourceImage && data.videoPrompt && !generatedVideo && !isGenerating) {
      handleGenerate(data.sourceImage, data.videoPrompt);
    }
  }, [data.sourceImage, data.videoPrompt]);

  const handleGenerate = async (image: string, prompt: string) => {
    setIsGenerating(true);

    try {
      const result = await generateVideoFromImage({
        baseImage: image,
        prompt: prompt,
        provider: 'replicate',
      }, isDevMode);

      if (result.success && result.videoUrl) {
        setGeneratedVideo(result.videoUrl);
        
        // Update node data for downstream connections
        if (id) {
          updateNodeData(id, {
            generatedVideo: result.videoUrl,
          });
        }
      }
    } catch (error) {
      console.error('Failed to generate video:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const inputs = [
    {
      id: 'enhanced-image-input',
      label: 'Enhanced Image',
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
      title="GenAI Clip"
      icon={<Video className="w-4 h-4 text-port-video" />}
      inputs={inputs}
      outputs={outputs}
    >
      <div className="space-y-4">
        {/* Loading State with Gradient Shader Effect */}
        {isGenerating && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-port-video flex items-center gap-1">
              <Video className="w-3 h-3 animate-pulse" />
              Generating video...
            </div>
            <div className="relative bg-muted rounded-lg overflow-hidden h-48">
              {/* Animated gradient shader effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-blue-500/20 animate-gradient-shift" />
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-transparent to-purple-500/10 animate-gradient-shift-reverse" />
              
              {/* Skeleton structure */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="space-y-3 w-full px-4">
                  <div className="h-3 bg-white/10 rounded animate-pulse" />
                  <div className="h-3 bg-white/10 rounded animate-pulse delay-75" />
                  <div className="h-3 bg-white/10 rounded animate-pulse delay-150" />
                  <div className="h-3 bg-white/10 rounded w-3/4 animate-pulse delay-225" />
                </div>
              </div>
              
              {/* Loading indicator */}
              <div className="absolute bottom-2 right-2 text-xs text-white bg-black/50 px-2 py-1 rounded flex items-center gap-1">
                <Video className="w-3 h-3 animate-spin" />
                Processing...
              </div>
            </div>
            
            {/* Prompt display */}
            {data.videoPrompt && (
              <div className="text-xs text-muted-foreground">
                Prompt: "{data.videoPrompt}"
              </div>
            )}
          </div>
        )}

        {/* Generated Video Display */}
        {!isGenerating && generatedVideo && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-port-video flex items-center gap-1">
              <Video className="w-3 h-3" />
              AI Generated Video
            </div>
            <div className="relative bg-muted rounded-lg overflow-hidden">
              <video
                src={generatedVideo}
                controls
                className="w-full object-cover"
                poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23333'/%3E%3C/svg%3E"
              />
              <div className="absolute bottom-1 right-1 text-xs text-white bg-black/50 px-1 rounded flex items-center gap-1">
                <Play className="w-3 h-3" />
                AI Video
              </div>
            </div>
            
            {/* Prompt display */}
            {data.videoPrompt && (
              <div className="text-xs text-muted-foreground">
                Prompt: "{data.videoPrompt}"
              </div>
            )}
          </div>
        )}

        {/* Waiting State */}
        {!isGenerating && !generatedVideo && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">
              Waiting for generation...
            </div>
            <div className="relative bg-muted rounded-lg overflow-hidden h-48 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Video className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Video will generate automatically</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </BaseCard>
  );
};
