
const $ = (sel, el=document) => el.querySelector(sel);
const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));

const state = {
  beats: [],
  kits: [],
  plugins: [],
  tutorials: [],
  filteredText: ""
};

// UI helpers
function fmtTime(sec){
  const m = Math.floor(sec/60)||0;
  const s = Math.floor(sec%60)||0;
  return `${m}:${String(s).padStart(2,'0')}`;
}

// Menu mobile
function toggleMenu(){
  const menu = $("#menu");
  const isOpen = menu.classList.toggle("open");
  $(".burger").setAttribute("aria-expanded", isOpen ? "true" : "false");
}
window.toggleMenu = toggleMenu;

// Audio player
const audio = $("#player");
const playBtn = $("#playPauseBtn");
const progress = $("#progress");
const bar = $("#progressBar");
const timeLabel = $("#timeLabel");
const nowPlaying = $("#nowPlaying");
const volume = $("#volume");

let currentTrack = null;

function loadTrack(track){
  audio.src = track.audio;
  audio.play();
  nowPlaying.textContent = `Tocando: ${track.title} — ${track.producer}`;
  playBtn.textContent = "⏸";
  currentTrack = track;
  localStorage.setItem("uv-volume", volume.value);
}

playBtn.addEventListener("click", () => {
  if(!audio.src && state.beats[0]){
    loadTrack(state.beats[0]);
    return;
  }
  if(audio.paused){ audio.play(); playBtn.textContent = "⏸"; }
  else { audio.pause(); playBtn.textContent = "▶︎"; }
});

audio.addEventListener("timeupdate", () => {
  const pct = (audio.currentTime / (audio.duration || 1)) * 100;
  bar.style.width = `${pct}%`;
  timeLabel.textContent = `${fmtTime(audio.currentTime)} / ${fmtTime(audio.duration || 0)}`;
});

progress.addEventListener("click", (e) => {
  const rect = progress.getBoundingClientRect();
  const pct = (e.clientX - rect.left) / rect.width;
  audio.currentTime = (audio.duration || 0) * pct;
});

volume.addEventListener("input", () => {
  audio.volume = Number(volume.value);
  localStorage.setItem("uv-volume", volume.value);
});

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
  if (e.code === "Space"){
    e.preventDefault();
    playBtn.click();
  } else if (e.code === "ArrowRight"){
    audio.currentTime = Math.min(audio.currentTime + 5, audio.duration || audio.currentTime + 5);
  } else if (e.code === "ArrowLeft"){
    audio.currentTime = Math.max(audio.currentTime - 5, 0);
  } else if (e.key.toLowerCase() === "m"){
    audio.muted = !audio.muted;
  }
});

// Renderers
function cardBeat(b){
  const tags = (b.tags||[]).map(t => `<span class="badge">${t}</span>`).join(" ");
  return `
  <article class="card">
    <div class="item-cover"><img src="${b.cover}" alt="Capa do beat ${b.title}" style="max-width:100%; max-height:100%"></div>
    <div class="meta"><strong>${b.title}</strong><span class="pill">${b.bpm} BPM</span></div>
    <div class="small" style="color:#93a4b7">${b.genre} • ${b.key}</div>
    <div class="small" style="margin:6px 0">${tags}</div>
    <div class="controls">
      <button class="btn-ghost" onclick='play("${b.id}")'>Play</button>
      <a class="btn" href="#">Licença ${b.license.replaceAll("-", " ")}</a>
    </div>
  </article>`;
}

function cardKit(k){
  return `
  <article class="card">
    <div class="item-cover"><img src="${k.cover}" alt="Capa do kit ${k.name}" style="max-width:100%; max-height:100%"></div>
    <div class="meta"><strong>${k.name}</strong><span class="pill">${k.type}</span></div>
    <div class="small">Formato: ${k.formats.join(", ")} • Tamanho: ${k.size_mb}MB</div>
    <div class="controls" style="margin-top:8px">
      <button class="btn-ghost" onclick='demo("${k.demo_audio}")'>Preview</button>
      <a class="btn" href="#">Download</a>
    </div>
  </article>`;
}

function cardPlugin(p){
  return `
  <article class="card">
    <div class="item-cover"><img src="${p.image}" alt="Imagem do plugin ${p.name}" style="max-width:100%; max-height:100%"></div>
    <div class="meta"><strong>${p.name}</strong><span class="pill">${p.status}</span></div>
    <div class="small">Plataformas: ${p.platforms.join(", ")} • Formatos: ${p.formats.join(", ")}</div>
    <div class="controls" style="margin-top:8px">
      <button class="btn-ghost" onclick='demo("${p.demo_audio}")'>Preview</button>
      <a class="btn" href="#">Detalhes</a>
    </div>
  </article>`;
}

function cardTutorial(t){
  return `
  <article class="card">
    <div class="item-cover">Tutorial</div>
    <div class="meta"><strong>${t.title}</strong><span class="pill">${t.topic}</span></div>
    <div class="small">${t.summary}</div>
    <div class="controls" style="margin-top:8px">
      <a class="btn" href="${t.url}">Assistir (${t.length_min} min)</a>
    </div>
  </article>`;
}

// Playback helpers
function play(id){
  const track = state.beats.find(b => b.id === id);
  if(!track) return;
  loadTrack(track);
}
window.play = play;

function demo(url){
  if(!url) return;
  audio.src = url;
  audio.play();
  nowPlaying.textContent = "Preview do pack/plugin";
  playBtn.textContent = "⏸";
}
window.demo = demo;

// Data loading + search
async function fetchJSON(path){
  const res = await fetch(path);
  return res.json();
}

function renderAll(){
  const txt = state.filteredText.toLowerCase();
  const matches = (s) => (s||"").toString().toLowerCase().includes(txt);

  // Beats
  const beats = state.beats.filter(b =>
    !txt ||
    matches(b.title) || matches(b.genre) || matches(b.key) ||
    (b.tags||[]).some(t => matches(t)) || matches(b.producer)
  );
  $("#beatsGrid").innerHTML = beats.map(cardBeat).join("");

  // Kits
  const kits = state.kits.filter(k =>
    !txt || matches(k.name) || matches(k.type) || (k.formats||[]).some(f => matches(f))
  );
  $("#kitsGrid").innerHTML = kits.map(cardKit).join("");

  // Plugins
  const plugins = state.plugins.filter(p =>
    !txt || matches(p.name) || matches(p.type) || (p.platforms||[]).some(pl => matches(pl))
  );
  $("#pluginsGrid").innerHTML = plugins.map(cardPlugin).join("");

  // Tutorials
  const tutorials = state.tutorials.filter(t =>
    !txt || matches(t.title) || matches(t.topic) || matches(t.summary)
  );
  $("#tutorialsGrid").innerHTML = tutorials.map(cardTutorial).join("");
}

async function init(){
  try{
    state.beats = await fetchJSON("data/beats.json");
    state.kits = await fetchJSON("data/kits.json");
    state.plugins = await fetchJSON("data/plugins.json");
    state.tutorials = await fetchJSON("data/tutorials.json");
  } catch(e){
    console.error("Erro ao carregar JSON", e);
  }
  const savedVol = localStorage.getItem("uv-volume");
  if(savedVol) { volume.value = savedVol; audio.volume = Number(savedVol); }
  renderAll();
}
init();

$("#searchInput")?.addEventListener("input", (e) => {
  state.filteredText = e.target.value || "";
  renderAll();
});

// Contact form dummy handler
function handleSubmit(e){
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form).entries());
  alert("Mensagem enviada! (mock)\\n" + JSON.stringify(data, null, 2));
  form.reset();
  return false;
}
window.handleSubmit = handleSubmit;

$("#year").textContent = new Date().getFullYear();
