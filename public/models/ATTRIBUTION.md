# Additional Tanit XR scans — 21 September 2026

The following scans are by **Tanit XR** and licensed under
[Creative Commons Attribution–NonCommercial–ShareAlike 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).
Credit: [Tanit XR](https://sketchfab.com/TanitXR).

| Local file | Creator's title and source | Downloaded GLB | Optimized GLB |
| --- | --- | ---: | ---: |
| punic-stela.glb | [Punic Stela – Tophet of Salammbo, Carthag - copy](https://sketchfab.com/3d-models/f9a80da509d8444cb691d183cf88a276) | 9,445,472 bytes | 551,932 bytes |
| roman-column-base.glb | [Roman Column Base – Byrsa Hill, Carthage - copy](https://sketchfab.com/3d-models/7d8ccdd72462444ca9db291e82f1bf5a) | 9,431,604 bytes | 497,544 bytes |
| traditional-loom.glb | [Traditional Loom with Woven Carpet – Medina of …](https://sketchfab.com/3d-models/6740b21cadc84f3587e35944a7fe70be) | 10,235,772 bytes | 723,996 bytes |

Downloaded through Sketchfab's authorized download dialog as 1k-texture GLBs.
Changes: mesh simplification, meshopt compression, and WebP texture compression
using glTF Transform. These adapted model files retain **CC BY-NC-SA 4.0**.
No missing surfaces, inscriptions, or textile patterns have been invented.
The scene changes display scale, orientation, and placement without claiming
these are surveyed dimensions or original settings.

Command (ratio 0.2 for stone, 0.3 for the loom):

```sh
npx gltf-transform optimize input.glb output.glb --compress meshopt --texture-compress webp --texture-size 1024 --simplify-ratio 0.2 --simplify-error 0.001
```

The loom source description identifies the Medina of Tunis. Its erroneous
near-zero map coordinates are deliberately not used. The archive's exact
period and the individual scan operator are not supplied; attribution is to
the publishing creator, Tanit XR.

## Further additions

The following Tanit XR scans use the same CC BY-NC-SA 4.0 license, verified in
their Sketchfab download dialogs. Downloaded as 1k GLBs on 21 September 2026.

| File | Source | Download bytes | Optimized bytes | Simplification ratio |
| --- | --- | ---: | ---: | ---: |
| tanit-stela.glb | [Tanit Stela](https://sketchfab.com/3d-models/e7bfb3b0767248f5b4064ca8c57dc6e4) | 1860384 | 258856 | 0.5 |
| sidi-sahbi-tilework.glb | [Tilework Wall Panel](https://sketchfab.com/3d-models/af6858454d664099a006ff39cb8bd08b) | 1983520 | 368636 | 0.65 |
| zaghouan-relief.glb | [Architectural Relief Fragment](https://sketchfab.com/3d-models/f263eb8d630c458f9c747380e803fd33) | 2880924 | 331448 | 0.4 |

Processing uses the command above with the listed ratios. Original scanned surfaces are retained; placement and scale are modern staging.

## Distant display variants

`models/lod/` contains lower-detail derivatives of each corresponding parent GLB.
These retain the parent scan's creator attribution and license. Geometry was
simplified (target ratio 0.15, maximum error 0.005), textures reduced to 256px
WebP, and meshopt compression applied by `scripts/build-model-lods.mjs`.
Full source display assets remain unchanged.
