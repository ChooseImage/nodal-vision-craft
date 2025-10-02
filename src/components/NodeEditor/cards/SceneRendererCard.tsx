import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NodeProps, useReactFlow, useEdges } from 'reactflow';
import { BaseCard } from './BaseCard';
import { Button } from '@/components/ui/button';
import { Palette, RefreshCw } from 'lucide-react';
import { DataSchemas } from '../NodeEditor';
import { useNodeData } from '../NodeDataContext';
import * as THREE from 'three';

interface SceneRendererData {
  label: string;
}

export const SceneRendererCard: React.FC<NodeProps<SceneRendererData>> = ({ data, id }) => {
  const { getNodeData, subscribeToNode } = useNodeData();
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

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    
    // Add skybox (simple gradient background)
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d')!;
    
    const gradient = context.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#87CEEB'); // Sky blue
    gradient.addColorStop(1, '#F0E68C'); // Khaki
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 512, 512);
    
    const texture = new THREE.CanvasTexture(canvas);
    scene.background = texture;
    sceneRef.current = scene;

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
    let previousMouse = { x: 0, y: 0 };
    const spherical = new THREE.Spherical();
    const target = new THREE.Vector3(0, 0, 0);

    // Initialize spherical coordinates from camera position
    const vector = new THREE.Vector3().subVectors(camera.position, target);
    spherical.setFromVector3(vector);

    const handleMouseDown = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      isDragging = true;
      previousMouse = { x: event.clientX, y: event.clientY };
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging) return;
      
      event.preventDefault();
      event.stopPropagation();

      const deltaX = event.clientX - previousMouse.x;
      const deltaY = event.clientY - previousMouse.y;

      spherical.theta -= deltaX * 0.01;
      spherical.phi -= deltaY * 0.01;

      // Constrain phi to avoid flipping
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

      // Update camera position
      const newVector = new THREE.Vector3().setFromSpherical(spherical);
      camera.position.copy(newVector.add(target));
      camera.lookAt(target);

      previousMouse = { x: event.clientX, y: event.clientY };
    };

    const handleMouseUp = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      isDragging = false;
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

    // Store cleanup function
    const detachControls = () => {
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('wheel', handleWheel);
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
    if (!sceneRef.current) return;

    if (typeof skyboxTexture === 'string') {
      // Load texture from URL
      const loader = new THREE.TextureLoader();
      loader.load(skyboxTexture, (texture) => {
        sceneRef.current!.background = texture;
      });
    } else {
      // Use provided texture
      sceneRef.current.background = skyboxTexture;
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

  const handleRender = async () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    setIsRendering(true);
    
    // Simulate rendering time
    setTimeout(() => {
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        const dataURL = rendererRef.current.domElement.toDataURL();
        setLastRender(dataURL);
      }
      setIsRendering(false);
    }, 1500);
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
        <Button 
          size="sm" 
          className="w-full gap-2"
          onClick={handleRender}
          disabled={isRendering}
        >
          <RefreshCw className={`w-4 h-4 ${isRendering ? 'animate-spin' : ''}`} />
          {isRendering ? 'Rendering...' : 'Render Scene'}
        </Button>

        {/* Preview */}
        <div className="space-y-2">
          <div className="text-xs font-medium">Preview</div>
          <div className="relative bg-muted rounded-lg overflow-hidden">
            <div
              ref={mountRef}
              className="w-full h-48 flex items-center justify-center"
            />
            <div className="absolute bottom-2 right-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
              Drag to rotate
            </div>
          </div>
        </div>

        {/* Rendered Output */}
        {lastRender && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-port-image">Rendered Output</div>
            <div className="relative bg-muted rounded-lg overflow-hidden">
              <img
                src={lastRender}
                alt="Rendered scene"
                className="w-full h-32 object-cover"
              />
              <div className="absolute bottom-1 right-1 text-xs text-white bg-black/50 px-1 rounded">
                Final Render
              </div>
            </div>
          </div>
        )}
      </div>
    </BaseCard>
  );
};
