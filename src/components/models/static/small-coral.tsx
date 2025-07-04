import { Clone, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { type GLTF } from "three-stdlib";
import { useRef } from "react";

const MODEL_PATH = "/models/coral.glb";

type TSmallCoral = GLTF & {
  nodes: {
    [key: string]: any;
  };
  materials: {
    [key: string]: THREE.Material;
  };
};

useGLTF.preload(MODEL_PATH);

type TSmallCoralProps = {
  position: [number, number, number];
};

function SmallCoral({ position }: TSmallCoralProps) {
  const smallCoralGltf = useGLTF(MODEL_PATH) as TSmallCoral;
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;

    if (groupRef.current) {
      groupRef.current.rotation.x = Math.sin(t * 0.25) * 0.1; // slow sway X
      groupRef.current.rotation.y = Math.cos(t * 0.3) * 0.1; // slow sway Y
      groupRef.current.rotation.z = Math.sin(t * 0.2) * 0.1; // slow sway Z
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <Clone object={smallCoralGltf.scene} />
    </group>
  );
}

export default SmallCoral;
