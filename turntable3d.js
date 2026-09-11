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

  const table=new THREE.Mesh(new THREE.BoxGeometry(18,.58,10.6),new THREE.MeshStandardMaterial({color:0x4a2411,roughness:.48,metalness:.02}));table.position.y=-.69;table.receiveShadow=true;scene.add(table);
  const deskLip=new THREE.Mesh(new THREE.BoxGeometry(18,.16,10.72),new THREE.MeshStandardMaterial({color:0x241006,roughness:.62}));deskLip.position.y=-.96;scene.add(deskLip);
  const grainMat=new THREE.MeshStandardMaterial({color:0x6a3518,roughness:.7,transparent:true,opacity:.42});
  for(let i=-4;i<=4;i++){const grain=new THREE.Mesh(new THREE.BoxGeometry(17.5,.008,.018),grainMat);grain.position.set(0,-.395,i*1.05);scene.add(grain)}
  const back=new THREE.Mesh(new THREE.PlaneGeometry(22,10),new THREE.MeshStandardMaterial({color:0x160b06,roughness:.9}));back.position.set(0,3,-5.4);scene.add(back);

  const base=new THREE.Mesh(new THREE.BoxGeometry(7,.42,5),new THREE.MeshStandardMaterial({color:0x18130f,roughness:.3,metalness:.32}));base.position.set(-.1,-.22,.1);base.castShadow=base.receiveShadow=true;scene.add(base);
  const frontTrim=new THREE.Mesh(new THREE.BoxGeometry(6.86,.09,.08),metal);frontTrim.position.set(-.1,-.34,2.61);scene.add(frontTrim);
  [[-2.7,-1.75],[2.5,-1.75],[-2.7,1.75],[2.5,1.75]].forEach(([x,z])=>{const foot=new THREE.Mesh(new THREE.CylinderGeometry(.17,.19,.18,24),black);foot.position.set(x,-.53,z);scene.add(foot)});
  const rim=new THREE.Mesh(new THREE.BoxGeometry(7.16,.12,5.16),new THREE.MeshStandardMaterial({color:0x38251b,roughness:.34,metalness:.24}));rim.position.set(-.1,-.46,.1);scene.add(rim);

  const platter=new THREE.Group();platter.position.set(-.82,.02,.05);scene.add(platter);
  const platterBase=new THREE.Mesh(new THREE.CylinderGeometry(2.28,2.28,.16,96),new THREE.MeshStandardMaterial({color:0x353535,roughness:.23,metalness:.8}));platterBase.castShadow=true;platter.add(platterBase);
  const record=new THREE.Mesh(new THREE.CylinderGeometry(2.12,2.12,.065,128),black);record.position.y=.115;record.castShadow=true;platter.add(record);
  for(let r=.78;r<2.04;r+=.07){const ring=new THREE.Mesh(new THREE.TorusGeometry(r,.006,5,120),new THREE.MeshStandardMaterial({color:0x2a2a2a,roughness:.33,metalness:.65}));ring.rotation.x=Math.PI/2;ring.position.y=.153;platter.add(ring)}
  const label=new THREE.Mesh(new THREE.CylinderGeometry(.68,.68,.075,64),cream);label.position.y=.16;platter.add(label);
  const spindle=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.28,24),metal);spindle.position.y=.28;platter.add(spindle);
  const labelRing=new THREE.Mesh(new THREE.TorusGeometry(.57,.012,8,64),new THREE.MeshStandardMaterial({color:0x806b51,roughness:.55}));labelRing.rotation.x=Math.PI/2;labelRing.position.y=.205;platter.add(labelRing);
  const platterRim=new THREE.Mesh(new THREE.TorusGeometry(2.23,.055,12,96),metal);platterRim.rotation.x=Math.PI/2;platterRim.position.y=.08;platter.add(platterRim);

  const armPivot=new THREE.Group();armPivot.position.set(2.55,.24,-1.48);scene.add(armPivot);
  const pivotBase=new THREE.Mesh(new THREE.CylinderGeometry(.43,.50,.30,48),new THREE.MeshStandardMaterial({color:0x111111,roughness:.25,metalness:.72}));pivotBase.castShadow=true;armPivot.add(pivotBase);
  const pivotCollar=new THREE.Mesh(new THREE.CylinderGeometry(.25,.29,.48,48),metal);pivotCollar.position.y=.28;armPivot.add(pivotCollar);
  const arm=new THREE.Group();armPivot.add(arm);
  const REST_ANGLE=0, DROP_ANGLE=-.69;
  arm.rotation.y=REST_ANGLE;

  /* Tonearm points toward the FRONT of the deck when parked, like the Rega reference. */
  const tube=new THREE.Mesh(new THREE.CylinderGeometry(.052,.052,3.25,24),metal);
  tube.rotation.x=Math.PI/2; tube.position.set(0,.34,1.52); tube.castShadow=true; arm.add(tube);
  const headshell=new THREE.Mesh(new THREE.BoxGeometry(.38,.12,.62),new THREE.MeshStandardMaterial({color:0x171717,roughness:.28,metalness:.55}));
  headshell.position.set(-.03,.29,3.12); headshell.rotation.y=.05; headshell.castShadow=true; arm.add(headshell);
  const cartridge=new THREE.Mesh(new THREE.BoxGeometry(.25,.18,.29),new THREE.MeshStandardMaterial({color:0xe8e2d7,roughness:.5,metalness:.12}));
  cartridge.position.set(-.03,.18,3.37); arm.add(cartridge);
  const stylus=new THREE.Mesh(new THREE.CylinderGeometry(.011,.011,.18,8),new THREE.MeshStandardMaterial({color:0xd9aa62,metalness:.75,roughness:.2}));
  stylus.position.set(-.03,.055,3.48); arm.add(stylus);
  const counterWeight=new THREE.Mesh(new THREE.CylinderGeometry(.23,.23,.62,32),new THREE.MeshStandardMaterial({color:0x191919,roughness:.3,metalness:.72}));
  counterWeight.rotation.x=Math.PI/2; counterWeight.position.set(0,.35,-.42); arm.add(counterWeight);
  const cueLever=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.55,12),metal);cueLever.rotation.z=Math.PI/2;cueLever.position.set(.48,.22,.02);armPivot.add(cueLever);
  const armHit=new THREE.Mesh(new THREE.BoxGeometry(.72,.5,3.9),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));
  armHit.position.set(0,.28,1.55);arm.add(armHit);
  const mug=new THREE.Group();mug.position.set(4.35,-.12,2.55);mug.rotation.y=-.18;scene.add(mug);
  const ceramic=new THREE.MeshStandardMaterial({color:0x17120f,roughness:.26,metalness:.08});
  const cup=new THREE.Mesh(new THREE.CylinderGeometry(.46,.37,.82,64,1,true),ceramic);cup.castShadow=true;mug.add(cup);
  const cupBottom=new THREE.Mesh(new THREE.CylinderGeometry(.37,.37,.055,64),ceramic);cupBottom.position.y=-.41;mug.add(cupBottom);
  const rimOuter=new THREE.Mesh(new THREE.TorusGeometry(.46,.035,16,64),ceramic);rimOuter.rotation.x=Math.PI/2;rimOuter.position.y=.41;mug.add(rimOuter);
  const inner=new THREE.Mesh(new THREE.CylinderGeometry(.405,.405,.035,64),new THREE.MeshStandardMaterial({color:0x070504,roughness:.5}));inner.position.y=.385;mug.add(inner);
  const latte=new THREE.Mesh(new THREE.CylinderGeometry(.37,.37,.018,64),new THREE.MeshStandardMaterial({color:0xb98558,roughness:.22,metalness:.01}));latte.position.y=.41;mug.add(latte);
  const foamDots=[];
  [[-.09,.05],[.08,.04],[-.02,-.09],[.12,-.08]].forEach(([x,z])=>{const f=new THREE.Mesh(new THREE.SphereGeometry(.022,12,12),new THREE.MeshStandardMaterial({color:0xe7cfb4,roughness:.9}));f.position.set(x,.432,z);foamDots.push(f);mug.add(f)});
  const iceMat=new THREE.MeshPhysicalMaterial({color:0xf6fbff,transparent:true,opacity:.62,roughness:.08,metalness:0,transmission:.28,thickness:.12,ior:1.31,clearcoat:.35,clearcoatRoughness:.08});
  const iceCubes=[];
  [[-.15,.07],[.13,.10],[.04,-.15]].forEach(([x,z],i)=>{const geo=new THREE.BoxGeometry(.19,.09,.19,2,1,2);const ice=new THREE.Mesh(geo,iceMat);ice.position.set(x,.465,z);ice.rotation.set(.08,i*.52+.15,.05);ice.userData.home=ice.position.clone();ice.userData.phase=i*2.1;iceCubes.push(ice);mug.add(ice)});
  const handle=new THREE.Mesh(new THREE.TorusGeometry(.31,.07,18,56,Math.PI*1.55),ceramic);handle.rotation.set(Math.PI/2,0,-Math.PI/2);handle.position.set(.46,.02,0);mug.add(handle);
  const saucer=new THREE.Mesh(new THREE.CylinderGeometry(.62,.67,.055,64),ceramic);saucer.position.y=-.48;saucer.scale.z=.72;mug.add(saucer);
  const lamp=new THREE.Group();lamp.position.set(5.15,-.35,-2.35);scene.add(lamp);
  const lampBase=new THREE.Mesh(new THREE.CylinderGeometry(.78,.9,.18,48),new THREE.MeshStandardMaterial({color:0x17120f,roughness:.3,metalness:.62}));lampBase.castShadow=true;lamp.add(lampBase);
  const lampBaseRing=new THREE.Mesh(new THREE.TorusGeometry(.78,.055,12,48),metal);lampBaseRing.rotation.x=Math.PI/2;lampBaseRing.position.y=.1;lamp.add(lampBaseRing);
  const lampStem=new THREE.Mesh(new THREE.CylinderGeometry(.075,.09,2.35,20),new THREE.MeshStandardMaterial({color:0x2a211b,metalness:.78,roughness:.25}));lampStem.position.set(0,1.18,0);lamp.add(lampStem);
  const neck=new THREE.Mesh(new THREE.TorusGeometry(.48,.075,16,48,Math.PI*.72),new THREE.MeshStandardMaterial({color:0x2a211b,metalness:.78,roughness:.25}));neck.position.set(0,2.25,0);neck.rotation.set(Math.PI/2,0,0);lamp.add(neck);
  const shade=new THREE.Mesh(new THREE.CylinderGeometry(.62,1.38,.92,64,1,true),new THREE.MeshStandardMaterial({color:0xa84b12,roughness:.42,metalness:.16,side:THREE.DoubleSide}));shade.position.set(0,2.68,0);shade.rotation.z=0;shade.castShadow=true;lamp.add(shade);
  const bulbMesh=new THREE.Mesh(new THREE.SphereGeometry(.2,24,24),new THREE.MeshStandardMaterial({color:0xffd6a0,emissive:0xff7a20,emissiveIntensity:5}));bulbMesh.position.set(0,2.20,0);lamp.add(bulbMesh);
  const bulb=new THREE.PointLight(0xff8c37,105,10,1.7);bulb.position.set(5.15,1.85,-2.35);bulb.castShadow=true;scene.add(bulb);

  scene.add(new THREE.HemisphereLight(0x9bb1d0,0x2a1208,1.15));
  const key=new THREE.DirectionalLight(0xffd7aa,2.3);key.position.set(-4,7,5);key.castShadow=true;scene.add(key);
  const fill=new THREE.PointLight(0x5478a8,9,8,2);fill.position.set(-2,2,-4);scene.add(fill);

  const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();
  let dragging=false,startX=0,baseAngle=arm.rotation.y,dropped=false,playing=false,autoDropping=false,autoT=0;
  const armMeshes=[armHit,tube,headshell,cartridge,pivotBase,pivotCollar];
  const mugHit=new THREE.Mesh(new THREE.CylinderGeometry(.68,.68,1.25,32),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));
  mugHit.position.copy(mug.position);scene.add(mugHit);
  let iceActive=false,iceTime=0;

  function setPointer(e){const r=canvas.getBoundingClientRect();mouse.x=((e.clientX-r.left)/r.width)*2-1;mouse.y=-((e.clientY-r.top)/r.height)*2+1;ray.setFromCamera(mouse,camera)}
  function normalized(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height}}
  function hitMug(e){setPointer(e);const p=normalized(e);return ray.intersectObject(mugHit,false).length>0 || (p.x>.73&&p.x<.88&&p.y>.60&&p.y<.86)}
  canvas.addEventListener('pointerdown',e=>{if(hitMug(e)){iceActive=true;iceTime=0;canvas.style.cursor='pointer'}});
  window.addEventListener('turntable:autoDrop',()=>{if(dropped||autoDropping)return;autoDropping=true;autoT=0;});
  window.addEventListener('turntable:ended',()=>{playing=false});

  const clock=new THREE.Clock();
  function smoothstep(t){return t*t*(3-2*t)}
  function animate(){requestAnimationFrame(animate);const dt=clock.getDelta();if(playing)platter.rotation.y-=dt*1.65;
    if(autoDropping){
      autoT+=dt/1.8;
      const t=Math.min(autoT,1),e=smoothstep(t);
      arm.rotation.y=THREE.MathUtils.lerp(REST_ANGLE,DROP_ANGLE,e);
      if(t>=1){autoDropping=false;dropped=true;playing=true;window.dispatchEvent(new CustomEvent('turntable:drop'))}
    }
    if(iceActive){iceTime+=dt;iceCubes.forEach((ice,i)=>{const a=iceTime*6.4+ice.userData.phase;ice.position.x=ice.userData.home.x+Math.sin(a)*.045;ice.position.z=ice.userData.home.z+Math.cos(a*1.08)*.045;ice.position.y=.465+Math.abs(Math.sin(a*.72))*.015;ice.rotation.y+=dt*(i%2?2.2:-2.4);ice.rotation.x=.08+Math.sin(a*.8)*.07});if(iceTime>1.1){iceActive=false;iceCubes.forEach(ice=>ice.position.copy(ice.userData.home))}}
    renderer.render(scene,camera)}animate();

  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight,false)});
}