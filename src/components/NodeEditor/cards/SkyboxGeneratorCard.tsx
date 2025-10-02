import React, { useState } from 'react';
import { NodeProps } from 'reactflow';
import { BaseCard } from './BaseCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, Upload, Sparkles, Palette } from 'lucide-react';
import { DataSchemas } from '../NodeEditor';
import { useNodeData } from '../NodeDataContext';
import { generateImageWithAI } from '@/utils/genAI';
import { useToast } from '@/hooks/use-toast';

interface SkyboxGeneratorData {
  label: string;
}

export const SkyboxGeneratorCard: React.FC<NodeProps<SkyboxGeneratorData>> = ({ data, id }) => {
  const { updateNodeData } = useNodeData();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('default');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    
    try {
      // Construct a comprehensive prompt with skybox-specific instructions
      const systemPrompt = "Generate a high-resolution, 360-degree equirectangular panorama image suitable for use as an HDRI skybox in a 3D rendering environment. The image should have seamless edges for proper spherical wrapping, realistic lighting, and atmospheric effects. The projection should be in equirectangular format (2:1 aspect ratio) that can be mapped onto a sphere. Create the following environment: ";
      const fullPrompt = systemPrompt + prompt;
      
      const result = await generateImageWithAI({ prompt: fullPrompt });
      
      if (result.success) {
        setPreviewImage(result.imageUrl);
        
        // Publish skybox data to other nodes
        if (id) {
          updateNodeData(id, { skyboxTexture: result.imageUrl });
        }
        
        toast({
          title: "Skybox generated successfully",
          description: "Your AI-generated skybox is ready.",
        });
      } else {
        toast({
          title: "Generation failed",
          description: result.error || "Failed to generate skybox",
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

  // Automatically apply default skybox when tab is selected
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    if (value === 'default') {
      const defaultSkyboxUrl = 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=300&h=150&fit=crop';
      setPreviewImage(defaultSkyboxUrl);
      
      // Publish skybox data to other nodes
      if (id) {
        updateNodeData(id, { skyboxTexture: defaultSkyboxUrl });
      }
    }
  };

  const outputs = [
    {
      id: 'skybox-output',
      label: 'Environment Texture',
      schema: DataSchemas.SKYBOX_TEXTURE,
      position: 'right' as const,
    }
  ];

  return (
    <BaseCard
      title="Skybox Generator"
      icon={<Image className="w-4 h-4 text-port-texture" />}
      outputs={outputs}
    >
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="text-xs">Upload</TabsTrigger>
            <TabsTrigger value="default" className="text-xs">Default</TabsTrigger>
            <TabsTrigger value="generate" className="text-xs">AI Gen</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-3">
            <Label className="text-xs">Upload HDRI File</Label>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full gap-2">
                <Upload className="w-4 h-4" />
                Select .HDR/.EXR
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                No file selected
              </p>
            </div>
          </TabsContent>

          <TabsContent value="default" className="space-y-3">
            <Label className="text-xs">Default Environment</Label>
            <div className="text-xs text-muted-foreground p-3 bg-muted rounded-md text-center">
              Default skybox applied automatically
            </div>
          </TabsContent>

          <TabsContent value="generate" className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs">Environment Prompt</Label>
              <Input
                placeholder="a crossroad in manhattan at sunset"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="text-xs"
              />
            </div>
            <Button 
              size="sm" 
              className="w-full gap-2"
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
            >
              <Sparkles className="w-4 h-4" />
              {isGenerating ? 'Generating...' : 'Generate'}
            </Button>
          </TabsContent>
        </Tabs>

        {/* Preview */}
        {previewImage && (
          <div className="space-y-2">
            <Label className="text-xs">Preview</Label>
            <div className="relative bg-muted rounded-lg overflow-hidden">
              <img
                src={previewImage}
                alt="Skybox preview"
                className="w-full h-24 object-cover"
              />
              <div className="absolute bottom-1 right-1 text-xs text-white bg-black/50 px-1 rounded">
                360° HDRI
              </div>
            </div>
          </div>
        )}
      </div>
    </BaseCard>
  );
};
