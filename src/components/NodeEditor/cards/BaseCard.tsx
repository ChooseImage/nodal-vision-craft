import React from 'react';
import { Handle, Position } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataSchema, PortConfig } from '../NodeEditor';

interface BaseCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  inputs?: PortConfig[];
  outputs?: PortConfig[];
  onDelete?: () => void;
}

const getPortColor = (schema: DataSchema): string => {
  switch (schema) {
    case 'MODEL_3D': return 'port-model';
    case 'SKYBOX_TEXTURE': return 'port-texture';
    case 'RENDERED_IMAGE': return 'port-image';
    case 'ENHANCED_IMAGE': return 'port-image';
    case 'GENERATED_VIDEO': return 'port-video';
    case 'TEXT': return 'border';
    default: return 'border';
  }
};

export const BaseCard: React.FC<BaseCardProps> = ({
  title,
  icon,
  children,
  inputs = [],
  outputs = [],
  onDelete,
}) => {
  return (
    <Card className="min-w-80 max-w-96 glass border-node-border hover:border-primary/30 transition-all duration-300 relative">
      {/* Input Handles */}
      {inputs.map((input, index) => (
        <Handle
          key={input.id}
          type="target"
          position={Position.Left}
          id={input.id}
          className={`${getPortColor(input.schema)} border-2 border-background`}
          style={{
            top: `${20 + (index * 30)}px`,
            left: '-6px',
          }}
          title={`${input.label} (${input.schema})`}
        />
      ))}

      {/* Output Handles */}
      {outputs.map((output, index) => (
        <Handle
          key={output.id}
          type="source"
          position={Position.Right}
          id={output.id}
          className={`${getPortColor(output.schema)} border-2 border-background`}
          style={{
            top: `${20 + (index * 30)}px`,
            right: '-6px',
          }}
          title={`${output.label} (${output.schema})`}
        />
      ))}

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );
};