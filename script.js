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
const aboutImage=$('.about-photo img');

async function loadLoadingMedia(){
  try{
    const res=await fetch('content/intro/manifest.json?ts='+Date.now(),{cache:'no-store'});
    if(!res.ok)return;
    const cfg=await res.json();
    const items=(cfg.items||[]).filter(x=>x&&x.src);
    const montage=$('#montage');
    if(!montage||!items.length)return;

    montage.innerHTML='';
    const sequenceSeconds=Number(cfg.sequenceSeconds)||11.4;
    const slot=Math.max(.42,Math.min(2.3,sequenceSeconds/items.length));
    const duration=Math.max(.5,slot*1.12);

    items.forEach((item,i)=>{
      const figure=document.createElement('figure');
      figure.dataset.dynamic='true';
      figure.style.setProperty('--item-delay',(.12+i*slot)+'s');
      figure.style.setProperty('--item-duration',duration+'s');

      if((item.type||'image').toLowerCase()==='video'){
        const video=document.createElement('video');
        video.src=item.src;
        video.muted=true;
        video.loop=true;
        video.playsInline=true;
        video.preload='metadata';
        video.setAttribute('aria-hidden','true');
        figure.appendChild(video);
      }else{
        const img=document.createElement('img');
        img.src=item.src;
        img.alt=item.alt||'Avaneesh';
        img.loading='eager';
        figure.appendChild(img);
      }
      montage.appendChild(figure);
    });
  }catch(e){console.warn('loading media config unavailable',e)}
}

async function loadAboutContent(){
  try{
    const res=await fetch('content/about/about.json?ts='+Date.now(),{cache:'no-store'});
    if(!res.ok)return;
    const cfg=await res.json();
    if(aboutImage&&cfg.image)aboutImage.src=cfg.image;
    const heading=$('.about-text h2');
    if(heading&&cfg.headlineHtml)heading.innerHTML=cfg.headlineHtml;
    const aboutText=$('.about-text');
    if(aboutText&&Array.isArray(cfg.paragraphs)){
      $$('.about-text p').forEach(p=>p.remove());
      cfg.paragraphs.forEach(t=>{
        const p=document.createElement('p');
        p.textContent=t;
        aboutText.appendChild(p);
      });
    }
  }catch(e){console.warn('about config unavailable',e)}
}

async function loadWorkFromResume(){
  try{
    const res=await fetch('content/work/resume.json?ts='+Date.now(),{cache:'no-store'});
    if(!res.ok)return;
    const cfg=await res.json();
    const grid=$('.work-grid');
    if(grid&&Array.isArray(cfg.work)&&cfg.work.length){
      grid.innerHTML=cfg.work.map((item,i)=>`
        <article>
          <span>${String(i+1).padStart(2,'0')}</span>
          <h3>${item.title||''}</h3>
          <p>${item.description||''}</p>
          <strong>${item.metric||''}</strong>
          <small>${item.metricLabel||''}</small>
        </article>`).join('');
    }
    const label=$('[data-page="work"] .section-num');
    if(label)label.textContent=cfg.label||'03 / SELECTED WORK — FROM CURRENT RESUME';

    const cvs=$$('.cv-choice');
    if(cvs[0]&&cfg.productResume)cvs[0].href=cfg.productResume;
    if(cvs[1]&&cfg.foundersOfficeResume)cvs[1].href=cfg.foundersOfficeResume;
  }catch(e){console.warn('resume config unavailable',e)}
}

async function loadPortfolioContent(){
  await Promise.all([loadLoadingMedia(),loadAboutContent(),loadWorkFromResume()]);
}
loadPortfolioContent();
const transitionStyle=document.createElement('style');
transitionStyle.textContent=`
.crt-exit-noise{position:fixed;z-index:998;inset:0;pointer-events:none;opacity:0;visibility:hidden;background:#666;overflow:hidden}
.crt-exit-noise:before{content:"";position:absolute;inset:-28%;background-image:repeating-radial-gradient(circle at 30% 20%,#eee 0 1px,#505050 1px 2px,#9a9a9a 2px 3px,#1d1d1d 3px 4px),repeating-linear-gradient(0deg,rgba(255,255,255,.07) 0 1px,rgba(0,0,0,.08) 1px 3px);background-size:5px 5px,100% 3px;animation:crtStatic .065s steps(2) infinite;filter:contrast(1.95) grayscale(1)}
.crt-exit-noise:after{content:"NO SIGNAL";position:absolute;inset:0;display:grid;place-items:center;color:#eee;font:500 11px DM Mono,monospace;letter-spacing:.34em;text-shadow:0 0 7px rgba(255,255,255,.38)}
.crt-impact-flash{position:fixed;z-index:999;inset:0;pointer-events:none;background:#fff;opacity:0;visibility:hidden}
.about-page.crt-about-reveal .about-wrap{animation:crtAboutReveal .82s cubic-bezier(.2,.72,.2,1) both}
.tv-stage{overflow:visible!important}.intro-page{overflow:visible!important}.tv-set.crt-pull-in{will-change:transform,filter,opacity;position:fixed!important;z-index:9999!important;margin:0!important;transform-origin:50% 50%!important}
@keyframes crtStatic{0%{transform:translate(0,0)}25%{transform:translate(-1.4%,1.8%)}50%{transform:translate(1.2%,-1.2%)}75%{transform:translate(-.8%,-1.4%)}100%{transform:translate(1.5%,1%)}}
#montage figure{transition:opacity var(--montage-speed,.72s) linear,filter var(--montage-speed,.72s) linear,transform var(--montage-speed,.72s) ease}.montage.montage-fast figure{animation-duration:.42s!important;transition-duration:.20s!important}@keyframes crtAboutReveal{0%{opacity:0;transform:translateY(22px)}100%{opacity:1;transform:translateY(0)}}
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

  const aboutPage=$('[data-page="about"]');
  const rect=tv.getBoundingClientRect();
  const cx=rect.left+rect.width/2;
  const cy=rect.top+rect.height/2;
  const dx=cx-window.innerWidth/2;
  const dy=cy-window.innerHeight/2;

  signalLost.textContent='NO SIGNAL';
  signalLost.classList.add('show');

  // Lock TV to the viewport at its exact current visual position.
  tv.classList.add('crt-pull-in');
  tv.style.width=rect.width+'px';
  tv.style.height=rect.height+'px';
  tv.style.left='50%';
  tv.style.top='50%';
  tv.style.position='fixed';
  tv.style.zIndex='9999';
  tv.style.margin='0';
  tv.style.transformOrigin='50% 50%';

  const startTransform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(1)`;
  tv.style.transform=startTransform;

  // Fast suction: small anticipation, then hard acceleration into the glass.
  const pull=tv.animate([
    {transform:startTransform,filter:'blur(0px) brightness(1) contrast(1)',offset:0},
    {transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.98)`,filter:'blur(0px) brightness(.98) contrast(1.03)',offset:.10},
    {transform:'translate(-50%,-50%) scale(1.55)',filter:'blur(0px) brightness(1.02) contrast(1.12)',offset:.28},
    {transform:'translate(-50%,-50%) scale(7.5)',filter:'blur(1.5px) brightness(1.08) contrast(1.28)',offset:.62},
    {transform:'translate(-50%,-50%) scale(46)',filter:'blur(12px) brightness(1.25) contrast(1.55)',offset:1}
  ],{
    duration:680,
    easing:'cubic-bezier(.78,.02,.98,.28)',
    fill:'forwards'
  });

  // Let the TV visibly grow first, then flood the screen with grey CRT noise.
  await wait(400);
  exitNoise.style.visibility='visible';
  exitNoise.style.opacity='0';
  exitNoise.style.transform='translateX(0)';
  exitNoise.animate(
    [{opacity:0},{opacity:.22,offset:.35},{opacity:1}],
    {duration:190,easing:'linear',fill:'forwards'}
  );

  await wait(145);

  // Impact flash + tiny jolt as the viewer "hits" the screen.
  impactFlash.style.visibility='visible';
  const shake=document.body.animate([
    {transform:'translateX(0)'},
    {transform:'translateX(5px)'},
    {transform:'translateX(-4px)'},
    {transform:'translateX(3px)'},
    {transform:'translateX(0)'}
  ],{duration:135,easing:'steps(1,end)'});
  await impactFlash.animate(
    [{opacity:0},{opacity:.82,offset:.18},{opacity:0}],
    {duration:150,easing:'ease-out',fill:'forwards'}
  ).finished.catch(()=>{});
  impactFlash.style.visibility='hidden';
  await shake.finished.catch(()=>{});

  // Grey/no-signal hold.
  await exitNoise.animate([
    {transform:'translateX(0)'},
    {transform:'translateX(-10px)'},
    {transform:'translateX(7px)'},
    {transform:'translateX(-4px)'},
    {transform:'translateX(0)'}
  ],{duration:110,easing:'steps(1,end)'}).finished.catch(()=>{});
  await wait(260);

  // Switch pages while grey static fully covers the viewport.
  go('about');
  aboutPage?.classList.add('crt-about-reveal');

  // Grey scene dissolves to reveal About.
  await exitNoise.animate(
    [{opacity:1},{opacity:.92,offset:.25},{opacity:0}],
    {duration:520,easing:'cubic-bezier(.2,.7,.2,1)',fill:'forwards'}
  ).finished.catch(()=>{});

  exitNoise.style.visibility='hidden';
  exitNoise.style.opacity='0';
  exitNoise.style.transform='';

  try{pull.cancel()}catch(e){}
  tv.style.width='';
  tv.style.height='';
  tv.style.left='';
  tv.style.top='';
  tv.style.position='';
  tv.style.zIndex='';
  tv.style.margin='';
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
async function startIntro(){clearIntroTimers();introTransitioning=false;tv.classList.remove('playing');signalLost.classList.remove('show');introNext.disabled=true;void tv.offsetWidth;tv.classList.add('playing');let audioStarted=false;if(soundEnabled){try{introAudio.currentTime=0;await introAudio.play();audioStarted=true}catch(e){}}if(audioStarted){introAudio.onended=transitionIntroToAbout;if(Number.isFinite(introAudio.duration)&&introAudio.duration>0)introTimer.push(setTimeout(transitionIntroToAbout,(introAudio.duration+.15)*1000))}else introTimer.push(setTimeout(transitionIntroToAbout,12800))}playIntro?.addEventListener('click',startIntro);


const progress=$('#songProgress'),elapsed=$('#elapsedTime'),duration=$('#durationTime'),instruction=$('#musicInstruction'),artistAudio=$('#artistAudio');
const formatTime=t=>{if(!Number.isFinite(t))return '—:—';const m=Math.floor(t/60),s=Math.floor(t%60);return `${m}:${String(s).padStart(2,'0')}`};
function primeSelectedAudio(track){
  if(!artistAudio||!track||!soundEnabled)return;
  try{
    const target=new URL(track.src,location.href).href;
    if(artistAudio.src!==target)artistAudio.src=track.src;
    artistAudio.currentTime=0;
    artistAudio.muted=true;
    const p=artistAudio.play();
    if(p&&p.catch)p.catch(()=>{});
  }catch(e){}
}

window.addEventListener('turntable:primeSelected',()=>{
  const track=artistState.tracks[artistState.index]||artistState.tracks[0];
  primeSelectedAudio(track);
});

async function playSelectedFromTurntable(){
  const artist=artistNames[artistState.slug]||'BILLY JOEL';
  viennaAudio.pause();
  if(artistState.tracks.length){
    await playArtistTrack(0);
  }else if(instruction){
    instruction.textContent=artist+' has no uploaded tracks yet.';
  }
}
function pauseVienna(){viennaAudio.pause();if(artistAudio)artistAudio.pause();}
window.addEventListener('turntable:drop',playSelectedFromTurntable);
window.addEventListener('turntable:lift',()=>{pauseVienna();if(instruction&&!instruction.textContent.includes('switching'))instruction.textContent='Press the turntable button to lower the needle.'});
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
const musicLibrary={
  'billy-joel':[{title:'Vienna',src:'assets/vienna.mp3.mp3'}],
  'ed-sheeran':[{title:'The Hills of Aberfeldy',src:'music/ed-sheeran/Ed%20Sheeran%20-%20The%20Hills%20of%20Aberfeldy%20%5BOfficial%20Video%5D.mp3'}],
  'michael-jackson':[{title:'Chicago',src:'music/michael-jackson/Michael%20Jackson%20-%20Chicago%20%28Official%20Audio%29.mp3'}],
  'queen':[{title:'Love Of My Life',src:'music/queen/Queen%20-%20Love%20Of%20My%20Life%20%5BLyrics%5D.mp3'}],
  'elton-john':[{title:'Yellow Brick Road',src:'music/elton-john/yellow%20brick%20road.weba'}]
};

function updateArtistCard(slug,title,playing=false){
  const card=document.querySelector('.music3d-sleeve[data-artist="'+slug+'"]');
  if(!card)return;
  const small=card.querySelector('small');
  if(small)small.textContent=title ? (playing ? title+' · PLAYING' : title) : '+ ADD MUSIC';
  card.classList.toggle('is-playing',!!playing);
}

async function getArtistTracks(slug){
  return (musicLibrary[slug]||[]).map(t=>({...t}));
}

async function syncArtistCardsFromFolders(){
  Object.keys(artistNames).forEach(slug=>{
    const tracks=musicLibrary[slug]||[];
    updateArtistCard(slug,tracks[0]?.title||'');
  });
}

async function loadArtistPlaylist(slug){
  const artist=artistNames[slug]||slug.toUpperCase();
  const immediateTrack=(musicLibrary[slug]||[])[0];
  if(immediateTrack)morphVinylLabel(immediateTrack.title,artist);
  const sameArtist=artistState.slug===slug;
  const wasPlaying=!!((artistAudio&&!artistAudio.paused)||(viennaAudio&&!viennaAudio.paused));
  if(wasPlaying&&immediateTrack)primeSelectedAudio(immediateTrack);
  $$$('.music3d-sleeve').forEach(x=>{x.classList.toggle('is-active',x.dataset.artist===slug);x.classList.remove('is-playing');});
  if(artistAudio)artistAudio.pause();
  viennaAudio.pause();
  artistState.slug=slug;artistState.index=0;artistState.durations=[];artistState.totalDuration=0;
  artistState.tracks=await getArtistTracks(slug);
  if(slug==='billy-joel'&&!artistState.tracks.length){artistState.tracks=[{title:'Vienna',src:'assets/vienna.mp3.mp3'}];}
  if(artistState.tracks.length)await probeDurations(artistState.tracks);
  const first=artistState.tracks[0];
  const nextTitle=first?.title||artist;
  artistState.selectedTitle=nextTitle;
  updateArtistCard(slug,first?.title||'');
  if(instruction)instruction.textContent=artistState.tracks.length ? artist+' — '+nextTitle+(wasPlaying?' switching…':' selected. Press the turntable button to lower the needle.') : artist+' selected — add audio files inside music/'+slug+'/';
  if(wasPlaying&&artistState.tracks.length){window.dispatchEvent(new CustomEvent('turntable:switchTrack'));}
}
async function playArtistTrack(i){
  const track=artistState.tracks[i];if(!track||!artistAudio)return;
  artistState.index=i;
  const target=new URL(track.src,location.href).href;
  const alreadyPrimed=artistAudio.src===target&&!artistAudio.paused;
  if(artistAudio.src!==target){
    artistAudio.src=track.src;
    artistAudio.currentTime=0;
  }
  const artist=artistNames[artistState.slug]||'';
  morphVinylLabel(track.title||artist||'VINYL',artist);
  updateArtistCard(artistState.slug,track.title||artist,true);
  if(instruction)instruction.textContent=artist+' — '+(track.title||artist)+' playing.';
  if(soundEnabled){
    artistAudio.muted=false;
    artistAudio.volume=1;
    if(!alreadyPrimed){
      try{await artistAudio.play()}catch(e){
        if(instruction)instruction.textContent='Tap the turntable button once more to allow audio.';
      }
    }
  }
}
if(artistAudio)artistAudio.addEventListener('timeupdate',()=>{
  const prior=artistState.durations.slice(0,artistState.index).reduce((a,b)=>a+b,0);
  const current=Number.isFinite(artistAudio.currentTime)?artistAudio.currentTime:0;
  const total=artistState.totalDuration||artistAudio.duration||1;
  window.dispatchEvent(new CustomEvent('turntable:progress',{detail:{progress:Math.min(1,(prior+current)/total)}}));
});
if(artistAudio)artistAudio.addEventListener('ended',()=>{const n=artistState.index+1;if(n<artistState.tracks.length)playArtistTrack(n);else if(instruction)instruction.textContent='Playlist finished.'});
$$('.music3d-sleeve').forEach(s=>s.addEventListener('click',()=>loadArtistPlaylist(s.dataset.artist)));
syncArtistCardsFromFolders();
updateArtistCard('billy-joel','Vienna');
morphVinylLabel('Vienna','BILLY JOEL');
window.addEventListener('wheel',e=>{if(!$('.content-page.page--active'))e.preventDefault()},{passive:false});