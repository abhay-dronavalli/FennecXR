import { useKeyboardControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { useExperienceStore } from '../store.js'

const forwardVector = new THREE.Vector3()
const sideVector = new THREE.Vector3()
const movement = new THREE.Vector3()

export default function Player() {
  const { camera } = useThree()
  const [, getControls] = useKeyboardControls()
  const hasEntered = useExperienceStore((state) => state.hasEntered)
  const previous = useRef(camera.position.clone())

  useFrame((_, rawDelta) => {
    if (!hasEntered || document.pointerLockElement == null) return
    const delta = Math.min(rawDelta, 0.05)
    const { forward, backward, left, right, sprint } = getControls()
    if (!forward && !backward && !left && !right) return

    camera.getWorldDirection(forwardVector)
    forwardVector.y = 0
    forwardVector.normalize()
    sideVector.crossVectors(forwardVector, camera.up).normalize()
    movement.set(0, 0, 0)
    movement.addScaledVector(forwardVector, Number(forward) - Number(backward))
    movement.addScaledVector(sideVector, Number(right) - Number(left))
    if (movement.lengthSq() > 0) movement.normalize()

    previous.current.copy(camera.position)
    camera.position.addScaledVector(movement, delta * (sprint ? 7.5 : 4.6))
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -43, 43)
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -20, 45)
    camera.position.y = 1.7
  })

  return null
}
