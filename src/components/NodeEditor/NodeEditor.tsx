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
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; sourceHandle?: { nodeId: string; handleId: string; handleType: 'source' | 'target'; schema?: DataSchema } } | null>(null);
  const [connectionInProgress, setConnectionInProgress] = useState<{ nodeId: string; handleId: string; handleType: 'source' | 'target' } | null>(null);
  const [removedEdges, setRemovedEdges] = useState<Edge[]>([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<any>(null);
  const justOpenedContextMenu = useRef<boolean>(false);

  const onConnect = useCallback((params: Edge | Connection) => {
    setEdges((eds) => addEdge(params, eds));
    setRemovedEdges([]); // Clear removed edges on successful connection
  }, [setEdges]);

  const onConnectStart = useCallback((event: any, { nodeId, handleId, handleType }: { nodeId: string; handleId: string; handleType: 'source' | 'target' }) => {
    // Get the schema from the handle ID
    // Handle IDs follow patterns like 'model-output', 'skybox-input', etc.
    let schema: DataSchema | undefined;
    
    if (handleId.includes('model')) {
      schema = DataSchemas.MODEL_3D;
    } else if (handleId.includes('skybox')) {
      schema = DataSchemas.SKYBOX_TEXTURE;
    } else if (handleId.includes('render')) {
      schema = DataSchemas.RENDERED_IMAGE;
    } else if (handleId.includes('enhanced')) {
      schema = DataSchemas.ENHANCED_IMAGE;
    } else if (handleId.includes('video')) {
      schema = DataSchemas.GENERATED_VIDEO;
    } else if (handleId.includes('text')) {
      schema = DataSchemas.TEXT;
    }
    
    setConnectionInProgress({ nodeId, handleId, handleType });
    
    // Check if this handle already has connections
    const existingEdges = edges.filter(edge => {
      if (handleType === 'source') {
        return edge.source === nodeId && edge.sourceHandle === handleId;
      } else {
        return edge.target === nodeId && edge.targetHandle === handleId;
      }
    });

    // If there are existing connections, remove them temporarily
    if (existingEdges.length > 0) {
      setRemovedEdges(existingEdges);
      setEdges((eds) => eds.filter(edge => !existingEdges.includes(edge)));
    }
  }, [edges, setEdges]);

  const onConnectEnd = useCallback((event: any) => {
    if (!connectionInProgress) {
      console.log('onConnectEnd: No connection in progress');
      return;
    }

    // Check if the connection ended on a handle (valid target)
    const target = event.target as HTMLElement;
    const isHandle = target.classList.contains('react-flow__handle') || 
                     target.closest('.react-flow__handle');
    const isOnNode = target.closest('.react-flow__node');
    
    console.log('onConnectEnd Debug:', {
      targetElement: target.tagName,
      targetClasses: target.className,
      isHandle,
      isOnNode: !!isOnNode,
      hasWrapper: !!reactFlowWrapper.current,
      hasInstance: !!reactFlowInstance.current,
      connectionInProgress,
      eventClientX: event.clientX,
      eventClientY: event.clientY,
    });
    
    // Only show context menu if NOT on a handle AND NOT on a node (i.e., on empty canvas)
    if (!isHandle && !isOnNode && reactFlowWrapper.current && reactFlowInstance.current) {
      // Connection dropped on empty canvas (not on a handle or node) - show context menu
      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      
      // Get the schema from the handle ID
      let schema: DataSchema | undefined;
      const handleId = connectionInProgress.handleId;
      
      if (handleId.includes('model')) {
        schema = DataSchemas.MODEL_3D;
      } else if (handleId.includes('skybox')) {
        schema = DataSchemas.SKYBOX_TEXTURE;
      } else if (handleId.includes('render')) {
        schema = DataSchemas.RENDERED_IMAGE;
      } else if (handleId.includes('enhanced')) {
        schema = DataSchemas.ENHANCED_IMAGE;
      } else if (handleId.includes('video')) {
        schema = DataSchemas.GENERATED_VIDEO;
      } else if (handleId.includes('text')) {
        schema = DataSchemas.TEXT;
      }
      
      console.log('Opening context menu at:', {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
        schema,
      });
      
      justOpenedContextMenu.current = true;
      setContextMenu({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
        sourceHandle: {
          ...connectionInProgress,
          schema,
        },
      });
      
      // Reset the flag after a short delay to allow the click event to pass
      setTimeout(() => {
        justOpenedContextMenu.current = false;
      }, 100);
    } else {
      console.log('Not opening context menu because:', {
        isHandle,
        isOnNode: !!isOnNode,
        hasWrapper: !!reactFlowWrapper.current,
        hasInstance: !!reactFlowInstance.current,
      });
      // Connection ended on a handle or was cancelled
      // If no new connection was made and we had removed edges, restore them
      setTimeout(() => {
        if (removedEdges.length > 0) {
          setEdges((eds) => {
            // Check if a new connection was actually made
            const newConnectionExists = eds.some(edge => {
              if (connectionInProgress.handleType === 'source') {
                return edge.source === connectionInProgress.nodeId && edge.sourceHandle === connectionInProgress.handleId;
              } else {
                return edge.target === connectionInProgress.nodeId && edge.targetHandle === connectionInProgress.handleId;
              }
            });
            
            // Only restore if no new connection was made
            if (!newConnectionExists) {
              return [...eds, ...removedEdges];
            }
            return eds;
          });
          setRemovedEdges([]);
        }
      }, 0);
    }
    
    setConnectionInProgress(null);
  }, [connectionInProgress, removedEdges, setEdges]);

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
    // Don't close the context menu if it was just opened from onConnectEnd
    if (justOpenedContextMenu.current) {
      console.log('Ignoring pane click - context menu was just opened');
      return;
    }
    console.log('Closing context menu from pane click');
    setContextMenu(null);
  }, []);

  const addNode = useCallback((type: string, position: { x: number; y: number }) => {
    const newNodeId = `${Date.now()}`;
    const flowPosition = reactFlowInstance.current?.screenToFlowPosition(position) || position;
    
    const newNode: Node = {
      id: newNodeId,
      type,
      position: flowPosition,
      data: { 
        label: type === 'modelLoader' ? '3D Model Loader' :
               type === 'skyboxGenerator' ? 'Skybox Generator' :
               type === 'sceneRenderer' ? 'Scene Renderer' : 'Node'
      },
    };
    
    setNodes((nds) => nds.concat(newNode));
    
    // If there's a source handle from a drag operation, create a connection
    if (contextMenu?.sourceHandle) {
      const sourceHandle = contextMenu.sourceHandle;
      const schema = sourceHandle.schema;
      
      // We need to wait for the node to be added before creating the edge
      setTimeout(() => {
        // Determine which handle to connect to based on the schema
        let targetHandleId = '';
        
        if (sourceHandle.handleType === 'source') {
          // Source handle -> need to find matching input on new node
          if (schema === DataSchemas.MODEL_3D) {
            targetHandleId = 'model-input';
          } else if (schema === DataSchemas.SKYBOX_TEXTURE) {
            targetHandleId = 'skybox-input';
          } else if (schema === DataSchemas.RENDERED_IMAGE) {
            targetHandleId = 'rendered-image-input';
          } else if (schema === DataSchemas.ENHANCED_IMAGE) {
            targetHandleId = 'enhanced-image-input';
          } else if (schema === DataSchemas.GENERATED_VIDEO) {
            targetHandleId = 'video-input';
          } else if (schema === DataSchemas.TEXT) {
            targetHandleId = 'text-input';
          }
          
          const newEdge: Edge = {
            id: `edge-${Date.now()}`,
            source: sourceHandle.nodeId,
            sourceHandle: sourceHandle.handleId,
            target: newNodeId,
            targetHandle: targetHandleId,
          };
          
          setEdges((eds) => addEdge(newEdge, eds));
        } else {
          // Target handle -> need to find matching output on new node
          let sourceHandleId = '';
          
          if (schema === DataSchemas.MODEL_3D) {
            sourceHandleId = 'model-output';
          } else if (schema === DataSchemas.SKYBOX_TEXTURE) {
            sourceHandleId = 'skybox-output';
          } else if (schema === DataSchemas.RENDERED_IMAGE) {
            sourceHandleId = 'render-output';
          } else if (schema === DataSchemas.ENHANCED_IMAGE) {
            sourceHandleId = 'enhanced-output';
          } else if (schema === DataSchemas.GENERATED_VIDEO) {
            sourceHandleId = 'video-output';
          } else if (schema === DataSchemas.TEXT) {
            sourceHandleId = 'text-output';
          }
          
          const newEdge: Edge = {
            id: `edge-${Date.now()}`,
            source: newNodeId,
            sourceHandle: sourceHandleId,
            target: sourceHandle.nodeId,
            targetHandle: sourceHandle.handleId,
          };
          
          setEdges((eds) => addEdge(newEdge, eds));
        }
      }, 0);
    }
    
    setContextMenu(null);
    setRemovedEdges([]); // Clear any removed edges
  }, [setNodes, setEdges, contextMenu]);

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
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
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
            onClose={() => {
              setContextMenu(null);
              // Restore removed edges if context menu is closed without creating a node
              if (removedEdges.length > 0) {
                setEdges((eds) => [...eds, ...removedEdges]);
                setRemovedEdges([]);
              }
            }}
            sourceHandle={contextMenu.sourceHandle}
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
