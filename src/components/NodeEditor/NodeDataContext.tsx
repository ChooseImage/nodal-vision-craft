import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import * as THREE from 'three';

export interface NodeData {
  model?: THREE.Object3D;
  skyboxTexture?: THREE.Texture | string;
  renderedImage?: string;
  enhancedImage?: string;
  timestamp?: number;
}

interface NodeDataContextType {
  nodeData: Record<string, NodeData>;
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void;
  getNodeData: (nodeId: string) => NodeData | undefined;
  subscribeToNode: (nodeId: string, callback: (data: NodeData) => void) => () => void;
}

const NodeDataContext = createContext<NodeDataContextType | undefined>(undefined);

export const useNodeData = () => {
  const context = useContext(NodeDataContext);
  if (!context) {
    throw new Error('useNodeData must be used within a NodeDataProvider');
  }
  return context;
};

interface NodeDataProviderProps {
  children: React.ReactNode;
}

export const NodeDataProvider: React.FC<NodeDataProviderProps> = ({ children }) => {
  const [nodeData, setNodeData] = useState<Record<string, NodeData>>({});
  const subscribersRef = useRef<Record<string, ((data: NodeData) => void)[]>>({});

  const updateNodeData = useCallback((nodeId: string, data: Partial<NodeData>) => {
    setNodeData(prev => {
      const newData = {
        ...prev[nodeId],
        ...data,
        timestamp: Date.now()
      };
      
      // Notify subscribers using ref
      const nodeSubscribers = subscribersRef.current[nodeId] || [];
      nodeSubscribers.forEach(callback => callback(newData));
      
      return {
        ...prev,
        [nodeId]: newData
      };
    });
  }, []);

  const getNodeData = useCallback((nodeId: string) => {
    return nodeData[nodeId];
  }, [nodeData]);

  const subscribeToNode = useCallback((nodeId: string, callback: (data: NodeData) => void) => {
    // Add subscriber using ref
    if (!subscribersRef.current[nodeId]) {
      subscribersRef.current[nodeId] = [];
    }
    subscribersRef.current[nodeId].push(callback);

    // Return unsubscribe function
    return () => {
      subscribersRef.current[nodeId] = (subscribersRef.current[nodeId] || []).filter(cb => cb !== callback);
    };
  }, []);

  return (
    <NodeDataContext.Provider value={{
      nodeData,
      updateNodeData,
      getNodeData,
      subscribeToNode
    }}>
      {children}
    </NodeDataContext.Provider>
  );
};
