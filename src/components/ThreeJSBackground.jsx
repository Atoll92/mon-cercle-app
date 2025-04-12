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
    
    // Create a renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0); // Transparent background
    
    // Append the renderer to the DOM
    const currentRef = mountRef.current;
    currentRef.appendChild(renderer.domElement);
    
    // Add window resize handler
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    
    window.addEventListener('resize', handleResize);
    
    // Create particles for a network-like animation
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 500;
    
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
      opacity: 0.8,
      vertexColors: true,
      blending: THREE.AdditiveBlending
    });
    
    // Create points mesh
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);
    
    // Create lines between some particles to create a network effect
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x4b5bff,
      transparent: true,
      opacity: 0.2
    });
    
    // Create lines connecting nearby particles
    const lineConnections = [];
    const maxConnections = 200; // Limit number of connections for performance
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
    
    // Animation loop
    const animate = () => {
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
      
      // Request animation frame
      requestAnimationFrame(animate);
    };
    
    // Start animation
    animate();
    
    // Clean up on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      
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
        zIndex: -1, // Place it behind content
        pointerEvents: 'none' // Allow clicks to pass through to elements behind
      }}
    />
  );
};

export default ThreeJSBackground;