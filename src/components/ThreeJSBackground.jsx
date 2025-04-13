import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';

const ThreeJSBackground = () => {
  const mountRef = useRef(null);
  const [fps, setFps] = useState(0);
  
  useEffect(() => {
    // Initialize Three.js scene
    const scene = new THREE.Scene();
    
    // Fog color - light blueish
    const fogColor = 0xf3f6ff;
    
    // Add fog with increased density (was 0.08)
    scene.fog = new THREE.FogExp2(fogColor, 0.15);
    
    // Get the width and height of the container
    const width = window.innerWidth;
    const height = window.innerHeight;

    const objectsColor = new THREE.Color(10 / 255, 90 / 255, 255 / 255);
    
    // Create a camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;
    
    // Create a renderer with better performance settings
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    
    // Set background color to match fog color
    renderer.setClearColor(fogColor, 1);
    
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    
    // Append the renderer to the DOM
    const currentRef = mountRef.current;
    currentRef.appendChild(renderer.domElement);
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Mild ambient light
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5); // Strong directional light
    directionalLight.position.set(2, 3, 4);
    scene.add(directionalLight);
    
    // Setup post-processing for bloom effect
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.3,    // strength
      0.35,   // radius
      0.98    // threshold
    );
    composer.addPass(bloomPass);

    const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);  
    composer.addPass(gammaCorrectionPass);
    
    // Create a main group to hold both shapes and lines
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // Create different 3D shapes
    const createShapes = (count) => {
      const shapes = [];
      
      // Prepare geometries
      const geometries = [
        new THREE.BoxGeometry(0.1, 0.1, 0.1),
        new THREE.TetrahedronGeometry(0.06),
        new THREE.DodecahedronGeometry(0.06)
      ];
      
      for (let i = 0; i < count; i++) {
        // Select random geometry
        const geometryIndex = Math.floor(Math.random() * geometries.length);
        const geometry = geometries[geometryIndex].clone();
        
        // Create a material with high specularity
        const material = new THREE.MeshPhongMaterial({
          color: objectsColor,
          specular: 0xffffff,
          shininess: 100,
          emissive: objectsColor.clone().multiplyScalar(0.2),
          flatShading: true
        });
        
        // Create mesh
        const mesh = new THREE.Mesh(geometry, material);
        
        // Random position
        const positionsScale = 15; //default was 15
        mesh.position.x = (Math.random() - 0.5) * positionsScale;
        mesh.position.y = (Math.random() - 0.5) * positionsScale;
        mesh.position.z = (Math.random() - 0.5) * positionsScale;
        
        // Random initial rotation
        mesh.rotation.x = Math.random() * Math.PI * 2;
        mesh.rotation.y = Math.random() * Math.PI * 2;
        mesh.rotation.z = Math.random() * Math.PI * 2;
        
        // Add rotation speeds for independent rotation
        mesh.userData.rotationSpeed = {
          x: (Math.random() - 0.5) * 0.02,
          y: (Math.random() - 0.5) * 0.02,
          z: (Math.random() - 0.5) * 0.02
        };
        
        // Add to mainGroup and to our array
        mainGroup.add(mesh);
        shapes.push(mesh);
      }
      
      return shapes;
    };
    
    // Create lines between some shapes
    const createConnections = (shapes, maxConnections) => {
      const connections = [];
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x6ba5ff,
        transparent: true,
        opacity: 0.6,
        linewidth: 50
      });
      
      const maxDistance = 2.5; // Maximum distance for a connection
      
      for (let i = 0; i < maxConnections; i++) {
        const index1 = Math.floor(Math.random() * shapes.length);
        const index2 = Math.floor(Math.random() * shapes.length);
        
        if (index1 === index2) continue;
        
        const p1 = shapes[index1].position;
        const p2 = shapes[index2].position;
        
        // Calculate distance
        const distance = p1.distanceTo(p2);
        
        // Only connect if within max distance and not already connected
        if (distance < maxDistance && !connections.some(conn => (conn.point1 === index1 && conn.point2 === index2) || (conn.point1 === index2 && conn.point2 === index1))) {

          const createLine = () => {
            const length = 1;
            
            // Create a cylinder
            const geometry = new THREE.CylinderGeometry(0.005, 0.005, length, 8);
            const material = new THREE.MeshPhongMaterial({
              color: objectsColor,
              specular: 0xffffff,
              shininess: 100,
              emissive: objectsColor.clone().multiplyScalar(0.2),
              flatShading: true
            });
            
            const cylinder = new THREE.Mesh(geometry, material);
            return cylinder;
          };

          // Create line using the custom function
          const line = createLine();

          connections.push({
            line: line,
            point1: index1,
            point2: index2
          });

          mainGroup.add(line);
        }
      }
      
      return connections;
    };
    
    // Create shapes and connections
    const shapes = createShapes(500); // was 450
    const connections = createConnections(shapes, 50000);
    
    // Add window resize handler with throttling
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        renderer.setSize(width, height);
        composer.setSize(width, height);
        
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }, 200);
    };
    
    window.addEventListener('resize', handleResize);
    
    // FPS calculation variables
    let frameCount = 0;
    let lastFpsUpdateTime = 0;
    const fpsUpdateInterval = 500; // Update FPS every 500ms
    
    // Animation loop with frame rate control
    let lastTime = 0;
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;
    
    const animate = (currentTime) => {
      const animationId = requestAnimationFrame(animate);
      
      // Control frame rate
      const deltaTime = currentTime - lastTime;
      if (deltaTime < frameInterval) return;
      
      lastTime = currentTime - (deltaTime % frameInterval);
      
      // Count frames for FPS calculation
      frameCount++;
      
      // Update FPS counter every 500ms
      if (currentTime - lastFpsUpdateTime > fpsUpdateInterval) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastFpsUpdateTime));
        setFps(fps);
        frameCount = 0;
        lastFpsUpdateTime = currentTime;
      }
      
      // Rotate the entire mainGroup (containing both shapes and lines)
      mainGroup.rotation.x += 0.0005;
      mainGroup.rotation.y += 0.0008;
      
      // Update individual shapes with their own rotation
      shapes.forEach(shape => {
        // Apply individual rotation based on the shape's unique rotation speed
        shape.rotation.x += shape.userData.rotationSpeed.x;
        shape.rotation.y += shape.userData.rotationSpeed.y;
        shape.rotation.z += shape.userData.rotationSpeed.z;
      });
      
      // Update line positions to match the shapes they connect
      connections.forEach(connection => {
        const shape1 = shapes[connection.point1];
        const shape2 = shapes[connection.point2];
        const cylinder = connection.line;
        
        // Get world positions of shapes
        const worldPos1 = new THREE.Vector3();
        const worldPos2 = new THREE.Vector3();
        
        shape1.getWorldPosition(worldPos1);
        shape2.getWorldPosition(worldPos2);
        
        // Convert world positions to local space relative to mainGroup
        const localPos1 = worldPos1.clone();
        const localPos2 = worldPos2.clone();
        mainGroup.worldToLocal(localPos1);
        mainGroup.worldToLocal(localPos2);
        
        // Calculate direction and length in local space
        const direction = new THREE.Vector3().subVectors(localPos2, localPos1);
        const length = direction.length();
        
        // Position cylinder at midpoint
        const midpoint = localPos1.clone().add(direction.clone().multiplyScalar(0.5));
        cylinder.position.copy(midpoint);
        
        // Update cylinder length
        cylinder.scale.y = length;
        
        // Set orientation using quaternion
        // Start with default cylinder orientation (Y-up)
        const defaultDirection = new THREE.Vector3(0, 1, 0);
        // Create quaternion for the rotation from default to target direction
        direction.normalize();
        cylinder.quaternion.setFromUnitVectors(defaultDirection, direction);
      });
      
      // Render using the effect composer (for bloom)
      composer.render();
    };
    
    // Start animation
    let animationId = requestAnimationFrame(animate);
    
    // Clean up on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      
      // Dispose of resources
      shapes.forEach(shape => {
        shape.geometry.dispose();
        shape.material.dispose();
        mainGroup.remove(shape);
      });
      
      connections.forEach(connection => {
        connection.line.geometry.dispose();
        connection.line.material.dispose();
        mainGroup.remove(connection.line);
      });
      
      scene.remove(mainGroup);
      currentRef.removeChild(renderer.domElement);
      
      renderer.dispose();
      composer.dispose();
    };
  }, []);
  
  return (
    <>
      <div 
        ref={mountRef} 
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
      {/* <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: '#00ff00',
        padding: '5px 10px',
        borderRadius: '4px',
        fontFamily: 'monospace',
        zIndex: 100
      }}>
        FPS: {fps}
      </div> */}
    </>
  );
};

export default ThreeJSBackground;