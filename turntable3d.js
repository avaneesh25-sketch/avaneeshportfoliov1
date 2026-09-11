import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const canvas=document.getElementById('turntableCanvas');
window.__turntable3dLoaded=true;
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

  // Self-contained reflected-light environment. No remote module/assets can block rendering.
  const pmremGenerator=new THREE.PMREMGenerator(renderer);
  const envScene=new THREE.Scene();
  envScene.background=new THREE.Color(0x1b0f0a);
  const envRoom=new THREE.Mesh(
    new THREE.BoxGeometry(20,12,20),
    new THREE.MeshBasicMaterial({color:0x2a1710,side:THREE.BackSide})
  );
  envScene.add(envRoom);
  scene.environment=pmremGenerator.fromScene(envScene,.08).texture;
  pmremGenerator.dispose();

  const pm=new THREE.MeshStandardMaterial({color:0x15120f,roughness:.48,metalness:.32});
  const wood=new THREE.MeshStandardMaterial({color:0x32180c,roughness:.6,metalness:.03});
  const black=new THREE.MeshStandardMaterial({color:0x050505,roughness:.23,metalness:.46});
  const metal=new THREE.MeshStandardMaterial({color:0xa9a6a1,roughness:.2,metalness:.88});
  const cream=new THREE.MeshStandardMaterial({color:0xd8c6a6,roughness:.7,metalness:0});

  const woodCanvas=document.createElement('canvas');woodCanvas.width=1024;woodCanvas.height=512;
  const wctx=woodCanvas.getContext('2d');
  const grad=wctx.createLinearGradient(0,0,1024,0);grad.addColorStop(0,'#2b150b');grad.addColorStop(.35,'#4b2511');grad.addColorStop(.72,'#3b1c0e');grad.addColorStop(1,'#5b2d13');wctx.fillStyle=grad;wctx.fillRect(0,0,1024,512);
  for(let y=0;y<512;y+=7){const wobble=Math.sin(y*.09)*16;wctx.strokeStyle=`rgba(130,72,35,${.08+(y%21)/500})`;wctx.lineWidth=1;wctx.beginPath();wctx.moveTo(0,y);for(let x=0;x<=1024;x+=32)wctx.lineTo(x,y+Math.sin(x*.018+y*.05)*3+wobble*.08);wctx.stroke()}
  const woodTex=new THREE.CanvasTexture(woodCanvas);woodTex.wrapS=woodTex.wrapT=THREE.RepeatWrapping;woodTex.repeat.set(2.2,1.5);
  const tableMat=new THREE.MeshPhysicalMaterial({map:woodTex,color:0xffffff,roughness:.48,metalness:0,clearcoat:.16,clearcoatRoughness:.45,envMapIntensity:.35});
  const table=new THREE.Mesh(new THREE.BoxGeometry(18,.58,10.6),tableMat);table.position.y=-.69;table.receiveShadow=true;scene.add(table);
  const deskLip=new THREE.Mesh(new THREE.BoxGeometry(18,.16,10.72),new THREE.MeshStandardMaterial({color:0x241006,roughness:.68}));deskLip.position.y=-.96;scene.add(deskLip);
  const back=new THREE.Mesh(new THREE.PlaneGeometry(22,10),new THREE.MeshStandardMaterial({color:0x160b06,roughness:.9}));back.position.set(0,3,-5.4);scene.add(back);

  const baseMat=new THREE.MeshPhysicalMaterial({color:0x14110f,roughness:.28,metalness:.18,clearcoat:.32,clearcoatRoughness:.22,envMapIntensity:.5});
  const base=new THREE.Mesh(new THREE.BoxGeometry(7,.42,5),baseMat);base.position.set(-.1,-.22,.1);base.castShadow=base.receiveShadow=true;scene.add(base);
  const frontTrim=new THREE.Mesh(new THREE.BoxGeometry(6.86,.09,.08),metal);frontTrim.position.set(-.1,-.34,2.61);scene.add(frontTrim);
  [[-2.7,-1.75],[2.5,-1.75],[-2.7,1.75],[2.5,1.75]].forEach(([x,z])=>{const foot=new THREE.Mesh(new THREE.CylinderGeometry(.17,.19,.18,24),black);foot.position.set(x,-.53,z);scene.add(foot)});
  const rim=new THREE.Mesh(new THREE.BoxGeometry(7.16,.12,5.16),new THREE.MeshStandardMaterial({color:0x38251b,roughness:.34,metalness:.24}));rim.position.set(-.1,-.46,.1);scene.add(rim);

  const platter=new THREE.Group();platter.position.set(-.82,.02,.05);scene.add(platter);
  const platterBase=new THREE.Mesh(new THREE.CylinderGeometry(2.28,2.28,.16,96),new THREE.MeshStandardMaterial({color:0x353535,roughness:.23,metalness:.8}));platterBase.castShadow=true;platter.add(platterBase);
  // Vinyl surface: physical semi-gloss with procedural concentric-groove normal map.
  const grooveCanvas=document.createElement('canvas');grooveCanvas.width=1024;grooveCanvas.height=1024;
  const gctx=grooveCanvas.getContext('2d');gctx.fillStyle='rgb(128,128,255)';gctx.fillRect(0,0,1024,1024);
  gctx.translate(512,512);
  for(let r=145;r<486;r+=3.4){
    const shade=(r%7<3.5)?136:120;
    gctx.strokeStyle=`rgb(${shade},128,255)`;gctx.lineWidth=1.25;gctx.beginPath();gctx.arc(0,0,r,0,Math.PI*2);gctx.stroke();
  }
  const grooveNormal=new THREE.CanvasTexture(grooveCanvas);grooveNormal.wrapS=grooveNormal.wrapT=THREE.RepeatWrapping;
  const vinylMat=new THREE.MeshPhysicalMaterial({
    color:0x090909,roughness:.39,metalness:.03,clearcoat:.42,clearcoatRoughness:.22,
    normalMap:grooveNormal,normalScale:new THREE.Vector2(.72,.72),envMapIntensity:.58
  });
  const record=new THREE.Mesh(new THREE.CylinderGeometry(2.12,2.12,.065,192),vinylMat);record.position.y=.115;record.castShadow=true;platter.add(record);
  const labelCanvas=document.createElement('canvas');labelCanvas.width=1024;labelCanvas.height=1024;
  const labelCtx=labelCanvas.getContext('2d');
  const labelTexture=new THREE.CanvasTexture(labelCanvas);labelTexture.colorSpace=THREE.SRGBColorSpace;labelTexture.anisotropy=8;
  const labelMat=new THREE.MeshStandardMaterial({map:labelTexture,color:0xffffff,roughness:.72,metalness:0});
  const label=new THREE.Mesh(new THREE.CylinderGeometry(.68,.68,.075,96),labelMat);label.position.y=.16;platter.add(label);

  let labelTitle='Vienna',labelArtist='BILLY JOEL',morphFrom='Vienna',morphTo='Vienna',morphArtist='BILLY JOEL',morphT=1;
  const runeGlyphs=['ᚠ','ᚢ','ᚦ','ᚱ','ᚲ','ᚷ','ᚹ','ᛃ','ᛇ','ᛈ','ᛉ','ᛏ','ᛒ','ᛗ','ᛚ','ᛞ','ᛟ'];
  function drawRecordLabel(title=labelTitle,artist=labelArtist,dust=0){
    const ctx=labelCtx,w=labelCanvas.width,h=labelCanvas.height;
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle='#d8c6a6';ctx.fillRect(0,0,w,h);
    ctx.globalAlpha=.18;ctx.fillStyle='#6c5a42';
    for(let i=0;i<180;i++){const x=(i*83)%w,y=(i*151)%h,r=1+((i*17)%4);ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}
    ctx.globalAlpha=1;
    ctx.strokeStyle='rgba(92,72,50,.45)';ctx.lineWidth=4;ctx.beginPath();ctx.arc(w/2,h/2,365,0,Math.PI*2);ctx.stroke();
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle='#17120e';ctx.font='italic 96px Georgia, serif';ctx.fillText(title,w/2,h/2-34);
    ctx.font='500 34px monospace';ctx.letterSpacing='8px';ctx.fillText(artist,w/2,h/2+92);
    if(dust>0){ctx.globalAlpha=dust*.45;ctx.fillStyle='#8b6a48';for(let i=0;i<110;i++){const x=(Math.sin(i*91.7+dust*17)*.5+.5)*w,y=(Math.sin(i*57.1+dust*9)*.5+.5)*h;ctx.fillRect(x,y,2+(i%5),2+(i%4))}ctx.globalAlpha=1}
    labelTexture.needsUpdate=true;
  }
  function runeVersion(text,amount){
    return [...String(text)].map((ch,i)=>ch===' ' ? ' ' : (Math.random()<amount ? runeGlyphs[(i+Math.floor(performance.now()/120))%runeGlyphs.length] : ch)).join('');
  }
  function morphLabel(title,artist){
    morphFrom=labelTitle;morphTo=title;labelArtist=artist;morphArtist=artist;morphT=0;
  }
  drawRecordLabel('Vienna','BILLY JOEL',0);
  window.addEventListener('turntable:label',e=>{const d=e.detail||{};morphLabel(d.title||d.artist||'VINYL',d.artist||'')});
  const spindle=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.28,24),metal);spindle.position.y=.28;platter.add(spindle);
  const labelRing=new THREE.Mesh(new THREE.TorusGeometry(.57,.012,8,64),new THREE.MeshStandardMaterial({color:0x806b51,roughness:.55}));labelRing.rotation.x=Math.PI/2;labelRing.position.y=.205;platter.add(labelRing);
  const platterRim=new THREE.Mesh(new THREE.TorusGeometry(2.23,.055,12,96),metal);platterRim.rotation.x=Math.PI/2;platterRim.position.y=.08;platter.add(platterRim);
  // No fake groove geometry: the physical normal map catches the real scene/lamp lighting.

  // Physical start button on the deck.
  const deckButtonGroup=new THREE.Group();
  deckButtonGroup.position.set(2.55,.02,1.72);
  scene.add(deckButtonGroup);

  const buttonWell=new THREE.Mesh(
    new THREE.CylinderGeometry(.25,.27,.055,48),
    new THREE.MeshStandardMaterial({color:0x090909,roughness:.2,metalness:.55})
  );
  buttonWell.position.y=.02;
  deckButtonGroup.add(buttonWell);

  const deckButton=new THREE.Mesh(
    new THREE.CylinderGeometry(.19,.19,.085,48),
    new THREE.MeshStandardMaterial({color:0x171717,roughness:.28,metalness:.5})
  );
  deckButton.position.y=.085;
  deckButton.castShadow=true;
  deckButtonGroup.add(deckButton);

  const buttonRing=new THREE.Mesh(
    new THREE.TorusGeometry(.19,.018,12,48),
    new THREE.MeshStandardMaterial({color:0x3d3d3d,roughness:.25,metalness:.78})
  );
  buttonRing.rotation.x=Math.PI/2;
  buttonRing.position.y=.13;
  deckButtonGroup.add(buttonRing);

  const statusLed=new THREE.Mesh(
    new THREE.SphereGeometry(.038,16,16),
    new THREE.MeshStandardMaterial({color:0x2b2b2b,emissive:0x000000,emissiveIntensity:0})
  );
  statusLed.position.set(-.34,.09,-.02);
  deckButtonGroup.add(statusLed);

  const tick33=new THREE.Mesh(
    new THREE.BoxGeometry(.16,.012,.025),
    new THREE.MeshStandardMaterial({color:0xd8d0c5,roughness:.5})
  );
  tick33.position.set(.40,.08,.11);
  deckButtonGroup.add(tick33);

  const tick45=new THREE.Mesh(
    new THREE.BoxGeometry(.16,.012,.025),
    new THREE.MeshStandardMaterial({color:0x8e857a,roughness:.5})
  );
  tick45.position.set(.40,.08,-.10);
  deckButtonGroup.add(tick45);

  const armPivot=new THREE.Group();armPivot.position.set(2.55,.24,-1.48);scene.add(armPivot);
  const pivotBase=new THREE.Mesh(new THREE.CylinderGeometry(.43,.50,.30,48),new THREE.MeshStandardMaterial({color:0x111111,roughness:.25,metalness:.72}));pivotBase.castShadow=true;armPivot.add(pivotBase);
  const pivotCollar=new THREE.Mesh(new THREE.CylinderGeometry(.25,.29,.48,48),metal);pivotCollar.position.y=.28;armPivot.add(pivotCollar);
  const arm=new THREE.Group();armPivot.add(arm);
  const REST_ANGLE=0, DROP_ANGLE=-.69, INNER_ANGLE=-.96;
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
  const mug=new THREE.Group();mug.position.set(4.35,-.16,2.55);mug.rotation.y=-.22;scene.add(mug);

  // Cafe-style black ceramic latte cup — visual geometry only; existing collider is untouched below.
  const ceramicMat=new THREE.MeshPhysicalMaterial({
    color:0x050505,roughness:.2,metalness:.03,clearcoat:.72,clearcoatRoughness:.14,envMapIntensity:.48
  });
  const innerCeramicMat=new THREE.MeshStandardMaterial({color:0x0b0908,roughness:.38});
  const cupBody=new THREE.Mesh(new THREE.CylinderGeometry(.50,.39,.58,96,1,true),ceramicMat);
  cupBody.position.y=-.05;cupBody.castShadow=true;mug.add(cupBody);
  const cupBase=new THREE.Mesh(new THREE.CylinderGeometry(.39,.39,.075,96),ceramicMat);
  cupBase.position.y=-.375;cupBase.castShadow=true;mug.add(cupBase);
  const cupRim=new THREE.Mesh(new THREE.TorusGeometry(.50,.045,20,96),ceramicMat);
  cupRim.rotation.x=Math.PI/2;cupRim.position.y=.245;mug.add(cupRim);
  const cupInner=new THREE.Mesh(new THREE.CylinderGeometry(.445,.445,.045,96),innerCeramicMat);
  cupInner.position.y=.218;mug.add(cupInner);

  // Big rounded cafe handle.
  const handleCurve=new THREE.CatmullRomCurve3([
    new THREE.Vector3(.44,.10,.0),
    new THREE.Vector3(.70,.16,.0),
    new THREE.Vector3(.78,-.04,.0),
    new THREE.Vector3(.67,-.25,.0),
    new THREE.Vector3(.42,-.20,.0)
  ]);
  const handle=new THREE.Mesh(new THREE.TubeGeometry(handleCurve,48,.072,18,false),ceramicMat);
  handle.rotation.y=-.04;handle.castShadow=true;mug.add(handle);

  // Latte surface.
  const latteMat=new THREE.MeshPhysicalMaterial({color:0xb86b35,roughness:.38,metalness:0,clearcoat:.12,clearcoatRoughness:.38});
  const latte=new THREE.Mesh(new THREE.CylinderGeometry(.425,.425,.026,96),latteMat);
  latte.position.y=.245;mug.add(latte);

  // Latte art drawn procedurally onto a thin top texture.
  const artCanvas=document.createElement('canvas');artCanvas.width=512;artCanvas.height=512;
  const actx=artCanvas.getContext('2d');
  actx.clearRect(0,0,512,512);
  actx.translate(256,256);
  actx.strokeStyle='rgba(247,232,205,.97)';
  actx.lineCap='round';
  actx.lineJoin='round';
  // rosetta/leaf stack
  for(let i=0;i<7;i++){
    const y=82-i*21, w=112-i*11;
    actx.lineWidth=14-i*.8;
    actx.beginPath();
    actx.moveTo(-w*.5,y);
    actx.bezierCurveTo(-w*.2,y-14,w*.2,y-14,w*.5,y);
    actx.bezierCurveTo(w*.18,y+15,-w*.18,y+15,-w*.5,y);
    actx.stroke();
  }
  // stem
  actx.lineWidth=12;
  actx.beginPath();actx.moveTo(0,98);actx.quadraticCurveTo(8,20,0,-106);actx.stroke();
  // heart crown
  actx.beginPath();
  actx.moveTo(0,-74);
  actx.bezierCurveTo(-38,-118,-95,-82,0,-14);
  actx.bezierCurveTo(95,-82,38,-118,0,-74);
  actx.stroke();

  const artTex=new THREE.CanvasTexture(artCanvas);artTex.colorSpace=THREE.SRGBColorSpace;
  const artMat=new THREE.MeshBasicMaterial({map:artTex,transparent:true,depthWrite:false,side:THREE.DoubleSide});
  const artDisc=new THREE.Mesh(new THREE.CircleGeometry(.36,96),artMat);
  artDisc.rotation.x=-Math.PI/2;artDisc.position.y=.265;artDisc.renderOrder=4;mug.add(artDisc);

  // Small saucer underneath for cafe feel.
  const saucer=new THREE.Mesh(new THREE.CylinderGeometry(.68,.72,.065,96),new THREE.MeshPhysicalMaterial({
    color:0x0b0b0b,roughness:.24,metalness:.02,clearcoat:.58,clearcoatRoughness:.18,envMapIntensity:.42
  }));
  saucer.position.y=-.455;saucer.scale.z=.82;saucer.castShadow=true;mug.add(saucer);

  // Keep ice arrays defined so the existing click-animation code remains safe without changing collider/physics logic.
  const iceCubes=[];

  const lamp=new THREE.Group();lamp.position.set(4.55,-.35,-1.35);scene.add(lamp);
  const lampBase=new THREE.Mesh(new THREE.CylinderGeometry(.78,.9,.18,48),new THREE.MeshStandardMaterial({color:0x17120f,roughness:.3,metalness:.62}));lampBase.castShadow=true;lamp.add(lampBase);
  const lampBaseRing=new THREE.Mesh(new THREE.TorusGeometry(.78,.055,12,48),metal);lampBaseRing.rotation.x=Math.PI/2;lampBaseRing.position.y=.1;lamp.add(lampBaseRing);
  const lampStem=new THREE.Mesh(new THREE.CylinderGeometry(.075,.09,2.35,20),new THREE.MeshStandardMaterial({color:0x2a211b,metalness:.78,roughness:.25}));lampStem.position.set(0,1.18,0);lamp.add(lampStem);
  const neck=new THREE.Mesh(new THREE.TorusGeometry(.48,.075,16,48,Math.PI*.72),new THREE.MeshStandardMaterial({color:0x2a211b,metalness:.78,roughness:.25}));neck.position.set(0,2.25,0);neck.rotation.set(Math.PI/2,0,0);lamp.add(neck);
  const shade=new THREE.Mesh(new THREE.CylinderGeometry(.62,1.38,.92,64,1,true),new THREE.MeshStandardMaterial({color:0xa84b12,roughness:.42,metalness:.16,side:THREE.DoubleSide}));shade.position.set(0,2.68,0);shade.rotation.z=0;shade.castShadow=true;lamp.add(shade);
  const bulbMesh=new THREE.Mesh(new THREE.SphereGeometry(.2,24,24),new THREE.MeshStandardMaterial({color:0xffd6a0,emissive:0xff7a20,emissiveIntensity:5}));bulbMesh.position.set(0,2.20,0);lamp.add(bulbMesh);
  const bulb=new THREE.PointLight(0xff8c37,105,10,1.7);bulb.position.set(4.55,1.85,-1.35);bulb.castShadow=true;scene.add(bulb);

  const lampPullString=new THREE.Group();lampPullString.position.set(4.95,2.12,-.45);scene.add(lampPullString);
  const chainMat=new THREE.MeshStandardMaterial({color:0xd4b486,roughness:.34,metalness:.08,emissive:0x2a170d,emissiveIntensity:.22});
  const pullLine=new THREE.Mesh(new THREE.CylinderGeometry(.022,.022,1.42,14),chainMat);
  pullLine.position.y=-.70;pullLine.castShadow=true;lampPullString.add(pullLine);
  for(let i=0;i<12;i++){const bead=new THREE.Mesh(new THREE.SphereGeometry(.034,14,14),chainMat);bead.position.y=-.08-i*.115;lampPullString.add(bead)}
  const pullBead=new THREE.Mesh(new THREE.SphereGeometry(.12,28,28),new THREE.MeshStandardMaterial({color:0x8a613e,roughness:.32,metalness:.05}));
  pullBead.scale.set(.82,1.28,.82);pullBead.position.y=-1.47;pullBead.castShadow=true;lampPullString.add(pullBead);
  const pullHit=new THREE.Mesh(new THREE.CylinderGeometry(.30,.30,1.95,16),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));
  pullHit.position.set(4.95,1.12,-.45);scene.add(pullHit);
  let lampOn=true,pullAngle=0,pullVel=0,pullTarget=0,pullImpulse=0;

  scene.add(new THREE.HemisphereLight(0x8f785f,0x241209,.72));
  const key=new THREE.DirectionalLight(0xffc58a,1.25);key.position.set(-4,6,5);key.castShadow=true;scene.add(key);
  const fill=new THREE.PointLight(0x6d4a35,4.5,8,2);fill.position.set(-2,2,-4);scene.add(fill);

  renderer.render(scene,camera); // first paint
  const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();
  let dragging=false,startX=0,baseAngle=arm.rotation.y,dropped=false,playing=false,autoDropping=false,autoLifting=false,autoT=0,playProgress=0;
  const armMeshes=[armHit,tube,headshell,cartridge,pivotBase,pivotCollar];
  const mugHit=new THREE.Mesh(new THREE.CylinderGeometry(.68,.68,1.25,32),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));
  mugHit.position.copy(mug.position);scene.add(mugHit);
  const buttonHit=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.28,32),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));
  buttonHit.position.copy(deckButtonGroup.position);buttonHit.position.y=.10;scene.add(buttonHit);
  let iceActive=false,iceTime=0,buttonPressT=0;

  function setPointer(e){const r=canvas.getBoundingClientRect();mouse.x=((e.clientX-r.left)/r.width)*2-1;mouse.y=-((e.clientY-r.top)/r.height)*2+1;ray.setFromCamera(mouse,camera)}
  function normalized(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height}}
  function hitMug(e){setPointer(e);const p=normalized(e);return ray.intersectObject(mugHit,false).length>0 || (p.x>.73&&p.x<.88&&p.y>.60&&p.y<.86)}
  function hitDeckButton(e){setPointer(e);return ray.intersectObject(buttonHit,false).length>0}
  function hitPullString(e){setPointer(e);return ray.intersectObject(pullHit,false).length>0}
  canvas.addEventListener('pointerdown',e=>{
    if(hitPullString(e)){
      // Give the chain a downward tug and let it swing/settle naturally.
      pullVel += 3.6;
      pullImpulse = 1;
      lampOn=!lampOn;
      bulb.visible=lampOn;bulbMesh.visible=lampOn;
      window.dispatchEvent(new CustomEvent('lamp:toggle',{detail:{on:lampOn}}));
      window.dispatchEvent(new CustomEvent('lamp:click'));
      return;
    }
    if(hitDeckButton(e)){
      buttonPressT=.18;
      if(dropped && !autoLifting){
        autoLifting=true;autoDropping=false;autoT=0;
        playing=false;
        statusLed.material.color.setHex(0x2b2b2b);
        statusLed.material.emissive.setHex(0x000000);
        statusLed.material.emissiveIntensity=0;
        // Music stops immediately as the stylus begins lifting off the record.
        window.dispatchEvent(new CustomEvent('turntable:lift'));
      } else if(!dropped && !autoDropping && !autoLifting){
        statusLed.material.color.setHex(0xff8a3b);
        statusLed.material.emissive.setHex(0xff5b16);
        statusLed.material.emissiveIntensity=3;
        window.dispatchEvent(new CustomEvent('turntable:autoDrop'));
      }
      return;
    }
    if(hitMug(e)){iceActive=true;iceTime=0;canvas.style.cursor='pointer'}
  });
  canvas.addEventListener('pointermove',e=>{if(hitDeckButton(e)||hitPullString(e)){canvas.style.cursor='pointer'}else if(!iceActive){canvas.style.cursor='default'}});
  window.addEventListener('turntable:autoDrop',()=>{if(dropped||autoDropping||autoLifting)return;playProgress=0;autoDropping=true;autoT=0;});
  window.addEventListener('turntable:progress',e=>{playProgress=THREE.MathUtils.clamp(Number(e.detail?.progress)||0,0,1)});
  window.addEventListener('turntable:ended',()=>{playing=false;statusLed.material.color.setHex(0x2b2b2b);statusLed.material.emissive.setHex(0x000000);statusLed.material.emissiveIntensity=0;});

  const clock=new THREE.Clock();
  function smoothstep(t){return t*t*(3-2*t)}
  function animate(){requestAnimationFrame(animate);const dt=clock.getDelta();if(playing){platter.rotation.y-=dt*1.65}
    {
      // Damped pendulum-ish motion for the pull cord.
      const stiffness=13.0,damping=4.8;
      const acc=(-stiffness*pullAngle)-(damping*pullVel);
      pullVel+=acc*dt;
      pullAngle+=pullVel*dt;
      pullAngle=THREE.MathUtils.clamp(pullAngle,-0.5,0.5);
      lampPullString.rotation.z=pullAngle*0.5;
      lampPullString.position.x=Math.sin(pullAngle)*0.12;
      lampPullString.position.y=-Math.abs(pullAngle)*0.10;
      if(Math.abs(pullAngle)<.002&&Math.abs(pullVel)<.01){pullAngle=0;pullVel=0}
    }
    if(morphT<1){
      morphT=Math.min(1,morphT+dt/1.55);
      const mid=1-Math.abs(morphT-.5)*2;
      const shown=morphT<.5?runeVersion(morphFrom,mid):runeVersion(morphTo,mid);
      drawRecordLabel(shown,morphArtist,mid);
      if(morphT>=1){labelTitle=morphTo;labelArtist=morphArtist;drawRecordLabel(labelTitle,labelArtist,0)}
    }
    if(buttonPressT>0){buttonPressT-=dt;deckButton.position.y=.055}else{deckButton.position.y=.085}
    if(autoLifting){
      autoT+=dt/1.35;
      const t=Math.min(autoT,1),e=smoothstep(t);
      arm.rotation.y=THREE.MathUtils.lerp(DROP_ANGLE,REST_ANGLE,e);
      if(t>=1){autoLifting=false;dropped=false;arm.rotation.y=REST_ANGLE}
    }
    if(autoDropping){
      autoT+=dt/1.8;
      const t=Math.min(autoT,1),e=smoothstep(t);
      arm.rotation.y=THREE.MathUtils.lerp(REST_ANGLE,DROP_ANGLE,e);
      if(t>=1){autoDropping=false;dropped=true;playing=true;statusLed.material.color.setHex(0xff8a3b);statusLed.material.emissive.setHex(0xff5b16);statusLed.material.emissiveIntensity=2.5;window.dispatchEvent(new CustomEvent('turntable:drop'))}
    }
    if(dropped&&!autoDropping&&!autoLifting){arm.rotation.y=THREE.MathUtils.lerp(arm.rotation.y,THREE.MathUtils.lerp(DROP_ANGLE,INNER_ANGLE,playProgress),Math.min(1,dt*1.8))}
    if(iceActive){iceTime+=dt;iceCubes.forEach((ice,i)=>{const a=iceTime*6.4+ice.userData.phase;ice.position.x=ice.userData.home.x+Math.sin(a)*.045;ice.position.z=ice.userData.home.z+Math.cos(a*1.08)*.045;ice.position.y=.465+Math.abs(Math.sin(a*.72))*.015;ice.rotation.y+=dt*(i%2?2.2:-2.4);ice.rotation.x=.08+Math.sin(a*.8)*.07});if(iceTime>1.1){iceActive=false;iceCubes.forEach(ice=>ice.position.copy(ice.userData.home))}}
    renderer.render(scene,camera)}animate();

  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight,false)});
}