import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NodeProps, useReactFlow, useEdges } from 'reactflow';
import { BaseCard } from './BaseCard';
import { Button } from '@/components/ui/button';
import { Palette, RefreshCw, Sparkles } from 'lucide-react';
import { DataSchemas } from '../NodeEditor';
import { useNodeData } from '../NodeDataContext';
import * as THREE from 'three';

interface SceneRendererData {
  label: string;
}

export const SceneRendererCard: React.FC<NodeProps<SceneRendererData>> = ({ data, id }) => {
  const { getNodeData, subscribeToNode, updateNodeData } = useNodeData();
  const reactFlowInstance = useReactFlow();
  const edges = useEdges();
  const [isRendering, setIsRendering] = useState(false);
  const [lastRender, setLastRender] = useState<string | null>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const animationRef = useRef<number>();
  const currentModelRef = useRef<THREE.Object3D | null>(null);
  const defaultCubeRef = useRef<THREE.Mesh | null>(null);
  const controlsRef = useRef<(() => void) | null>(null);
  const skyboxSphereRef = useRef<THREE.Mesh | null>(null);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Create skybox dome with default gradient texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d')!;
    
    const gradient = context.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#87CEEB'); // Sky blue
    gradient.addColorStop(1, '#F0E68C'); // Khaki
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 512, 512);
    
    const defaultTexture = new THREE.CanvasTexture(canvas);
    
    // Create skybox sphere (dome)
    const skyboxGeometry = new THREE.SphereGeometry(500, 60, 40);
    const skyboxMaterial = new THREE.MeshBasicMaterial({
      map: defaultTexture,
      side: THREE.BackSide, // Render inside of sphere
    });
    const skyboxSphere = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
    skyboxSphere.renderOrder = -1; // Render first (behind everything)
    scene.add(skyboxSphere);
    skyboxSphereRef.current = skyboxSphere;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      50,
      300 / 200,
      0.1,
      1000
    );
    camera.position.set(3, 3, 3);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(300, 200);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    // Default cube
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({ 
      color: 0x6366f1,
      shininess: 30
    });
    const cube = new THREE.Mesh(geometry, material);
    cube.castShadow = true;
    cube.name = 'defaultCube';
    scene.add(cube);
    defaultCubeRef.current = cube;

    mountRef.current.appendChild(renderer.domElement);

    // Initialize 3D controls directly
    let isDragging = false;
    let isPanning = false;
    let previousMouse = { x: 0, y: 0 };
    const spherical = new THREE.Spherical();
    const target = new THREE.Vector3(0, 0, 0);

    // Initialize spherical coordinates from camera position
    const vector = new THREE.Vector3().subVectors(camera.position, target);
    spherical.setFromVector3(vector);

    const handleMouseDown = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      
      if (event.button === 0) {
        // Left click - rotate
        isDragging = true;
      } else if (event.button === 2) {
        // Right click - pan
        isPanning = true;
      }
      
      previousMouse = { x: event.clientX, y: event.clientY };
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging && !isPanning) return;
      
      event.preventDefault();
      event.stopPropagation();

      const deltaX = event.clientX - previousMouse.x;
      const deltaY = event.clientY - previousMouse.y;

      if (isDragging) {
        // Rotate camera
        spherical.theta -= deltaX * 0.01;
        spherical.phi -= deltaY * 0.01;

        // Constrain phi to avoid flipping
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

        // Update camera position
        const newVector = new THREE.Vector3().setFromSpherical(spherical);
        camera.position.copy(newVector.add(target));
        camera.lookAt(target);
      } else if (isPanning) {
        // Pan camera - move both camera and target together
        const panSpeed = 0.005;
        const right = new THREE.Vector3();
        const up = new THREE.Vector3();
        
        // Get camera's right vector (perpendicular to view direction)
        camera.getWorldDirection(new THREE.Vector3());
        right.crossVectors(camera.up, new THREE.Vector3().subVectors(camera.position, target)).normalize();
        up.copy(camera.up).normalize();
        
        // Calculate pan offset based on mouse movement
        const panOffset = new THREE.Vector3();
        panOffset.add(right.multiplyScalar(-deltaX * panSpeed * spherical.radius));
        panOffset.add(up.multiplyScalar(deltaY * panSpeed * spherical.radius));
        
        // Move both target and camera by the same offset
        target.add(panOffset);
        camera.position.add(panOffset);
      }

      previousMouse = { x: event.clientX, y: event.clientY };
    };

    const handleMouseUp = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      
      if (event.button === 0) {
        isDragging = false;
      } else if (event.button === 2) {
        isPanning = false;
      }
    };

    const handleContextMenu = (event: MouseEvent) => {
      // Prevent context menu on canvas
      event.preventDefault();
      event.stopPropagation();
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();

      spherical.radius += event.deltaY * 0.01;
      spherical.radius = Math.max(2, Math.min(20, spherical.radius));

      // Update camera position
      const newVector = new THREE.Vector3().setFromSpherical(spherical);
      camera.position.copy(newVector.add(target));
      camera.lookAt(target);
    };

    // Attach event listeners with passive option for wheel events
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: false });
    renderer.domElement.addEventListener('contextmenu', handleContextMenu);

    // Store cleanup function
    const detachControls = () => {
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      renderer.domElement.removeEventListener('contextmenu', handleContextMenu);
    };
    controlsRef.current = detachControls;

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      
      // Only rotate the default cube if no custom model is loaded
      if (!currentModelRef.current && defaultCubeRef.current) {
        defaultCubeRef.current.rotation.x += 0.005;
        defaultCubeRef.current.rotation.y += 0.01;
      }
      
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      if (controlsRef.current) {
        controlsRef.current();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Define model and skybox handling functions
  const removeCurrentModel = useCallback(() => {
    if (currentModelRef.current && sceneRef.current) {
      sceneRef.current.remove(currentModelRef.current);
      currentModelRef.current = null;
    }
  }, []);

  const addModelToScene = useCallback((model: THREE.Object3D) => {
    if (!sceneRef.current) return;

    // Remove previous model
    removeCurrentModel();

    // Hide default cube
    if (defaultCubeRef.current) {
      defaultCubeRef.current.visible = false;
    }

    // Center and scale the model
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // Center the model
    model.position.sub(center);

    // Scale the model to fit in a reasonable size
    const maxDimension = Math.max(size.x, size.y, size.z);
    if (maxDimension > 2) {
      const scale = 2 / maxDimension;
      model.scale.setScalar(scale);
    }

    // Enable shadows for all meshes in the model
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    sceneRef.current.add(model);
    currentModelRef.current = model;
  }, [removeCurrentModel]);

  const updateSkybox = useCallback((skyboxTexture: THREE.Texture | string) => {
    if (!skyboxSphereRef.current) return;

    if (typeof skyboxTexture === 'string') {
      // Load texture from URL
      const loader = new THREE.TextureLoader();
      loader.load(skyboxTexture, (texture) => {
        if (skyboxSphereRef.current) {
          (skyboxSphereRef.current.material as THREE.MeshBasicMaterial).map = texture;
          (skyboxSphereRef.current.material as THREE.MeshBasicMaterial).needsUpdate = true;
        }
      });
    } else {
      // Use provided texture
      (skyboxSphereRef.current.material as THREE.MeshBasicMaterial).map = skyboxTexture;
      (skyboxSphereRef.current.material as THREE.MeshBasicMaterial).needsUpdate = true;
    }
  }, []);

  // Listen for incoming data from connected nodes
  useEffect(() => {
    if (!id) {
      return;
    }
    
    const connectedEdges = edges.filter(edge => edge.target === id);
    
    const unsubscribeFunctions: (() => void)[] = [];

    connectedEdges.forEach(edge => {
      const sourceNodeId = edge.source;
      
      // First, check for existing data immediately
      const existingData = getNodeData(sourceNodeId);
      
      if (existingData) {
        if (existingData.model && edge.targetHandle === 'model-input') {
          addModelToScene(existingData.model.clone());
        }
        
        if (existingData.skyboxTexture && edge.targetHandle === 'skybox-input') {
          updateSkybox(existingData.skyboxTexture);
        }
      }
      
      // Then subscribe to future updates
      const unsubscribe = subscribeToNode(sourceNodeId, (nodeData) => {
        // Handle model data
        if (nodeData.model && edge.targetHandle === 'model-input') {
          addModelToScene(nodeData.model.clone());
        }
        
        // Handle skybox data
        if (nodeData.skyboxTexture && edge.targetHandle === 'skybox-input') {
          updateSkybox(nodeData.skyboxTexture);
        }
      });
      
      unsubscribeFunctions.push(unsubscribe);
    });

    // Cleanup subscriptions
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }, [id, edges, subscribeToNode, getNodeData, addModelToScene, updateSkybox]);

  const captureSceneSnapshot = useCallback((): string | null => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) {
      return null;
    }

    // Render the current scene
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    
    // Capture as data URL (base64 PNG)
    const dataURL = rendererRef.current.domElement.toDataURL('image/png');
    return dataURL;
  }, []);

  const handleRender = async () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !id) return;

    setIsRendering(true);
    
    // Capture the scene
    const snapshot = captureSceneSnapshot();
    
    if (snapshot) {
      setLastRender(snapshot);
      
      // Update node data so connected nodes can access the rendered image
      updateNodeData(id, {
        renderedImage: snapshot,
      });
    }
    
    setIsRendering(false);
  };

  const handleEnhanceWithAI = async () => {
    if (!lastRender || !id) {
      console.warn('No render available to enhance. Please render the scene first.');
      return;
    }

    // Get current node position
    const currentNode = reactFlowInstance.getNode(id);
    if (!currentNode) return;

    // Create new AI Enhanced Image card
    const newNodeId = `ai-enhanced-${Date.now()}`;
    const newNode = {
      id: newNodeId,
      type: 'aiEnhancedImage',
      position: {
        x: currentNode.position.x + 400, // Position to the right
        y: currentNode.position.y,
      },
      data: { label: 'AI Enhanced Image' },
    };

    // Create edge connecting this node's output to the new node's input
    const newEdge = {
      id: `edge-${id}-${newNodeId}`,
      source: id,
      target: newNodeId,
      sourceHandle: 'render-output',
      targetHandle: 'rendered-image-input',
    };

    // Add the new node and edge to the flow
    reactFlowInstance.setNodes((nodes) => [...nodes, newNode]);
    reactFlowInstance.setEdges((edges) => [...edges, newEdge]);
  };

  const inputs = [
    {
      id: 'model-input',
      label: 'Model',
      schema: DataSchemas.MODEL_3D,
      position: 'left' as const,
    },
    {
      id: 'skybox-input',
      label: 'Skybox',
      schema: DataSchemas.SKYBOX_TEXTURE,
      position: 'left' as const,
    }
  ];

  const outputs = [
    {
      id: 'render-output',
      label: 'Rendered Image',
      schema: DataSchemas.RENDERED_IMAGE,
      position: 'right' as const,
    }
  ];

  return (
    <BaseCard
      title="Scene Renderer"
      icon={<Palette className="w-4 h-4 text-port-image" />}
      inputs={inputs}
      outputs={outputs}
    >
      <div className="space-y-4">
        {/* Render Controls */}
        <div className="space-y-2">
          <Button 
            size="sm" 
            className="w-full gap-2"
            onClick={handleRender}
            disabled={isRendering}
          >
            <RefreshCw className={`w-4 h-4 ${isRendering ? 'animate-spin' : ''}`} />
            {isRendering ? 'Rendering...' : 'Render Scene'}
          </Button>

          {lastRender && (
            <Button 
              size="sm" 
              className="w-full gap-2"
              onClick={handleEnhanceWithAI}
              variant="secondary"
            >
              <Sparkles className="w-4 h-4" />
              Enhance with AI
            </Button>
          )}
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <div className="text-xs font-medium">Preview</div>
          <div className="relative bg-muted rounded-lg overflow-hidden">
            <div
              ref={mountRef}
              className="w-full h-48 flex items-center justify-center"
            />
            <div className="absolute bottom-2 right-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
              Left: Rotate | Right: Pan
            </div>
          </div>
        </div>

        {/* Rendered Output */}
        {lastRender && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-port-image">
              Rendered Output
            </div>
            <div className="relative bg-muted rounded-lg overflow-hidden">
              <img
                src={lastRender}
                alt="Rendered scene"
                className="w-full object-cover"
              />
              <div className="absolute bottom-1 right-1 text-xs text-white bg-black/50 px-1 rounded">
                Rendered
              </div>
            </div>
          </div>
        )}
      </div>
    </BaseCard>
  );
};
