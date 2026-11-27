const root=new URL('../',import.meta.url);
export function initAlbum(host,{onPage=()=>{},onOpen=()=>{},onClose=()=>{}}={}){
 let chapters=[],chapter=0,index=0,open=false,request=0,returnFocus=null;
 const modal=host.tagName==='DIALOG',title=host.querySelector('[data-title]'),body=host.querySelector('[data-media]'),caption=host.querySelector('[data-caption]'),counter=host.querySelector('[data-counter]'),tabs=host.querySelector('[data-chapters]'),previous=host.querySelector('[data-prev]'),next=host.querySelector('[data-next]');
 function show(){
  const c=chapters[chapter];if(!c)return;
  const item=c.media[index];title.textContent=c.title;caption.textContent=c.description+(c.metric?' · '+c.metric:'');counter.textContent=item?(index+1)+' / '+c.media.length:'Chapter '+(chapter+1)+' / '+chapters.length;
  body.replaceChildren();
  if(item){const node=document.createElement(item.type==='video'?'video':'img');node.src=new URL(item.src,root).href;node.className='album-media';if(item.type==='video'){node.controls=true;node.playsInline=true;node.preload='metadata'}else{node.alt=item.alt||c.title;node.decoding='async'}body.append(node);node.addEventListener('error',()=>{if(node.parentNode===body)body.textContent='Media unavailable.'},{once:true})}
  else{const placeholder=document.createElement('div');placeholder.className='album-empty';const h=document.createElement('strong');h.textContent=c.metric||c.title;const p=document.createElement('p');p.textContent='Project photographs not yet added.';placeholder.append(h,p);body.append(placeholder)}
  previous.disabled=chapter===0&&index===0;next.disabled=chapter===chapters.length-1&&index>=Math.max(0,c.media.length-1);
  [...tabs.children].forEach((btn,i)=>btn.setAttribute('aria-pressed',String(i===chapter)));
  onPage(c,item,index);
 }
 function step(delta){if(!chapters.length)return;const c=chapters[chapter];if(delta>0){if(index+1<c.media.length)index++;else if(chapter<chapters.length-1){chapter++;index=0}else return}else{if(index>0)index--;else if(chapter>0){chapter--;index=Math.max(0,chapters[chapter].media.length-1)}else return}show()}
 async function start(){
  const token=++request;returnFocus=document.activeElement;open=true;if(modal&&!host.open)host.showModal();onOpen();body.textContent='Opening album…';
  try{if(!chapters.length){const r=await fetch(new URL('content/album/manifest.json',root));if(!r.ok)throw Error('Album unavailable');chapters=(await r.json()).chapters;if(!Array.isArray(chapters)||!chapters.length)throw Error('No chapters');tabs.replaceChildren(...chapters.map((c,i)=>{const b=document.createElement('button');b.type='button';b.textContent=c.title;b.addEventListener('click',()=>{chapter=i;index=0;show()});return b}))}
    if(token===request&&open)show();
  }catch(e){if(token===request&&open)body.textContent='Album could not load. Please try again.'}
 }
 function close(){if(!open)return;request++;open=false;body.replaceChildren();onClose();if(modal&&host.open)host.close();if(returnFocus?.isConnected)returnFocus.focus()}
 host.querySelector('[data-close]')?.addEventListener('click',close);if(modal){host.addEventListener('cancel',e=>{e.preventDefault();close()});host.addEventListener('close',()=>{if(open)close()})}
 previous.addEventListener('click',()=>step(-1));next.addEventListener('click',()=>step(1));
 host.addEventListener('keydown',e=>{if(e.target.tagName==='VIDEO')return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();e.stopPropagation();step(e.key==='ArrowRight'?1:-1)}});
 let touch=null;body.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&e.target.tagName!=='VIDEO')touch=[e.clientX,e.clientY]});body.addEventListener('pointerup',e=>{if(touch&&Math.abs(e.clientX-touch[0])>55&&Math.abs(e.clientY-touch[1])<60)step(e.clientX<touch[0]?1:-1);touch=null});
 return {open:start,close,get isOpen(){return open}};
}