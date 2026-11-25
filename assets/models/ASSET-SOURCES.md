# Portfolio V3 asset library

All targets below are local files, not live CDN dependencies. Source pages verified where noted; no mesh hierarchy or final file size is claimed until import-report.json or inspection confirms it.

## CC0 imports (1K textures)
- `assets/models/crt.glb`: Television 01 — Gabriel Radić, 2K triangles. https://polyhaven.com/a/Television_01
- `assets/models/desk.glb`: Wooden Table 01 — Ethan Place, 952 triangles, 1.8 m wide. https://polyhaven.com/a/WoodenTable_01
- `assets/models/notebook.glb`: Binder Notebook — DaDrood, 18K triangles, includes a pen visually. https://polyhaven.com/a/binder_notebook
- `assets/hdri/studio.hdr`: Wooden Studio 04 — Alexander Scholten. https://polyhaven.com/a/wooden_studio_04
- `assets/textures/wood-color.jpg`, `wood-normal.jpg`, `wood-roughness.jpg`: Wood Table — Dimitrios Savva. https://polyhaven.com/a/wood_table

Powered by Poly Haven — https://polyhaven.com/. CC0 license: https://polyhaven.com/license.

Run `python scripts/import_v3_assets.py` at repo root to retrieve and pack the original glTF model, textures and binary data into self-contained GLBs. Inspect `assets/models/import-report.json` for actual bytes, triangle estimates, mesh nodes and failures. Mesh names alone do not guarantee distinct explodable components.

## Manual imports (Sketchfab account download needed)
- `mug.glb`: Black Ceramic Mug by Gianluca Gatto, 7.3K triangles, CC Attribution. https://sketchfab.com/3d-models/black-ceramic-mug-754f9350c57b4d69916b27ce0b5f9ceb
- `airpods.glb`: Apple AirPods (Pro) by rattenheimer, 117.4K triangles, CC Attribution. https://sketchfab.com/3d-models/apple-airpods-pro-d623d42d99a54d0ea90c7c1dec272a1e — generation not verified, optimize before using.
- `headphones.glb`: Headphones by re1monsen, 56.7K triangles, CC Attribution. https://sketchfab.com/3d-models/headphones-b12a7fb702804cc19537047a033fe0d9 — sci-fi styling, optional.
- `turntable.glb`: ION Audio Vinyl Transport candidate by TemmieTim. Full page could not be opened; confirm license before downloading. Existing procedural turntable is the fallback.
- `beans.glb`: no verified suitable file yet; procedural instanced beans are fallback.

Keep each source's license link and author credit in website credits. Do not imply AirPods were designed by the portfolio owner. Verify model size and separate components after obtaining each binary. No production website code is modified by this importer.

## Chair
- `assets/models/chair.glb`: Office Chair by Tevy, CC0 1.0, v1 LOD0. https://tevy.dev/models/office-chair — pinned binary https://tevy.dev/models/office-chair/v1/lod0.glb. Listed 9,287 triangles, 426 KB, 0.65 × 1.13 × 0.67 m. Seat height 0.49 m. Orientation needs rendered verification.
