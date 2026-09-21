import { useKeyboardControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { constrainToEnclosure, walkingHeight } from './worldLayout.js'
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
  const viewpoint = useExperienceStore((state) => state.viewpoint)
  const setViewpoint = useExperienceStore((state) => state.setViewpoint)
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
    if (viewpoint) {
      camera.position.set(...viewpoint.position)
      camera.lookAt(...viewpoint.target)
      setViewpoint(null)
      return
    }
    if (teleportTarget) {
      const ax = teleportTarget[0]
      const ay = teleportTarget[1]
      const az = teleportTarget[2]
      // Determine building center based on zone (encoded in teleportTarget[3])
      // Temple center ≈ (0, 0, 0), Tunisia-details center ≈ (0, 0, -24.5)
      const isTemple = az > -15
      const cx = teleportTarget[3] ?? 0
      const cz = teleportTarget[4] ?? (isTemple ? 0 : -24.5)
      // Offset player 3 units from artifact toward building center
      const dx = cx - ax
      const dz = cz - az
      const len = Math.sqrt(dx * dx + dz * dz) || 1
      camera.position.set(ax + (dx / len) * 3, 1.7, az + (dz / len) * 3)
      constrainToEnclosure(camera.position)
      camera.position.y = 1.7 + walkingHeight(camera.position.x, camera.position.z)
      // Look at the artifact
      camera.lookAt(ax, ay, az)
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

    // The elevated overview is a viewing point; walking resumes on the path.
    if (camera.position.y > 4) {
      camera.position.set(0, 1.7, -16.8)
      camera.lookAt(0, 2, -25)
      return
    }
    previous.current.copy(camera.position)
    camera.position.addScaledVector(movement, delta * (sprint ? 7.5 : 4.6))
    constrainToEnclosure(camera.position)
    camera.position.y = 1.7 + walkingHeight(camera.position.x, camera.position.z)
  })

  return null
}
