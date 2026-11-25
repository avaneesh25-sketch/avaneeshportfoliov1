import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RGBELoader} from 'three/addons/loaders/RGBELoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

const container=document.querySelector('#scene');
const status=document.querySelector('#status');
const guideButton=document.querySelector('#guide');
const resetButton=document.querySelector('#reset');
const error=document.querySelector('#error');
const W=1.8;
const assets=new URL('../assets/',import.meta.url);
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x191611);
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
renderer.toneMappingExposure=1.15;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate=false;
container.appendChild(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=false;
controls.enablePan=false;
controls.minDistance=1.25;
controls.maxDistance=7;
controls.maxPolarAngle=Math.PI/2-.025;
controls.minPolarAngle=.15;

const hemi=new THREE.HemisphereLight(0xffe8d0,0x42382c,1.1);scene.add(hemi);
const key=new THREE.DirectionalLight(0xffe6c6,2.2);
key.position.set(-2.3,4,2.4);
key.castShadow=true;
key.shadow.mapSize.set(innerWidth<700?1024:2048,innerWidth<700?1024:2048);
Object.assign(key.shadow.camera,{left:-2.3,right:2.3,top:2.3,bottom:-2.3,near:.1,far:12});
key.shadow.normalBias=.008;key.shadow.bias=-.0002;scene.add(key);
const fill=new THREE.DirectionalLight(0xbad0ed,.65);fill.position.set(2,2,-2);scene.add(fill);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshStandardMaterial({color:0x302b25,roughness:.93}));
floor.rotation.x=-Math.PI/2;floor.position.y=-.002;floor.receiveShadow=true;scene.add(floor);
let pending=false;
function invalidate(){
  if(pending||document.hidden)return;
  pending=true;
  requestAnimationFrame(()=>{pending=false;renderer.render(scene,camera)});
}
controls.addEventListener('change',invalidate);
document.addEventListener('visibilitychange',invalidate);
let desk=null, bounds=null;
const guides=new THREE.Group();guides.visible=false;scene.add(guides);
function setCamera(){
  const portrait=innerWidth/innerHeight<1;
  const centerY=bounds?bounds.max.y*.65:.5;
  controls.target.set(0,centerY,0);
  const vertical=THREE.MathUtils.degToRad(camera.fov);
  const horizontal=2*Math.atan(Math.tan(vertical/2)*camera.aspect);
  const radius=bounds?bounds.getSize(new THREE.Vector3()).length()/2:1.1;
  const distance=radius/Math.sin(Math.min(horizontal,vertical)/2)*(portrait?1.12:1.06);
  camera.position.copy(controls.target).add(new THREE.Vector3(.40,.48,1).normalize().multiplyScalar(distance));
  controls.update();invalidate();
}
function resize(){
  renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.25:1.5));
  renderer.setSize(innerWidth,innerHeight,false);
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  setCamera();
}
window.addEventListener('resize',resize);resize();
resetButton.addEventListener('click',setCamera);
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
  desk.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
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
  status.textContent=(size.x*100).toFixed(0)+' × '+(size.z*100).toFixed(0)+' × '+(size.y*100).toFixed(0)+' cm · original model proportions'+(environment.status==='rejected'?' · HDRI unavailable':'');
  guideButton.disabled=false;resetButton.disabled=false;
  renderer.shadowMap.needsUpdate=true;setCamera();invalidate();
}
start().catch(e=>{status.textContent='Desk initialization failed.';error.hidden=false;error.textContent='The scene could not initialize.';console.error(e)});
