/* Tunesmith — a one-page AI song studio on top of SunoAPI (https://docs.sunoapi.org). */
(() => {
  "use strict";

  /* ================================================================
   * Constants
   * ================================================================ */
  const DIRECT_API = "https://api.sunoapi.org";
  const DIRECT_UPLOAD = "https://sunoapiorg.redpandaai.co";
  const PROXY_API = "/suno";
  const PROXY_UPLOAD = "/sunoupload";
  const POLL_MS = 5000;
  const TIMEOUT_MS = 30 * 60 * 1000;

  const MODELS = [
    { id: "V6", name: "V6", icon: "✦", tag: "Recommended", desc: "Most natural vocals and the richest detail. The best all-rounder." },
    { id: "V6_WILD", name: "V6 Wild", icon: "🌀", tag: "Experimental", desc: "Pushes creative boundaries for bolder, more distinctive results." },
    { id: "V6_MINI", name: "V6 Mini", icon: "⚡", tag: "Fast", desc: "Lightweight and quick. Great for sketching ideas." },
  ];
  const LEGACY_MODELS = [
    { id: "V5_5", name: "V5.5", icon: "🎙", desc: "Voice-customized model." },
    { id: "V5", name: "V5", icon: "5", desc: "Superior musical expression, faster generation." },
    { id: "V4_5PLUS", name: "V4.5+", icon: "4+", desc: "Richer tones, up to 8 min." },
    { id: "V4_5ALL", name: "V4.5 All", icon: "4A", desc: "Better song structure, up to 8 min." },
    { id: "V4_5", name: "V4.5", icon: "4.5", desc: "Smart prompts, up to 8 min." },
    { id: "V4", name: "V4", icon: "4", desc: "Improved vocals, up to 4 min." },
  ];
  const ALL_MODELS = [...MODELS, ...LEGACY_MODELS];
  const DURATION_MODELS = ["V6", "V6_WILD", "V6_MINI", "V5_5"];
  const PERSONA_MODELS = ["V6", "V6_WILD", "V6_MINI", "V5_5", "V5"];

  const IDEAS = [
    { e: "🌅", t: "A sunrise synthwave anthem about starting over, soaring female vocals" },
    { e: "☕", t: "Cozy lo-fi hip hop beat for a rainy Sunday in a coffee shop", i: true },
    { e: "🐶", t: "A heartfelt country ballad sung from the perspective of a loyal golden retriever" },
    { e: "🚀", t: "Epic orchestral trailer music for a rocket launch, huge drums and choir", i: true },
    { e: "💔", t: "Moody R&B slow jam about texting your ex at 2am" },
    { e: "🍕", t: "Upbeat pop-punk song about fighting over the last slice of pizza" },
    { e: "🌴", t: "Tropical reggaeton summer party track with a catchy Spanish hook" },
    { e: "🎂", t: "A jazzy swing birthday song for my best friend who loves cats" },
    { e: "🧙", t: "Folk tale ballad about a wizard who lost his hat, acoustic guitar and fiddle" },
    { e: "🏋️", t: "High-energy EDM workout anthem with a massive drop", i: false },
  ];
  const SURPRISE = {
    genre: ["indie pop", "synthwave", "bossa nova", "trap", "bluegrass", "K-pop", "shoegaze", "afrobeats", "disco", "sea shanty", "gospel", "drum and bass", "city pop", "emo", "baroque pop", "reggae"],
    subject: ["a robot learning to love", "the last day of summer", "a haunted vending machine", "finding your keys after an hour", "a road trip with no map", "a houseplant that wants more sun", "Monday mornings", "a dragon who is afraid of the dark", "your grandma's secret recipe", "falling for your barista", "a lighthouse keeper's last night", "winning the lottery and losing the ticket"],
    mood: ["euphoric", "bittersweet", "silly", "dreamy", "defiant", "nostalgic", "mysterious", "triumphant"],
  };
  const STYLE_CHIPS = {
    Genre: ["Pop", "Hip-hop", "R&B", "Rock", "Indie", "EDM", "Lo-fi", "Synthwave", "Jazz", "Country", "Afrobeats", "Reggaeton", "K-pop", "Metal", "Folk", "Cinematic"],
    Mood: ["Uplifting", "Melancholic", "Dreamy", "Energetic", "Dark", "Romantic", "Chill", "Epic"],
    Sound: ["Female vocals", "Male vocals", "Acoustic guitar", "Piano", "808s", "Strings", "Synth bass", "Choir", "Saxophone"],
  };
  const SOUND_CHIPS = ["Rain on a window", "Crackling campfire", "Sci-fi door whoosh", "Crowd cheering", "Lo-fi drum loop 90 bpm", "Ocean waves at night", "Retro game power-up", "Heartbeat, tense"];
  const KEYS = ["Any", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "Cm", "C#m", "Dm", "D#m", "Em", "Fm", "F#m", "Gm", "G#m", "Am", "A#m", "Bm"];
  const STEM_NAMES = ["Lead Vocal", "Backing Vocals", "Drum Kit", "Kick", "Snare", "Hi-Hat", "Bass", "808", "Piano", "Electric Guitar", "Acoustic Guitar", "Synth", "Synth Pad", "Synth Bass", "String Section", "Brass Section", "Organ", "Percussion", "Choir", "Saxophone", "Violin", "Cello", "Flute", "Trumpet"];
  const VARIETY_LABELS = ["Exact", "Balanced", "Distinct", "Bold", "Max"];
  const LOADING_MSGS = ["Tuning the guitars", "Warming up the vocalist", "Writing a killer hook", "Finding the groove", "Layering harmonies", "Dialing in the low end", "Adding a little sparkle", "Mixing it down", "Polishing the chorus", "Mastering for your ears"];
  const STEP_LABELS = ["Queued", "Lyrics", "First take", "Ready"];
  const REMIX_OPS = {
    cover: { label: "Create cover", path: "/api/v1/generate/upload-cover" },
    extend: { label: "Extend track", path: "/api/v1/generate/upload-extend" },
    vocals: { label: "Add vocals", path: "/api/v1/generate/add-vocals" },
    instrumental: { label: "Add backing track", path: "/api/v1/generate/add-instrumental" },
    mashup: { label: "Create mashup", path: "/api/v1/generate/mashup" },
    stems: { label: "Split stems", path: "/api/v1/vocal-removal/generate" },
  };
  const OP_BADGE = {
    generate: "Song", custom: "Custom", extend: "Extend", "upload-cover": "Cover", "upload-extend": "Extend",
    "add-vocals": "Vocals", "add-instrumental": "Backing", mashup: "Mashup", "replace-section": "Replace", sounds: "Sound",
  };
  const STEM_KEYS = [
    ["vocalUrl", "Vocals"], ["instrumentalUrl", "Instrumental"], ["backingVocalsUrl", "Backing vocals"], ["drumsUrl", "Drums"],
    ["bassUrl", "Bass"], ["guitarUrl", "Guitar"], ["keyboardUrl", "Keys"], ["percussionUrl", "Percussion"], ["stringsUrl", "Strings"],
    ["synthUrl", "Synth"], ["fxUrl", "FX"], ["brassUrl", "Brass"], ["woodwindsUrl", "Woodwinds"],
  ];

  /* ================================================================
   * Utilities
   * ================================================================ */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const fmtTime = (s) => {
    if (!isFinite(s) || s < 0) s = 0;
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };
  const ago = (t) => {
    const s = Math.round((Date.now() - t) / 1000);
    if (s < 45) return "just now";
    if (s < 3600) return `${Math.round(s / 60)}m ago`;
    if (s < 86400) return `${Math.round(s / 3600)}h ago`;
    return new Date(t).toLocaleDateString();
  };
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* quota or private mode */ } },
    del(k) { try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch { /* ignore */ } },
  };
  const safeFileName = (s) => (s || "track").replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-").slice(0, 60) || "track";

  /* ================================================================
   * State
   * ================================================================ */
  const state = {
    key: null,
    direct: location.protocol === "file:",
    model: store.get("ts.model", "V6"),
    tasks: store.get("ts.tasks", []),
    favs: new Set(store.get("ts.favs", [])),
    personas: store.get("ts.personas", []),
    credits: null,
    mode: "simple",
    tab: "create",
    remixOp: "cover",
    filter: "all",
    search: "",
    refs: [], // {name, type, url, preview, uploading}
    sources: [null, null], // {file, url}
    vocalGender: "",
    aligned: {}, // audioId -> alignedWords
    inflight: new Set(),
    queue: [],
    current: null,
  };
  if (!ALL_MODELS.some((m) => m.id === state.model)) state.model = "V6";

  const saveTasks = () => store.set("ts.tasks", state.tasks);
  const saveFavs = () => store.set("ts.favs", [...state.favs]);
  const savePersonas = () => store.set("ts.personas", state.personas);

  function loadKey() {
    try { return localStorage.getItem("ts.key") || sessionStorage.getItem("ts.key"); } catch { return null; }
  }
  function saveKey(k, remember) {
    try {
      localStorage.removeItem("ts.key"); sessionStorage.removeItem("ts.key");
      (remember ? localStorage : sessionStorage).setItem("ts.key", k);
    } catch { /* ignore */ }
  }

  /* ================================================================
   * Theme
   * ================================================================ */
  const mql = matchMedia("(prefers-color-scheme: dark)");
  function applyTheme(pref) {
    const dark = pref === "dark" || (pref === "system" && mql.matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.documentElement.dataset.themePref = pref;
    $('meta[name="theme-color"]').content = dark ? "#0c0a12" : "#f6f5fb";
    $$(".theme-switch button").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.theme === pref)));
  }
  function initTheme() {
    const opts = [["light", "☀️", "Light"], ["dark", "🌙", "Dark"], ["system", "🖥", "System"]];
    $$(".theme-switch").forEach((el) => {
      el.innerHTML = opts.map(([v, i, l]) => `<button type="button" role="radio" data-theme="${v}" title="${l} theme" aria-label="${l} theme">${i}</button>`).join("");
      el.addEventListener("click", (e) => {
        const b = e.target.closest("button"); if (!b) return;
        try { localStorage.setItem("ts.theme", b.dataset.theme); } catch { /* ignore */ }
        applyTheme(b.dataset.theme);
      });
    });
    const pref = document.documentElement.dataset.themePref || "system";
    applyTheme(pref);
    mql.addEventListener("change", () => applyTheme(document.documentElement.dataset.themePref || "system"));
  }

  /* ================================================================
   * API layer
   * ================================================================ */
  class ApiError extends Error { constructor(msg, code) { super(msg); this.code = code; } }

  const FRIENDLY = {
    400: "Some of those settings weren’t accepted",
    401: "That API key was rejected. Double-check it at sunoapi.org/api-key.",
    402: "You’re out of credits. Top up at sunoapi.org to keep creating.",
    404: "That item couldn’t be found.",
    405: "Too many requests. Give it a moment and try again.",
    409: "That already exists.",
    413: "That prompt or lyric is too long for this model.",
    422: "Some fields didn’t pass validation",
    429: "You’re out of credits. Top up at sunoapi.org to keep creating.",
    430: "You’re going a bit fast. Wait a few seconds and try again.",
    455: "SunoAPI is under maintenance right now. Try again shortly.",
    500: "SunoAPI hit a server error. Try again in a moment.",
  };
  function friendly(code, msg) {
    const base = FRIENDLY[code];
    if (!base) return msg || `Request failed (${code})`;
    if ((code === 400 || code === 422 || code === 409) && msg && msg !== "success") return `${base}: ${msg}`;
    return base;
  }

  const callbackUrl = () =>
    /^https?:$/.test(location.protocol) && !/^(localhost|127\.|0\.0\.0\.0)/.test(location.hostname)
      ? `${location.origin}/.netlify/functions/suno-callback`
      : "https://example.com/suno-callback";

  async function rawFetch(kind, path, init) {
    const base = state.direct ? (kind === "upload" ? DIRECT_UPLOAD : DIRECT_API) : (kind === "upload" ? PROXY_UPLOAD : PROXY_API);
    let res;
    try {
      res = await fetch(base + path, init);
    } catch (e) {
      if (!state.direct) { state.direct = true; return rawFetch(kind, path, init); }
      throw new ApiError("Couldn’t reach SunoAPI. Check your connection (or deploy to Netlify so the built-in proxy can handle CORS).");
    }
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch {
      // Proxy route missing (e.g. a plain static server): fall back to calling SunoAPI directly.
      if (!state.direct) { state.direct = true; return rawFetch(kind, path, init); }
      throw new ApiError(`Unexpected response from SunoAPI (HTTP ${res.status}).`, res.status);
    }
    return { res, json };
  }

  async function api(path, { method = "GET", body, query, key } = {}) {
    const q = query ? "?" + new URLSearchParams(query) : "";
    const headers = { Authorization: `Bearer ${key || state.key}` };
    if (body) headers["Content-Type"] = "application/json";
    const { res, json } = await rawFetch("api", path + q, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const code = json.code ?? res.status;
    if (code !== 200) {
      if (code === 401 && !key) onUnauthorized();
      throw new ApiError(friendly(code, json.msg), code);
    }
    return json.data;
  }

  async function uploadFile(file) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("uploadPath", "tunesmith");
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    fd.append("fileName", `${Date.now()}-${safeFileName(file.name.replace(/\.[^.]+$/, ""))}${ext ? "." + ext : ""}`);
    const { json } = await rawFetch("upload", "/api/file-stream-upload", { method: "POST", headers: { Authorization: `Bearer ${state.key}` }, body: fd });
    if (!(json.success || json.code === 200) || !json.data?.downloadUrl) throw new ApiError(json.msg || "Upload failed", json.code);
    return json.data.downloadUrl;
  }

  /* ================================================================
   * Toasts & dialog
   * ================================================================ */
  function toast(msg, type = "", action) {
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.innerHTML = `<span>${esc(msg)}</span>`;
    if (action) {
      const b = document.createElement("button");
      b.className = "btn sm"; b.textContent = action.label;
      b.onclick = () => { action.fn(); el.remove(); };
      el.append(b);
    }
    $("#toasts").append(el);
    setTimeout(() => { el.style.opacity = "0"; el.style.transition = "opacity .3s"; setTimeout(() => el.remove(), 300); }, type === "err" ? 7000 : 4500);
  }

  const dlg = $("#dlg");
  /** Open a dialog. `onSubmit` returning false keeps it open. */
  function openDialog({ title, body, submit, cancel = "Cancel", onSubmit, onOpen, wide }) {
    $("#dlgTitle").textContent = title;
    const b = $("#dlgBody");
    if (typeof body === "string") b.innerHTML = body; else { b.innerHTML = ""; b.append(body); }
    const foot = $("#dlgFoot");
    foot.innerHTML = "";
    foot.hidden = !submit && !cancel;
    if (cancel) {
      const c = document.createElement("button"); c.className = "btn ghost"; c.value = "cancel"; c.formNoValidate = true; c.textContent = cancel; foot.append(c);
    }
    if (submit) {
      const s = document.createElement("button"); s.className = "btn primary"; s.type = "button"; s.innerHTML = submit;
      s.onclick = async () => {
        s.disabled = true;
        try { const keep = await onSubmit?.(b); if (keep !== false) dlg.close(); }
        catch (e) { toast(e.message, "err"); }
        finally { s.disabled = false; }
      };
      foot.append(s);
    }
    dlg.style.width = wide ? "min(760px, calc(100vw - 24px))" : "";
    dlg.showModal();
    onOpen?.(b);
  }
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });

  /* ================================================================
   * Gate / auth
   * ================================================================ */
  function showGate(msg) {
    $("#app").hidden = true;
    $("#gate").hidden = false;
    $("#keyError").hidden = !msg;
    if (msg) $("#keyError").textContent = msg;
    setTimeout(() => $("#keyInput").focus(), 50);
  }
  function enterApp() {
    $("#gate").hidden = true;
    $("#app").hidden = false;
    $("#keyMask").textContent = state.key.length > 8 ? `${state.key.slice(0, 4)}…${state.key.slice(-4)}` : "••••";
    renderAll();
    refreshCredits();
    startPolling();
  }
  let unauthorizedShown = false;
  function onUnauthorized() {
    if (unauthorizedShown) return;
    unauthorizedShown = true;
    store.del("ts.key");
    state.key = null;
    showGate("Your API key was rejected. Please enter a valid key.");
  }

  $("#keyReveal").onclick = () => {
    const i = $("#keyInput");
    i.type = i.type === "password" ? "text" : "password";
  };
  $("#keyForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const key = $("#keyInput").value.trim();
    if (!key) return;
    const btn = $("#keySubmit");
    btn.disabled = true; btn.firstElementChild.textContent = "Checking key…";
    $("#keyError").hidden = true;
    try {
      const credits = await api("/api/v1/generate/credit", { key });
      state.key = key;
      unauthorizedShown = false;
      saveKey(key, $("#keyRemember").checked);
      setCredits(credits);
      $("#keyInput").value = "";
      enterApp();
      toast(`Welcome in! You have ${Number(credits).toLocaleString()} credits.`, "ok");
    } catch (err) {
      $("#keyError").textContent = err.code === 401 ? "That key didn’t work. Copy it again from sunoapi.org/api-key." : err.message;
      $("#keyError").hidden = false;
    } finally {
      btn.disabled = false; btn.firstElementChild.textContent = "Enter studio";
    }
  });

  $("#acctMenu").addEventListener("click", (e) => {
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (!act) return;
    $("#acctMenu").open = false;
    if (act === "change-key" || act === "logout") {
      if (act === "logout") store.del("ts.key");
      state.key = null;
      audio.pause();
      showGate();
    } else if (act === "clear-library") {
      openDialog({
        title: "Clear your library?",
        body: "<p>This removes every song and job from this browser. Files already generated stay on SunoAPI’s servers until they expire.</p>",
        submit: "Clear library",
        onSubmit: () => { state.tasks = []; saveTasks(); renderAll(); toast("Library cleared"); },
      });
    }
  });

  /* ================================================================
   * Credits
   * ================================================================ */
  function setCredits(n) {
    state.credits = Number(n);
    $("#creditsVal").textContent = isFinite(state.credits) ? state.credits.toLocaleString() : "—";
    const btn = $("#creditsBtn");
    btn.classList.toggle("low", state.credits > 0 && state.credits < 50);
    btn.classList.toggle("empty", state.credits <= 0);
  }
  async function refreshCredits() {
    try { setCredits(await api("/api/v1/generate/credit")); } catch { /* shown elsewhere */ }
  }
  $("#creditsBtn").onclick = () => { $("#creditsVal").textContent = "…"; refreshCredits(); };

  /* ================================================================
   * Studio: tabs, modes, model picker
   * ================================================================ */
  $(".tabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab]"); if (!b) return;
    setTab(b.dataset.tab);
  });
  function setTab(tab) {
    state.tab = tab;
    $$(".tabs [data-tab]").forEach((x) => x.setAttribute("aria-selected", String(x.dataset.tab === tab)));
    $$("[data-panel]").forEach((p) => (p.hidden = p.dataset.panel !== tab));
    $("#modelBtn").hidden = tab === "lyrics";
  }
  $("#modeSeg").addEventListener("click", (e) => {
    const b = e.target.closest("[data-mode]"); if (!b) return;
    setMode(b.dataset.mode);
  });
  function setMode(mode) {
    state.mode = mode;
    $$("#modeSeg button").forEach((x) => x.setAttribute("aria-checked", String(x.dataset.mode === mode)));
    $("#simpleForm").hidden = mode !== "simple";
    $("#customForm").hidden = mode !== "custom";
  }

  const modelInfo = (id) => ALL_MODELS.find((m) => m.id === id) || MODELS[0];
  function setModel(id) {
    state.model = id;
    store.set("ts.model", id);
    $("#modelName").textContent = modelInfo(id).name;
    updateModelDependent();
    updateCounts();
  }
  function updateModelDependent() {
    const durOk = DURATION_MODELS.includes(state.model);
    $("#durationField").hidden = !durOk;
    const perOk = PERSONA_MODELS.includes(state.model);
    $("#cPersona").disabled = !perOk;
    $("#cPersonaModel").disabled = !perOk;
    $("#cPersona").title = perOk ? "" : "Personas need V5 or newer";
  }
  $("#modelBtn").onclick = () => {
    const card = (m, legacy) => `<button type="button" class="model-card" data-model="${m.id}" aria-pressed="${m.id === state.model}">
        <span class="mi">${esc(m.icon)}</span><div><strong>${esc(m.name)}</strong><span>${esc(m.desc)}</span></div>
        ${legacy ? '<span class="badge model">Legacy</span>' : `<span class="badge">${esc(m.tag)}</span>`}</button>`;
    const isLegacy = LEGACY_MODELS.some((m) => m.id === state.model);
    openDialog({
      title: "Choose a model",
      body: `<p class="muted">Applies to every song, cover, extension and sound you create.</p>
        <div class="model-grid">${MODELS.map((m) => card(m)).join("")}</div>
        <details class="legacy" ${isLegacy ? "open" : ""}><summary>Legacy models</summary>
          <p class="muted small">SunoAPI marks these as discontinued. They stay here for compatibility and may be rejected.</p>
          <div class="model-grid">${LEGACY_MODELS.map((m) => card(m, true)).join("")}</div></details>`,
      cancel: "Close",
      onOpen: (b) => b.addEventListener("click", (e) => {
        const c = e.target.closest("[data-model]"); if (!c) return;
        setModel(c.dataset.model);
        toast(`Model set to ${modelInfo(c.dataset.model).name}`);
        dlg.close();
      }),
    });
  };

  /* ---------- Character counters ---------- */
  function limitFor(id) {
    const v4 = state.model === "V4";
    return {
      sPrompt: 3000,
      cTitle: 80,
      cStyle: v4 ? 200 : 1000,
      cLyrics: v4 ? 3000 : 5000,
      sdPrompt: 500,
      lyPrompt: 200,
    }[id];
  }
  function updateCounts() {
    $$("[data-count-for]").forEach((c) => {
      const id = c.dataset.countFor, el = document.getElementById(id), lim = limitFor(id);
      if (!el || !lim) return;
      const n = el.value.length;
      c.textContent = `${n.toLocaleString()} / ${lim.toLocaleString()}`;
      c.classList.toggle("over", n > lim);
    });
  }
  document.addEventListener("input", (e) => { if (e.target.matches("input, textarea")) updateCounts(); });

  function checkLimits(ids) {
    for (const id of ids) {
      const el = document.getElementById(id), lim = limitFor(id);
      if (el && lim && el.value.length > lim) {
        el.focus();
        throw new ApiError(`That’s ${el.value.length.toLocaleString()} characters. ${modelInfo(state.model).name} allows up to ${lim.toLocaleString()} here.`);
      }
    }
  }

  function withBusy(btn, fn) {
    return async (...args) => {
      if (btn.disabled) return;
      btn.disabled = true; btn.classList.add("busy");
      try { await fn(...args); }
      catch (e) { toast(e.message, "err"); }
      finally { btn.disabled = false; btn.classList.remove("busy"); }
    };
  }

  /* ================================================================
   * Simple mode
   * ================================================================ */
  $("#ideaChips").innerHTML = IDEAS.slice(0, 5).map((x, i) => `<button type="button" class="chip" data-idea="${i}">${x.e} ${esc(x.t.split(" ").slice(0, 4).join(" "))}…</button>`).join("");
  $("#ideaChips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-idea]"); if (!b) return;
    useIdea(IDEAS[+b.dataset.idea]);
  });
  function useIdea(idea) {
    setTab("create"); setMode("simple");
    $("#sPrompt").value = idea.t;
    $("#sInstrumental").checked = !!idea.i;
    updateCounts();
    $("#sPrompt").focus();
  }
  $("#surpriseBtn").onclick = () => {
    const p = `A ${pick(SURPRISE.mood)} ${pick(SURPRISE.genre)} song about ${pick(SURPRISE.subject)}`;
    const el = $("#sPrompt");
    el.value = "";
    let i = 0;
    const type = () => { el.value = p.slice(0, ++i); if (i < p.length) requestAnimationFrame(type); else updateCounts(); };
    type();
  };

  /* ---------- Reference attachments ---------- */
  const refDrop = $("#refDrop");
  wireDrop(refDrop, $("#refFile"), (files) => files.forEach(addRef));
  function wireDrop(zone, input, onFiles) {
    zone.addEventListener("click", () => input.click());
    zone.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); } });
    input.addEventListener("change", () => { onFiles([...input.files]); input.value = ""; });
    zone.addEventListener("dragover", (e) => { e.preventDefault(); zone.classList.add("over"); });
    zone.addEventListener("dragleave", () => zone.classList.remove("over"));
    zone.addEventListener("drop", (e) => { e.preventDefault(); zone.classList.remove("over"); onFiles([...e.dataTransfer.files]); });
  }
  async function addRef(file) {
    const type = file.type.split("/")[0];
    if (!["image", "audio", "video"].includes(type)) return toast(`${file.name} isn’t an image, audio or video file`, "err");
    const counts = { image: 0, video: 0, audio: 0 };
    state.refs.forEach((r) => counts[r.type]++);
    if (type === "image" && counts.image >= 5) return toast("Up to 5 images", "err");
    if (type === "video" && counts.video >= 1) return toast("Only 1 video reference", "err");
    const ref = { name: file.name, type, url: null, preview: type === "image" ? URL.createObjectURL(file) : null, uploading: true };
    state.refs.push(ref);
    renderRefs();
    try {
      ref.url = await uploadFile(file);
    } catch (e) {
      toast(`Upload failed: ${e.message}`, "err");
      state.refs = state.refs.filter((r) => r !== ref);
    }
    ref.uploading = false;
    renderRefs();
  }
  function renderRefs() {
    const icon = { image: "🖼", audio: "🎵", video: "🎬" };
    $("#refList").innerHTML = state.refs.map((r, i) => `<div class="ref">
      ${r.preview ? `<img src="${esc(r.preview)}" alt="" />` : `<b>${icon[r.type]}</b>`}
      <span title="${esc(r.name)}">${esc(r.name)}</span>
      ${r.uploading ? '<span class="mini-eq"><i></i><i></i><i></i></span>' : `<button type="button" data-rm="${i}" aria-label="Remove">✕</button>`}</div>`).join("");
  }
  $("#refList").addEventListener("click", (e) => {
    const b = e.target.closest("[data-rm]"); if (!b) return;
    state.refs.splice(+b.dataset.rm, 1); renderRefs();
  });

  $("#simpleForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const btn = e.submitter || $("#simpleForm .create-btn");
    withBusy(btn, async () => {
      const prompt = $("#sPrompt").value.trim();
      if (state.refs.some((r) => r.uploading)) throw new ApiError("Hang on, your references are still uploading.");
      const refs = state.refs.filter((r) => r.url);
      if (!prompt && !refs.length) { $("#sPrompt").focus(); throw new ApiError("Describe your song first (or add an inspiration file)."); }
      checkLimits(["sPrompt"]);
      const body = { customMode: false, instrumental: $("#sInstrumental").checked, model: state.model };
      if (prompt) body.prompt = prompt;
      const byType = (t) => refs.filter((r) => r.type === t).map((r) => r.url);
      if (byType("image").length) body.imageUrls = byType("image");
      if (byType("audio").length) body.audioUrls = byType("audio");
      if (byType("video").length) body.videoUrls = byType("video");
      await startMusic("generate", "/api/v1/generate", body, prompt || "Inspired by your uploads");
      state.refs = []; renderRefs();
    })();
  });

  /* ================================================================
   * Custom mode
   * ================================================================ */
  $("#styleChips").innerHTML = Object.entries(STYLE_CHIPS).map(([g, arr]) =>
    `<div class="grp"><b>${g}</b>${arr.map((c) => `<button type="button" class="chip" data-style="${esc(c)}">${esc(c)}</button>`).join("")}</div>`).join("");
  $("#styleChips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-style]"); if (!b) return;
    const el = $("#cStyle");
    const parts = el.value.split(",").map((s) => s.trim()).filter(Boolean);
    const i = parts.findIndex((p) => p.toLowerCase() === b.dataset.style.toLowerCase());
    if (i >= 0) parts.splice(i, 1); else parts.push(b.dataset.style);
    el.value = parts.join(", ");
    syncStyleChips(); updateCounts();
  });
  function syncStyleChips() {
    const parts = $("#cStyle").value.toLowerCase().split(",").map((s) => s.trim());
    $$("#styleChips [data-style]").forEach((c) => c.classList.toggle("on", parts.includes(c.dataset.style.toLowerCase())));
  }
  $("#cStyle").addEventListener("input", syncStyleChips);

  $(".lyric-tools").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tag]"); if (!b) return;
    const ta = $("#cLyrics");
    const { selectionStart: s, selectionEnd: en, value: v } = ta;
    const before = v.slice(0, s), pre = before && !before.endsWith("\n\n") ? (before.endsWith("\n") ? "\n" : "\n\n") : "";
    const ins = `${pre}${b.dataset.tag}\n`;
    ta.value = before + ins + v.slice(en);
    ta.focus(); ta.selectionStart = ta.selectionEnd = s + ins.length;
    updateCounts();
  });

  $("#cInstrumental").addEventListener("change", syncInstrumental);
  function syncInstrumental() {
    const inst = $("#cInstrumental").checked;
    $("#lyricsField").hidden = inst;
    $("#genderSeg").hidden = inst;
    $("#audioWeightWrap").hidden = inst;
  }
  $("#genderSeg").addEventListener("click", (e) => {
    const b = e.target.closest("[data-v]"); if (!b) return;
    state.vocalGender = b.dataset.v;
    $$("#genderSeg button").forEach((x) => x.setAttribute("aria-checked", String(x === b)));
  });

  $("#cDurationOn").addEventListener("change", () => { $("#cDuration").disabled = !$("#cDurationOn").checked; });
  $("#cDuration").addEventListener("input", () => { $("#cDurationOut").textContent = fmtTime(+$("#cDuration").value); });
  $("#cTune").addEventListener("change", () => { $("#tuneBox").hidden = !$("#cTune").checked; });
  const sliderOut = () => {
    $$(".slider output").forEach((o) => {
      const el = document.getElementById(o.dataset.for);
      o.textContent = el.id === "cVariety" ? VARIETY_LABELS[+el.value] : `${Math.round(el.value * 100)}%`;
    });
  };
  $("#tuneBox").addEventListener("input", sliderOut);

  function renderPersonaSelect() {
    const sel = $("#cPersona"), cur = sel.value;
    sel.innerHTML = `<option value="">No persona</option>` +
      state.personas.map((p) => `<option value="${esc(p.id)}">🎭 ${esc(p.name)}</option>`).join("") +
      `<option value="__custom">Paste an ID…</option>`;
    if ([...sel.options].some((o) => o.value === cur)) sel.value = cur;
    $("#cPersonaCustom").hidden = sel.value !== "__custom";
  }
  $("#cPersona").addEventListener("change", () => {
    $("#cPersonaCustom").hidden = $("#cPersona").value !== "__custom";
    const p = state.personas.find((x) => x.id === $("#cPersona").value);
    if (p) $("#cPersonaModel").value = p.kind || "style_persona";
  });

  // Boost style (synchronous endpoint)
  async function boostStyle(input) {
    const content = input.value.trim();
    if (!content) { input.focus(); throw new ApiError("Type a few style words first, then boost them."); }
    const data = await api("/api/v1/style/generate", { method: "POST", body: { content } });
    if (!data?.result) throw new ApiError(data?.errorMessage || "No boosted style came back. Try again.");
    input.value = data.result.trim();
    input.dispatchEvent(new Event("input", { bubbles: true }));
    if (typeof data.creditsRemaining === "number") setCredits(data.creditsRemaining);
    toast("Style boosted ✨", "ok");
  }
  $("#boostBtn").onclick = (e) => withBusy(e.currentTarget, () => boostStyle($("#cStyle")))();
  $$("[data-boost]").forEach((b) => (b.onclick = () => withBusy(b, () => boostStyle(document.getElementById(b.dataset.boost)))()));

  $("#aiLyricsBtn").onclick = () => {
    const seed = [$("#cTitle").value, $("#cStyle").value].filter(Boolean).join(", ");
    openDialog({
      title: "Write lyrics with AI",
      body: `<label class="field"><span>What’s the song about?</span>
        <textarea id="dLyPrompt" rows="3" maxlength="200" placeholder="A love letter to late-night drives">${esc(seed ? `A song called ${seed}` : "")}</textarea></label>
        <p class="muted small">You’ll get a couple of drafts. Pick one and it drops into your lyrics box.</p>`,
      submit: "🪄 Write lyrics",
      onOpen: (b) => $("#dLyPrompt", b).focus(),
      onSubmit: async (b) => {
        const prompt = $("#dLyPrompt", b).value.trim();
        if (!prompt) throw new ApiError("Tell the AI what the song is about.");
        await startLyrics(prompt, true);
      },
    });
  };

  $("#customForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const btn = e.submitter || $("#customForm .create-btn");
    withBusy(btn, async () => {
      const inst = $("#cInstrumental").checked;
      const title = $("#cTitle").value.trim();
      const style = $("#cStyle").value.trim();
      const lyrics = inst ? "" : $("#cLyrics").value.trim();
      const negative = $("#cNegative").value.trim();
      if (!style && !lyrics && !negative) { $("#cStyle").focus(); throw new ApiError("Add a style or some lyrics so the AI knows what to make."); }
      checkLimits(["cTitle", "cStyle", ...(inst ? [] : ["cLyrics"])]);
      const body = { customMode: true, instrumental: inst, model: state.model };
      if (title) body.title = title;
      if (style) body.style = style;
      if (lyrics) { body.prompt = lyrics; body.lyrics = lyrics; }
      if (negative) body.negativeTags = negative;
      if (!inst && state.vocalGender) body.vocalGender = state.vocalGender;
      if ($("#cTune").checked) {
        body.styleWeight = +(+$("#cStyleWeight").value).toFixed(2);
        body.weirdnessConstraint = +(+$("#cWeird").value).toFixed(2);
        if (!inst) body.audioWeight = +(+$("#cAudioWeight").value).toFixed(2);
        body.variety = +$("#cVariety").value;
      }
      if (DURATION_MODELS.includes(state.model) && $("#cDurationOn").checked) body.duration = +$("#cDuration").value;
      Object.assign(body, personaFields());
      await startMusic("custom", "/api/v1/generate", body, title || style || "Custom song");
    })();
  });
  function personaFields() {
    if (!PERSONA_MODELS.includes(state.model)) return {};
    let id = $("#cPersona").value;
    if (id === "__custom") id = $("#cPersonaCustom").value.trim();
    return id ? { personaId: id, personaModel: $("#cPersonaModel").value } : {};
  }

  /* ================================================================
   * Remix
   * ================================================================ */
  $("#opGrid").addEventListener("click", (e) => {
    const b = e.target.closest("[data-op]"); if (!b) return;
    setRemixOp(b.dataset.op);
  });
  function setRemixOp(op) {
    state.remixOp = op;
    $$("#opGrid [data-op]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.op === op)));
    $$("#remixForm [data-show]").forEach((el) => (el.hidden = !el.dataset.show.split(" ").includes(op)));
    $('.src[data-slot="1"]').hidden = op !== "mashup";
    $("#srcLabel").textContent = { vocals: "Instrumental to sing over", instrumental: "Vocal or melody track", mashup: "Two tracks to blend", stems: "Track to split" }[op] || "Source audio";
    $("#remixLabel").textContent = REMIX_OPS[op].label;
  }
  $$(".src").forEach((src) => {
    const slot = +src.dataset.slot, zone = $(".drop", src), input = $("input[type=file]", src), url = $(".src-url", src);
    wireDrop(zone, input, (files) => {
      const f = files.find((x) => x.type.startsWith("audio/") || /\.(mp3|wav|m4a|ogg|flac|aac|webm)$/i.test(x.name));
      if (!f) return toast("Please choose an audio file", "err");
      state.sources[slot] = { file: f };
      url.value = "";
      zone.classList.add("has");
      $("span", zone).innerHTML = `✅ ${esc(f.name)} <small class="muted">(${(f.size / 1048576).toFixed(1)} MB) · click to change</small>`;
    });
    url.addEventListener("input", () => {
      if (url.value.trim()) { state.sources[slot] = null; zone.classList.remove("has"); $("span", zone).innerHTML = "🎵 Drop an audio file or <u>browse</u>"; }
    });
  });
  function resetSources() {
    state.sources = [null, null];
    $$(".src").forEach((src) => {
      $(".drop", src).classList.remove("has");
      $(".drop span", src).innerHTML = "🎵 Drop an audio file or <u>browse</u>";
      $(".src-url", src).value = "";
    });
  }
  async function resolveSource(slot) {
    const s = state.sources[slot];
    if (s?.file) {
      if (s.uploaded) return s.uploaded;
      toast(`Uploading ${s.file.name}…`);
      s.uploaded = await uploadFile(s.file);
      return s.uploaded;
    }
    const u = $(`.src[data-slot="${slot}"] .src-url`).value.trim();
    if (u) {
      if (!/^https?:\/\//i.test(u)) throw new ApiError("Audio URLs must start with http:// or https://");
      return u;
    }
    return null;
  }

  $("#remixForm").addEventListener("submit", (e) => {
    e.preventDefault();
    withBusy($("#remixBtn"), async () => {
      const op = state.remixOp;
      const a = await resolveSource(0);
      if (!a) throw new ApiError("Add a source audio file or URL first.");
      const title = $("#rTitle").value.trim(), style = $("#rStyle").value.trim(), lyrics = $("#rLyrics").value.trim();
      const negative = $("#rNegative").value.trim(), inst = $("#rInstrumental").checked;
      const cb = { callBackUrl: callbackUrl() };
      if (op === "stems") {
        const type = $("#rStemType").value;
        const data = await api(REMIX_OPS.stems.path, { method: "POST", body: { audioUrl: a, type, ...cb } });
        addTask({ id: data.taskId, kind: "stems", label: `Stems from ${sourceName(0)}`, stemType: type });
        resetSources();
        return;
      }
      let body;
      if (op === "cover" || op === "extend") {
        body = { uploadUrl: a, model: state.model, instrumental: inst };
        if (title) body.title = title;
        if (style) body.style = style;
        if (lyrics && !inst) { body.prompt = lyrics; body.lyrics = lyrics; }
        if (op === "extend") { const c = parseFloat($("#rContinue").value); if (c > 0) body.continueAt = c; }
      } else if (op === "vocals") {
        if (!title || !style) throw new ApiError("Adding vocals needs a title and a style.");
        body = { uploadUrl: a, model: state.model, title, style, negativeTags: negative || "off-key, distortion" };
        if (lyrics) { body.prompt = lyrics; body.lyrics = lyrics; }
      } else if (op === "instrumental") {
        if (!title || !style) throw new ApiError("A backing track needs a title and a style.");
        body = { uploadUrl: a, model: state.model, title, tags: style, negativeTags: negative || "noise, distortion" };
      } else if (op === "mashup") {
        const b = await resolveSource(1);
        if (!b) throw new ApiError("A mashup needs two tracks.");
        body = { uploadUrlList: [a, b], model: state.model };
        if (title) body.title = title;
        if (style) body.style = style;
        if (lyrics && !inst) { body.prompt = lyrics; body.lyrics = lyrics; }
      }
      const opKey = { cover: "upload-cover", extend: "upload-extend", vocals: "add-vocals", instrumental: "add-instrumental", mashup: "mashup" }[op];
      await startMusic(opKey, REMIX_OPS[op].path, body, title || `${REMIX_OPS[op].label} · ${sourceName(0)}`);
      resetSources();
    })();
  });
  function sourceName(slot) {
    const s = state.sources[slot];
    if (s?.file) return s.file.name;
    const u = $(`.src[data-slot="${slot}"] .src-url`).value.trim();
    try { return decodeURIComponent(new URL(u).pathname.split("/").pop()) || "your audio"; } catch { return "your audio"; }
  }

  /* ================================================================
   * Sounds
   * ================================================================ */
  $("#sdKey").innerHTML = KEYS.map((k) => `<option>${k}</option>`).join("");
  $("#soundChips").innerHTML = SOUND_CHIPS.map((s) => `<button type="button" class="chip" data-sound="${esc(s)}">${esc(s)}</button>`).join("");
  $("#soundChips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-sound]"); if (!b) return;
    $("#sdPrompt").value = b.dataset.sound; updateCounts();
  });
  $("#soundsForm").addEventListener("submit", (e) => {
    e.preventDefault();
    withBusy(e.submitter || $("#soundsForm .btn"), async () => {
      const prompt = $("#sdPrompt").value.trim();
      if (!prompt) { $("#sdPrompt").focus(); throw new ApiError("Describe the sound you want."); }
      checkLimits(["sdPrompt"]);
      const body = { prompt, model: state.model, soundLoop: $("#sdLoop").checked, soundKey: $("#sdKey").value, grabLyrics: false };
      const bpm = parseInt($("#sdTempo").value, 10);
      if (bpm >= 1 && bpm <= 300) body.soundTempo = bpm;
      await startMusic("sounds", "/api/v1/generate/sounds", body, prompt);
    })();
  });

  /* ================================================================
   * Lyrics
   * ================================================================ */
  $("#lyricsForm").addEventListener("submit", (e) => {
    e.preventDefault();
    withBusy(e.submitter || $("#lyricsForm .btn"), async () => {
      const prompt = $("#lyPrompt").value.trim();
      if (!prompt) { $("#lyPrompt").focus(); throw new ApiError("Describe what the song should be about."); }
      await startLyrics(prompt, false);
      $("#lyPrompt").value = ""; updateCounts();
    })();
  });
  async function startLyrics(prompt, forCustom) {
    const data = await api("/api/v1/lyrics", { method: "POST", body: { prompt, callBackUrl: callbackUrl() } });
    addTask({ id: data.taskId, kind: "lyrics", label: prompt, forCustom });
    toast("Writing lyrics… usually takes under a minute.");
  }
  function useLyrics(text, title) {
    setTab("create"); setMode("custom");
    $("#cInstrumental").checked = false; syncInstrumental();
    $("#cLyrics").value = text;
    if (title && !$("#cTitle").value.trim()) $("#cTitle").value = title;
    updateCounts();
    $("#cLyrics").scrollIntoView({ behavior: "smooth", block: "center" });
    toast("Lyrics added to your custom song ✍️", "ok");
  }
  function lyricsPicker(task) {
    const items = (task.result || []).filter((x) => x.text);
    if (!items.length) return;
    openDialog({
      title: "Pick your lyrics",
      wide: true,
      body: `<div class="lyr-pick">${items.map((x, i) => `<div class="lyr"><h4>${esc(x.title || `Draft ${i + 1}`)}</h4><pre>${esc(x.text)}</pre>
        <button type="button" class="btn primary sm" data-use="${i}">Use this draft</button></div>`).join("")}</div>`,
      cancel: "Close",
      onOpen: (b) => b.addEventListener("click", (e) => {
        const u = e.target.closest("[data-use]"); if (!u) return;
        const x = items[+u.dataset.use];
        useLyrics(x.text, x.title);
        dlg.close();
      }),
    });
  }

  /* ================================================================
   * Tasks
   * ================================================================ */
  async function startMusic(op, path, body, label) {
    const data = await api(path, { method: "POST", body: { ...body, callBackUrl: callbackUrl() } });
    addTask({ id: data.taskId, kind: "music", op, path, label, model: body.model, params: body });
    toast("🎶 On it! Your first take usually streams in about 30 seconds.");
    refreshCredits();
    if (matchMedia("(max-width: 980px)").matches) $(".library").scrollIntoView({ behavior: "smooth" });
  }

  function addTask(t) {
    const task = { status: "pending", raw: "PENDING", createdAt: Date.now(), tracks: [], ...t };
    state.tasks = state.tasks.filter((x) => x.id !== task.id);
    state.tasks.unshift(task);
    saveTasks();
    renderAll();
    setTimeout(() => pollTask(task), 2500);
    return task;
  }
  const findTask = (id) => state.tasks.find((t) => t.id === id);
  const isActive = (t) => t.status === "pending" || t.status === "partial";

  const flagStatus = (f) => {
    if (f === "SUCCESS" || f === 1) return "done";
    if (f === "PENDING" || f === 0 || f === 2 || f == null || f === "") return "pending";
    return "failed";
  };
  const POLLERS = {
    music: {
      path: "/api/v1/generate/record-info",
      parse(d, t) {
        const raw = d.status || "PENDING";
        const tracks = (d.response?.sunoData || []).map((s) => normTrack(s, t.id));
        let status = "pending";
        if (raw === "SUCCESS") status = "done";
        else if (raw === "TEXT_SUCCESS" || raw === "FIRST_SUCCESS") status = "partial";
        else if (raw !== "PENDING") status = "failed";
        return { raw, status, tracks: tracks.length ? tracks : t.tracks, error: d.errorMessage };
      },
    },
    lyrics: {
      path: "/api/v1/lyrics/record-info",
      parse(d) {
        const raw = d.status || "PENDING";
        const items = (d.response?.data || []).filter((x) => x.status !== "failed");
        const status = raw === "SUCCESS" ? "done" : raw === "PENDING" ? "pending" : "failed";
        return { raw, status, result: items, error: d.errorMessage };
      },
    },
    wav: { path: "/api/v1/wav/record-info", parse: (d) => ({ status: flagStatus(d.successFlag), result: d.response, error: d.errorMessage }) },
    stems: { path: "/api/v1/vocal-removal/record-info", parse: (d) => ({ status: flagStatus(d.successFlag), result: d.response, error: d.errorMessage }) },
    video: { path: "/api/v1/mp4/record-info", parse: (d) => ({ status: flagStatus(d.successFlag), result: d.response, error: d.errorMessage }) },
    art: {
      path: "/api/v1/suno/cover/record-info",
      parse: (d) => ({ status: d.successFlag === 1 ? "done" : d.successFlag === 3 ? "failed" : "pending", result: d.response, error: d.errorMessage }),
    },
    midi: {
      path: "/api/v1/midi/record-info",
      parse: (d) => ({ status: d.successFlag === 1 ? "done" : d.successFlag === 2 || d.successFlag === 3 ? "failed" : "pending", result: d.midiData, error: d.errorMessage }),
    },
  };

  function normTrack(s, taskId) {
    return {
      id: s.id, taskId,
      title: s.title || "Untitled",
      tags: s.tags || "",
      prompt: s.prompt || "",
      image: s.image_url || s.source_image_url || "",
      audio: s.audio_url || s.source_audio_url || "",
      stream: s.stream_audio_url || s.source_stream_audio_url || "",
      duration: s.duration || 0,
      model: s.model_name || "",
    };
  }

  async function pollTask(task) {
    if (!state.key || state.inflight.has(task.id) || !isActive(task)) return;
    if (Date.now() - task.createdAt > TIMEOUT_MS) {
      task.status = "failed"; task.error = "Timed out waiting for results."; saveTasks(); renderAll(); return;
    }
    const p = POLLERS[task.kind]; if (!p) return;
    state.inflight.add(task.id);
    try {
      const d = await api(p.path, { query: { taskId: task.id } });
      if (!d) return;
      const before = JSON.stringify([task.status, task.raw, task.tracks, task.result]);
      const u = p.parse(d, task);
      Object.assign(task, u);
      if (task.status === "failed" && !task.error) task.error = "Generation failed.";
      const after = JSON.stringify([task.status, task.raw, task.tracks, task.result]);
      if (before !== after) {
        saveTasks();
        renderAll();
        onTaskChanged(task, JSON.parse(before)[0]);
      }
    } catch (e) {
      if (e.code === 401) return;
      task.pollErrors = (task.pollErrors || 0) + 1;
      if (task.pollErrors > 8) { task.status = "failed"; task.error = e.message; saveTasks(); renderAll(); }
    } finally {
      state.inflight.delete(task.id);
    }
  }

  function onTaskChanged(task, prev) {
    if (task.status === prev) {
      // Music moved from TEXT_SUCCESS to FIRST_SUCCESS etc.
      if (task.kind === "music" && task.raw === "FIRST_SUCCESS" && !task.notifiedFirst) {
        task.notifiedFirst = true;
        const tr = task.tracks.find((x) => x.stream || x.audio);
        if (tr) toast(`🎧 “${tr.title}” is streaming now`, "ok", { label: "Play", fn: () => playTrack(tr) });
      }
      return;
    }
    if (task.status === "failed") {
      toast(`${labelFor(task)} failed: ${task.error}`, "err");
      return;
    }
    if (task.kind === "music" && task.status === "partial" && !task.notifiedFirst && task.tracks.some((x) => x.stream || x.audio)) {
      task.notifiedFirst = true;
      const tr = task.tracks.find((x) => x.stream || x.audio);
      toast(`🎧 “${tr.title}” is streaming now`, "ok", { label: "Play", fn: () => playTrack(tr) });
    }
    if (task.status === "done") {
      refreshCredits();
      if (task.kind === "music") {
        const tr = task.tracks[0];
        if (!task.notifiedFirst && tr) toast(`✅ “${tr.title}” is ready`, "ok", { label: "Play", fn: () => playTrack(tr) });
        else toast(`✅ Mastered: ${task.tracks.map((x) => `“${x.title}”`).join(" & ")}`, "ok");
        confetti();
      } else if (task.kind === "lyrics") {
        if (task.forCustom) lyricsPicker(task);
        else toast("✍️ Your lyrics are ready", "ok");
      } else {
        toast(`✅ ${labelFor(task)} ready`, "ok");
      }
    }
  }
  const labelFor = (t) => ({ wav: "WAV file", stems: "Stem split", video: "Music video", art: "Cover art", midi: "MIDI", lyrics: "Lyrics" }[t.kind] || "Song");

  let pollTimer;
  function startPolling() {
    clearInterval(pollTimer);
    const tick = () => state.tasks.filter(isActive).forEach(pollTask);
    tick();
    pollTimer = setInterval(tick, POLL_MS);
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden && state.key) state.tasks.filter(isActive).forEach(pollTask); });

  /* ================================================================
   * Library rendering
   * ================================================================ */
  let loadingIdx = 0;
  setInterval(() => {
    loadingIdx++;
    $$(".progress .msg-text").forEach((el) => (el.textContent = LOADING_MSGS[(loadingIdx + +el.dataset.seed) % LOADING_MSGS.length]));
  }, 2800);

  function renderAll() {
    renderFeed();
    renderLyricsList();
    renderPersonaSelect();
    markPlaying();
  }

  function childTasks(parentTaskId, audioId) {
    return state.tasks.filter((t) => t.parent && t.parent.taskId === parentTaskId && (audioId === undefined ? !t.parent.audioId : t.parent.audioId === audioId));
  }

  function renderFeed() {
    const feed = $("#feed");
    const q = state.search.toLowerCase();
    let tasks = state.tasks.filter((t) => (t.kind === "music" || (t.kind === "stems" && !t.parent)));
    if (q) tasks = tasks.filter((t) => [t.label, ...t.tracks.flatMap((x) => [x.title, x.tags])].join(" ").toLowerCase().includes(q));
    if (state.filter === "fav") tasks = tasks.filter((t) => t.tracks.some((x) => state.favs.has(x.id)));

    if (!state.tasks.some((t) => t.kind === "music" || t.kind === "stems")) {
      feed.innerHTML = `<div class="card empty">
        <div class="big-note">🎵</div>
        <h3>Your first song is one click away</h3>
        <p>Pick a spark below, or write your own idea in the studio. Two versions will stream in about 30 seconds.</p>
        <div class="starter-grid">${IDEAS.slice(0, 6).map((x, i) => `<button class="starter" data-starter="${i}"><b>${x.e}</b><span>${esc(x.t)}</span></button>`).join("")}</div>
      </div>`;
      return;
    }
    if (!tasks.length) {
      feed.innerHTML = `<div class="card empty"><div class="big-note">🔍</div><h3>Nothing matches</h3><p>${state.filter === "fav" ? "Tap ♥ on a track to save it here." : "Try a different search."}</p></div>`;
      return;
    }
    feed.innerHTML = tasks.map(renderTask).join("");
  }

  function renderTask(t) {
    if (t.kind === "stems") {
      return `<article class="card task" data-task="${esc(t.id)}">
        <div class="task-head"><div class="task-title"><span class="badge">Stems</span><span class="q">${esc(t.label)}</span></div>
        <div class="row gap"><span class="time">${ago(t.createdAt)}</span>${taskMenu(t)}</div></div>
        ${stemsBlock(t, { title: t.label })}</article>`;
    }
    const badge = OP_BADGE[t.op] || "Song";
    const model = t.model ? `<span class="badge model">${esc(modelInfo(t.model).name)}</span>` : "";
    let body = "";
    if (t.status === "failed") {
      body = `<div class="task-error"><span>⚠️ ${esc(t.error || "Something went wrong.")}</span>${t.params ? `<button class="btn sm" data-retry="${esc(t.id)}">↻ Try again</button>` : ""}</div>`;
    }
    if (isActive(t)) body += progressBlock(t);
    if (t.tracks.length) body += `<div class="tracks">${t.tracks.map((tr) => renderTrack(tr, t)).join("")}</div>`;
    const art = childTasks(t.id).filter((c) => c.kind === "art");
    body += art.map(artBlock).join("");
    return `<article class="card task" data-task="${esc(t.id)}">
      <div class="task-head">
        <div class="task-title"><span class="badge ${t.status === "failed" ? "fail" : ""}">${esc(badge)}</span>${model}<span class="q" title="${esc(t.label)}">${esc(t.label)}</span></div>
        <div class="row gap"><span class="time">${ago(t.createdAt)}</span>${taskMenu(t)}</div>
      </div>${body}</article>`;
  }

  function taskMenu(t) {
    const hasTracks = t.kind === "music" && t.tracks.length && t.status === "done";
    return `<details class="menu"><summary class="icon-btn" aria-label="More" title="More">⋯</summary><div class="menu-list right">
      ${hasTracks ? `<button data-task-act="art" data-id="${esc(t.id)}">🖼 Generate cover art</button>` : ""}
      ${t.params ? `<button data-task-act="again" data-id="${esc(t.id)}">↻ Make another version</button>` : ""}
      <button data-task-act="copy" data-id="${esc(t.id)}">📋 Copy task ID</button>
      <hr /><button class="danger" data-task-act="remove" data-id="${esc(t.id)}">🗑 Remove from library</button></div></details>`;
  }

  function progressBlock(t) {
    const step = { PENDING: 0, TEXT_SUCCESS: 1, FIRST_SUCCESS: 2, SUCCESS: 3 }[t.raw] ?? 0;
    const seed = [...t.id].reduce((a, c) => a + c.charCodeAt(0), 0) % LOADING_MSGS.length;
    const msg = step >= 2 ? "First take is live, finishing the rest" : LOADING_MSGS[(loadingIdx + seed) % LOADING_MSGS.length];
    return `<div class="progress">
      <div class="msg"><span class="mini-eq"><i></i><i></i><i></i><i></i></span><span class="${step >= 2 ? "" : "msg-text"}" data-seed="${seed}">${esc(msg)}</span><span class="dots"></span></div>
      <div class="progress-steps">${STEP_LABELS.map((_, i) => `<i class="${i < step ? "done" : i === step ? "now" : ""}"></i>`).join("")}</div>
      <div class="progress-labels">${STEP_LABELS.map((l) => `<span>${l}</span>`).join("")}</div></div>`;
  }

  function renderTrack(tr, t) {
    const src = tr.audio || tr.stream;
    const live = !tr.audio && tr.stream;
    const fav = state.favs.has(tr.id);
    const done = t.status === "done" && tr.audio;
    const kids = childTasks(t.id, tr.id);
    const img = tr.image ? `<img src="${esc(tr.image)}" alt="" loading="lazy" />` : "";
    return `<div class="track" data-audio="${esc(tr.id)}" data-tid="${esc(t.id)}">
      <button class="art" data-play="${esc(tr.id)}" ${src ? "" : "disabled"} aria-label="Play ${esc(tr.title)}">${img}<span class="ov">${src ? "▶" : "…"}</span></button>
      <div class="t-main">
        <div class="t-title" title="${esc(tr.title)}">${esc(tr.title)}</div>
        <div class="t-tags" title="${esc(tr.tags)}">${esc(tr.tags || "—")}</div>
        <div class="t-meta">${tr.duration ? `<span>${fmtTime(tr.duration)}</span>` : ""}${live ? '<span class="live">● Streaming</span>' : ""}${tr.model ? `<span>${esc(tr.model)}</span>` : ""}</div>
      </div>
      <div class="t-actions">
        <button class="icon-btn fav ${fav ? "on" : ""}" data-fav="${esc(tr.id)}" aria-label="Favorite" title="Favorite">${fav ? "♥" : "♡"}</button>
        ${tr.audio ? `<a class="icon-btn" href="${esc(tr.audio)}" download="${esc(safeFileName(tr.title))}.mp3" target="_blank" rel="noopener" title="Download MP3" aria-label="Download MP3">⬇</a>` : ""}
        ${done ? trackMenu(tr, t) : ""}
      </div>
      ${kids.length ? renderAssets(kids, tr) : ""}
    </div>`;
  }

  function trackMenu(tr, t) {
    const id = esc(tr.id), tid = esc(t.id);
    const b = (act, label) => `<button data-act="${act}" data-a="${id}" data-t="${tid}">${label}</button>`;
    return `<details class="menu"><summary class="icon-btn" aria-label="Track actions" title="Track actions">⋯</summary><div class="menu-list right">
      ${b("karaoke", "🎤 Sing-along lyrics")}
      ${b("extend", "➕ Extend this song")}
      ${b("replace", "✂️ Replace a section")}
      ${b("reuse", "🎚 Reuse settings in Custom")}
      ${b("remix", "🎛 Send to Remix")}
      <hr />
      ${b("wav", "💿 Get WAV (lossless)")}
      ${b("stems", "🧩 Split into stems")}
      ${b("video", "🎬 Make a music video")}
      ${b("persona", "🎭 Save voice as persona")}
      <hr />
      ${b("copyid", "📋 Copy audio ID")}
    </div></details>`;
  }

  function renderAssets(kids, tr) {
    const chips = [], blocks = [];
    for (const k of kids) {
      if (k.kind === "midi") continue; // rendered inside its stems block
      const pending = isActive(k), failed = k.status === "failed";
      const name = { wav: "WAV", stems: "Stems", video: "Video", midi: "MIDI" }[k.kind] || k.kind;
      if (pending) { chips.push(`<span class="asset"><span class="spin"></span>${name}…</span>`); continue; }
      if (failed) { chips.push(`<span class="asset fail" title="${esc(k.error)}">⚠️ ${name} failed</span>`); continue; }
      if (k.kind === "wav" && k.result?.audioWavUrl) chips.push(`<a class="asset" href="${esc(k.result.audioWavUrl)}" target="_blank" rel="noopener" download>💿 Download WAV</a>`);
      if (k.kind === "video" && k.result?.videoUrl) blocks.push(`<div class="asset-block video-wrap"><video src="${esc(k.result.videoUrl)}" controls preload="none" playsinline></video><div><a class="asset" href="${esc(k.result.videoUrl)}" target="_blank" rel="noopener" download>🎬 Download MP4</a></div></div>`);
      if (k.kind === "stems") blocks.push(`<div class="asset-block">${stemsBlock(k, tr)}</div>`);
    }
    return (chips.length ? `<div class="assets">${chips.join("")}</div>` : "") + blocks.join("");
  }

  function stemList(r) {
    if (!r) return [];
    const out = STEM_KEYS.filter(([k]) => r[k]).map(([k, n]) => ({ name: n, url: r[k] }));
    if (!out.length && Array.isArray(r.originData)) {
      r.originData.forEach((o) => o.audio_url && out.push({ name: o.stem_type_group_name || "Stem", url: o.audio_url }));
    }
    return out;
  }
  function stemsBlock(k, tr) {
    if (isActive(k)) return progressLite("Splitting stems");
    if (k.status === "failed") return `<div class="task-error">⚠️ ${esc(k.error)}</div>`;
    const stems = stemList(k.result);
    if (!stems.length) return `<p class="muted small">No stems returned.</p>`;
    const midiKids = state.tasks.filter((m) => m.kind === "midi" && m.parent?.stemsTaskId === k.id);
    return `<div class="row between wrap gap"><strong class="small">🧩 Stems</strong>
      ${midiKids.length ? "" : `<button class="btn ghost sm" data-midi="${esc(k.id)}" data-a="${esc(tr?.id || "")}" data-t="${esc(k.parent?.taskId || "")}">🎹 Convert to MIDI</button>`}</div>
      <div class="stems">${stems.map((s) => `<div class="stem"><button data-playurl="${esc(s.url)}" data-name="${esc(s.name)}" data-sub="${esc(tr?.title || "")}" aria-label="Play ${esc(s.name)}">▶</button><span>${esc(s.name)}</span><a href="${esc(s.url)}" target="_blank" rel="noopener" download aria-label="Download ${esc(s.name)}">⬇</a></div>`).join("")}</div>
      ${midiKids.map((m) => midiBlock(m)).join("")}`;
  }
  function midiBlock(m) {
    if (isActive(m)) return progressLite("Transcribing to MIDI");
    if (m.status === "failed") return `<div class="task-error">⚠️ MIDI: ${esc(m.error)}</div>`;
    const inst = m.result?.instruments || [];
    const notes = inst.reduce((a, i) => a + (i.notes?.length || 0), 0);
    return `<div class="midi-sum">🎹 MIDI: ${inst.length} instrument${inst.length === 1 ? "" : "s"}, ${notes.toLocaleString()} notes
      ${inst.length ? `<button class="btn ghost sm" data-midifile="${esc(m.id)}">⬇ Download .mid</button>` : ""}</div>`;
  }
  function artBlock(k) {
    if (isActive(k)) return `<div class="asset-block" style="padding-left:0">${progressLite("Painting cover art")}</div>`;
    if (k.status === "failed") return `<div class="task-error">⚠️ Cover art: ${esc(k.error)}</div>`;
    const imgs = k.result?.images || [];
    return `<div><strong class="small">🖼 Cover art</strong><div class="cover-grid">${imgs.map((u) => `<a href="${esc(u)}" target="_blank" rel="noopener"><img src="${esc(u)}" alt="Generated cover art" loading="lazy" /></a>`).join("")}</div></div>`;
  }
  const progressLite = (label) => `<span class="asset"><span class="spin"></span>${esc(label)}…</span>`;

  function renderLyricsList() {
    const list = state.tasks.filter((t) => t.kind === "lyrics");
    $("#lyricsList").innerHTML = list.map((t) => {
      const head = `<div class="row between gap"><strong class="small">“${esc(t.label)}”</strong><span class="row gap"><span class="time">${ago(t.createdAt)}</span><button class="icon-btn" data-task-act="remove" data-id="${esc(t.id)}" aria-label="Remove" title="Remove">✕</button></span></div>`;
      if (isActive(t)) return `<div class="lyr">${head}<div class="msg"><span class="mini-eq"><i></i><i></i><i></i><i></i></span> Writing<span class="dots"></span></div></div>`;
      if (t.status === "failed") return `<div class="lyr">${head}<div class="task-error">⚠️ ${esc(t.error)}</div></div>`;
      return `<div class="lyr">${head}${(t.result || []).map((x, i) => `<h4>${esc(x.title || `Draft ${i + 1}`)}</h4><pre>${esc(x.text)}</pre>
        <div class="row gap wrap"><button class="btn primary sm" data-uselyr="${esc(t.id)}" data-i="${i}">Use in Custom song</button>
        <button class="btn ghost sm" data-copylyr="${esc(t.id)}" data-i="${i}">Copy</button></div>`).join("<hr style='border:0;border-top:1px solid var(--border);margin:12px 0' />")}</div>`;
    }).join("");
  }

  /* ---------- Library events ---------- */
  $("#libSearch").addEventListener("input", (e) => { state.search = e.target.value; renderFeed(); markPlaying(); });
  $("#libFilter").addEventListener("click", (e) => {
    const b = e.target.closest("[data-f]"); if (!b) return;
    state.filter = b.dataset.f;
    $$("#libFilter button").forEach((x) => x.setAttribute("aria-checked", String(x === b)));
    renderFeed(); markPlaying();
  });

  // Close open <details> menus on outside click.
  document.addEventListener("click", (e) => {
    $$("details.menu[open]").forEach((d) => { if (!d.contains(e.target)) d.open = false; });
  });

  const trackById = (tid, aid) => findTask(tid)?.tracks.find((x) => x.id === aid);

  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-play],[data-fav],[data-act],[data-task-act],[data-retry],[data-starter],[data-playurl],[data-midi],[data-midifile],[data-uselyr],[data-copylyr]");
    if (!el) return;
    const d = el.dataset;
    el.closest("details.menu")?.removeAttribute("open");
    if (d.play) {
      const tid = el.closest("[data-tid]").dataset.tid;
      const tr = trackById(tid, d.play);
      if (state.current?.id === tr.id) togglePlay(); else playTrack(tr);
    } else if (d.fav) {
      state.favs.has(d.fav) ? state.favs.delete(d.fav) : state.favs.add(d.fav);
      saveFavs(); renderFeed(); markPlaying();
    } else if (d.act) {
      trackAction(d.act, d.t, d.a);
    } else if (d.taskAct) {
      taskAction(d.taskAct, d.id);
    } else if (d.retry) {
      const t = findTask(d.retry);
      withBusy(el, () => startMusic(t.op, t.path, t.params, t.label))();
    } else if (d.starter) {
      useIdea(IDEAS[+d.starter]);
      $(".studio").scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (d.playurl) {
      playUrl({ id: d.playurl, title: d.name, sub: d.sub, url: d.playurl });
    } else if (d.midi) {
      withBusy(el, async () => {
        const data = await api("/api/v1/midi/generate", { method: "POST", body: { taskId: d.midi, callBackUrl: callbackUrl() } });
        addTask({ id: data.taskId, kind: "midi", parent: { taskId: d.t || d.midi, audioId: d.a || undefined, stemsTaskId: d.midi } });
        toast("🎹 Transcribing stems to MIDI…");
      })();
    } else if (d.midifile) {
      const m = findTask(d.midifile);
      downloadBlob(buildMidi(m.result.instruments), `tunesmith-${m.id.slice(0, 8)}.mid`, "audio/midi");
    } else if (d.uselyr || d.copylyr) {
      const t = findTask(d.uselyr || d.copylyr), x = t.result[+d.i];
      if (d.uselyr) useLyrics(x.text, x.title);
      else navigator.clipboard?.writeText(x.text).then(() => toast("Lyrics copied"));
    }
  });

  function taskAction(act, id) {
    const t = findTask(id); if (!t) return;
    if (act === "remove") {
      const kids = state.tasks.filter((k) => k.parent?.taskId === id || k.parent?.stemsTaskId === id);
      state.tasks = state.tasks.filter((x) => x !== t && !kids.includes(x));
      saveTasks(); renderAll();
      toast("Removed from library");
    } else if (act === "copy") {
      navigator.clipboard?.writeText(t.id).then(() => toast("Task ID copied"));
    } else if (act === "again") {
      startMusic(t.op, t.path, t.params, t.label).catch((e) => toast(e.message, "err"));
    } else if (act === "art") {
      if (childTasks(t.id).some((c) => c.kind === "art" && c.status !== "failed")) return toast("This song already has cover art");
      api("/api/v1/suno/cover/generate", { method: "POST", body: { taskId: t.id, callBackUrl: callbackUrl() } })
        .then((data) => { addTask({ id: data.taskId, kind: "art", parent: { taskId: t.id } }); toast("🖼 Painting new cover art…"); })
        .catch((e) => toast(e.message, "err"));
    }
  }

  /* ================================================================
   * Track actions
   * ================================================================ */
  async function startChild(kind, path, body, parent, msg) {
    const data = await api(path, { method: "POST", body: { ...body, callBackUrl: callbackUrl() } });
    addTask({ id: data.taskId, kind, parent });
    toast(msg);
  }

  function trackAction(act, tid, aid) {
    const tr = trackById(tid, aid); if (!tr) return;
    const parent = { taskId: tid, audioId: aid };
    const has = (kind) => childTasks(tid, aid).some((c) => c.kind === kind && c.status !== "failed");
    switch (act) {
      case "karaoke": return openKaraoke(tr);
      case "copyid": return navigator.clipboard?.writeText(`taskId: ${tid}\naudioId: ${aid}`).then(() => toast("IDs copied"));
      case "reuse": {
        setTab("create"); setMode("custom");
        $("#cTitle").value = tr.title; $("#cStyle").value = tr.tags;
        const inst = !tr.prompt || tr.prompt.length < 3;
        $("#cInstrumental").checked = inst; syncInstrumental();
        if (!inst) $("#cLyrics").value = tr.prompt;
        syncStyleChips(); updateCounts();
        $(".studio").scrollIntoView({ behavior: "smooth", block: "start" });
        return toast("Settings loaded. Tweak and create again.", "ok");
      }
      case "remix": {
        setTab("remix");
        resetSources();
        $('.src[data-slot="0"] .src-url').value = tr.audio;
        $("#rTitle").value = `${tr.title} (Remix)`;
        $(".studio").scrollIntoView({ behavior: "smooth", block: "start" });
        return toast("Loaded into Remix. Pick what to do with it.", "ok");
      }
      case "wav":
        if (has("wav")) return toast("WAV already requested for this track");
        return startChild("wav", "/api/v1/wav/generate", { taskId: tid, audioId: aid }, parent, "💿 Converting to WAV…").catch((e) => toast(e.message, "err"));
      case "stems":
        return openDialog({
          title: "Split into stems",
          body: `<p class="muted">Isolate parts of “${esc(tr.title)}” for remixing, karaoke, or production.</p>
            <label class="field"><span>Separation</span><select id="dStemType">
              <option value="separate_vocal">Vocals + instrumental (2 stems)</option>
              <option value="split_stem">Full band (up to 12 stems)</option>
              <option value="split_stem_advanced">One specific instrument</option></select></label>
            <label class="field" id="dStemNameWrap" hidden><span>Instrument</span><select id="dStemName">${STEM_NAMES.map((n) => `<option>${esc(n)}</option>`).join("")}</select></label>`,
          submit: "🧩 Split",
          onOpen: (b) => $("#dStemType", b).addEventListener("change", (e) => ($("#dStemNameWrap", b).hidden = e.target.value !== "split_stem_advanced")),
          onSubmit: (b) => {
            const type = $("#dStemType", b).value;
            const body = { taskId: tid, audioId: aid, type };
            if (type === "split_stem_advanced") body.stemName = $("#dStemName", b).value;
            return startChild("stems", "/api/v1/vocal-removal/generate", body, parent, "🧩 Splitting stems…");
          },
        });
      case "video":
        if (has("video")) return toast("A video is already on its way for this track");
        return openDialog({
          title: "Make a music video",
          body: `<p class="muted">Creates an MP4 with animated visuals for “${esc(tr.title)}”.</p>
            <label class="field"><span>Artist name <small class="muted">optional</small></span><input id="dAuthor" maxlength="50" placeholder="Your artist name" /></label>
            <label class="field"><span>Watermark / website <small class="muted">optional</small></span><input id="dDomain" maxlength="50" placeholder="yourband.com" /></label>`,
          submit: "🎬 Create video",
          onSubmit: (b) => {
            const body = { taskId: tid, audioId: aid };
            const a = $("#dAuthor", b).value.trim(), dn = $("#dDomain", b).value.trim();
            if (a) body.author = a;
            if (dn) body.domainName = dn;
            return startChild("video", "/api/v1/mp4/generate", body, parent, "🎬 Rendering your music video…");
          },
        });
      case "persona":
        return openDialog({
          title: "Save voice as a persona",
          body: `<p class="muted">Capture the vocal character of “${esc(tr.title)}” and reuse it in future songs (Custom → Advanced → Persona).</p>
            <label class="field"><span>Persona name</span><input id="dPName" maxlength="60" value="${esc(tr.title)} voice" /></label>
            <label class="field"><span>Describe the voice & style</span><textarea id="dPDesc" rows="3">${esc(tr.tags)}</textarea></label>
            <div class="grid2"><label class="field"><span>Analyze from (s)</span><input id="dPStart" type="number" min="0" step="1" value="0" /></label>
            <label class="field"><span>to (s)</span><input id="dPEnd" type="number" min="1" step="1" value="${Math.min(30, Math.floor(tr.duration || 30))}" /></label></div>`,
          submit: "🎭 Create persona",
          onSubmit: async (b) => {
            const name = $("#dPName", b).value.trim(), description = $("#dPDesc", b).value.trim();
            const vs = +$("#dPStart", b).value, ve = +$("#dPEnd", b).value;
            if (!name || !description) throw new ApiError("Give the persona a name and a description.");
            if (!(ve > vs)) throw new ApiError("The end time must be after the start time.");
            const data = await api("/api/v1/generate/generate-persona", { method: "POST", body: { taskId: tid, audioId: aid, name, description, vocalStart: vs, vocalEnd: ve, style: tr.tags.slice(0, 200) } });
            state.personas.unshift({ id: data.personaId, name: data.name || name, kind: "style_persona", from: tr.title });
            savePersonas(); renderPersonaSelect();
            toast(`🎭 Persona “${data.name || name}” saved. Find it in Custom → Advanced.`, "ok");
          },
        });
      case "extend":
        return openDialog({
          title: "Extend this song",
          body: `<p class="muted">Continue “${esc(tr.title)}” from any point. Leave lyrics empty to let the AI keep going.</p>
            <label class="field"><span class="label-row">Continue from <output id="dExtOut">${fmtTime(tr.duration)}</output></span>
              <input type="range" id="dExtAt" min="1" max="${Math.max(2, Math.floor(tr.duration || 60))}" step="1" value="${Math.max(1, Math.floor(tr.duration || 60) - 1)}" /></label>
            <label class="field"><span>Title</span><input id="dExtTitle" maxlength="80" value="${esc(tr.title)}" /></label>
            <label class="field"><span>Style</span><input id="dExtStyle" value="${esc(tr.tags)}" /></label>
            <label class="field"><span>Lyrics for the new part</span><textarea id="dExtLyrics" rows="5" placeholder="[Verse 3]&#10;…"></textarea></label>
            <label class="switch"><input type="checkbox" id="dExtInst" /><span class="track"></span> Instrumental</label>
            <p class="muted small">Uses model ${esc(modelInfo(state.model).name)}.</p>`,
          submit: "➕ Extend",
          onOpen: (b) => { const r = $("#dExtAt", b); const o = () => ($("#dExtOut", b).textContent = fmtTime(+r.value)); r.addEventListener("input", o); o(); },
          onSubmit: (b) => {
            const inst = $("#dExtInst", b).checked;
            const body = { audioId: aid, taskId: tid, model: state.model, continueAt: +$("#dExtAt", b).value, instrumental: inst };
            const ti = $("#dExtTitle", b).value.trim(), st = $("#dExtStyle", b).value.trim(), ly = $("#dExtLyrics", b).value.trim();
            if (ti) body.title = ti;
            if (st) body.style = st;
            if (ly && !inst) { body.prompt = ly; body.lyrics = ly; }
            Object.assign(body, personaFields());
            return startMusic("extend", "/api/v1/generate/extend", body, `${ti || tr.title} (extended)`);
          },
        });
      case "replace": {
        const dur = tr.duration || 60;
        const s0 = Math.max(0, Math.round(dur * 0.3)), e0 = Math.min(Math.round(dur * 0.3) + Math.max(10, Math.round(dur * 0.2)), Math.floor(dur));
        return openDialog({
          title: "Replace a section",
          body: `<p class="muted">Regenerate part of “${esc(tr.title)}” and blend it seamlessly. The section must be at least 10s and at most half the song (${fmtTime(dur)} total).</p>
            <div class="grid2"><label class="field"><span>Start (seconds)</span><input id="dRStart" type="number" min="0" step="0.5" value="${s0}" /></label>
            <label class="field"><span>End (seconds)</span><input id="dREnd" type="number" min="1" step="0.5" value="${e0}" /></label></div>
            <label class="field"><span>New lyrics for this section</span><textarea id="dRSeg" rows="4" placeholder="[Chorus]&#10;…"></textarea></label>
            <label class="field"><span>Full song lyrics (after the change)</span><textarea id="dRFull" rows="6">${esc(tr.prompt)}</textarea></label>
            <label class="field"><span>Style</span><input id="dRTags" value="${esc(tr.tags)}" /></label>
            <label class="field"><span>Exclude styles <small class="muted">optional</small></span><input id="dRNeg" /></label>`,
          submit: "✂️ Replace section",
          wide: true,
          onSubmit: (b) => {
            const st = +$("#dRStart", b).value, en = +$("#dREnd", b).value;
            const seg = $("#dRSeg", b).value.trim(), full = $("#dRFull", b).value.trim(), tags = $("#dRTags", b).value.trim();
            if (!(en - st >= 10)) throw new ApiError("The section needs to be at least 10 seconds long.");
            if (dur && en - st > dur / 2) throw new ApiError("The section can be at most half of the song.");
            if (dur && en > dur) throw new ApiError("The end time is past the end of the song.");
            if (!seg) throw new ApiError("Write the lyrics for the new section.");
            if (!full) throw new ApiError("Include the full lyrics of the song.");
            if (!tags) throw new ApiError("Add a style.");
            const body = { taskId: tid, audioId: aid, prompt: seg, lyrics: seg, tags, title: tr.title, infillStartS: +st.toFixed(2), infillEndS: +en.toFixed(2), fullLyrics: full };
            const neg = $("#dRNeg", b).value.trim();
            if (neg) body.negativeTags = neg;
            return startMusic("replace-section", "/api/v1/generate/replace-section", body, `${tr.title} (new ${fmtTime(st)}–${fmtTime(en)})`);
          },
        });
      }
    }
  }

  /* ---------- MIDI file writer ---------- */
  function buildMidi(instruments) {
    const TPQ = 480, TICKS_PER_SEC = TPQ * 2; // 120 bpm
    const vlq = (n) => { const b = [n & 0x7f]; while ((n >>= 7)) b.unshift((n & 0x7f) | 0x80); return b; };
    const str = (s) => [...s].map((c) => c.charCodeAt(0) & 0x7f);
    const u32 = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
    const chunk = (type, data) => [...str(type), ...u32(data.length), ...data];
    const tracks = [];
    tracks.push(chunk("MTrk", [0, 0xff, 0x51, 3, 0x07, 0xa1, 0x20, 0, 0xff, 0x2f, 0]));
    const melodic = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15];
    let next = 0;
    instruments.forEach((inst) => {
      const drums = /drum|kick|snare|hat|percussion|cymbal/i.test(inst.name || "");
      const channel = drums ? 9 : melodic[next++ % melodic.length];
      const ev = [];
      (inst.notes || []).forEach((n) => {
        const vel = Math.max(1, Math.min(127, Math.round(n.velocity <= 1 ? n.velocity * 127 : n.velocity)));
        const p = Math.max(0, Math.min(127, Math.round(n.pitch)));
        ev.push({ t: Math.round(n.start * TICKS_PER_SEC), d: [0x90 | channel, p, vel] });
        ev.push({ t: Math.round(Math.max(n.end, n.start + 0.01) * TICKS_PER_SEC), d: [0x80 | channel, p, 0] });
      });
      ev.sort((a, b) => a.t - b.t || (a.d[0] & 0xf0) - (b.d[0] & 0xf0));
      const name = str(inst.name || "Instrument").slice(0, 60);
      const data = [0, 0xff, 0x03, name.length, ...name];
      let last = 0;
      ev.forEach((e) => { data.push(...vlq(e.t - last), ...e.d); last = e.t; });
      data.push(0, 0xff, 0x2f, 0);
      tracks.push(chunk("MTrk", data));
    });
    const header = chunk("MThd", [0, 1, 0, tracks.length, (TPQ >> 8) & 255, TPQ & 255]);
    return new Uint8Array([...header, ...tracks.flat()]);
  }
  function downloadBlob(bytes, name, type) {
    const url = URL.createObjectURL(new Blob([bytes], { type }));
    const a = Object.assign(document.createElement("a"), { href: url, download: name });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  /* ================================================================
   * Player
   * ================================================================ */
  const audio = $("#audio");
  function buildQueue() {
    state.queue = [];
    state.tasks.filter((t) => t.kind === "music").forEach((t) => t.tracks.forEach((tr) => { if (tr.audio || tr.stream) state.queue.push(tr); }));
  }
  function playTrack(tr) {
    buildQueue();
    playUrl({ id: tr.id, taskId: tr.taskId, title: tr.title, sub: tr.tags, image: tr.image, url: tr.audio || tr.stream, download: tr.audio, track: tr });
  }
  function playUrl(item) {
    state.current = item;
    $("#player").hidden = false;
    $("#app").classList.add("has-player");
    if (audio.src !== item.url) { audio.src = item.url; }
    audio.play().catch(() => toast("Tap play to start audio"));
    $("#pTitle").textContent = item.title || "Untitled";
    $("#pSub").textContent = item.sub || "";
    const art = $("#pArt");
    if (item.image) art.src = item.image; else art.removeAttribute("src");
    const dl = $("#pDownload");
    dl.hidden = !(item.download || item.url);
    dl.href = item.download || item.url;
    dl.download = `${safeFileName(item.title)}.mp3`;
    $("#pLyrics").disabled = !item.track;
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: item.title, artist: "Tunesmith", artwork: item.image ? [{ src: item.image, sizes: "512x512" }] : [] });
      navigator.mediaSession.setActionHandler("nexttrack", () => step(1));
      navigator.mediaSession.setActionHandler("previoustrack", () => step(-1));
    }
    markPlaying();
    if (!$("#karaoke").hidden && item.track) openKaraoke(item.track);
  }
  function togglePlay() { if (!audio.src) return; audio.paused ? audio.play() : audio.pause(); }
  function step(dir) {
    if (!state.current?.track) return;
    const i = state.queue.findIndex((x) => x.id === state.current.id);
    const next = state.queue[i + dir];
    if (next) playTrack(next);
  }
  function markPlaying() {
    const id = state.current?.id;
    $$(".track").forEach((el) => {
      const on = el.dataset.audio === id;
      el.classList.toggle("playing", on);
      const ov = $(".art .ov", el);
      if (ov && !$(".art", el).disabled) ov.textContent = on && !audio.paused ? "❚❚" : "▶";
    });
  }
  $("#pPlay").onclick = togglePlay;
  $("#pPrev").onclick = () => (audio.currentTime > 3 ? (audio.currentTime = 0) : step(-1));
  $("#pNext").onclick = () => step(1);
  audio.addEventListener("play", () => { $("#pPlay").textContent = "❚❚"; $("#player").classList.add("playing-now"); markPlaying(); });
  audio.addEventListener("pause", () => { $("#pPlay").textContent = "▶"; $("#player").classList.remove("playing-now"); markPlaying(); });
  audio.addEventListener("ended", () => step(1));
  audio.addEventListener("error", () => { if (state.current) toast("Couldn’t play that audio. It may have expired.", "err"); });
  audio.addEventListener("timeupdate", () => {
    const d = audio.duration || state.current?.track?.duration || 0;
    const pct = d ? (audio.currentTime / d) * 100 : 0;
    $("#pFill").style.width = `${Math.min(100, pct)}%`;
    if (!seeking) $("#pSeek").value = Math.round(pct * 10);
    $("#pTime").textContent = `${fmtTime(audio.currentTime)} / ${fmtTime(d)}`;
    updateKaraoke();
  });
  let seeking = false;
  $("#pSeek").addEventListener("input", () => {
    seeking = true;
    const d = audio.duration || 0;
    if (d) audio.currentTime = ($("#pSeek").value / 1000) * d;
  });
  $("#pSeek").addEventListener("change", () => (seeking = false));
  document.addEventListener("keydown", (e) => {
    if (e.target.closest("input, textarea, select, [contenteditable]") || dlg.open) return;
    if (e.code === "Space" && state.current) { e.preventDefault(); togglePlay(); }
    if (e.key === "Escape" && !$("#karaoke").hidden) closeKaraoke();
  });

  /* ================================================================
   * Karaoke (timestamped lyrics)
   * ================================================================ */
  let kWords = [];
  $("#pLyrics").onclick = () => state.current?.track && openKaraoke(state.current.track);
  $("#karaokeClose").onclick = closeKaraoke;
  function closeKaraoke() { $("#karaoke").hidden = true; document.body.style.overflow = ""; }

  async function openKaraoke(tr) {
    if (state.current?.id !== tr.id) playTrack(tr);
    $("#karaoke").hidden = false;
    document.body.style.overflow = "hidden";
    $("#kTitle").textContent = tr.title;
    const art = $("#kArt"); if (tr.image) art.src = tr.image; else art.removeAttribute("src");
    const lines = $("#kLines");
    kWords = [];
    if (!state.aligned[tr.id]) {
      lines.innerHTML = `<p class="k-line active">Syncing lyrics<span class="dots"></span></p>`;
      try {
        const data = await api("/api/v1/generate/get-timestamped-lyrics", { method: "POST", body: { taskId: tr.taskId, audioId: tr.id } });
        state.aligned[tr.id] = data?.alignedWords || [];
      } catch (e) {
        state.aligned[tr.id] = [];
        toast(`Couldn’t sync lyrics: ${e.message}`, "err");
      }
    }
    if (state.current?.id !== tr.id) return;
    const words = state.aligned[tr.id];
    if (!words.length) {
      const plain = (tr.prompt || "").trim();
      lines.innerHTML = plain
        ? plain.split("\n").map((l) => `<p class="k-line ${/^\[.*\]$/.test(l.trim()) ? "section" : ""}" style="opacity:.9">${esc(l) || "&nbsp;"}</p>`).join("")
        : `<p class="k-line active">🎶 This one’s instrumental. Just vibe.</p>`;
      return;
    }
    // Group words into lines. Words may contain newlines and section tags like [Chorus].
    const out = [];
    let cur = [];
    const flush = () => { if (cur.length) out.push(cur); cur = []; };
    words.forEach((w) => {
      const text = String(w.word ?? "");
      const parts = text.split("\n");
      parts.forEach((p, i) => {
        if (i > 0) flush();
        if (p.trim()) cur.push({ text: p, s: w.startS, e: w.endS });
      });
    });
    flush();
    let idx = 0;
    lines.innerHTML = out.map((line, li) => {
      const txt = line.map((w) => w.text).join("");
      if (/^\s*\[.*\]\s*$/.test(txt)) return `<p class="k-line section">${esc(txt.replace(/[[\]]/g, ""))}</p>`;
      return `<p class="k-line" data-line="${li}">${line.map((w) => { kWords.push({ ...w, i: idx }); return `<span class="w" data-w="${idx++}">${esc(w.text)}</span>`; }).join("")}</p>`;
    }).join("");
    kWords.forEach((w) => (w.el = lines.querySelector(`[data-w="${w.i}"]`)));
    lastLine = null;
    updateKaraoke();
  }
  let lastLine = null;
  function updateKaraoke() {
    if ($("#karaoke").hidden || !kWords.length) return;
    const t = audio.currentTime;
    let activeEl = null;
    for (const w of kWords) {
      const el = w.el;
      if (!el) continue;
      const sung = w.s <= t;
      el.classList.toggle("sung", sung);
      if (sung) activeEl = el.parentElement;
    }
    if (activeEl !== lastLine) {
      $$("#kLines .k-line.active").forEach((l) => l.classList.remove("active"));
      if (activeEl) { activeEl.classList.add("active"); activeEl.scrollIntoView({ block: "center", behavior: "smooth" }); }
      lastLine = activeEl;
    }
  }

  /* ================================================================
   * Delight
   * ================================================================ */
  function confetti() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const c = document.createElement("canvas");
    Object.assign(c.style, { position: "fixed", inset: "0", pointerEvents: "none", zIndex: 70 });
    c.width = innerWidth; c.height = innerHeight;
    document.body.append(c);
    const ctx = c.getContext("2d");
    const colors = ["#8b5cf6", "#ec4899", "#fb923c", "#facc15", "#22d3ee"];
    const glyphs = ["♪", "♫", "♬", "✦"];
    const P = Array.from({ length: 70 }, () => ({
      x: innerWidth / 2 + (Math.random() - 0.5) * 200, y: innerHeight / 3,
      vx: (Math.random() - 0.5) * 12, vy: Math.random() * -12 - 4, r: Math.random() * 6 + 4,
      c: pick(colors), g: Math.random() < 0.35 ? pick(glyphs) : null, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
    }));
    let f = 0;
    (function frame() {
      ctx.clearRect(0, 0, c.width, c.height);
      P.forEach((p) => {
        p.vy += 0.35; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c;
        if (p.g) { ctx.font = `${p.r * 3}px sans-serif`; ctx.fillText(p.g, 0, 0); } else ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6);
        ctx.restore();
      });
      if (++f < 110) requestAnimationFrame(frame); else c.remove();
    })();
  }

  /* ================================================================
   * Init
   * ================================================================ */
  initTheme();
  setModel(state.model);
  setRemixOp("cover");
  syncInstrumental();
  sliderOut();
  updateCounts();
  renderPersonaSelect();

  // Give tasks that were mid-poll when the page closed a fresh error budget.
  state.tasks.forEach((t) => { t.pollErrors = 0; });
  // Refresh relative timestamps every minute.
  // Skip while a menu is open so it doesn't snap shut.
  setInterval(() => {
    if ($("#app").hidden || $("details.menu[open]")) return;
    renderFeed(); renderLyricsList(); markPlaying();
  }, 60000);

  state.key = loadKey();
  if (state.key) enterApp(); else showGate();
})();
