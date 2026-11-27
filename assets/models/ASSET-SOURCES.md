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

## Remaining prop import (candidate models, not exact branded replicas)
See `scripts/import_v3_props.py` for source URLs, pinned binary URLs, CC0 provenance and alternatives. `remaining-import-report.json` records actual downloads, SHA-256, mesh nodes, triangles and errors. 3DAssets.dev models are AI-assisted per their listings. No claim of exact AirPods Pro 2 or AT-LP60X geometry; keep candidates separate until approved. Original procedural coffee bean geometry is included under CC0. All GLBs must pass header, self-contained buffer/image and decoder-compatibility checks. Final visual and exploded-component validation remains required. Existing scene and production are untouched during acquisition.

## AT-LP120XUSB-inspired turntable
`turntable-lp120x.glb` is original procedural geometry, modeled from the public product dimensions 452 × 352 mm and visual characteristics of the black Audio-Technica AT-LP120XUSB. Reference: https://audio-technica.co.in/product/at-lp120xusb-bk-ind/ . Not an official model or scanned replica. Dust cover omitted for visibility; no manufacturer logo. Platter and tonearm independently grouped. Existing CC0 Grab3D and DJ deck models remain loading alternatives.

## Active turntable selection
The scene now prioritizes the existing third-party CC0 `turntable-dj-alt.glb` from https://3dassets.dev/assets/nightclub-and-dj-booth-turntable-deck-aa917183 (direct file https://cdn.3dassets.dev/assets/34088/v1/model.glb). Imported and validated in the previous asset workflow. Source lists a direct-drive design, S-shaped tonearm, pitch fader, magenta slipmat, 450 × 360 mm footprint and one spin animation. AI-assisted source model, not an exact branded product. The custom LP120X-inspired model is retained in the asset directory but no longer selected by the scene.

## Pro-Ject E1 (user-provided download)
Source listing: [Vinyl player Pro-Ject E1 by Axxxo](https://sketchfab.com/3d-models/vinyl-player-pro-ject-e1-a1ee56b1592c47b0a95351dbbd355743). Listed CC-BY; confirm license on original listing before publishing. Original supplied GLB 174,451,120 bytes; optimized derivative 17,753,820 bytes, 295,422 triangles, 87 meshes, 9 embedded textures. Changes: quadric decimation, texture downsampling to 512px, transparent dust-cover material, tangents omitted on simplified meshes. Local-only file picker permits inspecting the optimized GLB before committing it. Expected asset filename `turntable-pro-ject-e1-optimized.glb`. Until binary is committed, existing third-party models remain the automatic fallback. Do not publish to main before verifying license, quality and alignment.

## Listening room update
- Executive chair with headrest (3DAssets.dev, CC0, AI-assisted): https://3dassets.dev/assets/downtown-office-interiors-executive-chair-9801b58f ; pinned GLB https://cdn.3dassets.dev/assets/16982/v1/model.glb . Local `chair-executive.glb` preferred, CDN then previous chair as alternatives.
- Bookshelf speaker (3DAssets.dev, CC0, AI-assisted): https://3dassets.dev/assets/computers-and-desk-gadgets-speaker-bookshelf-90b50703 ; pinned GLB https://cdn.3dassets.dev/assets/38854/v1/model.glb . Local `wall-speaker.glb` preferred, CDN then original simple geometry fallback.
- Wood color, normal and roughness maps already in repo now applied to the writing desk with projected UVs. Plaster bump generated locally. Five original typographic posters use artist/track names only; no copied cover artwork. Audio references existing repository tracks; ensure rights before public release. No new music uploaded.
