const $=(s,r=document)=>r.querySelector(s);const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const gate=$('#audioGate'),introAudio=$('#introAudio'),viennaAudio=$('#viennaAudio'),tv=$('#tvSet'),playIntro=$('#playIntro'),signalLost=$('#signalLost'),introNext=$('#introNext');
let soundEnabled=true,introTimer=[],introTransitioning=false;
function clearIntroTimers(){introTimer.forEach(clearTimeout);introTimer=[]}
function go(page){const target=$(`[data-page="${page}"]`);if(!target)return;$$('.page').forEach(p=>p.classList.toggle('page--active',p===target));if(page!=='music')pauseVienna(false)}
$$('[data-go]').forEach(el=>el.addEventListener('click',()=>go(el.dataset.go)));
function enter(withSound){soundEnabled=withSound;gate.classList.add('hidden');setTimeout(()=>gate.remove(),800)}
$('#enterWithSound').addEventListener('click',()=>enter(true));$('#enterMuted').addEventListener('click',()=>enter(false));

// Runtime transition styling keeps the intro cinematic without adding another asset.
const transitionStyle=document.createElement('style');
transitionStyle.textContent=`
  .crt-exit-noise{position:fixed;z-index:998;inset:0;pointer-events:none;opacity:0;visibility:hidden;background:#777;overflow:hidden;transition:opacity .18s ease,visibility .18s ease}
  .crt-exit-noise:before{content:"";position:absolute;inset:-30%;background-image:repeating-radial-gradient(circle at 30% 20%,#eee 0 1px,#555 1px 2px,#999 2px 3px,#222 3px 4px);background-size:5px 5px;animation:crtStatic .08s steps(2) infinite;filter:contrast(1.8) grayscale(1)}
  .crt-exit-noise:after{content:"NO SIGNAL";position:absolute;inset:0;display:grid;place-items:center;color:#e9e9e9;text-shadow:2px 0 #111,-2px 0 #aaa;font:500 11px DM Mono,monospace;letter-spacing:.34em;background:repeating-linear-gradient(0deg,rgba(0,0,0,.18) 0 2px,rgba(255,255,255,.04) 3px 4px)}
  .crt-exit-noise.show{opacity:1;visibility:visible}
  .intro-page.crt-sucked{animation:crtSuck .95s cubic-bezier(.7,0,.3,1) forwards;transform-origin:50% 50%}
  .intro-page.crt-sucked .tv-set{animation:crtImplode .95s cubic-bezier(.7,0,.3,1) forwards}
  @keyframes crtStatic{0%{transform:translate(0,0)}25%{transform:translate(3%,-2%)}50%{transform:translate(-2%,3%)}75%{transform:translate(1%,2%)}100%{transform:translate(-3%,-1%)}}
  @keyframes crtSuck{0%{filter:none;transform:scale(1)}55%{filter:grayscale(1) contrast(1.7) brightness(.7);transform:scale(.985)}100%{filter:grayscale(1) contrast(2.2) brightness(.25);transform:scale(.08,.012);opacity:0}}
  @keyframes crtImplode{0%{transform:scale(1)}60%{transform:scale(1.05,.72)}100%{transform:scale(.04,.015);filter:brightness(3)}}
`;
document.head.appendChild(transitionStyle);
const exitNoise=document.createElement('div');exitNoise.className='crt-exit-noise';exitNoise.setAttribute('aria-hidden','true');document.body.appendChild(exitNoise);

function transitionIntroToAbout(){
  if(introTransitioning)return;introTransitioning=true;clearIntroTimers();introAudio.pause();
  const introPage=$('[data-page="intro"]');signalLost.textContent='NO SIGNAL';signalLost.classList.add('show');
  setTimeout(()=>{exitNoise.classList.add('show');introPage?.classList.add('crt-sucked')},180);
  setTimeout(()=>{go('about')},1050);
  setTimeout(()=>{exitNoise.classList.remove('show');introPage?.classList.remove('crt-sucked');tv.classList.remove('playing');signalLost.classList.remove('show');signalLost.textContent='BAD SIGNAL';introTransitioning=false},1500);
}

async function startIntro(){
  clearIntroTimers();introTransitioning=false;tv.classList.remove('playing');signalLost.classList.remove('show');introNext.disabled=true;void tv.offsetWidth;tv.classList.add('playing');
  let audioStarted=false;
  if(soundEnabled){try{introAudio.currentTime=0;await introAudio.play();audioStarted=true}catch(e){}}
  if(audioStarted){
    introAudio.onended=transitionIntroToAbout;
    // Fallback in case the browser never fires ended.
    if(Number.isFinite(introAudio.duration)&&introAudio.duration>0)introTimer.push(setTimeout(transitionIntroToAbout,(introAudio.duration+0.15)*1000));
  }else{
    introTimer.push(setTimeout(transitionIntroToAbout,12800));
  }
}
playIntro.addEventListener('click',startIntro);

const tonearm=$('#tonearm'),record=$('#record'),platter=$('#platter'),progress=$('#songProgress'),elapsed=$('#elapsedTime'),duration=$('#durationTime'),instruction=$('#musicInstruction');
let dragging=false,startPoint=null,currentAngle=0,armLatched=false;
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
function formatTime(t){if(!Number.isFinite(t))return '—:—';const m=Math.floor(t/60),s=Math.floor(t%60);return `${m}:${String(s).padStart(2,'0')}`}
function isOverRecord(x,y){const r=record.getBoundingClientRect();const cx=r.left+r.width/2,cy=r.top+r.height/2;const dx=x-cx,dy=y-cy;const radius=r.width*.48;return Math.hypot(dx,dy)<=radius}
function setArmAngle(angle){currentAngle=clamp(angle,-30,9);tonearm.style.transform=`rotate(${currentAngle}deg)`}
function armAngleFromPointer(x,y){const r=tonearm.getBoundingClientRect();const pivotX=r.right-r.width*.18,pivotY=r.top+r.height*.13;const a=Math.atan2(y-pivotY,x-pivotX)*180/Math.PI;return clamp(a+101,-30,9)}
async function playVienna(){armLatched=true;tonearm.classList.add('dropped');record.classList.add('spinning');setArmAngle(-27);instruction.textContent='Needle down. Vienna is playing.';if(soundEnabled){try{await viennaAudio.play()}catch(e){instruction.textContent='Needle down. Your browser blocked audio — tap play in the browser once.'}}}
function pauseVienna(resetArm=false){viennaAudio.pause();record.classList.remove('spinning');if(resetArm&&!armLatched){tonearm.classList.remove('dropped');setArmAngle(0);instruction.textContent='Move the arm. Music starts only when the stylus reaches the vinyl.'}}

tonearm.addEventListener('pointerdown',e=>{if(armLatched)return;dragging=true;startPoint={x:e.clientX,y:e.clientY};tonearm.classList.add('dragging');tonearm.setPointerCapture?.(e.pointerId)});
tonearm.addEventListener('pointermove',e=>{if(!dragging||armLatched)return;setArmAngle(armAngleFromPointer(e.clientX,e.clientY));instruction.textContent=isOverRecord(e.clientX,e.clientY)?'Release here to drop the needle.':'Drag the stylus over the vinyl.'});
tonearm.addEventListener('pointerup',async e=>{if(!dragging||armLatched)return;dragging=false;tonearm.classList.remove('dragging');const moved=startPoint?Math.hypot(e.clientX-startPoint.x,e.clientY-startPoint.y):0;startPoint=null;if(moved>8&&isOverRecord(e.clientX,e.clientY)){await playVienna()}else{pauseVienna(true)}});
tonearm.addEventListener('pointercancel',()=>{if(armLatched)return;dragging=false;tonearm.classList.remove('dragging');pauseVienna(true)});
tonearm.addEventListener('click',e=>e.preventDefault());

viennaAudio.addEventListener('loadedmetadata',()=>duration.textContent=formatTime(viennaAudio.duration));
viennaAudio.addEventListener('timeupdate',()=>{if(!viennaAudio.duration)return;progress.style.width=`${(viennaAudio.currentTime/viennaAudio.duration)*100}%`;elapsed.textContent=formatTime(viennaAudio.currentTime);duration.textContent=formatTime(viennaAudio.duration)});
viennaAudio.addEventListener('ended',()=>{record.classList.remove('spinning');tonearm.classList.add('dropped');setArmAngle(-27);instruction.textContent='Side finished. The needle stays where you left it.'});

window.addEventListener('wheel',e=>{if(!$('.content-page.page--active'))e.preventDefault()},{passive:false});
window.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){const p=$('.page--active')?.dataset.page;const next={intro:'music',music:'work',work:'about',about:'cv'}[p];if(next)go(next)}if(e.key==='ArrowLeft'){const p=$('.page--active')?.dataset.page;const prev={music:'intro',work:'music',about:'work',cv:'about'}[p];if(prev)go(prev)}});
