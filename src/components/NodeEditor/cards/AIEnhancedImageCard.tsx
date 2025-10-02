import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NodeProps, useEdges } from 'reactflow';
import { BaseCard } from './BaseCard';
import { Sparkles } from 'lucide-react';
import { DataSchemas } from '../NodeEditor';
import { useNodeData } from '../NodeDataContext';
import { enhanceSceneWithAI } from '@/utils/genAI';

interface AIEnhancedImageData {
  label: string;
}

export const AIEnhancedImageCard: React.FC<NodeProps<AIEnhancedImageData>> = ({ data, id }) => {
  const { getNodeData, subscribeToNode, updateNodeData } = useNodeData();
  const edges = useEdges();
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const lastProcessedImageRef = useRef<string | null>(null);
  const isEnhancingRef = useRef(false);

  const handleEnhance = useCallback(async (imageToEnhance: string) => {
    // Prevent re-processing the same image or if already processing
    if (!imageToEnhance || isEnhancingRef.current || lastProcessedImageRef.current === imageToEnhance) {
      return;
    }

    // Mark this image as being processed
    lastProcessedImageRef.current = imageToEnhance;
    isEnhancingRef.current = true;
    
    setIsEnhancing(true);
    setEnhancedImage(null);

    try {
      const result = await enhanceSceneWithAI({
        baseImage: imageToEnhance,
        prompt: 'Make this image look photorealistic, and all the objects and background environments fit together seamlessly. Enhance the lighting, materials, and overall visual quality to create a stunning, realistic render.',
        provider: 'gemini',
      });

      if (result.success && result.imageUrl) {
        setEnhancedImage(result.imageUrl);
        
        // Update node data for downstream connections
        if (id) {
          updateNodeData(id, {
            enhancedImage: result.imageUrl,
          });
        }
      }
    } catch (error) {
      console.error('Failed to enhance image:', error);
      // Reset on error so user can retry
      lastProcessedImageRef.current = null;
    } finally {
      isEnhancingRef.current = false;
      setIsEnhancing(false);
    }
  }, [id, updateNodeData]);

  // Listen for incoming rendered image from connected nodes
  useEffect(() => {
    if (!id) return;
    
    const connectedEdges = edges.filter(edge => edge.target === id);
    const unsubscribeFunctions: (() => void)[] = [];

    connectedEdges.forEach(edge => {
      const sourceNodeId = edge.source;
      
      // Check for existing data immediately
      const existingData = getNodeData(sourceNodeId);
      
      if (existingData?.renderedImage && edge.targetHandle === 'rendered-image-input') {
        setBaseImage(existingData.renderedImage);
        // Auto-trigger enhancement only if we haven't processed this image yet
        if (lastProcessedImageRef.current !== existingData.renderedImage) {
          handleEnhance(existingData.renderedImage);
        }
      }
      
      // Subscribe to future updates
      const unsubscribe = subscribeToNode(sourceNodeId, (nodeData) => {
        if (nodeData.renderedImage && edge.targetHandle === 'rendered-image-input') {
          setBaseImage(nodeData.renderedImage);
          // Auto-trigger enhancement only if we haven't processed this image yet
          if (lastProcessedImageRef.current !== nodeData.renderedImage) {
            handleEnhance(nodeData.renderedImage);
          }
        }
      });
      
      unsubscribeFunctions.push(unsubscribe);
    });

    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }, [id, edges, subscribeToNode, getNodeData, handleEnhance]);

  const inputs = [
    {
      id: 'rendered-image-input',
      label: 'Rendered Image',
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
      title="AI Enhanced Image"
      icon={<Sparkles className="w-4 h-4 text-port-enhanced" />}
      inputs={inputs}
      outputs={outputs}
    >
      <div className="space-y-4">
        {/* Loading State with Gradient Shader Effect */}
        {isEnhancing && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-port-enhanced flex items-center gap-1">
              <Sparkles className="w-3 h-3 animate-pulse" />
              Enhancing with AI...
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
                <Sparkles className="w-3 h-3 animate-spin" />
                Processing...
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Image Display */}
        {!isEnhancing && enhancedImage && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-port-enhanced flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI Enhanced Result
            </div>
            <div className="relative bg-muted rounded-lg overflow-hidden">
              <img
                src={enhancedImage}
                alt="AI enhanced scene"
                className="w-full object-cover"
              />
              <div className="absolute bottom-1 right-1 text-xs text-white bg-black/50 px-1 rounded flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Photorealistic
              </div>
            </div>
          </div>
        )}

        {/* Waiting State */}
        {!isEnhancing && !enhancedImage && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">
              Waiting for input...
            </div>
            <div className="relative bg-muted rounded-lg overflow-hidden h-48 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Connect a rendered image to enhance</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </BaseCard>
  );
};
