import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

function ThreeBackground({ isDark = false }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const particleMeshRef = useRef(null);
  const animationIdRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      1,
      1000
    );
    camera.position.z = 400;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 120;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 800;
    }

    particlesGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(posArray, 3)
    );

    // Material - dynamically change color based on theme
    const particleColor = isDark ? 0x60a5fa : 0x3b82f6; // Blue-400 for dark, Blue-500 for light
    const particlesMaterial = new THREE.PointsMaterial({
      size: 4,
      color: particleColor,
      transparent: true,
      opacity: isDark ? 0.6 : 0.8,
    });

    const linesMaterial = new THREE.LineBasicMaterial({
      color: particleColor,
      transparent: true,
      opacity: isDark ? 0.1 : 0.15,
    });

    const particleMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particleMesh);
    particleMeshRef.current = particleMesh;

    // Mouse movement handler
    const handleMouseMove = (event) => {
      mouseRef.current.x = event.clientX - window.innerWidth / 2;
      mouseRef.current.y = event.clientY - window.innerHeight / 2;
    };

    document.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      // Rotation
      particleMesh.rotation.x += 0.001;
      particleMesh.rotation.y += 0.001;

      // Mouse interaction
      camera.position.x += (mouseRef.current.x * 0.5 - camera.position.x) * 0.05;
      camera.position.y += (-mouseRef.current.y * 0.5 - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      // Remove existing lines
      const existingLines = scene.getObjectByName('lines');
      if (existingLines) scene.remove(existingLines);

      // Create new lines
      const lineGeo = new THREE.BufferGeometry();
      const linePos = [];
      const positions = particleMesh.geometry.attributes.position.array;

      for (let i = 0; i < particlesCount; i++) {
        for (let j = i + 1; j < particlesCount; j++) {
          const x1 = positions[i * 3];
          const y1 = positions[i * 3 + 1];
          const z1 = positions[i * 3 + 2];

          const x2 = positions[j * 3];
          const y2 = positions[j * 3 + 1];
          const z2 = positions[j * 3 + 2];

          const dist = Math.sqrt(
            Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2) + Math.pow(z1 - z2, 2)
          );

          if (dist < 120) {
            linePos.push(x1, y1, z1);
            linePos.push(x2, y2, z2);
          }
        }
      }

      lineGeo.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(linePos, 3)
      );
      const lines = new THREE.LineSegments(lineGeo, linesMaterial);
      lines.name = 'lines';
      lines.rotation.x = particleMesh.rotation.x;
      lines.rotation.y = particleMesh.rotation.y;

      scene.add(lines);

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      linesMaterial.dispose();
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
      }}
    />
  );
}

export default ThreeBackground;
