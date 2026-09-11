const cinematicMusicStyle=document.createElement('link');cinematicMusicStyle.rel='stylesheet';cinematicMusicStyle.href='music-scene.css';document.head.appendChild(cinematicMusicStyle);
const $=(s,r=document)=>r.querySelector(s);const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const gate=$('#audioGate'),introAudio=$('#introAudio'),viennaAudio=$('#viennaAudio'),tv=$('#tvSet'),playIntro=$('#playIntro'),signalLost=$('#signalLost'),introNext=$('#introNext');
let soundEnabled=true,introTimer=[],introTransitioning=false;
function clearIntroTimers(){introTimer.forEach(clearTimeout);introTimer=[]}
function go(page){const target=$(`[data-page="${page}"]`);if(!target)return;$$('.page').forEach(p=>p.classList.toggle('page--active',p===target));if(page!=='music')pauseVienna(false)}
$$('[data-go]').forEach(el=>el.addEventListener('click',()=>go(el.dataset.go)));
function enter(withSound){soundEnabled=withSound;gate.classList.add('hidden');setTimeout(()=>gate.remove(),800)}
$('#enterWithSound')?.addEventListener('click',()=>enter(true));$('#enterMuted')?.addEventListener('click',()=>enter(false));
const aboutImage=$('.about-photo img');if(aboutImage)aboutImage.src='assets/about.jpeg';
const transitionStyle=document.createElement('style');
transitionStyle.textContent=`
.crt-exit-noise{position:fixed;z-index:998;inset:0;pointer-events:none;opacity:0;visibility:hidden;background:#666;overflow:hidden}
.crt-exit-noise:before{content:"";position:absolute;inset:-28%;background-image:repeating-radial-gradient(circle at 30% 20%,#eee 0 1px,#505050 1px 2px,#9a9a9a 2px 3px,#1d1d1d 3px 4px);background-size:5px 5px;animation:crtStatic .075s steps(2) infinite;filter:contrast(1.9) grayscale(1)}
.crt-exit-noise:after{content:"NO SIGNAL";position:absolute;inset:0;display:grid;place-items:center;color:#eee;font:500 11px DM Mono,monospace;letter-spacing:.34em;text-shadow:0 0 7px rgba(255,255,255,.38)}
.crt-impact-flash{position:fixed;z-index:999;inset:0;pointer-events:none;background:#fff;opacity:0;visibility:hidden}
.about-page.crt-about-reveal .about-wrap{animation:crtAboutReveal .82s cubic-bezier(.2,.72,.2,1) both}
.tv-set.crt-pull-in{will-change:transform,filter,opacity;z-index:997;position:relative}
@keyframes crtStatic{0%{transform:translate(0,0)}25%{transform:translate(-1.4%,1.8%)}50%{transform:translate(1.2%,-1.2%)}75%{transform:translate(-.8%,-1.4%)}100%{transform:translate(1.5%,1%)}}
@keyframes crtAboutReveal{0%{opacity:0;transform:translateY(22px)}100%{opacity:1;transform:translateY(0)}}
`;
document.head.appendChild(transitionStyle);
const exitNoise=document.createElement('div');exitNoise.className='crt-exit-noise';document.body.appendChild(exitNoise);
const impactFlash=document.createElement('div');impactFlash.className='crt-impact-flash';document.body.appendChild(impactFlash);
function wait(ms){return new Promise(r=>setTimeout(r,ms))}
async function transitionIntroToAbout(){
  if(introTransitioning)return;
  introTransitioning=true;
  clearIntroTimers();
  introAudio.pause();

  const introPage=$('[data-page="intro"]');
  const aboutPage=$('[data-page="about"]');
  signalLost.textContent='NO SIGNAL';
  signalLost.classList.add('show');

  // Pull the viewer into the TV itself — scale the TV, not the page.
  tv.classList.add('crt-pull-in');
  tv.style.transformOrigin='50% 50%';

  const pull=tv.animate([
    {transform:'scale(1)',filter:'brightness(1) contrast(1)',opacity:1,offset:0},
    {transform:'scale(1.08)',filter:'brightness(.96) contrast(1.08)',opacity:1,offset:.28},
    {transform:'scale(3.2)',filter:'brightness(.88) contrast(1.22)',opacity:1,offset:.62},
    {transform:'scale(16)',filter:'brightness(.72) contrast(1.55)',opacity:1,offset:1}
  ],{duration:1100,easing:'cubic-bezier(.55,.02,.92,.45)',fill:'forwards'});

  // Static arrives before the bezel has completely left frame.
  await wait(600);
  exitNoise.style.visibility='visible';
  exitNoise.animate([{opacity:0},{opacity:1}],{duration:280,easing:'ease-out',fill:'forwards'});

  await wait(300);

  // Impact flash at the moment we pass through the glass.
  impactFlash.style.visibility='visible';
  await impactFlash.animate([{opacity:0},{opacity:.9},{opacity:0}],{
    duration:330,
    easing:'cubic-bezier(.4,0,.2,1)',
    fill:'forwards',
    offset:[0,.22,1]
  }).finished.catch(()=>{});
  impactFlash.style.visibility='hidden';

  // CRT horizontal desync stutter.
  await exitNoise.animate([
    {transform:'translateX(0)'},
    {transform:'translateX(-10px)'},
    {transform:'translateX(8px)'},
    {transform:'translateX(-6px)'},
    {transform:'translateX(0)'}
  ],{duration:190,iterations:1,easing:'steps(1,end)'}).finished.catch(()=>{});

  await wait(300);

  // Switch behind full static so there is never a hard visible page cut.
  go('about');
  aboutPage?.classList.add('crt-about-reveal');

  await exitNoise.animate([{opacity:1},{opacity:0}],{
    duration:430,easing:'ease-out',fill:'forwards'
  }).finished.catch(()=>{});
  exitNoise.style.visibility='hidden';
  exitNoise.style.transform='';

  // Reset intro scene after it is fully hidden.
  try{pull.cancel()}catch(e){}
  tv.style.transform='';
  tv.style.filter='';
  tv.style.opacity='';
  tv.style.transformOrigin='';
  tv.classList.remove('crt-pull-in','playing');
  signalLost.classList.remove('show');
  signalLost.textContent='BAD SIGNAL';

  setTimeout(()=>aboutPage?.classList.remove('crt-about-reveal'),900);
  introTransitioning=false;
}
async function startIntro(){clearIntroTimers();introTransitioning=false;tv.classList.remove('playing');signalLost.classList.remove('show');introNext.disabled=true;void tv.offsetWidth;tv.classList.add('playing');let audioStarted=false;if(soundEnabled){try{introAudio.currentTime=0;await introAudio.play();audioStarted=true}catch(e){}}if(audioStarted){introAudio.onended=transitionIntroToAbout;if(Number.isFinite(introAudio.duration)&&introAudio.duration>0)introTimer.push(setTimeout(transitionIntroToAbout,(introAudio.duration+.15)*1000))}else introTimer.push(setTimeout(transitionIntroToAbout,12800))}playIntro.addEventListener('click',startIntro);


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
window.addEventListener('wheel',e=>{if(!$('.content-page.page--active'))e.preventDefault()},{passive:false});window.addEventListener('keydown',e=>{const p=$('.page--active')?.dataset.page;if(e.key==='ArrowRight'){const n={intro:'music',music:'work',work:'about',about:'cv'}[p];if(n)go(n)}if(e.key==='ArrowLeft'){const q={music:'intro',work:'music',about:'work',cv:'about'}[p];if(q)go(q)}});