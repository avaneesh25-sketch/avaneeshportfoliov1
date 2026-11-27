import * as THREE from 'three';
const rootURL=new URL('../',import.meta.url);
const reduce=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp=THREE.MathUtils.clamp;
const ease=t=>1-Math.pow(1-clamp(t,0,1),3);
export function createPhotoCloud({camera,scene,canvas,getBook,requestRender,onOpen,onClose}){
 const ui=document.querySelector('#photo-cloud-ui'),title=ui.querySelector('[data-cloud-title]'),info=ui.querySelector('[data-cloud-info]'),filters=ui.querySelector('[data-cloud-filters]'),focusPanel=document.querySelector('#cloud-detail'),focusBody=focusPanel.querySelector('[data-cloud-media]'),focusTitle=focusPanel.querySelector('[data-cloud-detail-title]'),focusCaption=focusPanel.querySelector('[data-cloud-caption]');
 const root=new THREE.Group();root.name='Floating album pages';root.visible=false;camera.add(root);
 let active=false,closing=false,loading=false,loadVersion=0,manifest=null,entries=[],cards=[],selected=null,filter=-1,offset=new THREE.Vector2(),targetOffset=new THREE.Vector2(),scale=1,targetScale=1,elapsed=0,returnFocus=null,press=null,focusIndex=0;
 const start=new THREE.Vector3(),ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),loader=new THREE.TextureLoader();
 const white=new THREE.MeshBasicMaterial({color:0xece1c9,toneMapped:false}),edge=new THREE.MeshBasicMaterial({color:0xb5a48a,toneMapped:false});
 const bound=()=>{const portrait=camera.aspect<1;return {w:2.8*Math.tan(camera.fov*Math.PI/360)*camera.aspect,h:2.8*Math.tan(camera.fov*Math.PI/360),portrait}};
 function flattened(chapters){return chapters.flatMap((c,ci)=>c.media.length?c.media.map((item,i)=>({chapter:c,ci,item,key:ci+':'+i})): [{chapter:c,ci,item:null,key:ci+':summary'}])}
 function pageTexture(entry){
  const c=document.createElement('canvas');c.width=512;c.height=620;const ctx=c.getContext('2d');
  ctx.fillStyle='#eee4cc';ctx.fillRect(0,0,512,620);ctx.fillStyle='#30271d';ctx.font='bold 24px Georgia';ctx.fillText(entry.chapter.title,23,577,465);
  ctx.font='17px Arial';ctx.fillStyle='#77634a';ctx.fillText(entry.item?(entry.item.type==='video'?'VIDEO / PLAY':'PERSONAL ARCHIVE'):'PROJECT SUMMARY / PHOTOS PENDING',23,600,466);
  ctx.fillStyle='#d0c2a6';ctx.fillRect(19,19,474,516);
  if(entry.item?.type==='video'){ctx.fillStyle='#56483b';ctx.fillRect(19,19,474,516);ctx.fillStyle='#f4e5c7';ctx.beginPath();ctx.moveTo(220,210);ctx.lineTo(320,277);ctx.lineTo(220,344);ctx.closePath();ctx.fill();ctx.textAlign='center';ctx.font='21px Arial';ctx.fillText('PLAY CLIP',256,389);ctx.textAlign='left'}
  else if(!entry.item){ctx.fillStyle='#3c3225';ctx.font='bold 34px Georgia';const words=(entry.chapter.metric||entry.chapter.title).split(' ');let line='',y=135;for(const word of words){const test=line+' '+word;if(ctx.measureText(test).width>417&&line){ctx.fillText(line.trim(),45,y);line=word;y+=44}else line=test}if(line)ctx.fillText(line.trim(),45,y);ctx.font='21px Arial';ctx.fillText('From the portfolio',45,474);ctx.fillText('Photographs not yet added',45,504)}
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=2;
  let live=true;
  if(entry.item?.type==='image'){
   const img=new Image();img.decoding='async';img.onload=()=>{if(!live)return;const s=Math.min(474/img.width,516/img.height),w=img.width*s,h=img.height*s;ctx.drawImage(img,19+(474-w)/2,19+(516-h)/2,w,h);tex.needsUpdate=true;requestRender()};img.onerror=()=>{if(!live)return;ctx.fillStyle='#4e4030';ctx.font='23px Arial';ctx.fillText('Photo unavailable',45,280);tex.needsUpdate=true;requestRender()};img.src=new URL(entry.item.src,rootURL).href;
  }
  return {tex,dispose(){live=false;tex.dispose()}};
 }
 function makeCard(entry,i){
  const g=new THREE.Group();g.name='Floating page: '+entry.chapter.title;g.userData.entry=entry;
  const page=pageTexture(entry);
  const backing=new THREE.Mesh(new THREE.BoxGeometry(.32,.386,.006),edge);g.add(backing);
  const face=new THREE.Mesh(new THREE.PlaneGeometry(.314,.38),new THREE.MeshBasicMaterial({map:page.tex,side:THREE.DoubleSide,toneMapped:false}));face.position.z=.0035;g.add(face);
  g.position.copy(start);g.scale.setScalar(.12);g.rotation.set(-1.22,0,0);root.add(g);
  return {g,entry,face,page,index:i,shown:true,base:new THREE.Vector3(),phase:i*1.71,delay:Math.min(.6,i*.044)};
 }
 function disposeCards(){for(const c of cards){root.remove(c.g);c.g.traverse(o=>{if(o.isMesh){o.geometry.dispose();if(o.material!==edge&&o.material!==white)o.material.dispose()}});c.page.dispose()}cards=[]}
 function layout(){
  const visible=cards.filter(c=>filter===-1||c.entry.ci===filter);const n=visible.length;
  const b=bound(),stepX=.375,stepY=.445;
  // Honeycomb clustering, with alternating depth and an enlarged center tile.
  const slots=[[0,0],[-1,0],[1,0],[-.5,-1],[.5,-1],[-.5,1],[.5,1],[-1.5,-1],[1.5,-1],[-1.5,1],[1.5,1],[-2,0],[2,0]];
  cards.forEach(c=>{c.shown=visible.includes(c)});
  visible.forEach((c,i)=>{let s=slots[i];if(!s){const ring=2+Math.floor((i-13)/12),a=(i-13)%12*Math.PI/6;s=[Math.cos(a)*ring,Math.sin(a)*ring]};c.base.set(s[0]*stepX,s[1]*stepY,-1.65-.09*Math.min(5,Math.hypot(s[0],s[1])));c.index=i});
  if(n===1){visible[0].base.set(0,0,-1.25)}
  const availableW=b.w*.59,availableH=b.h*.55;
  const maxX=Math.max(.17,...visible.map(c=>Math.abs(c.base.x)+.17)),maxY=Math.max(.20,...visible.map(c=>Math.abs(c.base.y)+.20));
  const fit=Math.min(1,availableW/maxX,availableH/maxY);root.userData.fit=clamp(fit,.40,1);
  info.textContent=visible.length+' pages · drag to explore · click to inspect';
  targetOffset.set(0,0);offset.set(0,0);targetScale=scale=1;
  requestRender();
 }
 function setFilter(i){filter=i;selected=null;closeFocus();[...filters.children].forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.filter)===i)));layout()}
 async function open(){
  if(active||loading||closing)return;
  loading=true;const version=++loadVersion;returnFocus=document.activeElement;
  // Immediately lock the desk view, then open the physical cover.
  active=true;onOpen();ui.hidden=false;title.textContent='The Album';info.textContent='Opening the pages…';ui.classList.add('opening');ui.querySelector('[data-cloud-close]').focus();
  try{
   if(!manifest){const response=await fetch(new URL('content/album/manifest.json',rootURL));if(!response.ok)throw Error('Album unavailable');manifest=await response.json()}
   if(version!==loadVersion||!active)return;
   const book=getBook();camera.updateMatrixWorld(true);book?.group.updateMatrixWorld(true);
   if(book){book.group.getWorldPosition(start);start.y+=.09;camera.worldToLocal(start);if(start.z>-.12)start.set(0,-.45,-1.5)}else start.set(0,-.45,-1.5);
   entries=flattened(manifest.chapters);disposeCards();cards=entries.map(makeCard);filter=-1;elapsed=0;selected=null;root.visible=true;closing=false;
   filters.replaceChildren(...[{title:'All pages',i:-1},...manifest.chapters.map((c,i)=>({title:c.title,i}))].map(c=>{const b=document.createElement('button');b.type='button';b.textContent=c.title;b.dataset.filter=c.i;b.setAttribute('aria-pressed',String(c.i===-1));b.addEventListener('click',()=>setFilter(c.i));return b}));
   layout();ui.classList.remove('opening');requestRender();
  }catch(e){if(version===loadVersion){info.textContent='Album unavailable. Open the lightweight gallery instead.';ui.classList.remove('opening')}}
  finally{if(version===loadVersion)loading=false}
 }
 function closeFocus(){if(!selected&&!focusPanel.open)return;selected=null;focusBody.replaceChildren();if(focusPanel.open)focusPanel.close();requestRender()}
 function close(){
  if(!active&&!closing)return;loadVersion++;loading=false;closeFocus();active=false;closing=true;elapsed=0;ui.hidden=true;onClose();requestRender();if(returnFocus?.isConnected)returnFocus.focus();
 }
 function showFocus(entry){
  selected=entry;focusIndex=entries.indexOf(entry);focusTitle.textContent=entry.chapter.title;focusCaption.textContent=entry.chapter.description+(entry.chapter.metric?' · '+entry.chapter.metric:'');focusBody.replaceChildren();
  if(entry.item){const n=document.createElement(entry.item.type==='video'?'video':'img');n.src=new URL(entry.item.src,rootURL).href;if(entry.item.type==='video'){n.controls=true;n.playsInline=true;n.preload='metadata'}else{n.alt=entry.item.alt||entry.chapter.title;n.decoding='async'}focusBody.append(n)}
  else{const d=document.createElement('div');d.className='cloud-summary';d.textContent=entry.chapter.metric||'Project photographs not yet added.';const p=document.createElement('p');p.textContent='Project photographs not yet added.';d.append(p);focusBody.append(d)}
  if(!focusPanel.open)focusPanel.showModal();requestRender()
 }
 function next(delta){const list=entries.filter(e=>filter===-1||e.ci===filter);if(!list.length)return;const i=list.indexOf(selected);showFocus(list[(i+delta+list.length)%list.length])}
 function tick(dt){
  if(!active&&!closing)return false;
  elapsed+=dt;const reduced=reduce(),fit=root.userData.fit||1;
  offset.lerp(targetOffset,reduced?1:1-Math.exp(-dt*10));scale=THREE.MathUtils.lerp(scale,targetScale,reduced?1:1-Math.exp(-dt*8));
  let moving=false;
  for(const c of cards){
   const t=closing?1-ease(reduced?1:(elapsed-c.delay*.25)/.55):ease(reduced?1:(elapsed-.13-c.delay)/.78);
   const visible=c.shown&&!closing;
   const base=c.base.clone();base.x=base.x*fit*scale+offset.x;base.y=base.y*fit*scale+offset.y;
   const drift=reduced||selected?0:Math.sin(elapsed*.8+c.phase)*.012;
   base.y+=drift;
   const dest=start.clone().lerp(base,t);
   const bump=closing?0:Math.sin(t*Math.PI)*.12;dest.y+=bump;
   c.g.position.copy(dest);const s=(.13+.87*t)*fit*scale*(c.index===0?1.10:1);c.g.scale.setScalar(Math.max(.001,visible?s:closing?s:.001));
   c.g.rotation.set((-1.15)*(1-t)+Math.sin(c.phase)*.045*t,Math.sin(c.phase*2)*.09*t,Math.cos(c.phase)*.08*t);
   c.g.visible=(visible||closing&&c.shown)&&t>.001;
   moving||=t>0&&t<1;
  }
  if(closing&&(reduced||elapsed>.85)){closing=false;root.visible=false;disposeCards();return false}
  return closing||active&&!loading&&(!reduced&&!selected||moving||offset.distanceTo(targetOffset)>.001||Math.abs(scale-targetScale)>.001);
 }
 function hit(e){const r=canvas.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(ndc,camera);const h=ray.intersectObjects(cards.filter(c=>c.g.visible&&c.shown).map(c=>c.g),true)[0];let o=h?.object;while(o){if(o.userData.entry)return o.userData.entry;o=o.parent}return null}
 // Capture gestures before the room's own navigation handlers.
 canvas.addEventListener('pointerdown',e=>{if(!active)return;e.stopImmediatePropagation();press={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false};try{canvas.setPointerCapture(e.pointerId)}catch{}},true);
 canvas.addEventListener('pointermove',e=>{if(!active)return;e.stopImmediatePropagation();if(press){const dx=e.clientX-press.lastX,dy=e.clientY-press.lastY;if(Math.hypot(e.clientX-press.x,e.clientY-press.y)>7)press.moved=true;const unit=2*1.7*Math.tan(camera.fov*Math.PI/360)/Math.max(1,canvas.clientHeight);if(press.moved){targetOffset.x=clamp(targetOffset.x+dx*unit,-1.3,1.3);targetOffset.y=clamp(targetOffset.y-dy*unit,-1,1);requestRender()}press.lastX=e.clientX;press.lastY=e.clientY}else canvas.style.cursor=hit(e)?'pointer':'grab'},true);
 canvas.addEventListener('pointerup',e=>{if(!active)return;e.stopImmediatePropagation();if(press&&!press.moved){const entry=hit(e);if(entry)showFocus(entry)}press=null},true);
 canvas.addEventListener('pointercancel',()=>{press=null},true);
 window.addEventListener('wheel',e=>{if(!active||focusPanel.open||e.target.closest('#photo-cloud-ui'))return;e.preventDefault();e.stopImmediatePropagation();targetScale=clamp(targetScale*Math.exp(-e.deltaY*.0014),.62,1.6);requestRender()},{passive:false,capture:true});
 window.addEventListener('keydown',e=>{if(!active)return;if(focusPanel.open)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();if(e.key==='ArrowLeft')targetOffset.x+=.14;if(e.key==='ArrowRight')targetOffset.x-=.14;if(e.key==='ArrowUp')targetOffset.y-=.14;if(e.key==='ArrowDown')targetOffset.y+=.14;targetOffset.x=clamp(targetOffset.x,-1.3,1.3);targetOffset.y=clamp(targetOffset.y,-1,1);requestRender()}},true);
 ui.querySelector('[data-cloud-close]').addEventListener('click',close);
 ui.querySelector('[data-cloud-reset]').addEventListener('click',()=>{targetOffset.set(0,0);targetScale=1;requestRender()});
 ui.querySelector('[data-cloud-grid]').addEventListener('click',()=>{const list=entries.filter(e=>filter===-1||e.ci===filter);if(list.length)showFocus(list[0])});
 focusPanel.querySelector('[data-cloud-back]').addEventListener('click',closeFocus);focusPanel.querySelector('[data-cloud-prev]').addEventListener('click',()=>next(-1));focusPanel.querySelector('[data-cloud-next]').addEventListener('click',()=>next(1));focusPanel.addEventListener('cancel',e=>{e.preventDefault();closeFocus()});focusPanel.addEventListener('close',()=>{selected=null;focusBody.replaceChildren();requestRender()});
 window.addEventListener('resize',()=>{if(active&&cards.length)layout()});
 return {open,close,tick,get isOpen(){return active||closing}};
}