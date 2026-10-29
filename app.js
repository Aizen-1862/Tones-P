(() => {
  const $ = (id) => document.getElementById(id);
  const audio = $("audio");
  const stage = $("stage");
  const canvas = $("visualCanvas");
  const ctx = canvas.getContext("2d");
  const state = { mood: "auto", trackMood: "auto", lyrics: [], currentLine: -1, objectUrl: null, audioContext: null, analyser: null, source: null, data: null, particles: [], favorite: false, playing: false, apiTracks: [] };
  const palettes = {
    playful: { label:"PLAYFUL POP", colors:[[255,126,211],[255,213,104],[102,231,228]], background:"linear-gradient(135deg,#25122d,#17122b 55%,#2b1730)", animation:"playful" },
    emotional: { label:"EMOTIONAL", colors:[[104,153,255],[181,126,255],[255,143,190]], background:"linear-gradient(135deg,#101b38,#17132d 55%,#28162f)", animation:"emotional" },
    hype: { label:"HIGH ENERGY", colors:[[255,107,82],[255,192,86],[102,224,255]], background:"linear-gradient(135deg,#301523,#21142d 55%,#10253b)", animation:"hype" },
    dreamy: { label:"DREAM STATE", colors:[[120,237,220],[176,158,255],[255,171,224]], background:"linear-gradient(135deg,#102a32,#19172f 55%,#25172e)", animation:"dreamy" }
  };
  const moodWords = {
    playful: ["happy","fun","party","dance","love","summer","smile","pop","cute","baby","tonight"],
    emotional: ["sad","alone","heart","cry","miss","goodbye","broken","pain","tears","sorry","hurt"],
    hype: ["fire","run","fight","power","wild","strong","beat","fast","champion","win","energy"],
    dreamy: ["dream","moon","stars","sky","night","ocean","sleep","cloud","float","slow","wonder"]
  };
  const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
  function formatTime(s) { if (!Number.isFinite(s)) return "0:00"; return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`; }
  function selectedMood() {
    if (state.mood !== "auto") return state.mood;
    if (state.trackMood && state.trackMood !== "auto") return state.trackMood;
    const title = `${$("trackTitle").textContent} ${$("trackArtist").textContent}`.toLowerCase();
    for (const [m, words] of Object.entries(moodWords)) if (words.some(w => title.includes(w))) return m;
    if (state.analyser && state.data) {
      let sum = 0; for (const v of state.data) sum += v;
      const avg = sum / Math.max(1,state.data.length);
      if (avg > 115) return "hype";
    }
    return "playful";
  }
  function applyMood(mood) {
    const p = palettes[mood] || palettes.playful;
    document.documentElement.style.setProperty("--theme1",p.colors[0].join(","));
    document.documentElement.style.setProperty("--theme2",p.colors[1].join(","));
    document.documentElement.style.setProperty("--theme3",p.colors[2].join(","));
    document.documentElement.style.setProperty("--accent",`rgb(${p.colors[0].join(",")})`);
    document.documentElement.style.setProperty("--accent2",`rgb(${p.colors[1].join(",")})`);
    stage.style.background = `radial-gradient(ellipse at 25% 25%,rgba(${p.colors[0].join(",")},.3),transparent 42%),radial-gradient(ellipse at 78% 70%,rgba(${p.colors[1].join(",")},.2),transparent 45%),${p.background}`;
    $("styleName").textContent = p.label;
    $("moodLabel").textContent = state.playing ? p.label.toLowerCase().replace(/(^|\s)\S/g,s=>s.toUpperCase()) : `${p.label.toLowerCase().replace(/(^|\s)\S/g,s=>s.toUpperCase())} preview`;
    document.querySelectorAll(".mood-option").forEach(b => b.classList.toggle("active", b.dataset.mood === state.mood));
    renderLyrics();
  }
  function parseLRC(text) {
    const lines = [];
    for (const raw of text.split(/\r?\n/)) {
      const matches = [...raw.matchAll(/\[(\d{1,2}):(\d{2}(?:\.\d{1,3})?)\]/g)];
      const lyric = raw.replace(/\[\d{1,2}:\d{2}(?:\.\d{1,3})?\]/g,"").trim();
      if (!lyric || !matches.length) continue;
      for (const m of matches) lines.push({ time: Number(m[1])*60 + Number(m[2]), text: lyric });
    }
    return lines.sort((a,b)=>a.time-b.time);
  }
  function renderLyrics() {
    const container = $("lyricLines");
    if (!state.lyrics.length) return;
    const time = audio.currentTime || 0;
    let idx = -1;
    for (let i=0;i<state.lyrics.length;i++) { if (state.lyrics[i].time <= time) idx=i; else break; }
    if (idx === state.currentLine && container.dataset.rendered === "true") return;
    state.currentLine = idx; container.dataset.rendered = "true"; container.innerHTML = "";
    if (idx < 0) {
      const next = state.lyrics[0];
      const waiting = document.createElement("div"); waiting.className="lyric-line active"; waiting.textContent="The song is about to speak…"; container.append(waiting); return;
    }
    const mood = selectedMood();
    [idx-1,idx,idx+1].forEach((i,offset)=>{
      if (i<0 || i>=state.lyrics.length) return;
      const div=document.createElement("div");
      div.className=`lyric-line ${i===idx?"active":i<idx?"previous":"next"}`;
      if (i===idx) {
        state.lyrics[i].text.split(/\s+/).forEach((word,j)=>{
          const span=document.createElement("span"); span.className="word"; span.style.setProperty("--i",j); span.textContent=word; div.append(span,document.createTextNode(" "));
        });
        if (mood==="playful") div.style.transform="rotate(-1deg)";
        if (mood==="hype") div.style.textTransform="uppercase";
        if (mood==="dreamy") div.style.letterSpacing=".02em";
      } else div.textContent=state.lyrics[i].text;
      container.append(div);
    });
  }
  function loadLyrics(text) {
    state.lyrics = parseLRC(text);
    state.currentLine=-1;
    $("lyricLines").dataset.rendered="false";
    $("lyricKicker").textContent = state.lyrics.length ? "SYNCHRONIZED LYRICS" : "NO TIMED LYRICS FOUND";
    if (!state.lyrics.length) $("lyricLines").innerHTML='<div class="placeholder-title">No timestamps <em>found.</em></div><p class="placeholder-hint">Use LRC format such as [00:01.00]First line.</p>';
    else renderLyrics();
  }
  function showPlaceholder() {
    $("lyricLines").dataset.rendered="false";
    $("lyricLines").innerHTML='<div class="placeholder-title">Drop a track.<br><em>Watch it come alive.</em></div><p class="placeholder-hint">Load an audio file and optional timed lyrics to try the experience.</p>';
  }
  function setTrack({title,artist,audioUrl,artworkUrl,mood,lyrics}) {
    if (state.objectUrl) { URL.revokeObjectURL(state.objectUrl); state.objectUrl=null; }
    audio.src=audioUrl;
    $("trackTitle").textContent=title||"Untitled track";
    $("trackArtist").textContent=artist||"Unknown artist";
    $("audioStatus").textContent="Ready to play";
    state.trackMood=mood||"auto"; state.currentLine=-1; state.playing=false;
    $("playButton").textContent="▶";
    const art=$("artwork"); art.innerHTML="";
    if (artworkUrl) { const img=new Image(); img.src=artworkUrl; img.alt=""; art.append(img); } else art.textContent="♪";
    if (lyrics) { $("lyricsInput").value=lyrics; loadLyrics(lyrics); }
    else { state.lyrics=[]; $("lyricsInput").value=""; showPlaceholder(); }
    applyMood(selectedMood());
    audio.load();
  }
  async function setupAnalyser() {
    if (state.analyser || !window.AudioContext && !window.webkitAudioContext) return;
    try {
      const AC=window.AudioContext||window.webkitAudioContext;
      state.audioContext=new AC();
      state.analyser=state.audioContext.createAnalyser(); state.analyser.fftSize=128;
      state.data=new Uint8Array(state.analyser.frequencyBinCount);
      state.source=state.audioContext.createMediaElementSource(audio);
      state.source.connect(state.analyser); state.analyser.connect(state.audioContext.destination);
    } catch(e) { console.warn("Audio analysis unavailable; playback still works.",e); }
  }
  function resizeCanvas() {
    const rect=stage.getBoundingClientRect(), dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.max(1,Math.floor(rect.width*dpr)); canvas.height=Math.max(1,Math.floor(rect.height*dpr));
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  function initParticles() {
    state.particles=Array.from({length:35},()=>({x:Math.random(),y:Math.random(),r:1+Math.random()*3,s:.0004+Math.random()*.001,phase:Math.random()*6.28}));
  }
  function animate(now) {
    const w=stage.clientWidth,h=stage.clientHeight;
    ctx.clearRect(0,0,w,h);
    const mood=selectedMood(), p=palettes[mood]||palettes.playful;
    let energy=0;
    if (state.analyser && state.data && state.playing) {
      state.analyser.getByteFrequencyData(state.data);
      for (const v of state.data) energy+=v;
      energy=energy/Math.max(1,state.data.length)/255;
    }
    state.particles.forEach((pt,i)=>{
      pt.y-=pt.s*(1+energy*4); pt.x+=Math.sin(now*.0005+pt.phase)*.00025;
      if(pt.y<-.04){pt.y=1.04;pt.x=Math.random()}
      const x=pt.x*w+Math.sin(now*.0004+pt.phase)*9, y=pt.y*h;
      const c=p.colors[i%p.colors.length];
      ctx.beginPath();ctx.fillStyle=`rgba(${c.join(",")},${.16+energy*.42})`;ctx.arc(x,y,pt.r+energy*2,0,Math.PI*2);ctx.fill();
    });
    if (state.playing && energy>.05 && mood==="hype") {
      ctx.strokeStyle=`rgba(${p.colors[0].join(",")},${energy*.15})`;ctx.lineWidth=1;
      for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(w/2,h/2,30+i*24+energy*35,0,Math.PI*2);ctx.stroke()}
    }
    requestAnimationFrame(animate);
  }
  function setCatalogueStatus(message, isError=false) {
    const el = $("catalogueStatus"); if (!el) return; el.textContent = message; el.classList.toggle("is-error", isError);
  }
  function makeArtworkPlaceholder() { const el=document.createElement("span"); el.className="catalogue-art catalogue-art-placeholder"; el.setAttribute("aria-hidden","true"); el.textContent="♪"; return el; }
  function renderCatalogue(tracks) {
    const grid=$("catalogueGrid"); grid.replaceChildren();
    tracks.forEach(track => {
      const card=document.createElement("article"); card.className="catalogue-card";
      if(track.artworkUrl){const img=document.createElement("img");img.className="catalogue-art";img.src=track.artworkUrl;img.alt="";img.loading="lazy";img.referrerPolicy="no-referrer";img.onerror=()=>img.replaceWith(makeArtworkPlaceholder());card.append(img);}else card.append(makeArtworkPlaceholder());
      const title=document.createElement("span");title.className="catalogue-track-title";title.textContent=track.title||"Untitled track";
      const artist=document.createElement("span");artist.className="catalogue-track-artist";artist.textContent=track.artist||"Independent artist";
      const play=document.createElement("button");play.type="button";play.className="catalogue-play";play.textContent="▶ Play track";play.addEventListener("click",()=>{setTrack(track);audio.play().then(async()=>{await setupAnalyser();if(state.audioContext?.state==="suspended")await state.audioContext.resume();state.playing=true;$("playButton").textContent="Ⅱ";setStatus();}).catch(()=>setCatalogueStatus("Track selected. Tap Play if playback did not start automatically."));});
      const license=document.createElement("a");license.className="catalogue-license";license.textContent="View licence ↗";license.href=track.licenseUrl||track.providerUrl||"#";license.target="_blank";license.rel="noopener noreferrer";
      card.append(title,artist,play,license);grid.append(card);
    });
  }
  function makeArtworkPlaceholder() { const el=document.createElement("span");el.className="catalogue-art catalogue-art-placeholder";el.setAttribute("aria-hidden","true");el.textContent="♪";return el; }
  async function searchCatalogue(query) {
    const base=(window.LYRIC_MOTION_CONFIG?.API_BASE_URL||"").replace(/\/$/,"");
    if(!base || (/^http:\/\/localhost(?::\d+)?$/i.test(base) && location.protocol==="https:")){setCatalogueStatus("The catalogue API is not connected to this website yet. Connect the Tones:P backend and add a Jamendo client ID to enable online search.",true);return;}
    const button=$("catalogueSearchButton");button.disabled=true;setCatalogueStatus("Searching independent music…");
    try {const response=await fetch(base+"/api/catalog/search?q="+encodeURIComponent(query),{headers:{Accept:"application/json"}});const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.error||"Music search is temporarily unavailable.");const tracks=Array.isArray(payload.tracks)?payload.tracks:[];renderCatalogue(tracks);setCatalogueStatus(tracks.length?"Found "+tracks.length+" tracks. Select one to play.":"No playable tracks found. Try another artist or mood.");}
    catch(error){setCatalogueStatus(error.message||"Could not reach the music catalogue. Local audio playback still works.",true);}finally{button.disabled=false;}
  }
  $("catalogueSearchForm").addEventListener("submit",event=>{event.preventDefault();const query=$("catalogueQuery").value.trim();if(!query){setCatalogueStatus("Enter an artist, track, or mood to search.");$("catalogueQuery").focus();return;}searchCatalogue(query);});
  function setStatus() { $("audioStatus").textContent=state.playing?"Now playing":audio.src?"Ready to play":"No track loaded"; }
  $("uploadTrigger").addEventListener("click",()=>$("audioFile").click());
  $("browseButton").addEventListener("click",()=>$("audioFile").click());
  $("uploadCard").addEventListener("click",()=>$("audioFile").click());
  $("lyricsCard").addEventListener("click",()=>{$("lrcPanel").hidden=false;$("lyricsInput").focus()});
  $("loadLyricsFile").addEventListener("click",()=>$("lyricsFile").click());
  $("closeLyrics").addEventListener("click",()=>$("lrcPanel").hidden=true);
  $("audioFile").addEventListener("change",e=>{
    const file=e.target.files?.[0]; if(!file)return;
    const url=URL.createObjectURL(file);
    setTrack({title:file.name.replace(/\.[^.]+$/,""),artist:"Playing from your device",audioUrl:url,mood:"auto"}); state.objectUrl=url;
    audio.play().then(async()=>{state.playing=true;await setupAnalyser();if(state.audioContext?.state==="suspended")await state.audioContext.resume();$("playButton").textContent="Ⅱ";setStatus()}).catch(()=>{});
    e.target.value="";
  });
  $("lyricsFile").addEventListener("change",async e=>{
    const file=e.target.files?.[0];if(!file)return;
    $("lyricsInput").value=await file.text();loadLyrics($("lyricsInput").value);$("lrcPanel").hidden=false;e.target.value="";
  });
  $("applyLyrics").addEventListener("click",()=>{loadLyrics($("lyricsInput").value);$("lrcPanel").hidden=true});
  $("playButton").addEventListener("click",async()=>{
    if(!audio.src){$("audioFile").click();return}
    if(audio.paused){try{await setupAnalyser();if(state.audioContext?.state==="suspended")await state.audioContext.resume();await audio.play();state.playing=true;$("playButton").textContent="Ⅱ";setStatus()}catch(e){$("audioStatus").textContent="Playback could not start"}}
    else{audio.pause();state.playing=false;$("playButton").textContent="▶";setStatus()}
  });
  $("stopButton").addEventListener("click",()=>{audio.pause();audio.currentTime=0;state.playing=false;$("playButton").textContent="▶";state.currentLine=-1;renderLyrics();setStatus()});
  $("restartButton").addEventListener("click",()=>{audio.currentTime=0;if(audio.src)audio.play().then(()=>{state.playing=true;$("playButton").textContent="Ⅱ"}).catch(()=>{});});
  audio.addEventListener("timeupdate",()=>{
    $("currentTime").textContent=formatTime(audio.currentTime);
    if(Number.isFinite(audio.duration)&&audio.duration>0){$("seekBar").value=String(Math.round(audio.currentTime/audio.duration*1000));$("duration").textContent=formatTime(audio.duration)}
    renderLyrics();
  });
  audio.addEventListener("loadedmetadata",()=>{$("duration").textContent=formatTime(audio.duration);$("seekBar").value="0"});
  audio.addEventListener("ended",()=>{state.playing=false;$("playButton").textContent="▶";setStatus()});
  audio.addEventListener("play",()=>{state.playing=true;setStatus()});
  audio.addEventListener("pause",()=>{state.playing=false;setStatus()});
  $("seekBar").addEventListener("input",e=>{if(Number.isFinite(audio.duration))audio.currentTime=(Number(e.target.value)/1000)*audio.duration});
  $("volumeBar").addEventListener("input",e=>{audio.volume=Number(e.target.value)});
  $("favoriteButton").addEventListener("click",()=>{state.favorite=!state.favorite;$("favoriteButton").textContent=state.favorite?"♥":"♡";$("favoriteButton").classList.toggle("favorited",state.favorite)});
  document.querySelectorAll(".mood-option").forEach(b=>b.addEventListener("click",()=>{state.mood=b.dataset.mood;applyMood(selectedMood())}));
  window.addEventListener("resize",resizeCanvas);
  async function loadCatalogue() {
    const base=(window.LYRIC_MOTION_CONFIG?.API_BASE_URL||"").replace(/\/$/,"");
    if(!base)return;
    try{
      const r=await fetch(`${base}/api/tracks`);
      if(!r.ok)return;
      const data=await r.json(); state.apiTracks=data.tracks||[];
      const grid=$("libraryGrid");
      for(const t of state.apiTracks){
        if(!t.audioUrl)continue;
        const card=document.createElement("button");card.className="upload-card";
        const art=document.createElement("span");art.className="upload-plus";art.textContent="♪";
        const title=document.createElement("strong");title.textContent=t.title||"Untitled";
        const meta=document.createElement("span");meta.textContent=t.artist||"Unknown artist";
        card.append(art,title,meta);card.addEventListener("click",()=>setTrack(t));grid.append(card);
      }
    }catch(e){console.info("Catalogue API not available; local upload still works.")}
  }
  resizeCanvas();initParticles();requestAnimationFrame(animate);loadCatalogue();audio.volume=.8;
})();
