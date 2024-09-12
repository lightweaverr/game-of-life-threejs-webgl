'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D tPreviousState;
  uniform vec2 resolution;
  varying vec2 vUv;

  int getState(vec2 uv) {
    return int(texture2D(tPreviousState, uv).r);
  }

  void main() {
    vec2 texel = 1.0 / resolution;
    int sum = 
      getState(vUv + texel * vec2(-1.0, -1.0)) +
      getState(vUv + texel * vec2(-1.0,  0.0)) +
      getState(vUv + texel * vec2(-1.0,  1.0)) +
      getState(vUv + texel * vec2( 0.0, -1.0)) +
      getState(vUv + texel * vec2( 0.0,  1.0)) +
      getState(vUv + texel * vec2( 1.0, -1.0)) +
      getState(vUv + texel * vec2( 1.0,  0.0)) +
      getState(vUv + texel * vec2( 1.0,  1.0));

    int current = getState(vUv);
    
    if (current == 1 && (sum == 2 || sum == 3)) {
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    } else if (current == 0 && sum == 3) {
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    } else {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
  }
`;

interface GameOfLifeProps {
  cellSize: number;
}

interface Dimensions {
  width: number;
  height: number;
}

const GameOfLife: React.FC<GameOfLifeProps> = ({ cellSize = 5 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const renderTargetsRef = useRef<THREE.WebGLRenderTarget[]>([]);
  const currentTextureRef = useRef<number>(0);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState<Dimensions>({ width: 0, height: 0 });
  const [gridSize, setGridSize] = useState<Dimensions>({ width: 0, height: 0 });

  const initializeRenderTarget = useCallback((width: number, height: number): THREE.WebGLRenderTarget => {
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

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        setDimensions({ width, height });
        setGridSize({
          width: Math.ceil(width / cellSize),
          height: Math.ceil(height / cellSize)
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [cellSize]);

  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0 || gridSize.width === 0 || gridSize.height === 0) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(dimensions.width, dimensions.height);
    if (containerRef.current) {
      containerRef.current.appendChild(renderer.domElement);
    }

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        tPreviousState: { value: null },
        resolution: { value: new THREE.Vector2(gridSize.width, gridSize.height) }
      }
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    renderTargetsRef.current = [
      initializeRenderTarget(gridSize.width, gridSize.height),
      initializeRenderTarget(gridSize.width, gridSize.height)
    ];
    material.uniforms.tPreviousState.value = renderTargetsRef.current[0].texture;

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    materialRef.current = material;

    return () => {
      renderer.dispose();
      renderTargetsRef.current.forEach(rt => rt.dispose());
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [dimensions, gridSize, initializeRenderTarget]);

  const animate = useCallback(() => {
    
    if (!isRunning) return;
    console.log(renderTargetsRef.current[0].texture)

    const current = currentTextureRef.current;
    const next = 1 - current;

    if (materialRef.current && rendererRef.current && sceneRef.current && cameraRef.current) {
      materialRef.current.uniforms.tPreviousState.value = renderTargetsRef.current[current].texture;
      rendererRef.current.setRenderTarget(renderTargetsRef.current[next]);
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      rendererRef.current.setRenderTarget(null);
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }

    currentTextureRef.current = next;

    requestAnimationFrame(animate);
  }, [isRunning]);

  useEffect(() => {
    animate();
  }, [animate]);

  const toggleSimulation = () => {
    setIsRunning(!isRunning);
  };

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col items-center">
      <button
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={toggleSimulation}
      >
        {isRunning ? 'Stop' : 'Start'} Simulation
      </button>
    </div>
  );
};

export default GameOfLife;