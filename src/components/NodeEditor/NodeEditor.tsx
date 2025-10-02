import React, { useCallback, useState, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  Connection,
  ReactFlowProvider,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { ModelLoaderCard } from './cards/ModelLoaderCard';
import { SkyboxGeneratorCard } from './cards/SkyboxGeneratorCard';
import { SceneRendererCard } from './cards/SceneRendererCard';
import { AIImageEnhancerCard } from './cards/AIImageEnhancerCard';
import { AIEnhancedImageCard } from './cards/AIEnhancedImageCard';
import { AIVideoGeneratorCard } from './cards/AIVideoGeneratorCard';
import { VideoPlayerCard } from './cards/VideoPlayerCard';
import { GenAIClipCard } from './cards/GenAIClipCard';
import { NodeToolbar } from './NodeToolbar';
import { ContextMenu } from './ContextMenu';
import { NodeDataProvider } from './NodeDataContext';

// Define node types
const nodeTypes = {
  modelLoader: ModelLoaderCard,
  skyboxGenerator: SkyboxGeneratorCard,
  sceneRenderer: SceneRendererCard,
  aiImageEnhancer: AIImageEnhancerCard,
  aiEnhancedImage: AIEnhancedImageCard,
  aiVideoGenerator: AIVideoGeneratorCard,
  videoPlayer: VideoPlayerCard,
  genAIClip: GenAIClipCard,
};

// Schema definitions for type checking
export const DataSchemas = {
  MODEL_3D: 'MODEL_3D',
  SKYBOX_TEXTURE: 'SKYBOX_TEXTURE',
  RENDERED_IMAGE: 'RENDERED_IMAGE',
  ENHANCED_IMAGE: 'ENHANCED_IMAGE',
  GENERATED_VIDEO: 'GENERATED_VIDEO',
  TEXT: 'TEXT',
} as const;

export type DataSchema = typeof DataSchemas[keyof typeof DataSchemas];

// Port configuration
export interface PortConfig {
  id: string;
  label: string;
  schema: DataSchema;
  position: 'left' | 'right';
}

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'modelLoader',
    position: { x: 100, y: 100 },
    data: { label: '3D Model Loader' },
  },
];

const initialEdges: Edge[] = [];

// Validate if two ports can connect
const isValidConnection = (source: PortConfig, target: PortConfig): boolean => {
  return source.schema === target.schema && source.position !== target.position;
};

export const NodeEditor: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<any>(null);

  const onConnect = useCallback((params: Edge | Connection) => {
    setEdges((eds) => addEdge(params, eds));
  }, [setEdges]);

  const onContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    
    if (reactFlowWrapper.current) {
      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      setContextMenu({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });
    }
  }, []);

  const onPaneClick = useCallback(() => {
    setContextMenu(null);
  }, []);

  const addNode = useCallback((type: string, position: { x: number; y: number }) => {
    const newNode: Node = {
      id: `${Date.now()}`,
      type,
      position,
      data: { 
        label: type === 'modelLoader' ? '3D Model Loader' :
               type === 'skyboxGenerator' ? 'Skybox Generator' :
               type === 'sceneRenderer' ? 'Scene Renderer' : 'Node'
      },
    };
    
    setNodes((nds) => nds.concat(newNode));
    setContextMenu(null);
  }, [setNodes]);

  return (
    <div className="w-full h-screen bg-canvas-bg">
      <NodeToolbar onAddNode={addNode} />
      
      <div ref={reactFlowWrapper} className="w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onContextMenu={onContextMenu}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
          onInit={(instance) => {
            reactFlowInstance.current = instance;
          }}
          className="bg-canvas-bg"
        >
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={20} 
            size={1}
            color="hsl(var(--border))"
          />
          <Controls 
            className="bg-card border-border"
            showZoom
            showFitView
            showInteractive
          />
          <MiniMap 
            className="bg-card border-border"
            nodeColor="hsl(var(--primary))"
            maskColor="hsl(var(--muted))"
          />
        </ReactFlow>

        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onAddNode={addNode}
            onClose={() => setContextMenu(null)}
          />
        )}
      </div>
    </div>
  );
};

export const NodeEditorWrapper: React.FC = () => {
  return (
    <ReactFlowProvider>
      <NodeDataProvider>
        <NodeEditor />
      </NodeDataProvider>
    </ReactFlowProvider>
  );
};
