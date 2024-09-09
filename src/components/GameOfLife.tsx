'use client'

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import vertex from '@/shaders/vertex';
import fragment from '@/shaders/fragment';


const GameOfLife = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef(new THREE.Clock());

  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [cellSize, setCellSize] = useState(1);
  const [gridSize, setGridSize] = useState(20);

  const parameters = {
    frustumSize: 30,
  }


  useEffect(() => {
    
    const onWindowResize = () => {
      if (!containerRef.current) return;

      setCanvasSize({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight
      })

      const aspectRatio = canvasSize.width / canvasSize.height;

      camera.left = parameters.frustumSize * aspectRatio / -2;
      camera.right = parameters.frustumSize * aspectRatio / 2;
      camera.top = parameters.frustumSize / 2;
      camera.bottom = parameters.frustumSize / -2;
      camera.updateProjectionMatrix();



      plane.geometry.dispose();
      plane.geometry = new THREE.PlaneGeometry(parameters.frustumSize * aspectRatio, parameters.frustumSize);

      renderer.setSize(canvasSize.width, canvasSize.height);
    }

    const animate = () => {
      renderer.render(scene, camera);

      requestAnimationFrame(animate);
    }

    /**
     * Initialize
     */
    const canvas = document.querySelector('#myCanvas');
    if (!canvas) return;
    if (!containerRef.current) return;

    setCanvasSize({
      width: containerRef.current.offsetWidth,
      height: containerRef.current.offsetHeight
    })

    let camera: THREE.OrthographicCamera,
      scene: THREE.Scene,
      plane: THREE.Mesh,
      renderer: THREE.WebGLRenderer;

    const aspect = canvasSize.width / canvasSize.height;
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(
      parameters.frustumSize * aspect / -2,
      parameters.frustumSize * aspect / 2,
      parameters.frustumSize / 2,
      parameters.frustumSize / -2,
      0.1,
      100);
    const geometry = new THREE.PlaneGeometry(parameters.frustumSize * aspect, parameters.frustumSize);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: {
          value: 0
        }
      },
      vertexShader: vertex,
      fragmentShader: fragment
    });
    plane = new THREE.Mesh(geometry, material);
    
    camera.position.set(0, 0, 100);
    scene.add(plane);
    scene.add(camera);


    /**
     * Renderer
     */
    renderer = new THREE.WebGLRenderer({ canvas });

    renderer.setSize(canvasSize.width, canvasSize.height);
    renderer.render(scene, camera);

    window.addEventListener('resize', onWindowResize);
    animate();

    return () => window.removeEventListener('resize', onWindowResize);
  }, []);

  return (
    <div ref={containerRef} className='w-screen h-screen'>
      <canvas id='myCanvas' className='' />
    </div>
  )
}

export default GameOfLife