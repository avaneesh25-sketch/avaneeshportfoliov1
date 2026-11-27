import * as THREE from 'three';
export function makePhotoAlbum(scene){
 const group=new THREE.Group();group.name='Leather photo album';group.userData.career='album';group.position.set(-.975,.752,.63);group.rotation.y=Math.PI/2;scene.add(group);
 const leather=new THREE.MeshStandardMaterial({color:0x3b2922,roughness:.85}),paper=new THREE.MeshStandardMaterial({color:0xe4dcc4,roughness:.94}),edge=new THREE.MeshStandardMaterial({color:0xbaa990,roughness:.94});
 function box(parent,w,h,d,x,y,z,mat){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m}
 box(group,.204,.006,.266,0,.003,0,leather);box(group,.192,.022,.254,0,.017,0,edge);
 for(let i=0;i<9;i++)box(group,.194,.0006,.254,0,.007+i*.0025,0,paper);
 box(group,.011,.032,.267,-.102,.018,0,leather);
 const hinge=new THREE.Group();hinge.position.set(-.102,.031,0);group.add(hinge);box(hinge,.204,.006,.266,.102,0,0,leather);
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=680;const ctx=canvas.getContext('2d');ctx.fillStyle='#3b2922';ctx.fillRect(0,0,512,680);ctx.strokeStyle='#b79b67';ctx.lineWidth=3;ctx.strokeRect(30,30,452,620);ctx.textAlign='center';ctx.fillStyle='#d7c29b';ctx.font='24px Georgia';ctx.fillText('FIELD NOTES',256,215);ctx.font='bold 49px Georgia';ctx.fillText('The Album',256,320);ctx.font='22px Arial';ctx.fillText('A LIFE IN PROJECTS',256,382);ctx.fillText('AVANEESH PRAMOD',256,585);
 const coverTex=new THREE.CanvasTexture(canvas);coverTex.colorSpace=THREE.SRGBColorSpace;
 const title=new THREE.Mesh(new THREE.PlaneGeometry(.197,.258),new THREE.MeshStandardMaterial({map:coverTex,roughness:.84}));title.rotation.x=-Math.PI/2;title.position.set(.102,.0032,0);hinge.add(title);
 const pagePivot=new THREE.Group();pagePivot.position.set(-.097,.029,0);group.add(pagePivot);
 const pageCanvas=document.createElement('canvas');pageCanvas.width=512;pageCanvas.height=680;const pageCtx=pageCanvas.getContext('2d'),pageTex=new THREE.CanvasTexture(pageCanvas);pageTex.colorSpace=THREE.SRGBColorSpace;
 const leaf=new THREE.Mesh(new THREE.PlaneGeometry(.193,.252),new THREE.MeshStandardMaterial({map:pageTex,roughness:.93,side:THREE.DoubleSide}));leaf.rotation.x=-Math.PI/2;leaf.position.x=.096;pagePivot.add(leaf);
 let openness=0,target=0,flip=1,version=0;
 function updatePage(chapter,item){const v=++version;pageCtx.fillStyle='#ede3ca';pageCtx.fillRect(0,0,512,680);pageCtx.fillStyle='#3b3027';pageCtx.font='bold 29px Georgia';pageCtx.fillText(chapter.title,27,58,458);pageCtx.font='22px Arial';pageCtx.fillText(item?'Personal archive':chapter.metric||'Photographs to be added',27,617,458);pageTex.needsUpdate=true;flip=0;
 if(item?.type==='image'){const im=new Image();im.onload=()=>{if(v!==version)return;const scale=Math.min(450/im.width,495/im.height),w=im.width*scale,h=im.height*scale;pageCtx.drawImage(im,(512-w)/2,85+(495-h)/2,w,h);pageTex.needsUpdate=true;window.dispatchEvent(new Event('portfolio:album-texture'))};im.src=new URL('../'+item.src,import.meta.url).href}}
 return {group,open(){target=1},close(){target=0;version++},updatePage,tick(dt,reduced){openness=reduced?target:THREE.MathUtils.lerp(openness,target,1-Math.exp(-dt*8));if(Math.abs(openness-target)<.002)openness=target;hinge.rotation.z=openness*2.72;if(flip<1)flip=reduced?1:Math.min(1,flip+dt*2.5);pagePivot.rotation.z=openness*Math.sin(flip*Math.PI)*1.75;return openness!==target||flip<1}};
}