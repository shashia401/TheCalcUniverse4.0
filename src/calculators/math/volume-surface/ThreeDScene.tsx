import { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface Props {
  shape: string;
  dim1: number;
  dim2: number;
  dim3: number;
}

function fmt(n: number) {
  return parseFloat(n.toFixed(4)).toString();
}

function makeLabel(text: string, pos: THREE.Vector3, color = '#ef4444'): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 256, 64);
  ctx.font = 'bold 26px system-ui, sans-serif';
  const tw = ctx.measureText(text).width;
  const bw = tw + 24;
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillRect((256 - bw) / 2, 8, bw, 48);
  ctx.fillStyle = color;
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 32);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  sprite.position.copy(pos);
  sprite.scale.set(bw / 70, 0.55, 1);
  return sprite;
}

function addLine(scene: THREE.Scene, from: THREE.Vector3, to: THREE.Vector3) {
  const pts = [from, to];
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineDashedMaterial({ color: 0xef4444, dashSize: 0.05, gapSize: 0.05 });
  const line = new THREE.Line(geo, mat);
  line.computeLineDistances();
  scene.add(line);
}

function addAnnotations(scene: THREE.Scene, shape: string, d1: number, d2: number, d3: number, s: (v: number) => number) {
  const r = s(d1 || 1);
  const h = s(d2 || 1);
  const w = s(d3 || 1);

  switch (shape) {
    case 'sphere': {
      addLine(scene, new THREE.Vector3(0, 0, 0), new THREE.Vector3(r, 0, 0));
      scene.add(makeLabel(`r = ${fmt(d1)}`, new THREE.Vector3(r / 2, -0.25, 0)));
      break;
    }
    case 'cube': {
      const half = r / 2;
      addLine(scene, new THREE.Vector3(half, -half, half), new THREE.Vector3(half, -half, -half));
      scene.add(makeLabel(`s = ${fmt(d1)}`, new THREE.Vector3(half + 0.3, -half - 0.2, 0)));
      break;
    }
    case 'box': {
      const l = s(d1 || 1), hh = s(d3 || 1), ww = s(d2 || 1);
      addLine(scene, new THREE.Vector3(-l / 2, -hh / 2, ww / 2), new THREE.Vector3(l / 2, -hh / 2, ww / 2));
      addLine(scene, new THREE.Vector3(l / 2, -hh / 2, -ww / 2), new THREE.Vector3(l / 2, hh / 2, -ww / 2));
      scene.add(makeLabel(`l = ${fmt(d1)}`, new THREE.Vector3(0, -hh / 2 - 0.25, ww / 2), '#ef4444'));
      scene.add(makeLabel(`w = ${fmt(d2)}`, new THREE.Vector3(l / 2 + 0.25, -hh / 2 - 0.25, 0), '#ef4444'));
      scene.add(makeLabel(`h = ${fmt(d3)}`, new THREE.Vector3(l / 2 + 0.25, 0, -ww / 2), '#ef4444'));
      break;
    }
    case 'cylinder': {
      addLine(scene, new THREE.Vector3(0, h / 2, 0), new THREE.Vector3(r, h / 2, 0));
      addLine(scene, new THREE.Vector3(r + 0.3, -h / 2, 0), new THREE.Vector3(r + 0.3, h / 2, 0));
      scene.add(makeLabel(`r = ${fmt(d1)}`, new THREE.Vector3(r / 2, h / 2 + 0.25, 0), '#ef4444'));
      scene.add(makeLabel(`h = ${fmt(d2)}`, new THREE.Vector3(r + 0.7, 0, 0), '#ef4444'));
      break;
    }
    case 'cone': {
      addLine(scene, new THREE.Vector3(0, -h / 2, 0), new THREE.Vector3(r, -h / 2, 0));
      addLine(scene, new THREE.Vector3(r + 0.3, -h / 2, 0), new THREE.Vector3(r + 0.3, h / 2, 0));
      scene.add(makeLabel(`r = ${fmt(d1)}`, new THREE.Vector3(r / 2, -h / 2 - 0.25, 0), '#ef4444'));
      scene.add(makeLabel(`h = ${fmt(d2)}`, new THREE.Vector3(r + 0.7, 0, 0), '#ef4444'));
      break;
    }
    case 'pyramid': {
      const b = r;
      addLine(scene, new THREE.Vector3(-b / 2, -h / 2, -b / 2), new THREE.Vector3(b / 2, -h / 2, -b / 2));
      addLine(scene, new THREE.Vector3(b / 2 + 0.3, -h / 2, 0), new THREE.Vector3(b / 2 + 0.3, h / 2, 0));
      scene.add(makeLabel(`b = ${fmt(d1)}`, new THREE.Vector3(0, -h / 2 - 0.25, -b / 2), '#ef4444'));
      scene.add(makeLabel(`h = ${fmt(d2)}`, new THREE.Vector3(b / 2 + 0.7, 0, 0), '#ef4444'));
      break;
    }
  }
}

export default function ThreeDScene({ shape, dim1, dim2, dim3 }: Props) {
  const labels = useMemo(() => {
    const f = (n: number) => parseFloat(n.toFixed(4)).toString();
    switch (shape) {
      case 'sphere': return [`r = ${f(dim1 || 0)}`];
      case 'cube': return [`s = ${f(dim1 || 0)}`];
      case 'box': return [`l = ${f(dim1 || 0)}`, `w = ${f(dim2 || 0)}`, `h = ${f(dim3 || 0)}`];
      case 'cylinder': return [`r = ${f(dim1 || 0)}`, `h = ${f(dim2 || 0)}`];
      case 'cone': return [`r = ${f(dim1 || 0)}`, `h = ${f(dim2 || 0)}`];
      case 'pyramid': return [`b = ${f(dim1 || 0)}`, `h = ${f(dim2 || 0)}`];
      default: return [];
    }
  }, [shape, dim1, dim2, dim3]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scene: THREE.Scene, camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer, controls: OrbitControls;
    let animId: number;
    let disposed = false;

    try {
      const relevantDims = [dim1, dim2, dim3].filter(v => v > 0);
      const maxUserDim = Math.max(...relevantDims, 1);
      const scaleFactor = 2.5 / maxUserDim;
      const s = (v: number) => Math.max(v * scaleFactor, 0.1);

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf1f5f9);

      const width = container.clientWidth || 400;
      camera = new THREE.PerspectiveCamera(40, width / 300, 0.1, 100);
      camera.position.set(3.5, 2.5, 5);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, 300);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.12;
      controls.minDistance = 2;
      controls.maxDistance = 12;
      controls.autoRotate = false;
      controls.target.set(0, 0, 0);

      scene.add(new THREE.AmbientLight(0xffffff, 0.5));
      const dl1 = new THREE.DirectionalLight(0xffffff, 1.0);
      dl1.position.set(5, 10, 7);
      scene.add(dl1);
      const dl2 = new THREE.DirectionalLight(0xffffff, 0.3);
      dl2.position.set(-3, -2, -5);
      scene.add(dl2);

      const grid = new THREE.GridHelper(6, 12, 0x94a3b8, 0xcbd5e1);
      grid.position.y = -1.5;
      scene.add(grid);

      let geometry: THREE.BufferGeometry;

      switch (shape) {
        case 'sphere': geometry = new THREE.SphereGeometry(s(dim1 || 1), 32, 32); break;
        case 'cube': geometry = new THREE.BoxGeometry(s(dim1 || 1), s(dim1 || 1), s(dim1 || 1)); break;
        case 'box': geometry = new THREE.BoxGeometry(s(dim1 || 1), s(dim3 || 1), s(dim2 || 1)); break;
        case 'cylinder': geometry = new THREE.CylinderGeometry(s(dim1 || 1), s(dim1 || 1), s(dim2 || 1), 32); break;
        case 'cone': geometry = new THREE.ConeGeometry(s(dim1 || 1), s(dim2 || 1), 32); break;
        case 'pyramid': geometry = new THREE.CylinderGeometry(0, s(dim1 || 1), s(dim2 || 1), 4); break;
        default: geometry = new THREE.BoxGeometry(1, 1, 1);
      }

      const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
        color: 0x3b82f6, roughness: 0.4, metalness: 0.05, transparent: true, opacity: 0.85,
      }));
      scene.add(mesh);

      const lineMat = new THREE.LineBasicMaterial({ color: 0x1e40af, transparent: true, opacity: 0.25 });
      mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry), lineMat));

      // Measurement annotations
      addAnnotations(scene, shape, dim1, dim2, dim3, s);

      const animate = () => {
        animId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      if (!disposed) setStatus('ready');
    } catch (e) {
      console.error('[3D] Error:', e);
      if (!disposed) setStatus('error');
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(animId);
      renderer?.dispose();
      scene?.clear();
      if (container?.contains(renderer?.domElement)) container.removeChild(renderer.domElement);
    };
  }, [shape, dim1, dim2, dim3]);

  return (
    <div ref={containerRef} className="w-full rounded-lg overflow-hidden relative" style={{ minHeight: 300 }}>
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 rounded-lg z-10">
          <p className="text-xs text-slate-400 animate-pulse">Loading 3D scene...</p>
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 rounded-lg z-10">
          <p className="text-xs text-red-400">Could not load 3D. Use the 2D view instead.</p>
        </div>
      )}
      {status === 'ready' && labels.length > 0 && (
        <div className="flex justify-center gap-3 mt-2">
          {labels.map((l, i) => (
            <span key={`lbl-${i}`} className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              {l}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
