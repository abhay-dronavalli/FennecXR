import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { wantsFullDetail } from '../src/world/modelDetail.js'

test('approaching loads full detail, the dead band is stable, and leaving releases the rendered full model', () => {
  let full = false
  for (const distance of [30, 24, 20, 18]) assert.equal(wantsFullDetail(distance, full), false)
  full = wantsFullDetail(17.9, full)
  assert.equal(full, true)
  for (const distance of [18, 21, 23.9, 20]) assert.equal(wantsFullDetail(distance, full), true)
  assert.equal(wantsFullDetail(24.1, full), false)
  assert.equal(wantsFullDetail(3, false), true, 'guide teleport upgrades immediately on next check')
})

test('every scan has a real distant asset and shared finite normalization bounds', () => {
  const content = JSON.parse(fs.readFileSync('public/content.json'))
  for (const a of content.artifacts.filter(a => a.model)) {
    assert.notEqual(a.modelLod, a.model, a.id)
    assert.ok(fs.statSync('public' + a.modelLod).size > 100, a.id)
    for (let i = 0; i < 3; i++) {
      assert.ok(Number.isFinite(a.modelBounds.min[i]) && Number.isFinite(a.modelBounds.max[i]))
      assert.ok(a.modelBounds.max[i] >= a.modelBounds.min[i])
    }
  }
})

test('distant collection stays below 50% of full downloads and triangles', () => {
  const report = JSON.parse(fs.readFileSync('docs/model-performance.json'))
  const total = key => report.reduce((n, a) => n + a[key], 0)
  assert.ok(total('distantBytes') < total('fullBytes') * 0.5)
  assert.ok(total('distantTriangles') < total('fullTriangles') * 0.5)
})
