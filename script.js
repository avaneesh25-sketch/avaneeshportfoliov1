const powerBtn = document.getElementById('powerBtn');
const introAudio = document.getElementById('introAudio');
const tvStage = document.querySelector('.tv-stage');
const tvOff = document.getElementById('tvOff');
const introHint = document.getElementById('introHint');
let played = false;

powerBtn.addEventListener('click', async () => {
  if (played) {
    introAudio.currentTime = 0;
  }
  played = true;
  tvStage.classList.remove('playing');
  void tvStage.offsetWidth;
  tvStage.classList.add('playing');
  tvOff.textContent = '';
  introHint.textContent = 'playing the opening sequence…';
  try {
    introAudio.currentTime = 0;
    await introAudio.play();
  } catch(e) {
    introHint.textContent = 'Tap POWER again to allow sound.';
  }
  setTimeout(() => { introHint.textContent = 'scroll when the signal cuts.'; }, 11200);
  setTimeout(() => { tvOff.textContent = 'SIGNAL LOST'; tvOff.style.display='grid'; }, 12750);
});

const tonearm = document.getElementById('tonearm');
const record = document.getElementById('record');
const songTitle = document.getElementById('songTitle');
let dropped = false;
tonearm.addEventListener('click', () => {
  dropped = !dropped;
  tonearm.classList.toggle('dropped', dropped);
  record.classList.toggle('spinning', dropped);
  songTitle.textContent = dropped ? 'Now spinning: Avaneesh’s Apple Music' : 'Then step into my music.';
});

// subtle parallax on the TV and turntable
for (const el of [document.querySelector('.tv-shell'), document.querySelector('.turntable')]) {
  if (!el) continue;
  el.addEventListener('mousemove', (e) => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5;
    const y = (e.clientY - r.top) / r.height - .5;
    el.style.setProperty('--mx', x);
    el.style.setProperty('--my', y);
  });
}

// keyboard shortcuts mirror the visible keys
window.addEventListener('keydown', (e) => {
  if (e.target.matches('input,textarea')) return;
  const key = e.key.toLowerCase();
  const map = {
    w:'#work', a:'#about',
    r:'assets/Avaneesh_Pramod_Resume.pdf',
    l:'https://www.linkedin.com/in/avaneesh-pramod-805527280/',
    i:'https://www.instagram.com/hakuna.matata2510/',
    m:'https://music.apple.com/profile/avipp2510',
    c:'mailto:avaneeshpramod25@gmail.com'
  };
  const dest = map[key];
  if (!dest) return;
  if (dest.startsWith('#')) document.querySelector(dest)?.scrollIntoView({behavior:'smooth'});
  else if (dest.startsWith('mailto:')) location.href=dest;
  else window.open(dest,'_blank');
});
