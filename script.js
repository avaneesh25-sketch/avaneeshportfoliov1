const cinematicMusicStyle=document.createElement('link');cinematicMusicStyle.rel='stylesheet';cinematicMusicStyle.href='music-scene.css';document.head.appendChild(cinematicMusicStyle);
const $=(s,r=document)=>r.querySelector(s);const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const gate=$('#audioGate'),introAudio=$('#introAudio'),viennaAudio=$('#viennaAudio'),tv=$('#tvSet'),playIntro=$('#playIntro'),signalLost=$('#signalLost'),introNext=$('#introNext');
let soundEnabled=true,introTimer=[],introTransitioning=false;
function clearIntroTimers(){introTimer.forEach(clearTimeout);introTimer=[]}
function go(page){const target=$(`[data-page="${page}"]`);if(!target)return;$$('.page').forEach(p=>p.classList.toggle('page--active',p===target));if(page!=='music')pauseVienna(false)}
$$('[data-go]').forEach(el=>el.addEventListener('click',()=>go(el.dataset.go)));
function enter(withSound){soundEnabled=withSound;gate.classList.add('hidden');setTimeout(()=>gate.remove(),800)}
$('#enterWithSound').addEventListener('click',()=>enter(true));$('#enterMuted').addEventListener('click',()=>enter(false));
const aboutImage=$('.about-photo img');if(aboutImage)aboutImage.src='assets/about.jpeg';
const transitionStyle=document.createElement('style');transitionStyle.textContent=`.crt-exit-noise{position:fixed;z-index:998;inset:0;pointer-events:none;opacity:0;visibility:hidden;background:#777;overflow:hidden;transition:opacity .18s ease,visibility .18s ease}.crt-exit-noise:before{content:"";position:absolute;inset:-30%;background-image:repeating-radial-gradient(circle at 30% 20%,#eee 0 1px,#555 1px 2px,#999 2px 3px,#222 3px 4px);background-size:5px 5px;animation:crtStatic .08s steps(2) infinite;filter:contrast(1.8) grayscale(1)}.crt-exit-noise:after{content:"NO SIGNAL";position:absolute;inset:0;display:grid;place-items:center;color:#e9e9e9;font:500 11px DM Mono,monospace;letter-spacing:.34em}.crt-exit-noise.show{opacity:1;visibility:visible}.intro-page.crt-sucked{animation:crtSuck .95s cubic-bezier(.7,0,.3,1) forwards;transform-origin:50% 50%}@keyframes crtStatic{0%{transform:translate(0)}50%{transform:translate(-2%,3%)}100%{transform:translate(2%,-2%)}}@keyframes crtSuck{0%{transform:scale(1)}55%{filter:grayscale(1) contrast(1.7);transform:scale(.985)}100%{filter:grayscale(1) contrast(2.2);transform:scale(.08,.012);opacity:0}}`;document.head.appendChild(transitionStyle);const exitNoise=document.createElement('div');exitNoise.className='crt-exit-noise';document.body.appendChild(exitNoise);
function transitionIntroToAbout(){if(introTransitioning)return;introTransitioning=true;clearIntroTimers();introAudio.pause();const introPage=$('[data-page="intro"]');signalLost.textContent='NO SIGNAL';signalLost.classList.add('show');setTimeout(()=>{exitNoise.classList.add('show');introPage?.classList.add('crt-sucked')},180);setTimeout(()=>go('about'),1050);setTimeout(()=>{exitNoise.classList.remove('show');introPage?.classList.remove('crt-sucked');tv.classList.remove('playing');signalLost.classList.remove('show');signalLost.textContent='BAD SIGNAL';introTransitioning=false},1500)}
async function startIntro(){clearIntroTimers();introTransitioning=false;tv.classList.remove('playing');signalLost.classList.remove('show');introNext.disabled=true;void tv.offsetWidth;tv.classList.add('playing');let audioStarted=false;if(soundEnabled){try{introAudio.currentTime=0;await introAudio.play();audioStarted=true}catch(e){}}if(audioStarted){introAudio.onended=transitionIntroToAbout;if(Number.isFinite(introAudio.duration)&&introAudio.duration>0)introTimer.push(setTimeout(transitionIntroToAbout,(introAudio.duration+.15)*1000))}else introTimer.push(setTimeout(transitionIntroToAbout,12800))}playIntro.addEventListener('click',startIntro);


const progress=$('#songProgress'),elapsed=$('#elapsedTime'),duration=$('#durationTime'),instruction=$('#musicInstruction'),artistAudio=$('#artistAudio');
const formatTime=t=>{if(!Number.isFinite(t))return '—:—';const m=Math.floor(t/60),s=Math.floor(t%60);return `${m}:${String(s).padStart(2,'0')}`};
async function playViennaFromTurntable(){if(instruction)instruction.textContent='Needle down. Vienna is playing.';if(soundEnabled){try{viennaAudio.currentTime=0;await viennaAudio.play()}catch(e){}}}
function pauseVienna(){viennaAudio.pause();}
window.addEventListener('turntable:drop',playViennaFromTurntable);
window.addEventListener('turntable:lift',()=>{pauseVienna();if(instruction)instruction.textContent='Drag the tonearm onto the record.'});
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
const artistState={tracks:[],index:0,slug:'billy-joel',durations:[],totalDuration:0};
function morphVinylLabel(title,artist){window.dispatchEvent(new CustomEvent('turntable:label',{detail:{title,artist}}))}
async function probeDurations(tracks){
  const durations=await Promise.all(tracks.map(t=>new Promise(resolve=>{const a=new Audio();a.preload='metadata';a.src=t.src;const done=()=>resolve(Number.isFinite(a.duration)?a.duration:0);a.addEventListener('loadedmetadata',done,{once:true});a.addEventListener('error',()=>resolve(0),{once:true})})));
  artistState.durations=durations;artistState.totalDuration=durations.reduce((a,b)=>a+b,0);
}
async function loadArtistPlaylist(slug){
  const artist=artistNames[slug]||slug.toUpperCase();
  $$('.music3d-sleeve').forEach(x=>x.classList.toggle('is-active',x.dataset.artist===slug));
  morphVinylLabel(slug==='billy-joel'?'Vienna':artist,artist);
  if(artistAudio)artistAudio.pause();
  viennaAudio.pause();
  artistState.slug=slug;artistState.index=0;artistState.tracks=[];
  try{
    const res=await fetch(`music/${slug}/playlist.json?ts=${Date.now()}`,{cache:'no-store'});
    if(!res.ok)throw new Error('playlist missing');
    const data=await res.json();
    artistState.tracks=(Array.isArray(data)?data:(data.tracks||[])).filter(t=>t&&t.src);
    if(!artistState.tracks.length){if(instruction)instruction.textContent=`${artist} selected — add tracks in GitHub anytime.`;return}
    await probeDurations(artistState.tracks);
    await playArtistTrack(0);
  }catch(e){if(instruction)instruction.textContent=`${artist} selected — add tracks in GitHub anytime.`}
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
window.addEventListener('wheel',e=>{if(!$('.content-page.page--active'))e.preventDefault()},{passive:false});window.addEventListener('keydown',e=>{const p=$('.page--active')?.dataset.page;if(e.key==='ArrowRight'){const n={intro:'music',music:'work',work:'about',about:'cv'}[p];if(n)go(n)}if(e.key==='ArrowLeft'){const q={music:'intro',work:'music',about:'work',cv:'about'}[p];if(q)go(q)}});