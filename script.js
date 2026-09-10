const $=(s,r=document)=>r.querySelector(s);const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const gate=$('#audioGate'),introAudio=$('#introAudio'),viennaAudio=$('#viennaAudio'),tv=$('#tvSet'),playIntro=$('#playIntro'),signalLost=$('#signalLost'),introNext=$('#introNext');
let soundEnabled=true,introTimer=[],needleHasDropped=false;
function clearIntroTimers(){introTimer.forEach(clearTimeout);introTimer=[]}
function go(page){const target=$(`[data-page="${page}"]`);if(!target)return;$$('.page').forEach(p=>p.classList.toggle('page--active',p===target));$$('.artist-drawer').forEach(d=>{d.classList.remove('open');d.setAttribute('aria-hidden','true')});}
$$('[data-go]').forEach(el=>el.addEventListener('click',()=>go(el.dataset.go)));
function enter(withSound){soundEnabled=withSound;gate.classList.add('hidden');setTimeout(()=>gate.remove(),800)}
$('#enterWithSound').addEventListener('click',()=>enter(true));$('#enterMuted').addEventListener('click',()=>enter(false));
async function startIntro(){clearIntroTimers();tv.classList.remove('playing');signalLost.classList.remove('show');introNext.disabled=true;void tv.offsetWidth;tv.classList.add('playing');if(soundEnabled){try{introAudio.currentTime=0;await introAudio.play()}catch(e){/* intro audio may be absent; keep sound enabled so Vienna still plays */}}introTimer.push(setTimeout(()=>{signalLost.classList.add('show')},11800));introTimer.push(setTimeout(()=>{tv.classList.remove('playing');signalLost.textContent='SIGNAL LOST';signalLost.classList.add('show');introNext.disabled=false},12800))}
playIntro.addEventListener('click',startIntro);
const tonearm=$('#tonearm'),record=$('#record'),player=$('#playerCard'),drawer=$('#artistDrawer'),progress=$('#songProgress');
async function dropNeedle(){if(!tonearm.classList.contains('dropped')){tonearm.classList.add('dropped');record.classList.add('spinning');player.classList.add('show');needleHasDropped=true;if(soundEnabled){try{viennaAudio.currentTime=viennaAudio.currentTime||0;await viennaAudio.play()}catch(e){}}return}liftNeedle()}
function liftNeedle(){tonearm.classList.remove('dropped');record.classList.remove('spinning');viennaAudio.pause();player.classList.remove('show');if(needleHasDropped)setTimeout(openArtists,350)}
function openArtists(){drawer.classList.add('open');drawer.setAttribute('aria-hidden','false')}
tonearm.addEventListener('click',dropNeedle);$('#liftNeedle').addEventListener('click',liftNeedle);$('#closeArtists').addEventListener('click',()=>{drawer.classList.remove('open');drawer.setAttribute('aria-hidden','true')});
viennaAudio.addEventListener('timeupdate',()=>{if(!viennaAudio.duration)return;progress.style.width=`${(viennaAudio.currentTime/viennaAudio.duration)*100}%`});viennaAudio.addEventListener('ended',()=>{tonearm.classList.remove('dropped');record.classList.remove('spinning');player.classList.remove('show');openArtists()});
let dragStart=null;tonearm.addEventListener('pointerdown',e=>{dragStart={x:e.clientX,y:e.clientY};tonearm.setPointerCapture?.(e.pointerId)});tonearm.addEventListener('pointerup',e=>{if(!dragStart)return;const d=Math.hypot(e.clientX-dragStart.x,e.clientY-dragStart.y);dragStart=null;if(d>18&&!tonearm.classList.contains('dropped'))dropNeedle()});
window.addEventListener('wheel',e=>{if(!$('.content-page.page--active'))e.preventDefault()},{passive:false});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&drawer.classList.contains('open')){$('#closeArtists').click()}if(e.key==='ArrowRight'){const p=$('.page--active')?.dataset.page;const next={intro:'music',music:'work',work:'about',about:'cv'}[p];if(next)go(next)}if(e.key==='ArrowLeft'){const p=$('.page--active')?.dataset.page;const prev={music:'intro',work:'music',about:'work',cv:'about'}[p];if(prev)go(prev)}});
