'use client';

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { useAtomValue } from 'jotai';
import { cabinetAtom } from '@/store/cabinet';
import { PlacedComponent } from '@/types/switchgear';
import { MeshStandardMaterial } from 'three';

function EnclosureFrame({ width, height, depth }: { width: number; height: number; depth: number }) { 
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


    interface DinRail3DProps {
        railWidth: number;
        yPosition: number;
        zRail: number;
        components: PlacedComponent[];
    }
    function getPhaseColor(phase: string): string {
        switch (phase) {
            case 'A': return '#f59e0b';
            case 'B': return '#10b981';
            case 'C': return '#334155';
            case '3P': return '#dc2626';
            default: return '#94a3b8';
        }
    }
    function DinRail3D({ railWidth, yPosition, zRail, components }: DinRail3DProps) {
        return (
            <group position={[0, yPosition, zRail]}>
            <mesh>
                    <boxGeometry args={[railWidth, 0.035, 0.01]} /> 
                    <meshStandardMaterial color= "#94a3b8" metalness={0.8} roughness={ 0.3} />
                </mesh>
                {components.map((item) => {
                    const compWidth = item.component.widthModules * 0.018;
                    const xPos = -railWidth / 2 + 0.03 + (item.slotPosition - 1) * 0.018 + compWidth / 2;
                    return (
                        <group key={item.instanceId} position={[xPos, 0, 0.04]}>
                        <mesh>
                        <boxGeometry args={[compWidth, 0.085, 0.065]} />
                        <meshStandardMaterial color="#f8fafc" />
                        </mesh>
                        <mesh position={[0, 0.042, 0.033]}>
                        <boxGeometry args={[compWidth - 0.004, 0.004, 0.002]} />
                                <meshStandardMaterial color={getPhaseColor(item.phase)} />
                        </mesh>
                        <mesh position={[0, 0, 0.035]}>
                        <boxGeometry args={[0.012, 0.02, 0.015]} />
                        <meshStandardMaterial color={item.phase === '3P' ? "#dc2626" : "#0f172a"} />
                            </mesh>
                        </group>
                    );
                })}
            </group>
       )
    }
    



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
                {cabinet.rails.map((rail, index) => {
                    const railWidth = width - 0.08;
                    const zRail = -depth / 2 + 0.04;
                    const yPosition = height / 2 - 0.3 - index * 0.45;
                    
                    return (
                        <DinRail3D
                            key={rail.id}
                            railWidth={railWidth}
                            yPosition={yPosition}
                            zRail={zRail}
                            components={rail.components}
                        />
                    );
                })}
    </Canvas>
    </div>
    );
}