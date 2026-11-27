import * as THREE from 'three';
const mat=(color,roughness=.65,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const wood=mat(0x745037,.72),steel=mat(0x232526,.5,.25),skin=mat(0xb67e5c,.78),nail=mat(0xd9ae90,.67),cuff=mat(0x252a30,.9);
function box(g,w,h,d,x,y,z,m){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;}
function sphere(g,x,y,z,a,b,c,m){const o=new THREE.Mesh(new THREE.SphereGeometry(1,18,12),m);o.scale.set(a,b,c);o.position.set(x,y,z);g.add(o);return o;}
export function buildLDesk(){
 const g=new THREE.Group();g.name='Continuous L-shaped desk';
 const outline=[[-1.47,-.375],[1.25,-.375],[1.25,.375],[-.79,.375],[-.79,1.575],[-1.47,1.575]];
 const shape=new THREE.Shape();outline.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
 const geo=new THREE.ExtrudeGeometry(shape,{depth:.037,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.005,bevelThickness:.004,curveSegments:1});
 const slab=new THREE.Mesh(geo,wood);slab.rotation.x=-Math.PI/2;slab.position.y=.709;slab.castShadow=slab.receiveShadow=true;g.add(slab);
 for(const [x,z] of [[-1.40,-.31],[1.18,-.31],[1.18,.30],[-1.40,1.50],[-.86,1.50],[-1.40,.31]])box(g,.048,.707,.048,x,.354,z,steel);
 box(g,2.60,.065,.032,-.11,.675,-.32,steel);
 box(g,.032,.065,1.83,-1.40,.675,.60,steel);
 return g;
}
function cardTexture(metric,title,sub){
 const c=document.createElement('canvas');c.width=720;c.height=520;const ctx=c.getContext('2d');
 ctx.fillStyle='#e5dac1';ctx.fillRect(0,0,720,520);ctx.fillStyle='#25251f';ctx.fillRect(18,18,684,484);ctx.fillStyle='#e5dac1';
 ctx.font='24px Arial';ctx.fillText('SELECTED WORK  /  PORTFOLIO',50,76);ctx.fillRect(50,105,620,2);
 ctx.font='bold 124px Georgia';ctx.fillText(metric,50,250,620);ctx.font='bold 40px Arial';ctx.fillText(title,50,326,620);
 ctx.font='27px Arial';ctx.fillText(sub,50,388,620);ctx.font='18px Arial';ctx.fillText('FROM CURRENT PORTFOLIO',50,468);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
export function buildWorkstation(scene){
 const wall=new THREE.Mesh(new THREE.PlaneGeometry(4.3,4.4),mat(0x81766a,.96));wall.rotation.y=Math.PI/2;wall.position.set(-1.63,2.2,.9);wall.receiveShadow=true;scene.add(wall);
 const frames=[['20%','Yokogawa','Handover cycle-time reduction'],['0→50','Coffee Koffee','Cups/day'],['1K+','7 Senses','Storefront users'],['3','Hardware builds','Hands-on prototypes']];
 frames.forEach(([metric,title,sub],i)=>{
  const g=new THREE.Group();g.name='Achievement · '+title;g.rotation.y=Math.PI/2;
  g.position.set(-1.604,1.48+Math.floor(i/2)*.32,.42+(i%2)*.46);
  box(g,.415,.30,.025,0,0,0,steel);
  const p=new THREE.Mesh(new THREE.PlaneGeometry(.393,.278),new THREE.MeshStandardMaterial({map:cardTexture(metric,title,sub),roughness:.9,emissive:0xffffff,emissiveIntensity:.045}));p.position.z=.014;g.add(p);scene.add(g);
 });
 // Desk objects and frames are solid meshes; no flat hand/object sprites.
}
function segment(g,a,b,r1,r2,m){
 const o=new THREE.Mesh(new THREE.CylinderGeometry(r2,r1,1,12),m);const v=new THREE.Vector3().subVectors(b,a);o.position.copy(a).addScaledVector(v,.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.clone().normalize());o.scale.y=v.length();g.add(o);return o;
}
function hand(side){
 const g=new THREE.Group();
 sphere(g,0,0,0,.035,.047,.018,skin);
 sphere(g,side*.022,-.004,.012,.020,.027,.014,skin);
 const digits=[];
 for(let i=0;i<4;i++){
  const root=new THREE.Group();root.position.set((i-1.5)*.018,.037,0);g.add(root);
  const length=[.045,.058,.061,.050][i],r=[.008,.009,.009,.008][i];
  const joints=[];let p=root;
  for(let k=0;k<3;k++){
   const len=length*[.45,.32,.23][k];sphere(p,0,0,0,r,r,r,skin);segment(p,new THREE.Vector3(),new THREE.Vector3(0,len,0),r,r*.78,skin);
   const j=new THREE.Group();j.position.y=len;p.add(j);joints.push(p);p=j;
  }
  sphere(p,0,0,0,r*.72,r*.82,r*.72,skin);sphere(p,0,-.004,-r*.68,r*.55,.007,.0025,nail);
  digits.push(joints);
 }
 const thumb=new THREE.Group();thumb.position.set(side*.033,-.014,.006);thumb.rotation.z=-side*.8;g.add(thumb);
 segment(thumb,new THREE.Vector3(),new THREE.Vector3(0,.033,.008),.013,.009,skin);
 sphere(thumb,0,.033,.008,.009,.010,.009,skin);
 const tip=new THREE.Group();tip.position.set(0,.033,.008);thumb.add(tip);segment(tip,new THREE.Vector3(),new THREE.Vector3(0,.022,0),.009,.0065,skin);sphere(tip,0,.022,0,.0065,.008,.007,skin);
 return {g,digits,thumb,tip};
}
export function createHands(){
 const root=new THREE.Group(),left=hand(-1),right=hand(1);
 root.add(left.g,right.g);
 const arms=[-1,1].map(s=>{const arm=new THREE.Mesh(new THREE.CylinderGeometry(.026,.043,1,20),skin);root.add(arm);const sleeve=new THREE.Mesh(new THREE.CylinderGeometry(.044,.047,1,20),cuff);root.add(sleeve);return {arm,sleeve,s}});
 const axis=new THREE.Vector3(0,1,0);
 function fit(o,a,b){const d=b.clone().sub(a);o.position.copy(a).addScaledVector(d,.5);o.scale.y=d.length();o.quaternion.setFromUnitVectors(axis,d.normalize());}
 function pose(center,reach,release){
  [left,right].forEach(({g,digits,thumb,tip},i)=>{
   const s=i===0?-1:1,origin=new THREE.Vector3(s*.30,-.34,-.22);
   const hold=center.clone().add(new THREE.Vector3(s*.106,-.012,.015));
   const p=origin.clone().lerp(hold,reach*(1-release));g.position.copy(p);
   g.rotation.set(.32,s*.40,-s*.72);
   digits.forEach((j,k)=>j.forEach((part,n)=>{part.rotation.x=(.10+.65*reach*(1-release))*(n===0?1:.72);if(n===0)part.rotation.z=(k-1.5)*.055;}));thumb.rotation.x=.35*reach;tip.rotation.x=.4*reach;
   const wrist=p.clone().add(new THREE.Vector3(s*.016,-.047,.018)),elbow=origin.clone().add(new THREE.Vector3(s*.065,-.08,.11));
   const cuffEnd=elbow.clone().lerp(wrist,.56);fit(arms[i].sleeve,elbow,cuffEnd);fit(arms[i].arm,cuffEnd,wrist);
  });
 }
 return {root,pose};
}
