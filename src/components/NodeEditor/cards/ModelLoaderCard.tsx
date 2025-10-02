import React, { useState, useRef, useEffect } from 'react';
import { NodeProps } from 'reactflow';
import { BaseCard } from './BaseCard';
import { Button } from '@/components/ui/button';
import { Box, Upload } from 'lucide-react';
import { DataSchemas } from '../NodeEditor';
import { useNodeData } from '../NodeDataContext';
// Three.js imports
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

interface ModelLoaderData {
  label: string;
}

export const ModelLoaderCard: React.FC<NodeProps<ModelLoaderData>> = ({ data, id }) => {
  const { updateNodeData } = useNodeData();
  const [fileName, setFileName] = useState<string>('Default Cube');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [hasCustomModel, setHasCustomModel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    
    // Store target in a ref so it can be updated when model is loaded
    const targetRef = { current: target };

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
        camera.position.copy(newVector.add(targetRef.current));
        camera.lookAt(targetRef.current);
      } else if (isPanning) {
        // Pan camera - move both camera and target together
        const panSpeed = 0.005;
        const right = new THREE.Vector3();
        const up = new THREE.Vector3();
        
        // Get camera's right vector (perpendicular to view direction)
        camera.getWorldDirection(new THREE.Vector3());
        right.crossVectors(camera.up, new THREE.Vector3().subVectors(camera.position, targetRef.current)).normalize();
        up.copy(camera.up).normalize();
        
        // Calculate pan offset based on mouse movement
        const panOffset = new THREE.Vector3();
        panOffset.add(right.multiplyScalar(-deltaX * panSpeed * spherical.radius));
        panOffset.add(up.multiplyScalar(deltaY * panSpeed * spherical.radius));
        
        // Move both target and camera by the same offset
        targetRef.current.add(panOffset);
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
      camera.position.copy(newVector.add(targetRef.current));
      camera.lookAt(targetRef.current);
    };

    // Attach event listeners with passive option for wheel events
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: false });
    renderer.domElement.addEventListener('contextmenu', handleContextMenu);

    // Store cleanup function and target ref
    const detachControls = () => {
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      renderer.domElement.removeEventListener('contextmenu', handleContextMenu);
    };
    controlsRef.current = detachControls;
    
    // Store target ref for updating when model is loaded
    (controlsRef as any).targetRef = targetRef;

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      
      // Only rotate the default cube if no custom model is loaded
      if (!hasCustomModel && defaultCubeRef.current) {
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
  }, []); // Removed hasCustomModel from dependency array

  const removeCurrentModel = () => {
    if (currentModelRef.current && sceneRef.current) {
      sceneRef.current.remove(currentModelRef.current);
      currentModelRef.current = null;
    }
  };

  const addModelToScene = (model: THREE.Object3D) => {
    if (!sceneRef.current || !cameraRef.current) return;

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
    setHasCustomModel(true);

    // Update the controls target to center on the model
    if ((controlsRef as any).targetRef) {
      const modelCenter = new THREE.Vector3();
      const modelBox = new THREE.Box3().setFromObject(model);
      modelBox.getCenter(modelCenter);
      (controlsRef as any).targetRef.current.copy(modelCenter);
      
      // Update camera to look at the new target
      cameraRef.current.lookAt(modelCenter);
    }

    // Publish model data to other nodes
    if (id) {
      updateNodeData(id, { model: model.clone() });
    }
  };

  const loadModel = async (file: File): Promise<THREE.Object3D> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

        try {
          switch (fileExtension) {
            case '.glb':
            case '.gltf': {
              const loader = new GLTFLoader();
              loader.parse(arrayBuffer, '', (gltf) => {
                resolve(gltf.scene);
              }, reject);
              break;
            }
            case '.obj': {
              const loader = new OBJLoader();
              const text = new TextDecoder().decode(arrayBuffer);
              const object = loader.parse(text);
              resolve(object);
              break;
            }
            case '.stl': {
              const loader = new STLLoader();
              const geometry = loader.parse(arrayBuffer);
              const material = new THREE.MeshPhongMaterial({ color: 0x6366f1 });
              const mesh = new THREE.Mesh(geometry, material);
              resolve(mesh);
              break;
            }
            default:
              reject(new Error('Unsupported file format'));
          }
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Clear any previous errors
    setUploadError('');
    
    // Validate file type
    const validExtensions = ['.stl', '.obj', '.glb', '.gltf'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      setUploadError(`Unsupported file type. Please upload: ${validExtensions.join(', ')}`);
      return;
    }

    // Validate file size (limit to 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      setUploadError('File too large. Please upload a file smaller than 50MB.');
      return;
    }

    setIsLoading(true);
    setFileName(file.name);

    try {
      const model = await loadModel(file);
      addModelToScene(model);
      setIsLoading(false);
    } catch (error) {
      setUploadError('Failed to process the 3D model file.');
      setIsLoading(false);
      setFileName('Default Cube');
      
      // Show default cube again on error
      if (defaultCubeRef.current) {
        defaultCubeRef.current.visible = true;
      }
      setHasCustomModel(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
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
          <input
            ref={fileInputRef}
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
            onClick={handleUploadClick}
          >
            <Upload className="w-4 h-4" />
            {isLoading ? 'Processing...' : 'Upload Model'}
          </Button>
          {uploadError && (
            <p className="text-xs text-red-500 text-center">
              {uploadError}
            </p>
          )}
          <p className="text-xs text-muted-foreground text-center">
            {fileName}
          </p>
          <p className="text-xs text-muted-foreground text-center">
            Supports: STL, OBJ, GLB, GLTF (max 50MB)
          </p>
        </div>

        {/* 3D Preview */}
        <div className="relative bg-muted rounded-lg overflow-hidden">
          <div
            ref={mountRef}
            className="w-full h-48 flex items-center justify-center"
          />
          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
            Left: Rotate | Right: Pan
          </div>
        </div>
      </div>
    </BaseCard>
  );
};
