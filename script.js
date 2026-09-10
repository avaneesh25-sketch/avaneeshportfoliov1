const $=(s,r=document)=>r.querySelector(s);const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const gate=$('#audioGate'),introAudio=$('#introAudio'),viennaAudio=$('#viennaAudio'),tv=$('#tvSet'),playIntro=$('#playIntro'),signalLost=$('#signalLost'),introNext=$('#introNext');
let soundEnabled=true,introTimer=[];
function clearIntroTimers(){introTimer.forEach(clearTimeout);introTimer=[]}
function go(page){const target=$(`[data-page="${page}"]`);if(!target)return;$$('.page').forEach(p=>p.classList.toggle('page--active',p===target));if(page!=='music')pauseVienna(true)}
$$('[data-go]').forEach(el=>el.addEventListener('click',()=>go(el.dataset.go)));
function enter(withSound){soundEnabled=withSound;gate.classList.add('hidden');setTimeout(()=>gate.remove(),800)}
$('#enterWithSound').addEventListener('click',()=>enter(true));$('#enterMuted').addEventListener('click',()=>enter(false));
async function startIntro(){clearIntroTimers();tv.classList.remove('playing');signalLost.classList.remove('show');introNext.disabled=true;void tv.offsetWidth;tv.classList.add('playing');if(soundEnabled){try{introAudio.currentTime=0;await introAudio.play()}catch(e){}}introTimer.push(setTimeout(()=>signalLost.classList.add('show'),11800));introTimer.push(setTimeout(()=>{tv.classList.remove('playing');signalLost.textContent='SIGNAL LOST';signalLost.classList.add('show');introNext.disabled=false},12800))}
playIntro.addEventListener('click',startIntro);

const tonearm=$('#tonearm'),record=$('#record'),platter=$('#platter'),progress=$('#songProgress'),elapsed=$('#elapsedTime'),duration=$('#durationTime'),instruction=$('#musicInstruction');
let dragging=false,startPoint=null,currentAngle=0;
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
function formatTime(t){if(!Number.isFinite(t))return '—:—';const m=Math.floor(t/60),s=Math.floor(t%60);return `${m}:${String(s).padStart(2,'0')}`}
function isOverRecord(x,y){const r=record.getBoundingClientRect();const cx=r.left+r.width/2,cy=r.top+r.height/2;const dx=x-cx,dy=y-cy;const radius=r.width*.48;return Math.hypot(dx,dy)<=radius}
function setArmAngle(angle){currentAngle=clamp(angle,-30,9);tonearm.style.transform=`rotate(${currentAngle}deg)`}
function armAngleFromPointer(x,y){const r=tonearm.getBoundingClientRect();const pivotX=r.right-r.width*.18,pivotY=r.top+r.height*.13;const a=Math.atan2(y-pivotY,x-pivotX)*180/Math.PI;return clamp(a+101,-30,9)}
async function playVienna(){tonearm.classList.add('dropped');record.classList.add('spinning');setArmAngle(-27);instruction.textContent='Needle down. Vienna is playing.';if(soundEnabled){try{await viennaAudio.play()}catch(e){instruction.textContent='Needle down. Tap once more if your browser blocked audio.'}}}
function pauseVienna(resetArm=false){viennaAudio.pause();record.classList.remove('spinning');tonearm.classList.remove('dropped');if(resetArm){setArmAngle(0);instruction.textContent='Move the arm. Music starts only when the stylus reaches the vinyl.'}}

tonearm.addEventListener('pointerdown',e=>{dragging=true;startPoint={x:e.clientX,y:e.clientY};tonearm.classList.add('dragging');tonearm.setPointerCapture?.(e.pointerId);if(!viennaAudio.paused)pauseVienna(false)});
tonearm.addEventListener('pointermove',e=>{if(!dragging)return;setArmAngle(armAngleFromPointer(e.clientX,e.clientY));instruction.textContent=isOverRecord(e.clientX,e.clientY)?'Release here to drop the needle.':'Drag the stylus over the vinyl.'});
tonearm.addEventListener('pointerup',async e=>{if(!dragging)return;dragging=false;tonearm.classList.remove('dragging');const moved=startPoint?Math.hypot(e.clientX-startPoint.x,e.clientY-startPoint.y):0;startPoint=null;if(moved>8&&isOverRecord(e.clientX,e.clientY)){await playVienna()}else{pauseVienna(true)}});
tonearm.addEventListener('pointercancel',()=>{dragging=false;tonearm.classList.remove('dragging');pauseVienna(true)});
tonearm.addEventListener('click',e=>e.preventDefault());

viennaAudio.addEventListener('loadedmetadata',()=>duration.textContent=formatTime(viennaAudio.duration));
viennaAudio.addEventListener('timeupdate',()=>{if(!viennaAudio.duration)return;progress.style.width=`${(viennaAudio.currentTime/viennaAudio.duration)*100}%`;elapsed.textContent=formatTime(viennaAudio.currentTime);duration.textContent=formatTime(viennaAudio.duration)});
viennaAudio.addEventListener('ended',()=>{record.classList.remove('spinning');tonearm.classList.remove('dropped');setArmAngle(0);instruction.textContent='That side is done. Drag the needle back onto the record to replay.'});

window.addEventListener('wheel',e=>{if(!$('.content-page.page--active'))e.preventDefault()},{passive:false});
window.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){const p=$('.page--active')?.dataset.page;const next={intro:'music',music:'work',work:'about',about:'cv'}[p];if(next)go(next)}if(e.key==='ArrowLeft'){const p=$('.page--active')?.dataset.page;const prev={music:'intro',work:'music',about:'work',cv:'about'}[p];if(prev)go(prev)}});
