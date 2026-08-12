import { useFrame } from '@react-three/fiber/native';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

const COLORS = {
    body: '#32B7BF',
    bodyLight: '#5AD0EF',
    glass: '#203B61',
    glassHighlight: '#667B94',
    tire: '#26323A',
    rim: '#E4EAEE',
    hub: '#72909E',
    light: '#F7FBFF',
    signal: '#F69B11',
};

type CarProps = {
    animated?: boolean;
    scale?: number;
};

function createCabinGeometry() {
    const halfWidth = 0.58;
    const profile: [number, number][] = [
        [-1.35, 0.0],
        [-1.25, 0.72],
        [-0.35, 1.28],
        [0.6, 0.78],
        [1.2, 0.0],
    ];

    const vertices: number[] = [];

    profile.forEach(([x, y]) => vertices.push(x, y, halfWidth));
    profile.forEach(([x, y]) => vertices.push(x, y, -halfWidth));

    const indices: number[] = [
        0, 1, 2, 0, 2, 3, 0, 3, 4,
        9, 7, 8, 9, 6, 7, 9, 5, 6,
    ];

    for (let index = 0; index < profile.length; index += 1) {
        const next = (index + 1) % profile.length;
        indices.push(index, next, next + profile.length);
        indices.push(index, next + profile.length, index + profile.length);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
}

function createSideWindowGeometry() {
    const shape = new THREE.Shape();
    shape.moveTo(-1.12, 0.38);
    shape.lineTo(-0.68, 0.64);
    shape.lineTo(0.18, 0.28);
    shape.lineTo(0.5, -0.24);
    shape.lineTo(-1.12, 0.1);
    shape.closePath();

    return new THREE.ShapeGeometry(shape);
}

function createWindshieldGeometry() {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute([
            0.46, 0.72, 0.48,
            1.08, 0.1, 0.54,
            1.08, 0.1, -0.54,
            0.46, 0.72, -0.48,
        ], 3),
    );
    geometry.setIndex([0, 1, 2, 0, 2, 3]);
    geometry.computeVertexNormals();

    return geometry;
}

function Wheel({ x }: { x: number }) {
    return (
        <group position={[x, -0.44, 0.64]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.34, 0.34, 0.2, 32]} />
                <meshStandardMaterial color={COLORS.tire} roughness={0.8} />
            </mesh>

            <mesh position={[0, 0, 0.11]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.19, 0.19, 0.03, 32]} />
                <meshStandardMaterial color={COLORS.rim} roughness={0.55} />
            </mesh>

            <mesh position={[0, 0, 0.14]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.11, 0.11, 0.035, 24]} />
                <meshStandardMaterial color={COLORS.hub} roughness={0.65} />
            </mesh>
        </group>
    );
}

function HatchbackModel() {
    const cabinGeometry = useMemo(() => createCabinGeometry(), []);
    const sideWindowGeometry = useMemo(() => createSideWindowGeometry(), []);
    const windshieldGeometry = useMemo(() => createWindshieldGeometry(), []);

    return (
        <group rotation={[0.12, -0.58, 0]} position={[0, -0.2, 0]}>
            <mesh position={[0, -0.1, 0]}>
                <boxGeometry args={[2.9, 0.68, 1.22]} />
                <meshStandardMaterial color={COLORS.body} roughness={0.55} />
            </mesh>

            <mesh geometry={cabinGeometry} position={[-0.06, 0.04, 0]}>
                <meshStandardMaterial color={COLORS.bodyLight} roughness={0.5} />
            </mesh>

            <mesh geometry={sideWindowGeometry} position={[-0.06, 0.1, 0.615]}>
                <meshStandardMaterial color={COLORS.glass} roughness={0.38} />
            </mesh>

            <mesh geometry={windshieldGeometry}>
                <meshStandardMaterial color={COLORS.glass} roughness={0.34} />
            </mesh>

            <mesh position={[0.42, 0.67, -0.01]} rotation={[0.82, 0, 0]}>
                <boxGeometry args={[0.08, 0.02, 0.95]} />
                <meshStandardMaterial color={COLORS.glassHighlight} roughness={0.45} />
            </mesh>

            <Wheel x={-0.92} />
            <Wheel x={0.92} />

            <mesh position={[1.48, -0.04, 0.38]}>
                <boxGeometry args={[0.08, 0.24, 0.28]} />
                <meshStandardMaterial color={COLORS.light} roughness={0.45} />
            </mesh>

            <mesh position={[1.5, -0.05, -0.35]}>
                <boxGeometry args={[0.07, 0.2, 0.16]} />
                <meshStandardMaterial color={COLORS.signal} roughness={0.45} />
            </mesh>

            <mesh position={[-1.46, -0.05, 0.36]}>
                <boxGeometry args={[0.08, 0.2, 0.2]} />
                <meshStandardMaterial color={COLORS.signal} roughness={0.45} />
            </mesh>
        </group>
    );
}

export function Car({ animated = true, scale = 1 }: CarProps) {
    const carRef = useRef<THREE.Group>(null);

    useFrame((state, delta) => {
        if (!animated || !carRef.current) return;

        carRef.current.rotation.y += delta * 0.5;
        carRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.04;
    });

    return (
        <group ref={carRef} scale={scale}>
            <HatchbackModel />
        </group>
    );
}
