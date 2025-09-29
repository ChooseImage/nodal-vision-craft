import React, { useState, useRef, useEffect } from 'react';
import { NodeProps } from 'reactflow';
import { BaseCard } from './BaseCard';
import { Button } from '@/components/ui/button';
import { Box, Upload } from 'lucide-react';
import { DataSchemas } from '../NodeEditor';
import { use3DControls } from '@/hooks/use3DControls';

// Three.js imports
import * as THREE from 'three';

interface ModelLoaderData {
  label: string;
}

export const ModelLoaderCard: React.FC<NodeProps<ModelLoaderData>> = ({ data }) => {
  const [fileName, setFileName] = useState<string>('Default Cube');
  const [isLoading, setIsLoading] = useState(false);
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const animationRef = useRef<number>();

  const { attachControls } = use3DControls({
    camera: cameraRef.current,
    renderer: rendererRef.current,
    scene: sceneRef.current,
  });

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      50,
      280 / 200,
      0.1,
      1000
    );
    camera.position.set(3, 3, 3);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(280, 200);
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
    scene.add(cube);

    // Ground plane
    const planeGeometry = new THREE.PlaneGeometry(10, 10);
    const planeMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x2a2a2a,
      transparent: true,
      opacity: 0.3
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -0.5;
    plane.receiveShadow = true;
    scene.add(plane);

    mountRef.current.appendChild(renderer.domElement);

    // Attach custom 3D controls
    const detachControls = attachControls(renderer.domElement);

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      
      // Rotate the cube
      if (cube) {
        cube.rotation.x += 0.005;
        cube.rotation.y += 0.01;
      }
      
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      detachControls();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setFileName(file.name);

    // Simulate file processing
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const outputs = [
    {
      id: 'model-output',
      label: 'Model Data',
      schema: DataSchemas.MODEL_3D,
      position: 'right' as const,
    }
  ];

  return (
    <BaseCard
      title="3D Model Loader"
      icon={<Box className="w-4 h-4 text-port-model" />}
      outputs={outputs}
    >
      <div className="space-y-4">
        {/* File upload */}
        <div className="space-y-2">
          <label className="relative">
            <input
              type="file"
              accept=".stl,.obj,.glb,.gltf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              disabled={isLoading}
            >
              <Upload className="w-4 h-4" />
              {isLoading ? 'Loading...' : 'Upload Model'}
            </Button>
          </label>
          <p className="text-xs text-muted-foreground text-center">
            {fileName}
          </p>
        </div>

        {/* 3D Preview */}
        <div className="relative bg-muted rounded-lg overflow-hidden">
          <div
            ref={mountRef}
            className="w-full h-48 flex items-center justify-center"
          />
          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
            Drag to rotate
          </div>
        </div>
      </div>
    </BaseCard>
  );
};