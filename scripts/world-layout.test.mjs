import test from 'node:test'
import assert from 'node:assert/strict'
import { boundaryTowers, constrainToEnclosure, enclosure, playerRadius } from '../src/world/worldLayout.js'

test('walking stays inside the visible walls and outside the tower footprints', () => {
  const m = enclosure.thickness / 2 + playerRadius
  for (let x = -60; x <= 60; x += 0.5) {
    for (let z = -65; z <= 60; z += 0.5) {
      const p = constrainToEnclosure({ x, z })
      assert.ok(p.x >= enclosure.minX + m && p.x <= enclosure.maxX - m)
      assert.ok(p.z >= enclosure.minZ + m && p.z <= enclosure.maxZ - m)
      for (const [tx, tz] of boundaryTowers) {
        assert.ok(Math.abs(p.x - tx) >= 2 || Math.abs(p.z - tz) >= 2)
      }
    }
  }
})

test('movement stops at a solid tower and can continue around its inside edge', () => {
  const p = { x: 20, z: 20 }
  for (let i = 0; i < 500; i++) {
    p.x += 0.15
    p.z -= 0.2
    constrainToEnclosure(p)
  }
  assert.equal(p.z, -4)
  assert.ok(p.x <= 23.15)
  p.x = 21.8
  for (let i = 0; i < 180; i++) { p.z -= 0.2; constrainToEnclosure(p) }
  assert.ok(p.z < -30)
})
