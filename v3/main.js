import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RGBELoader} from 'three/addons/loaders/RGBELoader.js';

const container=document.querySelector('#scene');
const status=document.querySelector('#status');
const guideButton=document.querySelector('#guide');
const resetButton=document.querySelector('#reset');
const error=document.querySelector('#error');
const W=1.8, D=.75;
const DESK_HEIGHT=.75, EYE_HEIGHT=1.62, SEATED_EYE=1.25;
const CHAIR_Z=.93, CHAIR_FINAL_Z=.80;
const loadReport=[];
const assets=new URL('../assets/',import.meta.url);
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x1b1713);
scene.fog=new THREE.FogExp2(0x1b1713,.075);
const camera=new THREE.PerspectiveCamera(36,1,.03,35);
let renderer;
try {
  renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
} catch(e) {
  status.textContent='WebGL unavailable.';
  error.hidden=false; error.textContent='This desk study needs WebGL. Try a browser with hardware acceleration.';
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.25:1.5));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.03;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate=false;
container.appendChild(renderer.domElement);

const hemi=new THREE.HemisphereLight(0xffe0b8,0x33291f,.85);scene.add(hemi);
const key=new THREE.DirectionalLight(0xffd2a1,2.0);
key.position.set(-2.3,4,2.4);
key.castShadow=true;
key.shadow.mapSize.set(innerWidth<700?1024:2048,innerWidth<700?1024:2048);
Object.assign(key.shadow.camera,{left:-2.3,right:2.3,top:2.3,bottom:-2.3,near:.1,far:12});
key.shadow.normalBias=.008;key.shadow.bias=-.0002;scene.add(key);
const fill=new THREE.DirectionalLight(0xc5d0de,.38);fill.position.set(2,2,-2);scene.add(fill);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshStandardMaterial({color:0x302b25,roughness:.93}));
floor.rotation.x=-Math.PI/2;floor.position.y=-.002;floor.receiveShadow=true;scene.add(floor);
// Room shell, kept deliberately understated so the desk is the focal point.
const wall=new THREE.Mesh(new THREE.PlaneGeometry(12,4.4),new THREE.MeshStandardMaterial({color:0x3b3128,roughness:1}));
wall.position.set(0,2.2,-1.15);wall.receiveShadow=true;scene.add(wall);
const baseboard=new THREE.Mesh(new THREE.BoxGeometry(12,.09,.025),new THREE.MeshStandardMaterial({color:0x2b241e,roughness:.87}));
baseboard.position.set(0,.045,-1.13);scene.add(baseboard);

let desk=null,bounds=null,ready=false,chair=null,chairStatus='';
const guides=new THREE.Group();guides.visible=false;scene.add(guides);
const walkUI=document.querySelector('#walk');
const walkCopy=document.querySelector('#walk-copy');
const walkBar=document.querySelector('#walk-progress');
const skipButton=document.querySelector('#skip');
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
const coarse=matchMedia('(pointer: coarse)');
const startPos=new THREE.Vector3(),endPos=new THREE.Vector3(),lookStart=new THREE.Vector3(),lookEnd=new THREE.Vector3(),look=new THREE.Vector3();
const approachPos=new THREE.Vector3(),sidePos=new THREE.Vector3(),standPos=new THREE.Vector3();
let progress=0,desired=0,arrived=false,raf=0,lastTime=0,lastMouse=null,touchId=null,lastTouch=null;
let dimensions='';
function ease(t){return t*t*(3-2*t)}
function setPath(){
  const portrait=innerWidth/innerHeight<1;
  camera.fov=portrait?67:45;
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  const height=bounds?.max.y??DESK_HEIGHT;
  startPos.set(-.20,EYE_HEIGHT,3.7);
  approachPos.set(.80,EYE_HEIGHT,1.72);
  sidePos.set(.64,EYE_HEIGHT,.97);
  standPos.set(0,EYE_HEIGHT,.94);
  endPos.set(0,SEATED_EYE,CHAIR_FINAL_Z);
  lookStart.set(0,height+.15,0);
  lookEnd.set(0,height+.12,-.10);
}
function applyCamera(){
  const t=THREE.MathUtils.clamp(progress,0,1);
  const walking=t<.79;
  // Approach to the side of the chair, step in front of the backrest,
  // then lower into the seat. The last segment also rolls the chair forward.
  if(t<.48)camera.position.lerpVectors(startPos,approachPos,ease(t/.48));
  else if(t<.65)camera.position.lerpVectors(approachPos,sidePos,ease((t-.48)/.17));
  else if(t<.79)camera.position.lerpVectors(sidePos,standPos,ease((t-.65)/.14));
  else camera.position.lerpVectors(standPos,endPos,ease((t-.79)/.21));
  if(walking){
    const u=t/.79;
    const envelope=Math.sin(Math.PI*u);
    camera.position.x+=Math.sin(u*Math.PI*16)*.018*envelope;
    camera.position.y+=Math.sin(u*Math.PI*32)*.015*envelope;
  }
  const portrait=camera.aspect<1;
  const sit=ease(THREE.MathUtils.clamp((t-.65)/.35,0,1));
  const fov=THREE.MathUtils.lerp(portrait?67:45,portrait?82:65,sit);
  if(Math.abs(camera.fov-fov)>.01){camera.fov=fov;camera.updateProjectionMatrix()}
  look.lerpVectors(lookStart,lookEnd,ease(t));
  camera.lookAt(look);
  if(chair){
    const nextZ=THREE.MathUtils.lerp(CHAIR_Z,CHAIR_FINAL_Z,sit);
    if(Math.abs(chair.position.z-nextZ)>.0001){chair.position.z=nextZ;renderer.shadowMap.needsUpdate=true}
  }
  walkBar.style.transform='scaleX('+t.toFixed(3)+')';
}
function invalidate(){
  if(raf||document.hidden)return;
  raf=requestAnimationFrame(frame);
}
function frame(now){
  raf=0;
  const dt=lastTime?Math.min(.05,(now-lastTime)/1000):1/60;
  lastTime=now;
  if(ready){
    progress+= (desired-progress)*(1-Math.exp(-dt*9));
    if(Math.abs(desired-progress)<.001)progress=desired;
    if(progress===1&&!arrived){
      arrived=true;
      walkUI.dataset.arrived='true';
      status.textContent=dimensions+' · Seated at the desk.';
      skipButton.disabled=true;
    }
  }
  applyCamera();
  renderer.render(scene,camera);
  if(Math.abs(desired-progress)>.0001&&!document.hidden)invalidate();
  else lastTime=0;
}
function advance(pixels){
  if(!ready||arrived||desired===1)return;
  const budget=coarse.matches?Math.max(300,innerWidth*.95):Math.max(620,innerWidth*.72);
  desired=Math.min(1,desired+pixels/budget);
  invalidate();
}
function replay(){
  if(!ready)return;
  progress=desired=0;arrived=false;lastMouse=null;touchId=null;lastTouch=null;lastTime=0;
  walkUI.dataset.arrived='false';
  status.textContent=dimensions;
  skipButton.disabled=false;
  if(reduceMotion.matches)skip();
  else invalidate();
}
function skip(){
  if(!ready)return;
  desired=1;
  if(reduceMotion.matches)progress=1;
  invalidate();
}
window.addEventListener('pointermove',e=>{
  if(e.pointerType!=='mouse'||!ready||arrived)return;
  if(e.target.closest?.('button,a')){lastMouse=null;return}
  const p=[e.clientX,e.clientY];
  if(lastMouse)advance(Math.min(90,Math.hypot(p[0]-lastMouse[0],p[1]-lastMouse[1])));
  lastMouse=p;
},{passive:true});
document.documentElement.addEventListener('pointerleave',()=>{lastMouse=null});
const canvas=renderer.domElement;
canvas.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse'||!ready||arrived||touchId!==null)return;
  touchId=e.pointerId;lastTouch=[e.clientX,e.clientY];
  try{canvas.setPointerCapture(e.pointerId)}catch{}
});
canvas.addEventListener('pointermove',e=>{
  if(e.pointerId!==touchId||!lastTouch)return;
  const p=[e.clientX,e.clientY];
  advance(Math.min(90,Math.hypot(p[0]-lastTouch[0],p[1]-lastTouch[1])));
  lastTouch=p;
},{passive:true});
function endTouch(e){if(e.pointerId===touchId){touchId=null;lastTouch=null}}
canvas.addEventListener('pointerup',endTouch);
canvas.addEventListener('pointercancel',endTouch);
canvas.addEventListener('lostpointercapture',endTouch);
window.addEventListener('keydown',e=>{
  if(!ready||arrived||e.target.closest?.('button,a,input'))return;
  if(['ArrowUp','w','W',' '].includes(e.key)){e.preventDefault();advance(110)}
  else if(e.key==='Escape')skip();
});
document.addEventListener('visibilitychange',()=>{
  lastTime=0;lastMouse=null;
  if(document.hidden&&raf){cancelAnimationFrame(raf);raf=0}
  else invalidate();
});
function resize(){
  renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.25:1.5));
  renderer.setSize(innerWidth,innerHeight,false);
  setPath();invalidate();
}
window.addEventListener('resize',resize);
resize();
walkCopy.textContent=coarse.matches?'Swipe across the room to walk closer.':'Move your mouse to walk closer.';
resetButton.addEventListener('click',replay);
skipButton.addEventListener('click',skip);
guideButton.addEventListener('click',()=>{
  guides.visible=!guides.visible;
  guideButton.setAttribute('aria-pressed',String(guides.visible));
  invalidate();
});

const RAD=Math.PI/180;
// x=right, z=toward viewer, positive yaw turns the front toward camera-right.
const arrangement=[
  {name:'CRT',w:.45,d:.353,x:-.49,z:-.055,yaw:13,file:'crt.glb'},
  {name:'Turntable',w:.3595,d:.3733,x:.59,z:-.065,yaw:-12,file:'turntable-candidate.glb',alternates:['turntable-dj-alt.glb']},
  {name:'Notebook',w:.148,d:.210,x:.025,z:.075,yaw:8,file:'notebook.glb',node:'binder_notebook_closed'},
  {name:'Coffee mug',w:.12,d:.09,x:-.64,z:.245,yaw:25,file:'mug.glb'},
  {name:'Coffee beans',w:.052,d:.039,x:-.48,z:.27,yaw:16,file:'beans.glb'},
  {name:'Earbuds (MVP)',w:.0606,d:.055,x:.30,z:.205,yaw:-16,file:'earbuds-candidate.glb',alternates:['earbuds-alt.glb']},
  {name:'Headphones',w:.18,d:.16,x:.13,z:-.21,yaw:-10,file:'headphones.glb'}
];
function footprint(item,y){
  const {w,d,x,z,yaw}=item;
  const points=[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2],[-w/2,-d/2]].map(([a,b])=>new THREE.Vector3(a,0,b));
  const outline=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0xe6d8be}));
  outline.position.set(x,y,z);outline.rotation.y=yaw*RAD;guides.add(outline);
}
// The downloaded desk is a single mesh only 55 cm tall. Extend the middle
// of the legs, keeping the top assembly and the bottom 8 cm unscaled.
function raiseDeskGeometry(model,originalHeight,targetHeight){
  const delta=targetHeight-originalHeight;
  if(Math.abs(delta)<.001)return;
  const bottom=.08,upper=originalHeight-.065;
  model.traverse(o=>{
    if(!o.isMesh)return;
    const g=o.geometry.clone(),p=g.getAttribute('position');
    for(let i=0;i<p.count;i++){
      const y=p.getY(i);
      const weight=THREE.MathUtils.clamp((y-bottom)/(upper-bottom),0,1);
      p.setY(i,y+delta*weight);
    }
    p.needsUpdate=true;g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();o.geometry=g;
  });
}
const loader=new GLTFLoader();
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function getGLB(file){
  const url=new URL('models/'+file,assets).href;
  let failure;
  for(let i=0;i<2;i++){
    const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),8000);
    try{
      const response=await fetch(url,{signal:ctl.signal,cache:i?'reload':'default'});
      if(!response.ok)throw new Error('HTTP '+response.status+' '+file);
      const binary=await response.arrayBuffer();
      clearTimeout(timer);
      if(binary.byteLength<20||new DataView(binary).getUint32(0,true)!==0x46546c67)throw new Error('Invalid GLB '+file);
      return await loader.parseAsync(binary,new URL('.',url).href);
    }catch(e){failure=e;if(i===0)await sleep(350)}
    finally{clearTimeout(timer)}
  }
  throw failure;
}
async function loadFirst(name,files){
  for(const file of files){
    try{const data=await getGLB(file);loadReport.push({name,file,status:'loaded'});return {data,file}}
    catch(e){loadReport.push({name,file,status:'failed',reason:String(e)});console.warn('Asset fallback',file,e)}
  }
  return null;
}
const material=(color,roughness=.6,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const dark=material(0x151619),black=material(0x0a0a0b,.35),white=material(0xf4f3ee,.28),paper=material(0xcfc4ad,.9),metal=material(0x8f9091,.32,.65),brown=material(0x392317,.6);
function box(parent,w,h,d,x,y,z,mat){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);parent.add(m);return m;
}
function cyl(parent,r,h,x,y,z,mat){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,48),mat);m.position.set(x,y,z);parent.add(m);return m;
}
function fallbackProp(name){
  const g=new THREE.Group();
  if(name==='Turntable'){
    box(g,.3595,.065,.3733,0,.0325,0,dark);
    const platter=cyl(g,.15,.015,-.015,.072,0,metal);platter.name='platter';
    cyl(g,.145,.003,-.015,.082,0,black).name='record';
    cyl(g,.034,.004,-.015,.085,0,paper).name='record label';
    cyl(g,.014,.026,.145,.080,-.12,metal);
    const arm=box(g,.007,.008,.19,.145,.092,-.025,metal);arm.name='tonearm';
    box(g,.022,.012,.034,.145,.092,.068,dark);
    box(g,.029,.005,.017,.132,.069,.16,black);
  }else if(name==='Coffee mug'){
    const profile=[new THREE.Vector2(0,0),new THREE.Vector2(.039,0),new THREE.Vector2(.042,.007),new THREE.Vector2(.044,.085),new THREE.Vector2(.039,.086),new THREE.Vector2(.037,.009),new THREE.Vector2(0,.009)];
    const cup=new THREE.Mesh(new THREE.LatheGeometry(profile,48),dark);g.add(cup);
    const handle=new THREE.Mesh(new THREE.TorusGeometry(.026,.006,10,32),dark);handle.position.set(.045,.047,0);g.add(handle);
    cyl(g,.037,.003,0,.073,0,brown);
  }else if(name==='Notebook'){
    box(g,.148,.007,.210,0,.0035,0,brown);box(g,.141,.019,.202,0,.0165,0,paper);box(g,.148,.004,.210,0,.028,0,brown);
  }else if(name==='Earbuds (MVP)'){
    box(g,.0606,.0217,.0452,0,.01085,0,white);
    box(g,.059,.008,.044,0,.025,0,white);
  }else if(name==='Coffee beans'){
    for(let i=0;i<12;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),brown);m.scale.set(.0035,.0024,.0053);m.position.set((i%4-1.5)*.014,.0024,(Math.floor(i/4)-1)*.013);g.add(m)}
  }else if(name==='Headphones'){
    const band=new THREE.Mesh(new THREE.TorusGeometry(.076,.008,10,40,Math.PI),dark);band.position.y=.10;g.add(band);
    for(const side of [-1,1]){const cup=cyl(g,.038,.025,side*.076,.043,0,dark);cup.rotation.z=Math.PI/2}
  }else{
    box(g,.45,.33,.35,0,.165,0,paper);box(g,.36,.25,.012,-.025,.177,.18,black);
  }
  return g;
}
async function placeImported(item,top){
  const loaded=await loadFirst(item.name,[item.file,...(item.alternates||[])].filter(Boolean));
  let object=loaded?.data.scene;
  if(item.node&&object){
    const found=object.getObjectByName(item.node);
    object=found?.clone(true)||null;
  }
  if(!object){object=fallbackProp(item.name);loadReport.push({name:item.name,status:'procedural fallback'})}
  const pivot=new THREE.Group(),model=new THREE.Group();
  model.add(object);pivot.add(model);
  let b=new THREE.Box3().setFromObject(model),s=b.getSize(new THREE.Vector3());
  if(item.node&&s.x>s.z){object.rotation.y+=Math.PI/2;model.updateMatrixWorld(true);b.setFromObject(model);s=b.getSize(s)}
  if(!Number.isFinite(s.x)||s.x<=0||s.z<=0){
    model.remove(object);object=fallbackProp(item.name);model.add(object);
    b.setFromObject(model);s=b.getSize(s);loadReport.push({name:item.name,status:'invalid bounds fallback'});
  }
  const factor=Math.min(item.w/s.x,item.d/s.z);
  // Scale the parent, not a translated node within an imported model.
  const scaled=new THREE.Group();model.remove(object);scaled.add(object);model.add(scaled);
  scaled.scale.setScalar(factor);model.updateMatrixWorld(true);b.setFromObject(model);
  const center=b.getCenter(new THREE.Vector3());
  model.position.set(-center.x,-b.min.y,-center.z);
  pivot.position.set(item.x,top,item.z);pivot.rotation.y=item.yaw*RAD;
  pivot.name=item.name;
  pivot.traverse(o=>{
    if(!o.isMesh)return;
    o.castShadow=true;o.receiveShadow=true;
    if(item.name==='Coffee mug'&&o.material?.name==='cream'){o.material=o.material.clone();o.material.color.setHex(0x19191b);o.material.roughness=.29}
  });
  scene.add(pivot);
}
function fallbackChair(){
  const g=new THREE.Group();
  box(g,.49,.09,.46,0,.49,0,dark);
  box(g,.46,.55,.055,0,.85,-.20,dark);
  cyl(g,.034,.42,0,.22,0,metal);
  for(let i=0;i<5;i++){
    const leg=box(g,.055,.04,.31,0,.075,0,dark);leg.rotation.y=i*Math.PI*2/5;leg.position.x=Math.sin(leg.rotation.y)*.13;leg.position.z=Math.cos(leg.rotation.y)*.13;
  }
  for(const x of [-.27,.27]){box(g,.035,.17,.035,x,.62,0,dark);box(g,.065,.035,.24,x,.72,0,dark)}
  return g;
}
async function loadChair(){
  const loaded=await loadFirst('Chair',['chair.glb']);
  const root=loaded?.data.scene||fallbackChair();
  chair=new THREE.Group();const model=new THREE.Group();model.add(root);chair.add(model);
  let b=new THREE.Box3().setFromObject(root),s=b.getSize(new THREE.Vector3());
  if(!Number.isFinite(s.y)||s.y<=0){chair=null;chairStatus=' · Chair geometry invalid';return}
  root.scale.multiplyScalar(1.13/s.y);model.updateMatrixWorld(true);b.setFromObject(model);
  const center=b.getCenter(new THREE.Vector3());
  model.position.set(-center.x,-b.min.y,-center.z);
  chair.rotation.y=Math.PI;chair.position.set(0,0,CHAIR_Z);
  chair.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
  scene.add(chair);chairStatus=loaded?' · Ergonomic chair':' · Chair fallback';
}
function fallbackDesk(){
  const g=new THREE.Group(),wood=material(0x563722,.7);
  box(g,W,.045,D,0,DESK_HEIGHT-.0225,0,wood);
  for(const x of [-.84,.84])for(const z of [-.32,.32])box(g,.045,.705,.045,x,.3525,z,dark);
  return g;
}
async function start(){
  const [loaded,environment]=await Promise.allSettled([
    loadFirst('Desk',['study-desk-candidate.glb','desk.glb']),
    new RGBELoader().loadAsync(new URL('hdri/studio.hdr',assets).href)
  ]);
  if(environment.status==='fulfilled'){
    environment.value.mapping=THREE.EquirectangularReflectionMapping;
    scene.environment=environment.value;
    scene.environmentIntensity=.7;
  }
  const chosen=loaded.status==='fulfilled'?loaded.value:null;
  const original=chosen?.data.scene||fallbackDesk();
  desk=new THREE.Group();desk.add(original);
  let b=new THREE.Box3().setFromObject(desk),size=b.getSize(new THREE.Vector3());
  if(size.z>size.x){original.rotation.y+=Math.PI/2;desk.updateMatrixWorld(true);b.setFromObject(desk);size=b.getSize(size)}
  if(![size.x,size.y,size.z].every(n=>Number.isFinite(n)&&n>0))throw new Error('Invalid desk bounds');
  // A writing desk of standard working dimensions; keep tabletop and drawer
  // construction proportions as close as possible within the requested footprint.
  desk.scale.set(W/size.x,DESK_HEIGHT/size.y,D/size.z);
  desk.updateMatrixWorld(true);b.setFromObject(desk);
  const center=b.getCenter(new THREE.Vector3());
  desk.position.set(-center.x,-b.min.y,-center.z);
  desk.traverse(o=>{
    if(!o.isMesh)return;
    o.castShadow=true;o.receiveShadow=true;
    const tint=m=>{
      const copy=m.clone();
      if(copy.color){
        if(m.name==='oak')copy.color.setHex(0x68452e);
        else if(m.name==='carcass')copy.color.setHex(0x40332a);
        else if(chosen?.file==='desk.glb')copy.color.multiply(new THREE.Color(0xc7ab92));
      }
      return copy;
    };
    o.material=Array.isArray(o.material)?o.material.map(tint):tint(o.material);
  });
  scene.add(desk);desk.updateMatrixWorld(true);bounds=new THREE.Box3().setFromObject(desk);
  size=bounds.getSize(new THREE.Vector3());
  const top=bounds.max.y;
  arrangement.forEach(item=>footprint(item,top+.004));
  const outcomes=await Promise.allSettled([...arrangement.map(item=>placeImported(item,top+.002)),loadChair()]);
  outcomes.filter(r=>r.status==='rejected').forEach(r=>console.warn(r.reason));
  const fallbacks=loadReport.filter(r=>r.status.includes('fallback')).length;
  dimensions=(size.x*100).toFixed(0)+' × '+(size.z*100).toFixed(0)+' × '+(size.y*100).toFixed(0)+' cm · standing 162 / seated 125 cm'+(fallbacks?' · '+fallbacks+' fallback props':'')+(environment.status==='rejected'?' · HDRI unavailable':'');
  window.__v3AssetReport=loadReport;
  console.table(loadReport);
  ready=true;
  guideButton.disabled=false;resetButton.disabled=false;skipButton.disabled=false;
  renderer.shadowMap.needsUpdate=true;setPath();replay();
}
start().catch(e=>{status.textContent='Desk initialization failed.';error.hidden=false;error.textContent='The scene could not initialize.';console.error(e)});
