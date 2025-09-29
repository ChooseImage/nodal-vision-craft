import React, { useState, useRef, useEffect } from 'react';
import { NodeProps } from 'reactflow';
import { BaseCard } from './BaseCard';
import { Button } from '@/components/ui/button';
import { Palette, RefreshCw } from 'lucide-react';
import { DataSchemas } from '../NodeEditor';
import * as THREE from 'three';

interface SceneRendererData {
  label: string;
}

export const SceneRendererCard: React.FC<NodeProps<SceneRendererData>> = ({ data }) => {
  const [isRendering, setIsRendering] = useState(false);
  const [lastRender, setLastRender] = useState<string | null>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();

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
    scene.add(directionalLight);

    // Sample model (cube)
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({ 
      color: 0x6366f1,
      shininess: 30
    });
    const cube = new THREE.Mesh(geometry, material);
    cube.castShadow = true;
    scene.add(cube);

    mountRef.current.appendChild(renderer.domElement);
    renderer.render(scene, camera);

    // Cleanup
    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

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
              Live Preview
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