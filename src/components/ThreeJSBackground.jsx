// src/components/ThreeJSBackground.jsx
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const ThreeJSBackground = () => {
  const mountRef = useRef(null);
  
  useEffect(() => {
    // Initialize Three.js scene
    const scene = new THREE.Scene();
    
    // Get the width and height of the container
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Create a camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;
    
    // Create a renderer with better performance settings
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'high-performance' // Prioritize performance
    });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0); // Transparent background
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for better performance
    
    // Append the renderer to the DOM
    const currentRef = mountRef.current;
    currentRef.appendChild(renderer.domElement);
    
    // Add window resize handler with throttling
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }, 200); // Throttle resize events
    };
    
    window.addEventListener('resize', handleResize);
    
    // Create particles for a network-like animation (reduced count for performance)
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 900; // Reduced from 700
    
    // Create arrays to store particle positions and colors
    const posArray = new Float32Array(particlesCount * 3);
    const colorArray = new Float32Array(particlesCount * 3);
    
    // Assign random positions and colors to particles
    for (let i = 0; i < particlesCount * 3; i += 3) {
      // Positions (scattered in 3D space)
      posArray[i] = (Math.random() - 0.5) * 10;
      posArray[i + 1] = (Math.random() - 0.5) * 10;
      posArray[i + 2] = (Math.random() - 0.5) * 10;
      
      // Colors (blue/purple theme to match "Mon Cercle")
      colorArray[i] = 0.5 + Math.random() * 0.5; // R (0.5-1.0)
      colorArray[i + 1] = 0.2 + Math.random() * 0.3; // G (0.2-0.5)
      colorArray[i + 2] = 0.8 + Math.random() * 0.2; // B (0.8-1.0)
    }
    
    // Add attributes to geometry
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
    
    // Create material for particles
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.05,
      transparent: true,
      opacity: 0.9,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
    
    // Create points mesh
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);
    
    // Create lines between some particles (reduced for performance)
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x6ba5ff,
      transparent: true,
      opacity: 0.6
    });
    
    // Create lines connecting nearby particles
    const lineConnections = [];
    const maxConnections = 1000; // Reduced from 100 for performance
    const maxDistance = 3; // Maximum distance for a connection
    
    for (let i = 0; i < maxConnections; i++) {
      const index1 = Math.floor(Math.random() * particlesCount);
      const index2 = Math.floor(Math.random() * particlesCount);
      
      const p1 = {
        x: posArray[index1 * 3],
        y: posArray[index1 * 3 + 1],
        z: posArray[index1 * 3 + 2]
      };
      
      const p2 = {
        x: posArray[index2 * 3],
        y: posArray[index2 * 3 + 1],
        z: posArray[index2 * 3 + 2]
      };
      
      // Calculate distance
      const distance = Math.sqrt(
        Math.pow(p1.x - p2.x, 2) +
        Math.pow(p1.y - p2.y, 2) +
        Math.pow(p1.z - p2.z, 2)
      );
      
      // Only connect if within max distance
      if (distance < maxDistance) {
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(p1.x, p1.y, p1.z),
          new THREE.Vector3(p2.x, p2.y, p2.z)
        ]);
        
        const line = new THREE.Line(lineGeometry, lineMaterial);
        lineConnections.push(line);
        scene.add(line);
      }
    }
    
    // Animation loop with frame rate control
    let lastTime = 0;
    const targetFPS = 30; // Target 30 FPS to reduce load
    const frameInterval = 1000 / targetFPS;
    
    const animate = (currentTime) => {
      // Request next frame first to avoid missing frames
      const animationId = requestAnimationFrame(animate);
      
      // Control frame rate
      const deltaTime = currentTime - lastTime;
      if (deltaTime < frameInterval) return;
      
      // Update last time, adjusting for the overflow time
      lastTime = currentTime - (deltaTime % frameInterval);
      
      // Rotate the entire particle system slowly
      particlesMesh.rotation.x += 0.0005;
      particlesMesh.rotation.y += 0.0008;
      
      // Update line rotations to match particles
      lineConnections.forEach(line => {
        line.rotation.x += 0.0005;
        line.rotation.y += 0.0008;
      });
      
      // Render the scene
      renderer.render(scene, camera);
    };
    
    // Start animation
    let animationId = requestAnimationFrame(animate);
    
    // Clean up on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      
      // Dispose of resources
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      lineMaterial.dispose();
      
      lineConnections.forEach(line => {
        line.geometry.dispose();
      });
      
      scene.remove(particlesMesh);
      lineConnections.forEach(line => scene.remove(line));
      
      currentRef.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);
  
  return (
    <div 
      ref={mountRef} 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0, // Changed from -10 to 0 to make it visible but behind content
        pointerEvents: 'none' // Allow clicks to pass through to elements behind
      }}
    />
  );
};

export default ThreeJSBackground;