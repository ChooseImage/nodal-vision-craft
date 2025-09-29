import React from 'react';
import { NodeProps } from 'reactflow';
import { BaseCard } from './BaseCard';
import { Label } from '@/components/ui/label';
import { Monitor } from 'lucide-react';
import { DataSchemas } from '../NodeEditor';

interface VideoPlayerData {
  label: string;
}

export const VideoPlayerCard: React.FC<NodeProps<VideoPlayerData>> = ({ data }) => {
  // In a real implementation, this would get video data from connected input
  const mockVideoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

  const inputs = [
    {
      id: 'video-input',
      label: 'Video Data',
      schema: DataSchemas.GENERATED_VIDEO,
      position: 'left' as const,
    }
  ];

  return (
    <BaseCard
      title="Video Player"
      icon={<Monitor className="w-4 h-4 text-port-video" />}
      inputs={inputs}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs">Final Output</Label>
          <div className="relative bg-muted rounded-lg overflow-hidden">
            <video
              src={mockVideoUrl}
              controls
              className="w-full h-40 object-cover"
              poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23333'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='14' fill='%23666' text-anchor='middle' dy='5'%3ENo Video%3C/text%3E%3C/svg%3E"
            />
            <div className="absolute bottom-2 right-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
              Final Video Player
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Connect a video input to play generated content
        </div>
      </div>
    </BaseCard>
  );
};