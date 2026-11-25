import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RGBELoader} from 'three/addons/loaders/RGBELoader.js';

const container=document.querySelector('#scene');
const status=document.querySelector('#status');
const guideButton=document.querySelector('#guide');
const resetButton=document.querySelector('#reset');
const error=document.querySelector('#error');
const W=1.8;
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

let desk=null,bounds=null,ready=false;
const guides=new THREE.Group();guides.visible=false;scene.add(guides);
const walkUI=document.querySelector('#walk');
const walkCopy=document.querySelector('#walk-copy');
const walkBar=document.querySelector('#walk-progress');
const skipButton=document.querySelector('#skip');
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
const coarse=matchMedia('(pointer: coarse)');
const startPos=new THREE.Vector3(),endPos=new THREE.Vector3(),lookStart=new THREE.Vector3(),lookEnd=new THREE.Vector3(),look=new THREE.Vector3();
let progress=0,desired=0,arrived=false,raf=0,lastTime=0,lastMouse=null,touchId=null,lastTouch=null;
let dimensions='';
function ease(t){return t*t*(3-2*t)}
function setPath(){
  const portrait=innerWidth/innerHeight<1;
  camera.fov=portrait?53:39;
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  const height=bounds?.max.y??.75;
  const size=bounds?bounds.getSize(new THREE.Vector3()):new THREE.Vector3(1.8,.75,.8);
  const vf=THREE.MathUtils.degToRad(camera.fov);
  const hf=2*Math.atan(Math.tan(vf/2)*camera.aspect);
  const endZ=Math.max(1.55,size.x*.57/Math.tan(hf/2),size.z*.5+1.15);
  startPos.set(-.20,1.67,endZ+2.8);
  endPos.set(.06,height+1.0,endZ);
  lookStart.set(0,height+.05,0);
  lookEnd.set(0,height*.76,-.02);
}
function applyCamera(){
  const t=THREE.MathUtils.clamp(progress,0,1);
  // Short, gentle head movement fades at both ends; no perpetual camera motion.
  const envelope=Math.sin(Math.PI*t)*(1-ease(Math.max(0,(t-.76)/.24)));
  const path=t<.80?t:(.80+.20*(1-Math.pow(1-(t-.80)/.20,1.4)));
  camera.position.lerpVectors(startPos,endPos,path);
  camera.position.x+=Math.sin(t*Math.PI*16)*.025*envelope;
  camera.position.y+=Math.sin(t*Math.PI*32)*.017*envelope;
  look.lerpVectors(lookStart,lookEnd,ease(t));
  camera.lookAt(look);
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
      status.textContent=dimensions+' · You have arrived.';
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

function footprint(w,d,x,z,y){
  const points=[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2],[-w/2,-d/2]].map(([a,b])=>new THREE.Vector3(x+a,y,z+b));
  const outline=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0xe6d8be}));
  guides.add(outline);
}
const loader=new GLTFLoader();
async function start(){
  const [model,environment]=await Promise.allSettled([
    loader.loadAsync(new URL('models/desk.glb',assets).href),
    new RGBELoader().loadAsync(new URL('hdri/studio.hdr',assets).href)
  ]);
  if(environment.status==='fulfilled'){
    environment.value.mapping=THREE.EquirectangularReflectionMapping;
    scene.environment=environment.value;
    scene.environmentIntensity=.7;
  }
  if(model.status==='rejected'){
    status.textContent='Table model could not load.';
    error.hidden=false;error.textContent='The real desk asset failed to load. No substitute geometry has been shown.';
    console.error(model.reason);invalidate();return;
  }
  desk=new THREE.Group();
  const original=model.value.scene;
  desk.add(original);
  let b=new THREE.Box3().setFromObject(desk);
  let size=b.getSize(new THREE.Vector3());
  // Uniform scale only; rotate the model if its long axis is depth.
  if(size.z>size.x){original.rotation.y+=Math.PI/2;desk.updateMatrixWorld(true);b.setFromObject(desk);size=b.getSize(size)}
  if(!Number.isFinite(size.x)||size.x<=0)throw new Error('Invalid desk bounds');
  desk.scale.setScalar(W/size.x);
  desk.updateMatrixWorld(true);b.setFromObject(desk);
  const center=b.getCenter(new THREE.Vector3());
  desk.position.set(-center.x,-b.min.y,-center.z);
  desk.traverse(o=>{
    if(!o.isMesh)return;
    o.castShadow=true;o.receiveShadow=true;
    const tint=m=>{const copy=m.clone();if(copy.color)copy.color.multiply(new THREE.Color(0xc7ab92));return copy};
    o.material=Array.isArray(o.material)?o.material.map(tint):tint(o.material);
  });
  scene.add(desk);desk.updateMatrixWorld(true);bounds=new THREE.Box3().setFromObject(desk);
  size=bounds.getSize(new THREE.Vector3());
  // Real AT-LP60X footprint; all other guides use approximate physical sizes.
  const top=bounds.max.y+.004;
  const depth=size.z;
  footprint(.3595,.3733,.53,0,top);
  footprint(.43,.36,-.42,-Math.max(0,(depth-.36)/2-.04),top);
  footprint(.148,.210,.03,.10,top);
  footprint(.09,.09,-.64,.17,top);
  footprint(.0606,.0452,.31,.17,top);
  dimensions=(size.x*100).toFixed(0)+' × '+(size.z*100).toFixed(0)+' × '+(size.y*100).toFixed(0)+' cm · original model proportions'+(environment.status==='rejected'?' · HDRI unavailable':'');
  ready=true;
  guideButton.disabled=false;resetButton.disabled=false;skipButton.disabled=false;
  renderer.shadowMap.needsUpdate=true;setPath();replay();
}
start().catch(e=>{status.textContent='Desk initialization failed.';error.hidden=false;error.textContent='The scene could not initialize.';console.error(e)});
