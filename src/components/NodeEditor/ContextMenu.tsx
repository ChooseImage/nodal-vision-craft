import React from 'react';
import { Card } from '@/components/ui/card';
import { Box, Image, Palette } from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  onAddNode: (type: string, position: { x: number; y: number }) => void;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onAddNode, onClose }) => {
  const handleAddNode = (type: string) => {
    onAddNode(type, { x: x - 100, y: y - 50 });
    onClose();
  };

  return (
    <Card 
      className="absolute z-50 glass border-glass-border p-2 min-w-48"
      style={{ left: x, top: y }}
    >
      <div className="space-y-1">
        <button
          onClick={() => handleAddNode('modelLoader')}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-node-hover transition-colors"
        >
          <Box className="w-4 h-4 text-port-model" />
          3D Model Loader
        </button>
        
        <button
          onClick={() => handleAddNode('skyboxGenerator')}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-node-hover transition-colors"
        >
          <Image className="w-4 h-4 text-port-texture" />
          Skybox Generator
        </button>
        
        <button
          onClick={() => handleAddNode('sceneRenderer')}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-node-hover transition-colors"
        >
          <Palette className="w-4 h-4 text-port-image" />
          Scene Renderer
        </button>
      </div>
    </Card>
  );
};