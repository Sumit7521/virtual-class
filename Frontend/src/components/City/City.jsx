import React, { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useLoader, useThree } from '@react-three/fiber';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { useControls } from 'leva';
import * as THREE from 'three';

export default function City(props) {
  const { scene } = useGLTF('/models/City.glb');
  const hdri = useLoader(RGBELoader, '/hdri/venice_dawn_1_1k.hdr');
  const { scene: threeScene, gl } = useThree();

  // Leva control for brightness
  const { exposure } = useControls('HDRI Settings', {
    exposure: { value: 0.46, min: 0, max: 3, step: 0.01 }
  });

  useEffect(() => {
    hdri.mapping = THREE.EquirectangularReflectionMapping;
    threeScene.background = hdri;
    threeScene.environment = hdri;
    console.log("HDRI loaded ✅", hdri);
  }, [hdri, threeScene]);

  // Apply brightness change live
  useEffect(() => {
    gl.toneMappingExposure = exposure;
  }, [exposure, gl]);

  return <primitive object={scene} {...props} dispose={null} />;
}