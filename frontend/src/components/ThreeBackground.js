import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

function ThreeBackground({ isDark = false }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const particleMeshRef = useRef(null);
  const linesMeshRef = useRef(null);
  const animationIdRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const isCleanedUpRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;
    isCleanedUpRef.current = false;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 400;
    cameraRef.current = camera;

    // Renderer setup with better settings
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 150;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 1000;
    }

    particlesGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(posArray, 3)
    );

    // Material - dynamically change color based on theme
    const particleColor = isDark ? 0x60a5fa : 0x3b82f6; // Blue-400 for dark, Blue-500 for light
    const particlesMaterial = new THREE.PointsMaterial({
      size: 5,
      color: particleColor,
      transparent: true,
      opacity: isDark ? 0.7 : 0.9,
      sizeAttenuation: true
    });

    const particleMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particleMesh);
    particleMeshRef.current = particleMesh;

    // Lines material
    const linesMaterial = new THREE.LineBasicMaterial({
      color: particleColor,
      transparent: true,
      opacity: isDark ? 0.15 : 0.2,
    });

    // Create initial line mesh
    const lineGeometry = new THREE.BufferGeometry();
    const linesMesh = new THREE.LineSegments(lineGeometry, linesMaterial);
    linesMesh.name = 'connectionLines';
    scene.add(linesMesh);
    linesMeshRef.current = linesMesh;

    // Mouse movement handler
    const handleMouseMove = (event) => {
      mouseRef.current.x = (event.clientX - window.innerWidth / 2) * 0.5;
      mouseRef.current.y = (event.clientY - window.innerHeight / 2) * 0.5;
    };

    document.addEventListener('mousemove', handleMouseMove);

    // Animation loop with proper line updates
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      // Smooth rotation
      if (particleMesh) {
        particleMesh.rotation.x += 0.0008;
        particleMesh.rotation.y += 0.0008;
      }

      // Smooth mouse interaction with camera
      if (camera) {
        camera.position.x += (mouseRef.current.x - camera.position.x) * 0.03;
        camera.position.y += (-mouseRef.current.y - camera.position.y) * 0.03;
        camera.lookAt(scene.position);
      }

      // Update connection lines
      if (particleMesh && linesMeshRef.current) {
        const linePositions = [];
        const positions = particleMesh.geometry.attributes.position.array;

        for (let i = 0; i < particlesCount; i++) {
          for (let j = i + 1; j < particlesCount; j++) {
            const x1 = positions[i * 3];
            const y1 = positions[i * 3 + 1];
            const z1 = positions[i * 3 + 2];

            const x2 = positions[j * 3];
            const y2 = positions[j * 3 + 1];
            const z2 = positions[j * 3 + 2];

            const distance = Math.sqrt(
              Math.pow(x2 - x1, 2) + 
              Math.pow(y2 - y1, 2) + 
              Math.pow(z2 - z1, 2)
            );

            if (distance < 150) {
              linePositions.push(x1, y1, z1, x2, y2, z2);
            }
          }
        }

        // Update line geometry
        linesMeshRef.current.geometry.setAttribute(
          'position',
          new THREE.Float32BufferAttribute(linePositions, 3)
        );
        linesMeshRef.current.geometry.attributes.position.needsUpdate = true;
        linesMeshRef.current.rotation.copy(particleMesh.rotation);
      }

      renderer.render(scene, camera);
    };

    // Start animation
    animate();

    // Resize handler
    const handleResize = () => {
      if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      if (containerRef.current && renderer && renderer.domElement && containerRef.current.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
      
      if (renderer) {
        renderer.dispose();
      }
      
      if (particlesGeometry) {
        particlesGeometry.dispose();
      }
      
      if (particlesMaterial) {
        particlesMaterial.dispose();
      }
      
      if (linesMaterial) {
        linesMaterial.dispose();
      }
    };
  }, [isDark]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none'
      }}
    />
  );
}

export default ThreeBackground;
