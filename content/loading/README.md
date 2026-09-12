# Loading screen media

Upload intro photos/videos into this folder, then add them to `manifest.json`.

Supported:
- images: JPG, JPEG, PNG, WEBP
- videos: MP4, WEBM

Every photo/video gets the same CRT/vintage filter automatically.

The sequence automatically adjusts its speed to the number of items:
- fewer items = each stays on screen longer
- more items = faster cuts so the full intro still fits the song

Example item:
```json
{ "type": "image", "src": "content/loading/my-photo.jpg", "alt": "Avaneesh" }
```

Video:
```json
{ "type": "video", "src": "content/loading/my-video.mp4" }
```

The order in manifest.json is the playback order.
