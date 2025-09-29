import { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface Use3DControlsProps {
  camera: THREE.PerspectiveCamera | null;
  renderer: THREE.WebGLRenderer | null;
  scene: THREE.Scene | null;
}

export const use3DControls = ({ camera, renderer, scene }: Use3DControlsProps) => {
  const isDragging = useRef(false);
  const previousMouse = useRef({ x: 0, y: 0 });
  const spherical = useRef(new THREE.Spherical());
  const target = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (!camera) return;

    // Initialize spherical coordinates from camera position
    const vector = new THREE.Vector3().subVectors(camera.position, target.current);
    spherical.current.setFromVector3(vector);
  }, [camera]);

  const handleMouseDown = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    isDragging.current = true;
    previousMouse.current = { x: event.clientX, y: event.clientY };
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (!isDragging.current || !camera) return;
    
    event.preventDefault();
    event.stopPropagation();

    const deltaX = event.clientX - previousMouse.current.x;
    const deltaY = event.clientY - previousMouse.current.y;

    spherical.current.theta -= deltaX * 0.01;
    spherical.current.phi += deltaY * 0.01;

    // Constrain phi to avoid flipping
    spherical.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.current.phi));

    // Update camera position
    const vector = new THREE.Vector3().setFromSpherical(spherical.current);
    camera.position.copy(vector.add(target.current));
    camera.lookAt(target.current);

    previousMouse.current = { x: event.clientX, y: event.clientY };
  };

  const handleMouseUp = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    isDragging.current = false;
  };

  const handleWheel = (event: WheelEvent) => {
    if (!camera) return;
    
    event.preventDefault();
    event.stopPropagation();

    spherical.current.radius += event.deltaY * 0.01;
    spherical.current.radius = Math.max(2, Math.min(20, spherical.current.radius));

    // Update camera position
    const vector = new THREE.Vector3().setFromSpherical(spherical.current);
    camera.position.copy(vector.add(target.current));
    camera.lookAt(target.current);
  };

  const attachControls = (element: HTMLElement) => {
    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseup', handleMouseUp);
    element.addEventListener('wheel', handleWheel);

    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseup', handleMouseUp);
      element.removeEventListener('wheel', handleWheel);
    };
  };

  return { attachControls };
};