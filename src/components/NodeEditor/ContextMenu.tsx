import React from 'react';
import { Card } from '@/components/ui/card';
import { Box, Image, Palette, Sparkles, Video, Film } from 'lucide-react';
import type { DataSchema } from './NodeEditor';

interface ContextMenuProps {
  x: number;
  y: number;
  onAddNode: (type: string, position: { x: number; y: number }) => void;
  onClose: () => void;
  sourceHandle?: {
    nodeId: string;
    handleId: string;
    handleType: 'source' | 'target';
    schema?: DataSchema;
  } | null;
}

// Define which cards accept which input schemas (using string literals to avoid circular dependency)
const cardInputSchemas: Record<string, DataSchema[]> = {
  sceneRenderer: ['MODEL_3D', 'SKYBOX_TEXTURE'],
  aiImageEnhancer: ['RENDERED_IMAGE'],
  aiEnhancedImage: ['RENDERED_IMAGE'],
  aiVideoGenerator: ['ENHANCED_IMAGE'],
  videoPlayer: ['GENERATED_VIDEO'],
  genAIClip: ['TEXT'],
};

// Define which cards output which schemas
const cardOutputSchemas: Record<string, DataSchema[]> = {
  modelLoader: ['MODEL_3D'],
  skyboxGenerator: ['SKYBOX_TEXTURE'],
  sceneRenderer: ['RENDERED_IMAGE'],
  aiImageEnhancer: ['ENHANCED_IMAGE'],
  aiEnhancedImage: ['ENHANCED_IMAGE'],
  aiVideoGenerator: ['GENERATED_VIDEO'],
  genAIClip: ['TEXT'],
};

// All available node types with their metadata
const allNodeTypes = [
  { type: 'modelLoader', label: '3D Model Loader', icon: Box, color: 'text-port-model' },
  { type: 'skyboxGenerator', label: 'Skybox Generator', icon: Image, color: 'text-port-texture' },
  { type: 'sceneRenderer', label: 'Scene Renderer', icon: Palette, color: 'text-port-image' },
  { type: 'aiImageEnhancer', label: 'AI Image Enhancer', icon: Sparkles, color: 'text-port-image' },
  { type: 'aiEnhancedImage', label: 'AI Enhanced Image', icon: Sparkles, color: 'text-port-image' },
  { type: 'aiVideoGenerator', label: 'AI Video Generator', icon: Video, color: 'text-port-video' },
  { type: 'videoPlayer', label: 'Video Player', icon: Film, color: 'text-port-video' },
  { type: 'genAIClip', label: 'Gen AI Clip', icon: Sparkles, color: 'text-primary' },
];

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onAddNode, onClose, sourceHandle }) => {
  const handleAddNode = (type: string) => {
    onAddNode(type, { x: x - 100, y: y - 50 });
    onClose();
  };

  // Filter node types based on source handle schema
  const getCompatibleNodeTypes = () => {
    if (!sourceHandle || !sourceHandle.schema) {
      // No source handle or schema - show all node types
      return allNodeTypes;
    }

    const schema = sourceHandle.schema;
    
    // If it's a source handle (output), we need cards that can accept this schema as input
    if (sourceHandle.handleType === 'source') {
      return allNodeTypes.filter(nodeType => {
        const acceptedSchemas = cardInputSchemas[nodeType.type];
        if (!acceptedSchemas) return false;
        
        // Check if this card accepts the schema from the source handle
        return acceptedSchemas.includes(schema);
      });
    } else {
      // If it's a target handle (input), we need cards that can output this schema
      return allNodeTypes.filter(nodeType => {
        const outputSchemas = cardOutputSchemas[nodeType.type];
        if (!outputSchemas) return false;
        
        // Check if this card outputs the schema needed by the target handle
        return outputSchemas.includes(schema);
      });
    }
  };

  const compatibleNodeTypes = getCompatibleNodeTypes();

  return (
    <Card 
      className="absolute z-50 glass border-glass-border p-2 min-w-48"
      style={{ left: x, top: y }}
    >
      <div className="space-y-1">
        {compatibleNodeTypes.length === 0 ? (
          <div className="px-3 py-2 text-xs text-muted-foreground text-center">
            No compatible nodes
          </div>
        ) : (
          compatibleNodeTypes.map(({ type, label, icon: Icon, color }) => (
            <button
              key={type}
              onClick={() => handleAddNode(type)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-node-hover transition-colors"
            >
              <Icon className={`w-4 h-4 ${color}`} />
              {label}
            </button>
          ))
        )}
      </div>
    </Card>
  );
};
