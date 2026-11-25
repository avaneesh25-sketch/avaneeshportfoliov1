"""Import CC0 V3 candidates; no third-party scripts or credentials required."""
import json, math, struct, hashlib, urllib.request, urllib.parse, random
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"assets"/"models"
OUT.mkdir(parents=True,exist_ok=True)
LIMIT=5_000_000
HOSTS={"cdn.3dassets.dev","tevy.dev","grab3d.com","www.grab3d.com","cdn.grab3d.com"}
def fetch(url,limit=LIMIT):
    u=urllib.parse.urlparse(url)
    if u.scheme!="https" or u.hostname not in HOSTS: raise ValueError("Unexpected source host "+str(u.hostname))
    req=urllib.request.Request(url,headers={"User-Agent":"PortfolioV3-AssetImport/1.0"})
    with urllib.request.urlopen(req,timeout=40) as r:
        if urllib.parse.urlparse(r.geturl()).hostname not in HOSTS: raise ValueError("Unexpected redirect host")
        data=r.read(limit+1)
    if len(data)>limit: raise ValueError("Download exceeds budget")
    return data

def inspect(data):
    if len(data)<20: raise ValueError("Truncated")
    magic,version,size=struct.unpack_from("<4sII",data)
    if magic!=b"glTF" or version!=2 or size!=len(data): raise ValueError("Not a valid GLB 2 header")
    n,typ=struct.unpack_from("<I4s",data,12)
    if typ!=b"JSON" or 20+n>len(data): raise ValueError("Bad JSON chunk")
    d=json.loads(data[20:20+n])
    if not d.get("meshes") or not d.get("nodes"): raise ValueError("No geometry")
    if any("uri" in b for b in d.get("buffers",[])) or any("uri" in i and not i["uri"].startswith("data:") for i in d.get("images",[])): raise ValueError("Not self-contained")
    if set(d.get("extensionsRequired",[])) & {"KHR_draco_mesh_compression","EXT_meshopt_compression","KHR_texture_basisu"}: raise ValueError("Needs additional decoder")
    triangles=0
    for m in d["meshes"]:
        for p in m["primitives"]:
            if p.get("mode",4)==4:
                triangles+=d["accessors"][p.get("indices",p["attributes"]["POSITION"])]["count"]//3
    return {"bytes":len(data),"sha256":hashlib.sha256(data).hexdigest(),"triangles_mesh_total":triangles,"mesh_nodes":[{"name":node.get("name","unnamed"),"mesh":node["mesh"]} for node in d["nodes"] if "mesh" in node],"animations":len(d.get("animations",[])),"extensionsRequired":d.get("extensionsRequired",[])}

def save(filename,data,source,download,notes):
    meta=inspect(data)
    (OUT/filename).write_bytes(data)
    return dict(meta,file=filename,source=source,download=download,license="CC0 1.0",notes=notes)

def import_direct(filename,source,url,notes):
    return save(filename,fetch(url),source,url,notes)

def grab_turntable():
    api="https://grab3d.com/api/v1/models/turntable.json"
    meta=json.loads(fetch(api,1_000_000))
    for entry in meta.get("files",[]):
        if entry.get("format","").lower()=="glb":
            return save("turntable-candidate.glb",fetch(entry["url"]),"https://grab3d.com/models/electronics/turntable/",entry["url"],"Stylized, NOT AT-LP60X. Source describes separately movable parts. Inspect before adapting.")
    raise ValueError("No GLB in published API response")

def beans():
    # Original geometry, in metres: subtly grooved roasted coffee bean.
    # 16 longitudinal rings, 32 segments; shared mesh with 12 separate nodes.
    pos=[]; idx=[]; rings=16; seg=32
    for i in range(rings+1):
        a=math.pi*i/rings
        for j in range(seg):
            b=2*math.pi*j/seg
            x=.0035*math.sin(a)*math.cos(b)
            z=.0053*math.sin(a)*math.sin(b)
            y=.0024*math.cos(a)
            if y>0:
                y-=.00065*math.exp(-(x/.00055)**2)*(math.sin(a)**2)*min(1,y/.001)
            pos.append((x,y+.0024,z))
    for i in range(rings):
        for j in range(seg):
            a=i*seg+j;b=i*seg+(j+1)%seg;c=a+seg;d=b+seg
            idx.extend((a,b,c,b,d,c))
    # Correct winding to point outward and compute smooth area-weighted normals.
    norm=[[0.,0.,0.] for _ in pos]
    for i in range(0,len(idx),3):
        a,b,c=idx[i:i+3]
        A,B,C=pos[a],pos[b],pos[c]
        u=[B[k]-A[k] for k in range(3)];v=[C[k]-A[k] for k in range(3)]
        n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]]
        mid=[(A[k]+B[k]+C[k])/3 for k in range(3)];mid[1]-=.0024
        if sum(n[k]*mid[k] for k in range(3))<0:
            idx[i+1],idx[i+2]=c,b;n=[-v for v in n]
        for vertex in (a,b,c):
            for k in range(3):norm[vertex][k]+=n[k]
    normals=[]
    for n in norm:
        l=math.sqrt(sum(v*v for v in n))
        normals.append(tuple(v/l for v in n) if l>1e-15 else (0,1,0))
    binary=bytearray();views=[]
    def add(data,target):
        binary.extend(b"\0"*((-len(binary))%4));offset=len(binary);binary.extend(data)
        views.append({"buffer":0,"byteOffset":offset,"byteLength":len(data),"target":target})
    add(struct.pack("<"+"f"*(3*len(pos)),*(v for p in pos for v in p)),34962)
    add(struct.pack("<"+"f"*(3*len(normals)),*(v for p in normals for v in p)),34962)
    add(struct.pack("<"+"H"*len(idx),*idx),34963)
    binary.extend(b"\0"*((-len(binary))%4))
    rng=random.Random(26);nodes=[]
    for i in range(12):
        x=(i%4-1.5)*.014+rng.uniform(-.0015,.0015);z=(i//4-1)*.016+rng.uniform(-.0015,.0015)
        angle=rng.uniform(-math.pi,math.pi)
        nodes.append({"name":"Bean_%02d"%i,"mesh":0,"translation":[x,0,z],"rotation":[0,math.sin(angle/2),0,math.cos(angle/2)]})
    doc={"asset":{"version":"2.0","generator":"Portfolio V3 original coffee bean geometry"},"scene":0,"scenes":[{"nodes":list(range(len(nodes)))}],"nodes":nodes,"meshes":[{"name":"Grooved roasted bean","primitives":[{"attributes":{"POSITION":0,"NORMAL":1},"indices":2,"material":0}]}],"materials":[{"name":"Roasted coffee","pbrMetallicRoughness":{"baseColorFactor":[.105,.044,.019,1],"metallicFactor":0,"roughnessFactor":.56}}],"buffers":[{"byteLength":len(binary)}],"bufferViews":views,"accessors":[{"bufferView":0,"componentType":5126,"count":len(pos),"type":"VEC3","min":[min(p[k] for p in pos) for k in range(3)],"max":[max(p[k] for p in pos) for k in range(3)]},{"bufferView":1,"componentType":5126,"count":len(normals),"type":"VEC3"},{"bufferView":2,"componentType":5123,"count":len(idx),"type":"SCALAR","min":[min(idx)],"max":[max(idx)]}]}
    j=json.dumps(doc,separators=(",",":")).encode();j+=b" "*((-len(j))%4)
    data=struct.pack("<4sII",b"glTF",2,12+8+len(j)+8+len(binary))+struct.pack("<I4s",len(j),b"JSON")+j+struct.pack("<I4s",len(binary),b"BIN\0")+binary
    return save("beans.glb",data,"Original procedural geometry",None,"Twelve independently movable bean nodes; no downloaded model. CC0 dedication for this geometry.")

jobs=[
("mug.glb","https://3dassets.dev/assets/music-recording-studio-and-instruments-coffee-mug-91bac0a5","https://cdn.3dassets.dev/assets/33831/v1/model.glb","Generic stoneware mug; color and separate handle need inspection."),
("headphones.glb","https://3dassets.dev/assets/computers-and-desk-gadgets-headphones-over-ear-bc21b783","https://cdn.3dassets.dev/assets/38851/v1/model.glb","Generic over-ear headphones; AI-assisted library."),
("earbuds-candidate.glb","https://3dassets.dev/assets/computers-and-desk-gadgets-earbuds-charging-case-39e4bff6","https://cdn.3dassets.dev/assets/38852/v1/model.glb","Generic wireless earbuds; NOT verified AirPods Pro 2. AI-assisted library."),
("earbuds-alt.glb","https://tevy.dev/models/wireless-earbuds-case","https://tevy.dev/models/wireless-earbuds-case/v1/lod0.glb","Generic white case with one earbud beside it."),
("study-desk-candidate.glb","https://3dassets.dev/assets/bedroom-and-living-room-furniture-desk-writing-2f6be817","https://cdn.3dassets.dev/assets/38795/v1/model.glb","Writing desk candidate; not swapped into scene pending visual inspection."),
("study-desk-alt.glb","https://tevy.dev/models/scholars-writing-desk","https://tevy.dev/models/scholars-writing-desk/v1/lod0.glb","Alternate writing desk; style and proportions need inspection."),
("turntable-dj-alt.glb","https://3dassets.dev/assets/nightclub-and-dj-booth-turntable-deck-aa917183","https://cdn.3dassets.dev/assets/34088/v1/model.glb","DJ deck alternate; NOT AT-LP60X.")
]
report={"models":[],"errors":[]}
for job in jobs:
    try:report["models"].append(import_direct(*job))
    except Exception as e:report["errors"].append({"file":job[0],"error":str(e)})
try:report["models"].append(grab_turntable())
except Exception as e:report["errors"].append({"file":"turntable-candidate.glb","error":str(e)})
try:report["models"].append(beans())
except Exception as e:report["errors"].append({"file":"beans.glb","error":str(e)})
(OUT/"remaining-import-report.json").write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
if not report["models"]:raise SystemExit("Nothing imported")
