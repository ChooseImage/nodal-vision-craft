import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Box, Image, Palette, Sparkles, Play, Monitor, Zap } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { APIKeyModal } from '@/components/APIKeyModal';
import { useDevMode } from '@/contexts/DevModeContext';

interface NodeToolbarProps {
  onAddNode: (type: string, position: { x: number; y: number }) => void;
}

export const NodeToolbar: React.FC<NodeToolbarProps> = ({ onAddNode }) => {
  const { isDevMode, setDevMode } = useDevMode();
  
  const handleAddNode = (type: string) => {
    // Add node at center of current view
    const position = { x: 400, y: 300 };
    onAddNode(type, position);
  };

  return (
    <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
      <div className="glass rounded-lg p-2 border">
        <h1 className="text-lg font-semibold text-foreground px-2">3D AI Pipeline</h1>
      </div>
      
      <APIKeyModal />

      {/* Dev Mode Toggle */}
      <div className="glass rounded-lg p-2 border flex items-center gap-2">
        <Switch
          id="dev-mode"
          checked={isDevMode}
          onCheckedChange={setDevMode}
        />
        <Label 
          htmlFor="dev-mode" 
          className="text-sm cursor-pointer flex items-center gap-1"
        >
          <Zap className={`w-3 h-3 ${isDevMode ? 'text-yellow-500' : 'text-muted-foreground'}`} />
          Dev Mode
        </Label>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="default" size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Node
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 glass border-glass-border">
          <DropdownMenuItem 
            onClick={() => handleAddNode('modelLoader')}
            className="gap-2 cursor-pointer hover:bg-node-hover"
          >
            <Box className="w-4 h-4 text-port-model" />
            3D Model Loader
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => handleAddNode('skyboxGenerator')}
            className="gap-2 cursor-pointer hover:bg-node-hover"
          >
            <Image className="w-4 h-4 text-port-texture" />
            Skybox Generator
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => handleAddNode('sceneRenderer')}
            className="gap-2 cursor-pointer hover:bg-node-hover"
          >
            <Palette className="w-4 h-4 text-port-image" />
            Scene Renderer
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-border" />
          
          <DropdownMenuItem 
            disabled
            className="gap-2 opacity-50"
          >
            <Sparkles className="w-4 h-4 text-port-image" />
            AI Image Enhancer
            <span className="ml-auto text-xs text-muted-foreground">Soon</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            disabled
            className="gap-2 opacity-50"
          >
            <Play className="w-4 h-4 text-port-video" />
            AI Video Generator
            <span className="ml-auto text-xs text-muted-foreground">Soon</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            disabled
            className="gap-2 opacity-50"
          >
            <Monitor className="w-4 h-4 text-port-video" />
            Video Player
            <span className="ml-auto text-xs text-muted-foreground">Soon</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
