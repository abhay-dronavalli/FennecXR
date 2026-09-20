import { useKeyboardControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useExperienceStore } from '../store.js'

const forwardVector = new THREE.Vector3()
const sideVector = new THREE.Vector3()
const movement = new THREE.Vector3()

export default function Player() {
  const { camera } = useThree()
  const [, getControls] = useKeyboardControls()
  const hasEntered        = useExperienceStore((state) => state.hasEntered)
  const pamphletOpen      = useExperienceStore((state) => state.pamphletOpen)
  const teleportTarget    = useExperienceStore((state) => state.teleportTarget)
  const setTeleportTarget = useExperienceStore((state) => state.setTeleportTarget)
  const savedCameraPos    = useExperienceStore((state) => state.savedCameraPos)
  const setSavedCameraPos = useExperienceStore((state) => state.setSavedCameraPos)
  const previous = useRef(camera.position.clone())

  // Restore camera position when remounting after 3D viewer
  useEffect(() => {
    if (savedCameraPos) {
      camera.position.set(savedCameraPos[0], savedCameraPos[1], savedCameraPos[2])
      setSavedCameraPos(null)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Save camera position on unmount (before 3D viewer takes over)
  useEffect(() => {
    return () => {
      const pos = [camera.position.x, camera.position.y, camera.position.z]
      setSavedCameraPos(pos)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((_, rawDelta) => {
    if (teleportTarget) {
      const ax = teleportTarget[0]
      const az = teleportTarget[2]
      // Place player 3 units away from artifact, facing toward it
      const dist = Math.sqrt(ax * ax + az * az) || 1
      const offsetX = (ax / dist) * 3
      const offsetZ = (az / dist) * 3
      camera.position.set(ax + offsetX, 1.7, az + offsetZ)
      // Look at the artifact
      camera.lookAt(ax, 1.7, az)
      setTeleportTarget(null)
      return
    }
    if (!hasEntered || pamphletOpen || document.pointerLockElement == null) return
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
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -30, 45)
    camera.position.y = 1.7
  })

  return null
}
