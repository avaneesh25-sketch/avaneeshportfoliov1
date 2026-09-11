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

  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
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
  const woodTex=new THREE.CanvasTexture(woodCanvas);
  // Use one continuous texture across the tabletop. Repeating the gradient created
  // the visible center seam where the right edge wrapped back to the left edge.
  woodTex.wrapS=THREE.ClampToEdgeWrapping;
  woodTex.wrapT=THREE.ClampToEdgeWrapping;
  woodTex.repeat.set(1,1);
  woodTex.generateMipmaps=true;
  woodTex.minFilter=THREE.LinearMipmapLinearFilter;
  woodTex.magFilter=THREE.LinearFilter;
  woodTex.anisotropy=renderer.capabilities.getMaxAnisotropy();
  woodTex.needsUpdate=true;
  const tableMat=new THREE.MeshPhysicalMaterial({map:woodTex,color:0xffffff,roughness:.48,metalness:0,clearcoat:.16,clearcoatRoughness:.45,envMapIntensity:.35});
  const tableGeo=new THREE.BoxGeometry(18,.58,10.6,32,2,32);
  tableGeo.computeVertexNormals();
  const table=new THREE.Mesh(tableGeo,tableMat);table.position.y=-.69;table.receiveShadow=true;scene.add(table);
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
  grooveNormal.generateMipmaps=true;
  grooveNormal.minFilter=THREE.LinearMipmapLinearFilter;
  grooveNormal.magFilter=THREE.LinearFilter;
  grooveNormal.anisotropy=renderer.capabilities.getMaxAnisotropy();
  grooveNormal.needsUpdate=true;
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

  const ceramicMat=new THREE.MeshPhysicalMaterial({
    color:0x11100f,
    roughness:.18,
    metalness:.01,
    clearcoat:1.0,
    clearcoatRoughness:.07,
    envMapIntensity:.9,
    side:THREE.DoubleSide
  });

  // Lathed cafe-cup profile gives the body actual visual volume instead of a thin dark ring.
  const cupProfile=[
    new THREE.Vector2(.34,-.35),
    new THREE.Vector2(.39,-.31),
    new THREE.Vector2(.44,-.18),
    new THREE.Vector2(.49,.03),
    new THREE.Vector2(.51,.22),
    new THREE.Vector2(.505,.25)
  ];
  const cupBody=new THREE.Mesh(new THREE.LatheGeometry(cupProfile,128),ceramicMat);
  cupBody.castShadow=true;
  mug.add(cupBody);

  const cupBase=new THREE.Mesh(new THREE.CylinderGeometry(.34,.36,.07,128),ceramicMat);
  cupBase.position.y=-.375;cupBase.castShadow=true;mug.add(cupBase);

  const cupRim=new THREE.Mesh(new THREE.TorusGeometry(.505,.038,24,128),ceramicMat);
  cupRim.rotation.x=Math.PI/2;cupRim.position.y=.247;mug.add(cupRim);

  // Rounded D-loop handle.
  const handleCurve=new THREE.CatmullRomCurve3([
    new THREE.Vector3(.48,.15,0),
    new THREE.Vector3(.72,.17,0),
    new THREE.Vector3(.82,.02,0),
    new THREE.Vector3(.77,-.18,0),
    new THREE.Vector3(.48,-.20,0)
  ]);
  const handle=new THREE.Mesh(new THREE.TubeGeometry(handleCurve,64,.055,20,false),ceramicMat);
  handle.castShadow=true;mug.add(handle);

  // Procedural crema + rosetta.
  const latteCanvas=document.createElement('canvas');latteCanvas.width=latteCanvas.height=512;
  const lctx=latteCanvas.getContext('2d');
  const crema=lctx.createRadialGradient(230,210,20,256,256,250);
  crema.addColorStop(0,'#c9803e');crema.addColorStop(.55,'#b56b31');crema.addColorStop(1,'#965021');
  lctx.fillStyle=crema;lctx.beginPath();lctx.arc(256,256,252,0,Math.PI*2);lctx.fill();

  lctx.strokeStyle='rgba(248,235,214,.97)';lctx.lineCap='round';lctx.lineJoin='round';
  const cx=256,cy=310;
  for(let i=0;i<8;i++){
    const y=cy-i*21,w=122-i*11;
    lctx.lineWidth=14-i*.6;
    lctx.beginPath();
    lctx.moveTo(cx-w*.48,y);
    lctx.bezierCurveTo(cx-w*.22,y-14,cx+w*.22,y-14,cx+w*.48,y);
    lctx.bezierCurveTo(cx+w*.18,y+13,cx-w*.18,y+13,cx-w*.48,y);
    lctx.stroke();
  }
  lctx.lineWidth=8;lctx.beginPath();lctx.moveTo(cx,334);lctx.quadraticCurveTo(cx+4,244,cx,142);lctx.stroke();
  lctx.lineWidth=10;lctx.beginPath();lctx.moveTo(cx,170);
  lctx.bezierCurveTo(cx-33,134,cx-78,165,cx,218);
  lctx.bezierCurveTo(cx+78,165,cx+33,134,cx,170);lctx.stroke();


  const latteSnapshot=document.createElement('canvas');
  latteSnapshot.width=latteCanvas.width;latteSnapshot.height=latteCanvas.height;
  latteSnapshot.getContext('2d').drawImage(latteCanvas,0,0);

  const latteTex=new THREE.CanvasTexture(latteCanvas);
  latteTex.colorSpace=THREE.SRGBColorSpace;

  const rippleGroup=new THREE.Group();
  rippleGroup.position.y=.249;
  mug.add(rippleGroup);
  const rippleRings=[];
  [0,.13,.26].forEach((delay,i)=>{
    const mat=new THREE.MeshBasicMaterial({color:0xf4dfc0,transparent:true,opacity:0,depthWrite:false});
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.08,.007,10,72),mat);
    ring.rotation.x=Math.PI/2;
    ring.userData.delay=delay;
    ring.visible=false;
    rippleRings.push(ring);
    rippleGroup.add(ring);
  });

  function redrawLatteBase(){
    const g=lctx.createRadialGradient(230,210,20,256,256,250);
    g.addColorStop(0,'#c9803e');g.addColorStop(.55,'#b56b31');g.addColorStop(1,'#965021');
    lctx.clearRect(0,0,512,512);
    lctx.fillStyle=g;lctx.beginPath();lctx.arc(256,256,252,0,Math.PI*2);lctx.fill();
  }

  function disperseLatteArt(p){
    redrawLatteBase();
    if(p<1){
      // Ghost the original art outward while fading it, like milk dispersing into crema.
      const scales=[1+p*.08,1+p*.16,1+p*.24];
      scales.forEach((s,i)=>{
        lctx.save();
        lctx.globalAlpha=(1-p)*(.52-i*.11);
        lctx.translate(256,256);
        lctx.rotate((i-1)*p*.035);
        lctx.scale(s,s);
        lctx.translate(-256,-256);
        lctx.drawImage(latteSnapshot,0,0);
        lctx.restore();
      });
    }
    latteTex.needsUpdate=true;
  }

  latteTex.generateMipmaps=true;
  latteTex.minFilter=THREE.LinearMipmapLinearFilter;
  latteTex.magFilter=THREE.LinearFilter;
  latteTex.anisotropy=renderer.capabilities.getMaxAnisotropy();

  // Visible coffee surface: a top-facing textured disc with a tiny convex center.
  // The previous spherical cap was flipped below the rim from this camera angle.
  const latteMat=new THREE.MeshPhysicalMaterial({
    map:latteTex,
    color:0xffffff,
    roughness:.34,
    metalness:0,
    clearcoat:.16,
    clearcoatRoughness:.32,
    envMapIntensity:.42,
    side:THREE.DoubleSide
  });
  const latteSurface=new THREE.Mesh(new THREE.CircleGeometry(.445,128),latteMat);
  latteSurface.rotation.x=-Math.PI/2;
  latteSurface.position.y=.236;
  latteSurface.renderOrder=4;
  mug.add(latteSurface);

  // Thin crema meniscus gives the coffee a slight dome without hiding the texture.
  const cremaMeniscus=new THREE.Mesh(
    new THREE.TorusGeometry(.438,.012,16,128),
    new THREE.MeshPhysicalMaterial({color:0xc98649,roughness:.32,clearcoat:.12,clearcoatRoughness:.3})
  );
  cremaMeniscus.rotation.x=Math.PI/2;
  cremaMeniscus.position.y=.239;
  mug.add(cremaMeniscus);

  const innerRing=new THREE.Mesh(new THREE.TorusGeometry(.45,.018,16,96),new THREE.MeshStandardMaterial({color:0x24160f,roughness:.48}));
  innerRing.rotation.x=Math.PI/2;innerRing.position.y=.225;mug.add(innerRing);

  const saucer=new THREE.Mesh(new THREE.CylinderGeometry(.67,.72,.06,128),ceramicMat);
  saucer.position.y=-.455;saucer.scale.z=.82;saucer.castShadow=true;mug.add(saucer);

  // Small warm fill so the black ceramic keeps a readable highlight.
  const mugFill=new THREE.PointLight(0xffb16a,3.2,2.8,2);
  mugFill.position.set(4.9,.8,3.0);scene.add(mugFill);

  // Keep existing mug interaction safe.
  const iceCubes=[];

  const lamp=new THREE.Group();lamp.position.set(4.55,-.35,-1.35);scene.add(lamp);
  const lampBase=new THREE.Mesh(new THREE.CylinderGeometry(.78,.9,.18,48),new THREE.MeshStandardMaterial({color:0x17120f,roughness:.3,metalness:.62}));lampBase.castShadow=true;lamp.add(lampBase);
  const lampBaseRing=new THREE.Mesh(new THREE.TorusGeometry(.78,.055,12,48),metal);lampBaseRing.rotation.x=Math.PI/2;lampBaseRing.position.y=.1;lamp.add(lampBaseRing);
  const lampStem=new THREE.Mesh(new THREE.CylinderGeometry(.075,.09,2.35,20),new THREE.MeshStandardMaterial({color:0x2a211b,metalness:.78,roughness:.25}));lampStem.position.set(0,1.18,0);lamp.add(lampStem);
  const neck=new THREE.Mesh(new THREE.TorusGeometry(.48,.075,16,48,Math.PI*.72),new THREE.MeshStandardMaterial({color:0x2a211b,metalness:.78,roughness:.25}));neck.position.set(0,2.25,0);neck.rotation.set(Math.PI/2,0,0);lamp.add(neck);
  const shade=new THREE.Mesh(new THREE.CylinderGeometry(.62,1.38,.92,64,1,true),new THREE.MeshStandardMaterial({color:0xa84b12,roughness:.42,metalness:.16,side:THREE.DoubleSide}));shade.position.set(0,2.68,0);shade.rotation.z=0;shade.castShadow=true;lamp.add(shade);
  const bulbMesh=new THREE.Mesh(new THREE.SphereGeometry(.2,24,24),new THREE.MeshStandardMaterial({color:0xffd6a0,emissive:0xff7a20,emissiveIntensity:5}));bulbMesh.position.set(0,2.20,0);lamp.add(bulbMesh);
  const bulb=new THREE.PointLight(0xff8c37,105,10,1.7);bulb.position.set(4.55,1.85,-1.35);bulb.castShadow=true;
  bulb.shadow.mapSize.set(1024,1024);bulb.shadow.bias=-0.00035;bulb.shadow.normalBias=.015;bulb.shadow.radius=4;
  scene.add(bulb);

  // Pull cord is a CHILD of the lamp so it cannot drift away from the shade.
  // Local coordinates are anchored just under the socket housing.
  const lampPullString=new THREE.Group();
  lampPullString.position.set(.42,2.34,.34);
  lamp.add(lampPullString);

  const cordStart=new THREE.Vector3(0,0,0);
  const cordMid=new THREE.Vector3(.025,-.66,.02);
  const cordEnd=new THREE.Vector3(.06,-1.34,.05);
  const cordCurve=new THREE.CatmullRomCurve3([cordStart,cordMid,cordEnd]);
  const chainMat=new THREE.MeshStandardMaterial({
    color:0x2b241f,roughness:.58,metalness:.08
  });
  const pullLine=new THREE.Mesh(new THREE.TubeGeometry(cordCurve,28,.018,8,false),chainMat);
  pullLine.castShadow=true;
  lampPullString.add(pullLine);

  // Small brass/acorn pull at the bottom.
  const pullBead=new THREE.Group();
  pullBead.position.copy(cordEnd);
  const beadTop=new THREE.Mesh(
    new THREE.SphereGeometry(.075,20,20),
    new THREE.MeshPhysicalMaterial({color:0x8b6a3e,roughness:.34,metalness:.28,clearcoat:.22})
  );
  beadTop.scale.set(.9,1.05,.9);
  pullBead.add(beadTop);
  const beadTail=new THREE.Mesh(
    new THREE.ConeGeometry(.065,.13,20),
    new THREE.MeshPhysicalMaterial({color:0x725231,roughness:.38,metalness:.22})
  );
  beadTail.position.y=-.105;
  beadTail.rotation.z=Math.PI;
  pullBead.add(beadTail);
  lampPullString.add(pullBead);

  // Large invisible hit target, also parented to the lamp.
  const pullHit=new THREE.Mesh(
    new THREE.CylinderGeometry(.22,.22,1.55,16),
    new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false})
  );
  pullHit.position.set(.05,-.67,.04);
  lampPullString.add(pullHit);

  const pullRestPos=lampPullString.position.clone();
  let lampOn=true,pullAngle=0,pullVel=0,pullTarget=0,pullImpulse=0;

  scene.add(new THREE.HemisphereLight(0x8f785f,0x241209,.72));
  const key=new THREE.DirectionalLight(0xffc58a,1.15);key.position.set(-4,6,5);key.castShadow=true;
  key.shadow.mapSize.set(2048,2048);
  key.shadow.bias=-0.0002;
  key.shadow.normalBias=.01;
  key.shadow.radius=3;
  key.shadow.camera.near=.5;
  key.shadow.camera.far=18;
  key.shadow.camera.left=-7;key.shadow.camera.right=7;key.shadow.camera.top=7;key.shadow.camera.bottom=-7;
  scene.add(key);
  const fill=new THREE.PointLight(0x6d4a35,4.5,8,2);fill.position.set(-2,2,-4);scene.add(fill);

  renderer.render(scene,camera); // first paint
  const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();
  let dragging=false,startX=0,baseAngle=arm.rotation.y,dropped=false,playing=false,autoDropping=false,autoLifting=false,autoT=0,playProgress=0;
  const armMeshes=[armHit,tube,headshell,cartridge,pivotBase,pivotCollar];
  const mugHit=new THREE.Mesh(new THREE.CylinderGeometry(.68,.68,1.25,32),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));
  mugHit.position.copy(mug.position);scene.add(mugHit);
  const buttonHit=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.28,32),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));
  buttonHit.position.copy(deckButtonGroup.position);buttonHit.position.y=.10;scene.add(buttonHit);
  let iceActive=false,iceTime=0,buttonPressT=0,latteRippling=false,latteRippleT=0,latteDispersed=false;

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
    if(hitMug(e)){
      if(!latteDispersed&&!latteRippling){latteRippling=true;latteRippleT=0}
      canvas.style.cursor='pointer';
    }
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
      if(Math.abs(pullVel)<.012&&Math.abs(pullAngle)<.012){
        pullAngle=Math.sin(clock.elapsedTime*.8)*.018;
      }
      const acc=(-stiffness*pullAngle)-(damping*pullVel);
      pullVel+=acc*dt;
      pullAngle+=pullVel*dt;
      pullAngle=THREE.MathUtils.clamp(pullAngle,-0.5,0.5);
      lampPullString.rotation.z=pullAngle*0.42;
      lampPullString.rotation.x=Math.sin(pullAngle*.8)*0.08;
      lampPullString.position.x=pullRestPos.x+Math.sin(pullAngle)*0.035;
      lampPullString.position.y=pullRestPos.y-Math.abs(pullAngle)*0.065;
      lampPullString.position.z=pullRestPos.z;
      if(Math.abs(pullAngle)<.002&&Math.abs(pullVel)<.01){
        pullAngle=0;pullVel=0;
        lampPullString.rotation.set(0,0,0);
        lampPullString.position.copy(pullRestPos);
      }
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
    if(latteRippling){
      latteRippleT=Math.min(1,latteRippleT+dt/1.45);
      const p=latteRippleT;
      disperseLatteArt(p);
      rippleRings.forEach((ring,i)=>{
        const local=THREE.MathUtils.clamp((p-ring.userData.delay)/(1-ring.userData.delay),0,1);
        ring.visible=local>0&&local<1;
        const radius=.10+local*.34;
        ring.scale.setScalar(radius/.08);
        ring.material.opacity=(1-local)*.34;
      });
      if(p>=1){
        latteRippling=false;latteDispersed=true;
        redrawLatteBase();latteTex.needsUpdate=true;
        rippleRings.forEach(r=>{r.visible=false;r.material.opacity=0});
      }
    }
    if(iceActive){iceTime+=dt;iceCubes.forEach((ice,i)=>{const a=iceTime*6.4+ice.userData.phase;ice.position.x=ice.userData.home.x+Math.sin(a)*.045;ice.position.z=ice.userData.home.z+Math.cos(a*1.08)*.045;ice.position.y=.465+Math.abs(Math.sin(a*.72))*.015;ice.rotation.y+=dt*(i%2?2.2:-2.4);ice.rotation.x=.08+Math.sin(a*.8)*.07});if(iceTime>1.1){iceActive=false;iceCubes.forEach(ice=>ice.position.copy(ice.userData.home))}}
    renderer.render(scene,camera)}animate();

  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight,false)});
}