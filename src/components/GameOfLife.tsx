'use client'

import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import vertex from '@/shaders/vertex';
import fragment from '@/shaders/fragment';


const GameOfLife = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef(new THREE.Clock());
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const planeRef = useRef<THREE.Mesh | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const renderTargetsRef = useRef<THREE.WebGLRenderTarget[]>([]);
  const currentTextureRef = useRef<number>(0);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [cellSize, setCellSize] = useState(100);
  const [gridSize, setGridSize] = useState({ width: 0, height: 0 });
  const [isRunning, setIsRunning] = useState(true);



  const parameters = {
    frustumSize: 30,
  }

  const initRenderTarget = useCallback((width: number, height: number) => {
    const renderTarget = new THREE.WebGLRenderTarget(width, height, {
      format: THREE.RedFormat,
      type: THREE.UnsignedByteType
    });
    const size = width * height;
    const data = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      data[i] = Math.random() > 0.5 ? 255 : 0;
    }
    renderTarget.texture.image = { data, width, height };
    renderTarget.texture.needsUpdate = true;
    return renderTarget;
  }, []);

  const init = () => {
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

    const aspect = canvasSize.width / canvasSize.height;
    sceneRef.current = new THREE.Scene();
    cameraRef.current = new THREE.OrthographicCamera(
      parameters.frustumSize * aspect / -2,
      parameters.frustumSize * aspect / 2,
      parameters.frustumSize / 2,
      parameters.frustumSize / -2,
      0.1,
      100);
    const geometry = new THREE.PlaneGeometry(parameters.frustumSize * aspect, parameters.frustumSize);
    materialRef.current = new THREE.ShaderMaterial({
      uniforms: {
        uPreviousState: { value: null },
        uResolution: { value: new THREE.Vector2(gridSize.width, gridSize.height) }
      },
      vertexShader: vertex,
      fragmentShader: fragment,
    });
    planeRef.current = new THREE.Mesh(geometry, materialRef.current);

    cameraRef.current.position.set(0, 0, 100);
    sceneRef.current.add(planeRef.current);
    sceneRef.current.add(cameraRef.current);

    /**
     * Renderer
     */
    rendererRef.current = new THREE.WebGLRenderer({ canvas });

    rendererRef.current.setSize(canvasSize.width, canvasSize.height);
    rendererRef.current.render(sceneRef.current, cameraRef.current);
  }

  const onWindowResize = () => {
    if (!containerRef.current) return;
    const newCanvasSize = {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight
    }
    setCanvasSize(newCanvasSize);

    const newGridSize = {
      width: Math.ceil(newCanvasSize.width / cellSize),
      height: Math.ceil(newCanvasSize.height / cellSize)
    };
    setGridSize(newGridSize)
    const aspectRatio = newCanvasSize.width / newCanvasSize.height;

    if (!cameraRef.current) return;
    cameraRef.current.left = parameters.frustumSize * aspectRatio / -2;
    cameraRef.current.right = parameters.frustumSize * aspectRatio / 2;
    cameraRef.current.top = parameters.frustumSize / 2;
    cameraRef.current.bottom = parameters.frustumSize / -2;
    cameraRef.current.updateProjectionMatrix();


    if (!planeRef.current) return;
    planeRef.current.geometry.dispose();
    planeRef.current.geometry = new THREE.PlaneGeometry(parameters.frustumSize * aspectRatio, parameters.frustumSize);

    if (!rendererRef.current) return;
    rendererRef.current.setSize(newCanvasSize.width, newCanvasSize.height);
  }

  /**
   *  Animation
   */
  const animate = useCallback(() => {
    if (!isRunning) return;
    const current = currentTextureRef.current;
    const next = 1 - current;

    if (!materialRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    materialRef.current.uniforms.uPreviousState.value = renderTargetsRef.current[current].texture;
    rendererRef.current.setRenderTarget(renderTargetsRef.current[next]);
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    rendererRef.current.setRenderTarget(null);
    rendererRef.current.render(sceneRef.current, cameraRef.current);

    currentTextureRef.current = next;
    requestAnimationFrame(animate);
  }, []);


  /**
   *  Use Effects
   */
  useEffect(() => {
    const newGridSize = {
      width: Math.ceil(canvasSize.width / cellSize),
      height: Math.ceil(canvasSize.height / cellSize)
    };
    setGridSize(newGridSize);
    renderTargetsRef.current = [
      initRenderTarget(newGridSize.width, newGridSize.height),
      initRenderTarget(newGridSize.width, newGridSize.height)
    ];

    if (!materialRef.current) return
    materialRef.current.uniforms.uPreviousState.value = renderTargetsRef.current[0].texture;
    materialRef.current.uniforms.uResolution.value = new THREE.Vector2(newGridSize.width, newGridSize.height);
  }, [canvasSize, cellSize]);





  useEffect(() => {
    init();
    animate();
    window.addEventListener('resize', onWindowResize);
    onWindowResize();
    /**
     * Cleanup
     */
    return () => {
      window.removeEventListener('resize', onWindowResize);
      if (planeRef.current) {
        planeRef.current.geometry.dispose();
        (planeRef.current.material as THREE.Material).dispose();
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  return (
    <div ref={containerRef} className='w-screen h-screen'>
      <canvas id='myCanvas' className='' />
    </div>
  )
}

export default GameOfLife