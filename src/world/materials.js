import * as THREE from 'three'

// Deterministic, locally generated surfaces; no downloaded imagery or invented
// historic inscriptions. One repeat represents two metres on architectural boxes.
const size = 256
const hash = (x, y) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
}

function smoothNoise(u, v, cells) {
  const x = u * cells, y = v * cells
  const ix = Math.floor(x), iy = Math.floor(y)
  const fx = x - ix, fy = y - iy
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy)
  const sample = (a, b) => hash((a + cells) % cells, (b + cells) % cells)
  return THREE.MathUtils.lerp(
    THREE.MathUtils.lerp(sample(ix, iy), sample(ix + 1, iy), sx),
    THREE.MathUtils.lerp(sample(ix, iy + 1), sample(ix + 1, iy + 1), sx), sy,
  ) - 0.5
}

function surface(kind) {
  const color = new Uint8Array(size * size * 4)
  const relief = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size
      const grain = hash(x, y)
      const cloud = smoothNoise(u, v, 4) + smoothNoise(u, v, 16) * 0.4
      let value = 235 + cloud * 6 + (grain - 0.5) * 18
      let height = 155 + (grain - 0.5) * 44 + cloud * 10
      if (kind === 'paving' || kind === 'masonry') {
        const rows = kind === 'paving' ? 4 : 6
        const row = Math.floor(v * rows)
        const xx = (u * 3 + (row % 2) * 0.5) % 1
        const yy = (v * rows) % 1
        const edge = Math.min(xx, 1 - xx, yy, 1 - yy)
        const block = hash(Math.floor(u * 3 + (row % 2) * 0.5) % 3, row)
        value += (block - 0.5) * 22
        if (edge < 0.025) { value = 153 + grain * 18; height = 65 }
        else if (edge < 0.05) { value -= 15; height -= 30 }
      }
      if (kind === 'plaster') { value = 246 + cloud * 4 + (grain - 0.5) * 12 }
      if (kind === 'roof') {
        const flute = Math.cos(u * Math.PI * 32)
        value = 207 + flute * 25 + grain * 12
        height = 128 + flute * 65
        if ((v * 8) % 1 < 0.045) { value *= 0.7; height = 50 }
      }
      if (kind === 'earth') { value = 216 + cloud * 12 + (grain - 0.5) * 42 }
      const i = (y * size + x) * 4
      for (let c = 0; c < 3; c++) {
        color[i + c] = THREE.MathUtils.clamp(value, 0, 255)
        relief[i + c] = THREE.MathUtils.clamp(height, 0, 255)
      }
      color[i + 3] = relief[i + 3] = 255
    }
  }
  function texture(data, isColor) {
    const result = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
    result.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace
    result.wrapS = result.wrapT = THREE.RepeatWrapping
    result.generateMipmaps = true
    result.minFilter = THREE.LinearMipmapLinearFilter
    result.magFilter = THREE.LinearFilter
    result.anisotropy = 4
    result.needsUpdate = true
    return result
  }
  return { map: texture(color, true), bumpMap: texture(relief, false) }
}

export const surfaces = Object.fromEntries(
  ['stone', 'plaster', 'masonry', 'paving', 'roof', 'earth'].map(kind => [kind, surface(kind)]),
)

export function architecturalBox(dimensions) {
  const geometry = new THREE.BoxGeometry(...dimensions)
  const position = geometry.attributes.position
  const normal = geometry.attributes.normal
  const uv = geometry.attributes.uv
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), y = position.getY(i), z = position.getZ(i)
    if (Math.abs(normal.getY(i)) > 0.5) uv.setXY(i, x / 2, z / 2)
    else if (Math.abs(normal.getX(i)) > 0.5) uv.setXY(i, z / 2, y / 2)
    else uv.setXY(i, x / 2, y / 2)
  }
  return geometry
}
