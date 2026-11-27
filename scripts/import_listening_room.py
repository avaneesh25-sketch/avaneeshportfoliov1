import json, struct, hashlib, urllib.request
from pathlib import Path
out=Path("assets/models")
jobs={"chair-executive.glb":"https://cdn.3dassets.dev/assets/16982/v1/model.glb","wall-speaker.glb":"https://cdn.3dassets.dev/assets/38854/v1/model.glb"}
report={}
for name,url in jobs.items():
    try:
        req=urllib.request.Request(url,headers={"User-Agent":"PortfolioV3-AssetImport/1.0"})
        with urllib.request.urlopen(req,timeout=35) as response:
            data=response.read(5_000_001)
        if len(data)>5_000_000 or len(data)<20: raise ValueError("Invalid length")
        magic,version,size=struct.unpack_from("<4sII",data)
        if magic!=b"glTF" or version!=2 or size!=len(data): raise ValueError("Invalid GLB")
        n,kind=struct.unpack_from("<I4s",data,12)
        if kind!=b"JSON" or n+20>len(data): raise ValueError("Invalid JSON chunk")
        doc=json.loads(data[20:20+n])
        if not doc.get("meshes") or set(doc.get("extensionsRequired",[])) & {"KHR_draco_mesh_compression","EXT_meshopt_compression","KHR_texture_basisu"}: raise ValueError("Unsupported model")
        if any("uri" in b for b in doc.get("buffers",[])) or any("uri" in i and not i["uri"].startswith("data:") for i in doc.get("images",[])): raise ValueError("External dependency")
        (out/name).write_bytes(data)
        report[name]={"source":url,"bytes":len(data),"sha256":hashlib.sha256(data).hexdigest(),"license":"CC0"}
    except Exception as e: report[name]={"error":str(e),"source":url}
(out/"listening-room-import-report.json").write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
