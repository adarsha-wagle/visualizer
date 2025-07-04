import React, { useRef } from "react";
import { useGLTF, useAnimations, Clone } from "@react-three/drei";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { IDynamicModel } from "../common/types";
import useModelAi from "../common/use-model-ai";

const MODEL_PATH = "/models/seahorse.glb";

const tempVectorSwim = new THREE.Vector3();

export type TSeahorseBehavior = "swim" | "stopAndMove";

export interface ISeahorse extends IDynamicModel {
  behavior: TSeahorseBehavior;
  speed: number;

  isMoving?: boolean;
  originalSpeed?: number;

  stopAndMoveTimer: number;
}

interface ISeahorseProps {
  seahorse: ISeahorse;
}

useGLTF.preload(MODEL_PATH);

// Adds a small random variation to direction every few seconds to simuate swimming behavior
const updateSwim = (seahorse: ISeahorse, deltaTime: number): void => {
  seahorse.behaviorTimer += deltaTime;
  if (seahorse.behaviorTimer > 2 + Math.random() * 2) {
    const variation = tempVectorSwim.set(
      (Math.random() - 0.5) * 0.2,
      (Math.random() - 0.5) * 0.1,
      (Math.random() - 0.5) * 0.2
    );
    seahorse.direction.add(variation.multiplyScalar(0.1)).normalize();
    seahorse.behaviorTimer = 0;
  }
};

const updateStopAndMove = (seahorse: ISeahorse, deltaTime: number): void => {
  // Initialize properties if not set
  if (seahorse.isMoving === undefined) {
    seahorse.isMoving = true;
    seahorse.originalSpeed = seahorse.speed;
  }

  seahorse.behaviorTimer += deltaTime;

  if (seahorse.behaviorTimer > seahorse.stopAndMoveTimer) {
    seahorse.isMoving = !seahorse.isMoving;
    seahorse.behaviorTimer = 0;

    // Set speed based on current state
    if (seahorse.isMoving) {
      seahorse.speed = seahorse.originalSpeed || 1;
    } else {
      seahorse.speed = 0;
    }
  }

  // Add slight directional variation when moving (like natural swimming)
  if (seahorse.isMoving && seahorse.behaviorTimer > 0.5) {
    const variation = tempVectorSwim.set(
      (Math.random() - 0.5) * 0.1,
      (Math.random() - 0.5) * 0.05,
      (Math.random() - 0.5) * 0.1
    );
    seahorse.direction.add(variation.multiplyScalar(0.05)).normalize();
  }
  if (!seahorse.isMoving) {
    // Add gentle swaying motion while stopped
    const time = 0.5;

    const swayAmount = Math.sin(time * 1.5) * 0.01; // Left/right sway
    const bobAmount = Math.sin(time * 1.2) * 0.015; // Vertical bob

    seahorse.position.x += swayAmount;
    seahorse.position.y += bobAmount;
  }
};

export default function Seahorse({ seahorse }: ISeahorseProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(MODEL_PATH);
  const { actions } = useAnimations(animations, groupRef);

  const { move } = useModelAi();

  React.useEffect(() => {
    if (actions && animations.length > 0) {
      actions[animations[0].name]?.reset().play();
    }
  }, [actions, animations]);

  // Initialize rotation values if not set
  React.useEffect(() => {
    if (seahorse.currentRotationY === undefined) {
      seahorse.currentRotationY = Math.atan2(
        seahorse.direction.x,
        seahorse.direction.z
      );
    }
  }, [seahorse]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Move the seahorse
    move(seahorse, delta);

    // Update seahorse behavior
    switch (seahorse.behavior) {
      case "swim":
        updateSwim(seahorse, delta);
        break;
      case "stopAndMove":
        updateStopAndMove(seahorse, delta);
        break;
      default:
        break;
    }

    // IMPROVED: Even smoother visual updates with different lerp speeds
    groupRef.current.position.lerp(seahorse.position, 0.3); // Slightly faster position updates

    // Smoother rotation updates
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      seahorse.rotation.x,
      0.1 // Slower for pitch
    );
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      seahorse.rotation.y,
      0.2 // Medium speed for yaw
    );
    groupRef.current.rotation.z = THREE.MathUtils.lerp(
      groupRef.current.rotation.z,
      seahorse.rotation.z,
      0.15 // Slower for banking effect
    );
  });

  return <Clone object={scene} ref={groupRef} />;
}
