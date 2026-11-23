'use client';

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { useAtomValue } from 'jotai';
import { cabinetAtom } from '@/store/cabinet';

function EnclosureFrame({ width, height, depth }: { width: number; heigth: number; depth: number }) { 
    const wallThickness = 0.02;
    const metalMaterial = (
        <meshStandardMaterial
            color="#cbd5e1"
            metalness={0.4}
            roughness={0.4}
        />
    );

    return (
        <group>
            {/* 1. Задняя стенка */}
            <mesh position={[0, 0, -depth / 2 + wallThickness / 2]}>
                <boxGeometry args={[width, height, wallThickness]} />
                {metalMaterial}
            </mesh>
            {/* 2. Левая стенка */}
            <mesh position={[-width / 2 + wallThickness / 2, 0, 0]}>
                <boxGeometry args={[wallThickness, height, depth]} />
                {metalMaterial}
            </mesh>
            {/* 3. Правая стенка */}
            <mesh position={[width / 2 - wallThickness / 2, 0, 0]}>
                <boxGeometry args={[wallThickness, height, depth]} />
                {metalMaterial}
            </mesh>
            {/* 4. Верхняя крышка */}
            <mesh position={[0, height / 2 - wallThickness / 2, 0]}>
                <boxGeometry args={[width, wallThickness, depth]} />
                {metalMaterial}
            </mesh>
            {/* 5. Нижний цоколь (темная опорная рама) */}
            <mesh position={[0, -height / 2 + 0.04, 0]}>
                <boxGeometry args={[width, 0.08, depth]} />
                <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.5} />
            </mesh>
            {/* Красная фирменная полоса ABB на козырьке */}
            <mesh position={[0, height / 2 - 0.02, depth / 2]}>
                <boxGeometry args={[width, 0.015, 0.005]} />
                <meshStandardMaterial color="#dc2626" />
            </mesh>
        </group>
    );
}


export default function Cabinet3D() {
    const cabinet = useAtomValue(cabinetAtom);

    const width = cabinet.widthMm / 1000;
    const height = cabinet.heightMm / 1000;
    const depth = cabinet.depthMm / 1000;

    return (
        <div className="w-full h-full min-h-[600px] bg-slate-100 relative rounded-lg border border-slate-200 overflow-hidden flex flex-col">
            <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded border border-slate-300 text-xs font-mono text-slate-600 shadow-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>3D ENCLOSURE: Left Click + Drag to Orbit | Scroll to Zoom</span>
        </div>
    <Canvas
    camera={{ position: [1.8, 1.2, 2.5], fov: 45 }}
    className="w-full h-full cursor-grab active:cursor-grabbing"
    >
                <ambientLight intensity={0.8} />
                <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow/>
                <directionalLight position={[-5, 5, -5]} intensity={0.5} />

                <Grid 
                position={[0, -height / 2, 0]}
                args={[10, 10]}
                cellSize={0.2}
                cellThickness={0.8}
                cellColor="#cbd5e1"
                sectionSize={1}
                sectionThickness={1.2}
                sectionColor="#94a3b8"
                fadeDistance={8}
                />
                <OrbitControls makeDefault minDistance={1} maxDistance={6} />

<EnclosureFrame width={width} height={height} depth={depth} />

    </Canvas>
    </div>
    );
}