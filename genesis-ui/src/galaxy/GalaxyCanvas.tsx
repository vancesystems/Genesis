import { Canvas } from "@react-three/fiber"
import { CameraControls } from "@react-three/drei"
import { GalaxyScene } from "./GalaxyScene"
import type { NoteGraph } from "./galaxyTypes"
import type { GlobalGraph } from "./galaxyTypes"

type GalaxyCanvasProps = {
  graphData: NoteGraph | null
  globalData: GlobalGraph | null
}

export function GalaxyCanvas(props: GalaxyCanvasProps) {
  return (
    <div className="galaxy-viewport">
      <Canvas
        camera={{
          position: [0, 0, 45],
          fov: 50,
          near: 0.1,
          far: 1000,
        }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.45} />
        <pointLight position={[8, 8, 8]} intensity={2} />
        <color attach="background" args={["#02030a"]} />

        <GalaxyScene graphData={props.graphData} globalData={props.globalData} />

        <CameraControls makeDefault />
      </Canvas>
    </div>
  )
}