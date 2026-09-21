import fs from 'node:fs/promises'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { convertPrimitiveToTriangles, getBounds, simplify, textureCompress, meshopt } from '@gltf-transform/functions'
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer'
import sharp from 'sharp'

await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready, MeshoptSimplifier.ready])
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder,
})
const content = JSON.parse(await fs.readFile('public/content.json', 'utf8'))
const triangles = doc => doc.getRoot().listMeshes().reduce((sum, mesh) => sum + mesh.listPrimitives().reduce((n, p) => n + (p.getMode() === 4 ? (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3 : 0), 0), 0)
const report = []
await fs.mkdir('public/models/lod', { recursive: true })
for (const artifact of content.artifacts.filter(a => a.model)) {
  const source = 'public' + artifact.model
  const doc = await io.read(source)
  const bounds = getBounds(doc.getRoot().listScenes()[0])
  for (const mesh of doc.getRoot().listMeshes()) for (const primitive of mesh.listPrimitives()) {
    if (primitive.getMode() === 5 || primitive.getMode() === 6) convertPrimitiveToTriangles(primitive)
  }
  const before = triangles(doc)
  // Preserve source bounds for identical placement across levels of detail.
  artifact.modelBounds = bounds
  artifact.modelLod = artifact.model.replace('/models/', '/models/lod/')
  await doc.transform(
    simplify({ simplifier: MeshoptSimplifier, ratio: 0.15, error: 0.005 }),
    textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [256, 256] }),
    meshopt({ encoder: MeshoptEncoder }),
  )
  await io.write('public' + artifact.modelLod, doc)
  report.push({ id: artifact.id, fullBytes: (await fs.stat(source)).size, distantBytes: (await fs.stat('public' + artifact.modelLod)).size, fullTriangles: before, distantTriangles: triangles(doc) })
}
await fs.writeFile('public/content.json', JSON.stringify(content, null, 2) + '\n')
await fs.mkdir('docs', { recursive: true })
await fs.writeFile('docs/model-performance.json', JSON.stringify(report, null, 2) + '\n')
console.log(report.reduce((sum, r) => {
  for (const key of ['fullBytes', 'distantBytes', 'fullTriangles', 'distantTriangles']) sum[key] += r[key]
  return sum
}, { fullBytes: 0, distantBytes: 0, fullTriangles: 0, distantTriangles: 0 }))
