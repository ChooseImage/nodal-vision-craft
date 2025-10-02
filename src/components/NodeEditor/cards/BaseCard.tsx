import React from 'react';
import { Handle, Position, useEdges, useNodeId } from 'reactflow';
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
  const edges = useEdges();
  const nodeId = useNodeId();
  
  // Helper function to check if a handle has connections
  const isHandleConnected = (handleId: string, handleType: 'source' | 'target'): boolean => {
    if (!nodeId) return false;
    return edges.some(edge => {
      if (handleType === 'source') {
        return edge.source === nodeId && edge.sourceHandle === handleId;
      } else {
        return edge.target === nodeId && edge.targetHandle === handleId;
      }
    });
  };

  return (
    <Card className="min-w-80 max-w-96 glass border-node-border hover:border-primary/30 transition-all duration-300 relative">
      {/* Input Handles */}
      {inputs.map((input, index) => {
        const connected = isHandleConnected(input.id, 'target');
        return (
          <Handle
            key={input.id}
            type="target"
            position={Position.Left}
            id={input.id}
            className={`${getPortColor(input.schema)} ${connected ? 'connected' : ''}`}
            style={{
              top: `${24 + (index * 24)}px`,
            }}
            title={`${input.label} (${input.schema})`}
          />
        );
      })}

      {/* Output Handles */}
      {outputs.map((output, index) => {
        const connected = isHandleConnected(output.id, 'source');
        return (
          <Handle
            key={output.id}
            type="source"
            position={Position.Right}
            id={output.id}
            className={`${getPortColor(output.schema)} ${connected ? 'connected' : ''}`}
            style={{
              top: `${24 + (index * 24)}px`,
            }}
            title={`${output.label} (${output.schema})`}
          />
        );
      })}

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
