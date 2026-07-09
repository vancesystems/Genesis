import * as THREE from "three"

export const AXIAL_TILT: [number, number, number] = [
  0,
  0,
  THREE.MathUtils.degToRad(11),
]

export const PLANET_SPHERE_GEOMETRY =
  new THREE.SphereGeometry(1, 20, 20)