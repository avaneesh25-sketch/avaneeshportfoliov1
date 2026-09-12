const cinematicMusicStyle=document.createElement('link');cinematicMusicStyle.rel='stylesheet';cinematicMusicStyle.href='music-scene.css';document.head.appendChild(cinematicMusicStyle);
const $=(s,r=document)=>r.querySelector(s);const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const gate=$('#audioGate'),introAudio=$('#introAudio'),viennaAudio=$('#viennaAudio'),tv=$('#tvSet'),playIntro=$('#playIntro'),signalLost=$('#signalLost'),introNext=$('#introNext');
let soundEnabled=true,introTimer=[],introTransitioning=false;
function clearIntroTimers(){introTimer.forEach(clearTimeout);introTimer=[]}
const chapterOrder=['about','work','music','cv'];
let currentPage='intro';

function syncChapterChrome(page){
  currentPage=page;
  document.body.classList.toggle('chapter-mode',page!=='intro');
  $$('#chapterNav [data-chapter]').forEach(b=>b.classList.toggle('is-active',b.dataset.chapter===page));
}

function go(page,direction='next'){
  const target=$(`[data-page="${page}"]`);
  if(!target)return;
  $$('.page').forEach(p=>{
    p.classList.remove('page-swipe-in-right','page-swipe-in-left');
    p.classList.toggle('page--active',p===target);
  });
  if(page!=='intro'){
    void target.offsetWidth;
    target.classList.add(direction==='prev'?'page-swipe-in-left':'page-swipe-in-right');
  }
  syncChapterChrome(page);
  if(page!=='music')pauseVienna(false);
}

$$('[data-go]').forEach(el=>el.addEventListener('click',()=>go(el.dataset.go)));

function stepChapter(delta){
  if(currentPage==='intro'){go('about','next');return}
  const idx=Math.max(0,chapterOrder.indexOf(currentPage));
  const next=(idx+delta+chapterOrder.length)%chapterOrder.length;
  go(chapterOrder[next],delta<0?'prev':'next');
}
$('#loopPrev')?.addEventListener('click',()=>stepChapter(-1));
$('#loopNext')?.addEventListener('click',()=>stepChapter(1));

let swipeStartX=0,swipeStartY=0,swipeTracking=false;
document.addEventListener('touchstart',e=>{
  if(!document.body.classList.contains('chapter-mode')||!e.touches?.length)return;
  swipeStartX=e.touches[0].clientX;swipeStartY=e.touches[0].clientY;swipeTracking=true;
},{passive:true});
document.addEventListener('touchend',e=>{
  if(!swipeTracking||!document.body.classList.contains('chapter-mode'))return;
  swipeTracking=false;
  const t=e.changedTouches?.[0];if(!t)return;
  const dx=t.clientX-swipeStartX,dy=t.clientY-swipeStartY;
  if(Math.abs(dx)<70||Math.abs(dx)<Math.abs(dy)*1.2)return;
  // Literal gesture: swipe RIGHT advances, swipe LEFT goes back.
  stepChapter(dx>0?1:-1);
},{passive:true});

window.addEventListener('keydown',e=>{
  if(!document.body.classList.contains('chapter-mode'))return;
  if(e.key==='ArrowRight')stepChapter(1);
  if(e.key==='ArrowLeft')stepChapter(-1);
});
try{syncChapterChrome('intro')}catch(e){console.error('chapter nav init failed',e)}
function enter(withSound){soundEnabled=withSound;if(gate){gate.classList.add('hidden');setTimeout(()=>gate.remove(),800)}}
$('#enterWithSound')?.addEventListener('click',()=>enter(true));$('#enterMuted')?.addEventListener('click',()=>enter(false));
const aboutImage=$('.about-photo img');if(aboutImage)aboutImage.src='assets/about.jpeg';
const transitionStyle=document.createElement('style');
transitionStyle.textContent=`
.crt-exit-noise{position:fixed;z-index:998;inset:0;pointer-events:none;opacity:0;visibility:hidden;background:#666;overflow:hidden}
.crt-exit-noise:before{content:"";position:absolute;inset:-28%;background-image:repeating-radial-gradient(circle at 30% 20%,#eee 0 1px,#505050 1px 2px,#9a9a9a 2px 3px,#1d1d1d 3px 4px),repeating-linear-gradient(0deg,rgba(255,255,255,.07) 0 1px,rgba(0,0,0,.08) 1px 3px);background-size:5px 5px,100% 3px;animation:crtStatic .065s steps(2) infinite;filter:contrast(1.95) grayscale(1)}
.crt-exit-noise:after{content:"NO SIGNAL";position:absolute;inset:0;display:grid;place-items:center;color:#eee;font:500 11px DM Mono,monospace;letter-spacing:.34em;text-shadow:0 0 7px rgba(255,255,255,.38)}
.crt-impact-flash{position:fixed;z-index:999;inset:0;pointer-events:none;background:#fff;opacity:0;visibility:hidden}
.about-page.crt-about-reveal .about-wrap{animation:crtAboutReveal .82s cubic-bezier(.2,.72,.2,1) both}
.tv-stage{overflow:visible!important}.intro-page{overflow:visible!important}.tv-set.crt-pull-in{will-change:transform,filter,opacity;position:fixed!important;z-index:9999!important;left:50%!important;top:50%!important;margin:0!important;transform-origin:50% 50%!important}
@keyframes crtStatic{0%{transform:translate(0,0)}25%{transform:translate(-1.4%,1.8%)}50%{transform:translate(1.2%,-1.2%)}75%{transform:translate(-.8%,-1.4%)}100%{transform:translate(1.5%,1%)}}
#montage figure{transition:opacity var(--montage-speed,.72s) linear,filter var(--montage-speed,.72s) linear,transform var(--montage-speed,.72s) ease}.montage.montage-fast figure{animation-duration:.42s!important;transition-duration:.20s!important}@keyframes crtAboutReveal{0%{opacity:0;transform:translateY(22px)}100%{opacity:1;transform:translateY(0)}}
`;
document.head.appendChild(transitionStyle);
const exitNoise=document.createElement('div');exitNoise.className='crt-exit-noise';document.body.appendChild(exitNoise);
const impactFlash=document.createElement('div');impactFlash.className='crt-impact-flash';document.body.appendChild(impactFlash);
function transitionIntroToAbout(){if(introTransitioning)return;introTransitioning=true;clearIntroTimers();introAudio.pause();const introPage=$('[data-page="intro"]');signalLost.textContent='NO SIGNAL';signalLost.classList.add('show');setTimeout(()=>{exitNoise.classList.add('show');introPage?.classList.add('crt-sucked')},180);setTimeout(()=>{go('about');syncChapterChrome?.('about')},1050);setTimeout(()=>{exitNoise.classList.remove('show');introPage?.classList.remove('crt-sucked');tv.classList.remove('playing');signalLost.classList.remove('show');signalLost.textContent='BAD SIGNAL';introTransitioning=false},1500)}
async function startIntro(){clearIntroTimers();introTransitioning=false;tv.classList.remove('playing');signalLost.classList.remove('show');introNext.disabled=true;void tv.offsetWidth;tv.classList.add('playing');let audioStarted=false;if(soundEnabled){try{introAudio.currentTime=0;await introAudio.play();audioStarted=true}catch(e){}}if(audioStarted){introAudio.onended=transitionIntroToAbout;if(Number.isFinite(introAudio.duration)&&introAudio.duration>0)introTimer.push(setTimeout(transitionIntroToAbout,(introAudio.duration+.15)*1000))}else introTimer.push(setTimeout(transitionIntroToAbout,12800))}playIntro?.addEventListener('click',startIntro);


const progress=$('#songProgress'),elapsed=$('#elapsedTime'),duration=$('#durationTime'),instruction=$('#musicInstruction'),artistAudio=$('#artistAudio');
const formatTime=t=>{if(!Number.isFinite(t))return '—:—';const m=Math.floor(t/60),s=Math.floor(t%60);return `${m}:${String(s).padStart(2,'0')}`};
async function playSelectedFromTurntable(){
  const artist=artistNames[artistState.slug]||'BILLY JOEL';
  if(artistState.slug==='billy-joel' && (!artistState.tracks.length || artistState.tracks[0]?.src==='assets/vienna.mp3.mp3')){
    if(artistAudio)artistAudio.pause();
    if(instruction)instruction.textContent='Needle down. Vienna is playing.';
    if(soundEnabled){try{viennaAudio.currentTime=0;await viennaAudio.play()}catch(e){}}
    return;
  }
  viennaAudio.pause();
  if(artistState.tracks.length){
    await playArtistTrack(0);
  }else if(instruction){
    instruction.textContent=`${artist} has no uploaded tracks yet.`;
  }
}
function pauseVienna(){viennaAudio.pause();if(artistAudio)artistAudio.pause();}
window.addEventListener('turntable:drop',playSelectedFromTurntable);
window.addEventListener('turntable:lift',()=>{pauseVienna();if(instruction)instruction.textContent='Press the turntable button to lower the needle.'});
viennaAudio.addEventListener('loadedmetadata',()=>{if(duration)duration.textContent=formatTime(viennaAudio.duration)});
viennaAudio.addEventListener('timeupdate',()=>{if(!viennaAudio.duration)return;const p=viennaAudio.currentTime/viennaAudio.duration;if(progress)progress.style.width=`${p*100}%`;if(elapsed)elapsed.textContent=formatTime(viennaAudio.currentTime);if(duration)duration.textContent=formatTime(viennaAudio.duration);window.dispatchEvent(new CustomEvent('turntable:progress',{detail:{progress:p}}))});
viennaAudio.addEventListener('ended',()=>{if(instruction)instruction.textContent='Side finished. The needle stays where you left it.';window.dispatchEvent(new CustomEvent('turntable:ended'))});

const artistNames={
  'ed-sheeran':'ED SHEERAN',
  'michael-jackson':'MICHAEL JACKSON',
  'queen':'QUEEN',
  'billy-joel':'BILLY JOEL',
  'elton-john':'ELTON JOHN'
};
const artistState={tracks:[{title:'Vienna',src:'assets/vienna.mp3.mp3'}],index:0,slug:'billy-joel',durations:[],totalDuration:0,selectedTitle:'Vienna'};
function morphVinylLabel(title,artist){window.dispatchEvent(new CustomEvent('turntable:label',{detail:{title,artist}}))}
async function probeDurations(tracks){
  const durations=await Promise.all(tracks.map(t=>new Promise(resolve=>{const a=new Audio();a.preload='metadata';a.src=t.src;const done=()=>resolve(Number.isFinite(a.duration)?a.duration:0);a.addEventListener('loadedmetadata',done,{once:true});a.addEventListener('error',()=>resolve(0),{once:true})})));
  artistState.durations=durations;artistState.totalDuration=durations.reduce((a,b)=>a+b,0);
}
async function loadArtistPlaylist(slug){
  const artist=artistNames[slug]||slug.toUpperCase();
  const sameArtist=artistState.slug===slug;
  $$('.music3d-sleeve').forEach(x=>x.classList.toggle('is-active',x.dataset.artist===slug));

  // Selecting an artist never starts audio. It only changes the record/playlist selection.
  if(artistAudio)artistAudio.pause();
  viennaAudio.pause();
  window.dispatchEvent(new CustomEvent('turntable:lift'));
  artistState.slug=slug;artistState.index=0;artistState.durations=[];artistState.totalDuration=0;artistState.tracks=[];

  try{
    const res=await fetch(`music/${slug}/playlist.json?ts=${Date.now()}`,{cache:'no-store'});
    if(!res.ok)throw new Error('playlist missing');
    const data=await res.json();
    artistState.tracks=(Array.isArray(data)?data:(data.tracks||[])).filter(t=>t&&t.src);
    if(artistState.tracks.length)await probeDurations(artistState.tracks);

    const first=artistState.tracks[0];
    const nextTitle=first?.title || (slug==='billy-joel'?'Vienna':artist);
    artistState.selectedTitle=nextTitle;

    if(!sameArtist)morphVinylLabel(nextTitle,artist);
    if(instruction)instruction.textContent=artistState.tracks.length
      ? `${artist} selected. Press the turntable button to lower the needle.`
      : `${artist} selected — add tracks in GitHub anytime.`;
  }catch(e){
    const nextTitle=slug==='billy-joel'?'Vienna':artist;
    artistState.selectedTitle=nextTitle;
    if(!sameArtist)morphVinylLabel(nextTitle,artist);
    if(instruction)instruction.textContent=`${artist} selected — add tracks in GitHub anytime.`;
  }
}
async function playArtistTrack(i){
  const track=artistState.tracks[i];if(!track||!artistAudio)return;
  artistState.index=i;
  artistAudio.src=track.src;
  morphVinylLabel(track.title||artistNames[artistState.slug]||'VINYL',artistNames[artistState.slug]||'');
  if(instruction)instruction.textContent=`${track.title||artistNames[artistState.slug]} — playing.`;
  if(soundEnabled)try{await artistAudio.play()}catch(e){}
}
if(artistAudio)artistAudio.addEventListener('timeupdate',()=>{
  const prior=artistState.durations.slice(0,artistState.index).reduce((a,b)=>a+b,0);
  const current=Number.isFinite(artistAudio.currentTime)?artistAudio.currentTime:0;
  const total=artistState.totalDuration||artistAudio.duration||1;
  window.dispatchEvent(new CustomEvent('turntable:progress',{detail:{progress:Math.min(1,(prior+current)/total)}}));
});
if(artistAudio)artistAudio.addEventListener('ended',()=>{const n=artistState.index+1;if(n<artistState.tracks.length)playArtistTrack(n);else if(instruction)instruction.textContent='Playlist finished.'});
$$('.music3d-sleeve').forEach(s=>s.addEventListener('click',()=>loadArtistPlaylist(s.dataset.artist)));
window.addEventListener('wheel',e=>{if(!$('.content-page.page--active'))e.preventDefault()},{passive:false});