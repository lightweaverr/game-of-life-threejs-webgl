'use client'

import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import vertex from '@/shaders/vertex';
import mainFragment from '@/shaders/mainFragment';
import bufferFragment from '@/shaders/bufferFragment';
import { createDataTexture } from '@/utils';


const GameOfLife = () => {
  /**
   * Initialising all the components as refs to retain reference across renders.
   */
  const containerRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef(new THREE.Clock());
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const bufferSceneRef = useRef<THREE.Scene | null>(null);
  const planeRef = useRef<THREE.Mesh | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const currentTextureRef = useRef<number>(0);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const bufferMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const initialStateTextureRef = useRef<THREE.DataTexture | null>(null);
  const bufferMeshRef = useRef<THREE.Mesh | null>(null);
  const renderBufferA = useRef<THREE.WebGLRenderTarget | null>(null);
  const renderBufferB = useRef<THREE.WebGLRenderTarget | null>(null);


  /**
   * State
   */
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [cellSize, setCellSize] = useState(7);
  const [gridSize, setGridSize] = useState({ width: 0, height: 0 });
  const [isRunning, setIsRunning] = useState(true);


  /**
   * Parameters
   */
  const parameters = {
    frustumSize: 30,
  }

  /**
  * Initialize
  */
  const init = () => {

    /**
     * Canvas
     */
    const canvas = document.querySelector('#myCanvas');
    if (!canvas) return;
    if (!containerRef.current) return;


    /**
     * Sizes
     */
    const newCanvasSize = {
      width: containerRef.current.offsetWidth,
      height: containerRef.current.offsetHeight
    }
    setCanvasSize(newCanvasSize);
    const aspect = newCanvasSize.width / newCanvasSize.height;


    /**
     * Scene
     */
    sceneRef.current = new THREE.Scene();
    bufferSceneRef.current = new THREE.Scene();

    /**
     * Camera
     */
    cameraRef.current = new THREE.OrthographicCamera(
      parameters.frustumSize * aspect / -2,
      parameters.frustumSize * aspect / 2,
      parameters.frustumSize / 2,
      parameters.frustumSize / -2,
      0.1,
      100);
    cameraRef.current.position.set(0, 0, 100);

    sceneRef.current.add(cameraRef.current);

    /**
     * Texture
     */
    initialStateTextureRef.current = createDataTexture(newCanvasSize);

    /**
     * Mesh (Geometry and Material)
     */
    const geometry = new THREE.PlaneGeometry(parameters.frustumSize * aspect, parameters.frustumSize);

    materialRef.current = new THREE.ShaderMaterial({
      uniforms: {
        uPreviousState: { value: initialStateTextureRef.current },
        uResolution: { value: new THREE.Vector2(canvasSize.width, canvasSize.height) },
        uGridSize: { value: new THREE.Vector2(gridSize.width, gridSize.height) },
      },
      vertexShader: vertex,
      fragmentShader: mainFragment,
    });

    bufferMaterialRef.current = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: initialStateTextureRef.current },
        uResolution: { value: new THREE.Vector2(canvasSize.width, canvasSize.height) },
        uGridSize: { value: new THREE.Vector2(gridSize.width, gridSize.height) },
        uMouse: { value: new THREE.Vector3() }, // we will use the z value as click indicator
        uFrame: { value: 0 },
      },
      vertexShader: vertex,
      fragmentShader: bufferFragment,
    })

    planeRef.current = new THREE.Mesh(geometry, materialRef.current);
    bufferMeshRef.current = new THREE.Mesh(geometry, bufferMaterialRef.current);

    sceneRef.current.add(planeRef.current);
    bufferSceneRef.current.add(bufferMeshRef.current);

    /**
     * RenderBuffers
     */
    renderBufferA.current = new THREE.WebGLRenderTarget(gridSize.width, gridSize.height, {
      format: THREE.RGBAFormat,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      type: THREE.FloatType,
      stencilBuffer: false,
    });
    renderBufferB.current = new THREE.WebGLRenderTarget(gridSize.width, gridSize.height, {
      format: THREE.RGBAFormat,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      type: THREE.FloatType,
      stencilBuffer: false,
    });

    /**
     * Renderer
     */
    rendererRef.current = new THREE.WebGLRenderer({ canvas });
    rendererRef.current.setSize(canvasSize.width, canvasSize.height);
    rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  const onWindowResize = () => {
    if (!containerRef.current) return;
    const newCanvasSize = {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight
    }
    setCanvasSize(newCanvasSize);
  }

  /**
   *  Animation
   */
  const animate = useCallback(() => {
    if (!isRunning) return;



    if (!materialRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current || !bufferSceneRef.current) return;


    // Change the render target 
    rendererRef.current.setRenderTarget(renderBufferA.current);
    // render the next frame to the bufferA  
    rendererRef.current.render(bufferSceneRef.current, cameraRef.current);

    // now renderBufferA has the next frame
    materialRef.current.uniforms.uPreviousState.value = renderBufferA.current!.texture;

    rendererRef.current.setRenderTarget(null);
    rendererRef.current.render(sceneRef.current, cameraRef.current);

    // Now we ping pong the buffers
    const next = renderBufferA.current;
    renderBufferA.current = renderBufferB.current;
    renderBufferB.current = next;
    // and we pass the current frame to buffer material to render next frame
    bufferMaterialRef.current!.uniforms.uTexture.value = next!.texture;

    // Increment the frame
    bufferMaterialRef.current!.uniforms.uFrame.value += 1;

    // currentTextureRef.current = next;
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

    const aspectRatio = canvasSize.width / canvasSize.height;

    if (!cameraRef.current) return;
    cameraRef.current.left = parameters.frustumSize * aspectRatio / -2;
    cameraRef.current.right = parameters.frustumSize * aspectRatio / 2;
    cameraRef.current.top = parameters.frustumSize / 2;
    cameraRef.current.bottom = parameters.frustumSize / -2;
    cameraRef.current.updateProjectionMatrix();


    if (!planeRef.current) return;
    planeRef.current.geometry.dispose();
    const newGeometry = new THREE.PlaneGeometry(parameters.frustumSize * aspectRatio, parameters.frustumSize);
    planeRef.current.geometry = newGeometry;
    bufferMeshRef.current!.geometry = newGeometry;

    if (!rendererRef.current) return;
    rendererRef.current.setSize(canvasSize.width, canvasSize.height);

    renderBufferA.current?.setSize(newGridSize.width, newGridSize.height);
    renderBufferB.current?.setSize(newGridSize.width, newGridSize.height);

    if (!materialRef.current || !bufferMaterialRef.current) return
    initialStateTextureRef.current = createDataTexture({ width: newGridSize.width, height: newGridSize.height });
    materialRef.current.uniforms.uPreviousState.value = initialStateTextureRef.current;
    materialRef.current.uniforms.uGridSize.value = new THREE.Vector2(newGridSize.width, newGridSize.height);
    bufferMaterialRef.current.uniforms.uTexture.value = initialStateTextureRef.current;
    bufferMaterialRef.current.uniforms.uGridSize.value = new THREE.Vector2(newGridSize.width, newGridSize.height);
    bufferMaterialRef.current.uniforms.uResolution.value = new THREE.Vector2(canvasSize.width, canvasSize.height);
    materialRef.current.uniforms.uResolution.value = new THREE.Vector2(canvasSize.width, canvasSize.height);
  }, [canvasSize, cellSize]);


  useEffect(() => {
    init();
    onWindowResize();
    animate();

    window.addEventListener('resize', onWindowResize);

    rendererRef.current!.domElement.addEventListener('mousedown', () => {
      bufferMaterialRef.current!.uniforms.uMouse.value.z = 1;
    })

    rendererRef.current!.domElement.addEventListener('mouseup', () => {
      bufferMaterialRef.current!.uniforms.uMouse.value.z = 0;

    })

    rendererRef.current!.domElement.addEventListener('mousemove', e => {
      //update uniforms
      bufferMaterialRef.current!.uniforms.uMouse.value.x = e.clientX;
      bufferMaterialRef.current!.uniforms.uMouse.value.y = rendererRef.current!.domElement.clientHeight - e.clientY;
    })

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
      <canvas id='myCanvas' className='w-full h-full' />
    </div>
  )
}

export default GameOfLife