import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const canvas=document.getElementById('turntableCanvas');
if(canvas){
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0x090604);
  scene.fog=new THREE.FogExp2(0x090604,.035);

  const camera=new THREE.PerspectiveCamera(36,innerWidth/innerHeight,.1,100);
  camera.position.set(.1,7.2,10.6);
  camera.lookAt(.1,.15,.1);

  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setSize(innerWidth,innerHeight,false);
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.03;

  const pm=new THREE.MeshStandardMaterial({color:0x15120f,roughness:.48,metalness:.32});
  const wood=new THREE.MeshStandardMaterial({color:0x32180c,roughness:.6,metalness:.03});
  const black=new THREE.MeshStandardMaterial({color:0x050505,roughness:.23,metalness:.46});
  const metal=new THREE.MeshStandardMaterial({color:0xa9a6a1,roughness:.2,metalness:.88});
  const cream=new THREE.MeshStandardMaterial({color:0xd8c6a6,roughness:.7,metalness:0});

  const table=new THREE.Mesh(new THREE.BoxGeometry(18,.45,10.6),wood);table.position.y=-.65;table.receiveShadow=true;scene.add(table);
  const back=new THREE.Mesh(new THREE.PlaneGeometry(22,10),new THREE.MeshStandardMaterial({color:0x160b06,roughness:.9}));back.position.set(0,3,-5.4);scene.add(back);

  const base=new THREE.Mesh(new THREE.BoxGeometry(7,.38,5),pm);base.position.set(-.1,-.25,.1);base.castShadow=base.receiveShadow=true;scene.add(base);
  const rim=new THREE.Mesh(new THREE.BoxGeometry(7.16,.12,5.16),new THREE.MeshStandardMaterial({color:0x38251b,roughness:.34,metalness:.24}));rim.position.set(-.1,-.46,.1);scene.add(rim);

  const platter=new THREE.Group();platter.position.set(-.82,.02,.05);scene.add(platter);
  const platterBase=new THREE.Mesh(new THREE.CylinderGeometry(2.28,2.28,.16,96),new THREE.MeshStandardMaterial({color:0x353535,roughness:.23,metalness:.8}));platterBase.castShadow=true;platter.add(platterBase);
  const record=new THREE.Mesh(new THREE.CylinderGeometry(2.12,2.12,.065,128),black);record.position.y=.115;record.castShadow=true;platter.add(record);
  for(let r=.78;r<2.04;r+=.07){const ring=new THREE.Mesh(new THREE.TorusGeometry(r,.006,5,120),new THREE.MeshStandardMaterial({color:0x2a2a2a,roughness:.33,metalness:.65}));ring.rotation.x=Math.PI/2;ring.position.y=.153;platter.add(ring)}
  const label=new THREE.Mesh(new THREE.CylinderGeometry(.68,.68,.075,64),cream);label.position.y=.16;platter.add(label);
  const spindle=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.28,24),metal);spindle.position.y=.28;platter.add(spindle);

  const armPivot=new THREE.Group();armPivot.position.set(2.45,.22,-1.45);scene.add(armPivot);
  const pivotBase=new THREE.Mesh(new THREE.CylinderGeometry(.48,.55,.35,48),new THREE.MeshStandardMaterial({color:0x151515,roughness:.28,metalness:.7}));pivotBase.castShadow=true;armPivot.add(pivotBase);
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(.27,.27,.3,48),metal);cap.position.y=.27;armPivot.add(cap);
  const arm=new THREE.Group();armPivot.add(arm);arm.rotation.y=-.08;
  const tube=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,3.72,20),metal);tube.rotation.z=Math.PI/2;tube.position.set(-1.72,.3,.06);tube.castShadow=true;arm.add(tube);
  const elbow=new THREE.Mesh(new THREE.TorusGeometry(.48,.055,16,48,Math.PI*.52),metal);elbow.rotation.set(Math.PI/2,0,-.25);elbow.position.set(-3.42,.3,.18);arm.add(elbow);
  const cartridge=new THREE.Mesh(new THREE.BoxGeometry(.55,.18,.35),new THREE.MeshStandardMaterial({color:0x101010,roughness:.3,metalness:.6}));cartridge.position.set(-3.62,.23,.54);cartridge.rotation.y=-.18;arm.add(cartridge);
  const stylus=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.25,8),new THREE.MeshStandardMaterial({color:0xe1b26d,metalness:.7,roughness:.25}));stylus.position.set(-3.78,.08,.58);arm.add(stylus);
  const weight=new THREE.Mesh(new THREE.CylinderGeometry(.25,.25,.6,32),new THREE.MeshStandardMaterial({color:0x202020,roughness:.35,metalness:.72}));weight.rotation.z=Math.PI/2;weight.position.set(.42,.32,-.03);arm.add(weight);

  const mug=new THREE.Group();mug.position.set(4.4,-.15,2.55);scene.add(mug);
  const cup=new THREE.Mesh(new THREE.CylinderGeometry(.48,.42,.9,48),new THREE.MeshStandardMaterial({color:0x111111,roughness:.4,metalness:.15}));cup.castShadow=true;mug.add(cup);
  const coffee=new THREE.Mesh(new THREE.CylinderGeometry(.41,.41,.015,48),new THREE.MeshStandardMaterial({color:0x3a1606,roughness:.25}));coffee.position.y=.46;mug.add(coffee);
  const handle=new THREE.Mesh(new THREE.TorusGeometry(.32,.08,16,40,Math.PI*1.55),new THREE.MeshStandardMaterial({color:0x111111,roughness:.4}));handle.rotation.y=Math.PI/2;handle.position.set(.48,.05,0);mug.add(handle);

  const lampStem=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,2.3,20),new THREE.MeshStandardMaterial({color:0x19130f,metalness:.5,roughness:.35}));lampStem.position.set(5.3,.45,-2.5);scene.add(lampStem);
  const shade=new THREE.Mesh(new THREE.ConeGeometry(1.25,.9,48,1,true),new THREE.MeshStandardMaterial({color:0x8e3f0e,roughness:.65,side:THREE.DoubleSide}));shade.position.set(5.3,1.55,-2.5);shade.rotation.x=Math.PI;scene.add(shade);
  const bulb=new THREE.PointLight(0xff8c37,90,9,2);bulb.position.set(5.1,1.05,-2.1);bulb.castShadow=true;scene.add(bulb);

  scene.add(new THREE.HemisphereLight(0x9bb1d0,0x2a1208,1.15));
  const key=new THREE.DirectionalLight(0xffd7aa,2.3);key.position.set(-4,7,5);key.castShadow=true;scene.add(key);
  const fill=new THREE.PointLight(0x5478a8,9,8,2);fill.position.set(-2,2,-4);scene.add(fill);

  const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();
  let dragging=false,startX=0,baseAngle=arm.rotation.y,dropped=false,playing=false;
  const armMeshes=[tube,elbow,cartridge,cap,pivotBase];

  function hitArm(e){const r=canvas.getBoundingClientRect();mouse.x=((e.clientX-r.left)/r.width)*2-1;mouse.y=-((e.clientY-r.top)/r.height)*2+1;ray.setFromCamera(mouse,camera);return ray.intersectObjects(armMeshes,false).length>0}
  canvas.addEventListener('pointerdown',e=>{if(dropped)return;if(hitArm(e)){dragging=true;startX=e.clientX;baseAngle=arm.rotation.y;canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing'}});
  canvas.addEventListener('pointermove',e=>{if(!dragging)return;const dx=(e.clientX-startX)/innerWidth;arm.rotation.y=THREE.MathUtils.clamp(baseAngle-dx*2.7,-.78,.14)});
  canvas.addEventListener('pointerup',e=>{if(!dragging)return;dragging=false;canvas.style.cursor='default';if(arm.rotation.y<-.55){arm.rotation.y=-.68;dropped=true;playing=true;window.dispatchEvent(new CustomEvent('turntable:drop'))}else{arm.rotation.y=-.08}});
  canvas.addEventListener('pointercancel',()=>{dragging=false;canvas.style.cursor='default';if(!dropped)arm.rotation.y=-.08});
  window.addEventListener('turntable:ended',()=>{playing=false});

  const clock=new THREE.Clock();
  function animate(){requestAnimationFrame(animate);const dt=clock.getDelta();if(playing)platter.rotation.y-=dt*1.65;renderer.render(scene,camera)}animate();

  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight,false)});
}