'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import * as THREE from 'three';

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  varying vec2 vUv;
  uniform float u_time;
  uniform float u_intensity;
  uniform vec2 u_resolution;

  // Simplex noise function
  vec3 permute(vec3 x) {
    return mod(((x*34.0)+1.0)*x, 289.0);
  }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                        0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                       -0.577350269189626,  // -1.0 + 2.0 * C.x
                        0.024390243902439); // 1.0 / 41.0
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = vUv;
    vec3 color = vec3(0.0, 0.0, 0.0);

    // Grid
    vec2 gridUv = uv * 20.0;
    float grid = (mod(gridUv.x, 1.0) > 0.98 || mod(gridUv.y, 1.0) > 0.98) ? 1.0 : 0.0;
    color += vec3(0.0, 0.1, 0.2) * grid * 0.2;

    // Flowing noise
    float noise = snoise(uv * 2.0 + vec2(u_time * 0.1, 0.0));
    color += vec3(0.0, 0.1, 0.2) * noise * 0.1;

    // Central glow
    vec2 center = vec2(0.5, 0.5);
    float dist = distance(uv, center);
    float strength = smoothstep(0.4, 0.0, dist);
    float pulse = sin(u_time * 0.5) * 0.5 + 0.5;
    color += vec3(0.0, 0.1, 0.3) * strength * pulse * u_intensity;

    gl_FragColor = vec4(color, 1.0);
  }
`;

const Scene = ({ isAnimated }: { isAnimated: boolean }) => {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);

  useFrame(({ clock, size }) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.u_time.value = clock.getElapsedTime();
      shaderRef.current.uniforms.u_resolution.value.x = size.width;
      shaderRef.current.uniforms.u_resolution.value.y = size.height;
    }
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={shaderRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          u_time: { value: 0 },
          u_intensity: { value: isAnimated ? 1.0 : 0.0 },
          u_resolution: { value: new THREE.Vector2() },
        }}
      />
    </mesh>
  );
};

const DynamicBackground = () => {
  const [isAnimated, setIsAnimated] = useState(true);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>
      <Canvas>
        <Scene isAnimated={isAnimated} />
      </Canvas>
      <button
        onClick={() => setIsAnimated(!isAnimated)}
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          padding: '10px',
          background: 'rgba(255, 255, 255, 0.1)',
          color: 'white',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        {isAnimated ? 'Disable Animation' : 'Enable Animation'}
      </button>
    </div>
  );
};

export default DynamicBackground;