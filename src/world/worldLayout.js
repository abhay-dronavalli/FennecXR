// Shared by the visible ramparts and movement constraint. Metres, Y-up.
export const enclosure = { minX: -24, maxX: 24, minZ: -36, maxZ: 24, thickness: 1 }
export const playerRadius = 0.35
export const boundaryTowers = [-24, 24].flatMap(x => [-36, -6, 24].map(z => [x, z]))

export function constrainToEnclosure(position) {
  const margin = enclosure.thickness / 2 + playerRadius
  position.x = Math.max(enclosure.minX + margin, Math.min(enclosure.maxX - margin, position.x))
  position.z = Math.max(enclosure.minZ + margin, Math.min(enclosure.maxZ - margin, position.z))
  for (const [x, z] of boundaryTowers) {
    const half = 1.65 + playerRadius
    const dx = position.x - x, dz = position.z - z
    if (Math.abs(dx) < half && Math.abs(dz) < half) {
      if (half - Math.abs(dx) < half - Math.abs(dz)) position.x = x + Math.sign(dx || -x) * half
      else position.z = z + Math.sign(dz || 1) * half
    }
  }
  return position
}

export function walkingHeight(x, z) {
  if (Math.abs(x) < 8.9 && z >= -6.2 && z <= 8.6) return 0.58
  if (Math.abs(x) < 9.9 && z >= -8.45 && z < -6.2) return z < -6.95 ? 0.28 : 0.43
  if (Math.abs(x) < 12.5 && z >= -30 && z <= -20) return 0.1
  return 0.04
}
