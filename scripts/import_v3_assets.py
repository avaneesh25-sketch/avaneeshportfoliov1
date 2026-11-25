"""One-time CC0 asset import. Run from repository root: python scripts/import_v3_assets.py."""
import hashlib, json, mimetypes, struct, base64, urllib.request, urllib.parse
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
MODELS=ROOT/"assets"/"models"
TEXTURES=ROOT/"assets"/"textures"
HDRI=ROOT/"assets"/"hdri"
for folder in (MODELS,TEXTURES,HDRI): folder.mkdir(parents=True,exist_ok=True)

def get(url):
    u=urllib.parse.urlparse(url)
    if u.scheme!="https" or u.hostname not in ("api.polyhaven.com","dl.polyhaven.org"):
        raise ValueError("Unexpected source host: "+url)
    req=urllib.request.Request(url,headers={"User-Agent":"PortfolioV3-AssetImport/1.0 (personal portfolio; powered by Poly Haven)"})
    with urllib.request.urlopen(req,timeout=90) as response:
        return response.read(50_000_001)

def files(asset):
    return json.loads(get("https://api.polyhaven.com/files/"+asset))

def read_file(info):
    data=get(info["url"])
    if len(data)>50_000_000: raise ValueError("File too large")
    if info.get("md5") and hashlib.md5(data).hexdigest()!=info["md5"].lower():
        raise ValueError("MD5 mismatch: "+info["url"])
    return data

def model(asset, filename):
    source=files(asset)["gltf"]["1k"]["gltf"]
    doc=json.loads(read_file(source))
    includes=source.get("include",{})
    if "EXT_meshopt_compression" in doc.get("extensionsUsed",[]):
        raise ValueError("Compressed glTF requires separate conversion")
    binary=bytearray()
    def append(data):
        binary.extend(b"\0"*((-len(binary))%4))
        offset=len(binary)
        binary.extend(data)
        return offset
    def read_uri(uri):
        if uri.startswith("data:"):
            return base64.b64decode(uri.split(",",1)[1])
        key=urllib.parse.unquote(uri)
        if uri in includes: return read_file(includes[uri])
        if key in includes: return read_file(includes[key])
        raise ValueError("Missing dependency: "+uri)
    offsets=[]
    for buf in doc.get("buffers",[]):
        offsets.append(append(read_uri(buf["uri"])))
    views=doc.setdefault("bufferViews",[])
    for view in views:
        view["byteOffset"]=view.get("byteOffset",0)+offsets[view["buffer"]]
        view["buffer"]=0
    for image in doc.get("images",[]):
        if "uri" not in image: continue
        uri=image.pop("uri")
        data=read_uri(uri)
        mime=image.get("mimeType") or (uri.split(";",1)[0][5:] if uri.startswith("data:") else mimetypes.guess_type(uri)[0])
        if mime not in ("image/png","image/jpeg","image/webp","image/ktx2"):
            raise ValueError("Unsupported texture: "+str(mime))
        image["mimeType"]=mime
        image["bufferView"]=len(views)
        views.append({"buffer":0,"byteOffset":append(data),"byteLength":len(data)})
    binary.extend(b"\0"*((-len(binary))%4))
    doc["buffers"]=[{"byteLength":len(binary)}]
    j=json.dumps(doc,separators=(",",":"),ensure_ascii=False).encode("utf-8")
    j+=b" "*((-len(j))%4)
    glb=struct.pack("<4sII",b"glTF",2,12+8+len(j)+8+len(binary))+struct.pack("<I4s",len(j),b"JSON")+j+struct.pack("<I4s",len(binary),b"BIN\0")+binary
    if len(glb)>25_000_000: raise ValueError("GLB exceeds repository budget")
    dest=MODELS/filename
    dest.write_bytes(glb)
    nodes=[{"name":n.get("name","unnamed"),"mesh":n["mesh"]} for n in doc.get("nodes",[]) if "mesh" in n]
    triangles=0
    for mesh in doc.get("meshes",[]):
        for p in mesh.get("primitives",[]):
            if p.get("mode",4)==4:
                index=p.get("indices",p["attributes"]["POSITION"])
                triangles+=doc["accessors"][index]["count"]//3
    return {"file":str(dest.relative_to(ROOT)),"bytes":len(glb),"triangles":triangles,"mesh_nodes":nodes,"source":"https://polyhaven.com/a/"+asset,"license":"CC0"}

report={"models":[],"other":[],"errors":[],"credit":"Powered by Poly Haven (https://polyhaven.com/). Models and textures CC0."}
for asset, filename in [("Television_01","crt.glb"),("WoodenTable_01","desk.glb"),("binder_notebook","notebook.glb")]:
    try:
        report["models"].append(model(asset,filename))
    except Exception as e:
        report["errors"].append({"asset":asset,"error":str(e)})
try:
    data=read_file(files("wooden_studio_04")["hdri"]["1k"]["hdr"])
    if not data.startswith((b"#?RADIANCE",b"#?RGBE")): raise ValueError("Not an HDR image")
    dest=HDRI/"studio.hdr"
    dest.write_bytes(data)
    report["other"].append({"file":str(dest.relative_to(ROOT)),"bytes":len(data)})
except Exception as e: report["errors"].append({"asset":"wooden_studio_04","error":str(e)})
try:
    wood=files("wood_table")
    for mapname, filename in [("Diffuse","wood-color.jpg"),("nor_gl","wood-normal.jpg"),("Rough","wood-roughness.jpg")]:
        try:
            data=read_file(wood[mapname]["1k"]["jpg"])
            if not data.startswith(b"\xff\xd8"): raise ValueError("Not a JPEG")
            dest=TEXTURES/filename
            dest.write_bytes(data)
            report["other"].append({"file":str(dest.relative_to(ROOT)),"bytes":len(data)})
        except Exception as e: report["errors"].append({"asset":"wood_table/"+mapname,"error":str(e)})
except Exception as e: report["errors"].append({"asset":"wood_table","error":str(e)})
(MODELS/"import-report.json").write_text(json.dumps(report,indent=2),encoding="utf-8")
print(json.dumps(report,indent=2))
if not report["models"] and not report["other"]: raise SystemExit("No asset imports succeeded.")
