"use strict";
(function () {
  function indexForHash(hash, pages) {
    if (hash === "#higher-dimensions") return Math.max(0, pages.findIndex(p => p.title === "Higher dimensions are easier"));
    if (hash === "#wave-packets") return Math.max(0, pages.findIndex(p => p.interactive));
    if (hash === "#bilinear-wave-packets") return Math.max(0, pages.findIndex(p => p.bilinearPackets));
    if (hash === "#three-wave-interactions") return Math.max(0, pages.findIndex(p => p.trilinear));
    if (hash === "#atomic-space") return Math.max(0, pages.findIndex(p => p.frame_label === "transference-uv"));
    let match = /^#slide-(\d+)$/.exec(hash);
    if (match) return Math.max(0, pages.findIndex(p => p.slide === Number(match[1])));
    match = /^#page-(\d+)$/.exec(hash);
    return match ? Math.max(0, Math.min(pages.length - 1, Number(match[1]) - 1)) : 0;
  }
  function mount(doc, win) {
    const el = id => doc.getElementById(id);
    const data = JSON.parse(el("deck-data").textContent), pages = data.pages;
    const image = el("slide"), figure = el("interactive"), video = el("dispersion"), jump = el("jump");
    const bilinear = el("interactive-bilinear");
    const trilinear = el("interactive-trilinear");
    const transition = el("equation-transition"), transitions = data.transitions || [];
    const cover = el("transition-cover"), dispersionCover = el("dispersion-cover");
    const incoming = () => transitions.find(t => t.to_page === pages[index].page);
    let playbackToken = 0;
    let active = false, preparing = false, cancelFrame = () => {};
    let dispersionToken = 0, dispersionState = "idle";
    let cancelDispersionFrame = () => {};
    let index = indexForHash(win.location.hash, pages);
    for (const [i, page] of pages.entries()) {
      const option = doc.createElement("option");
      option.value = i; option.textContent = page.caption; jump.appendChild(option);
    }
    function fit() {
      const viewport = el("viewport"), canvas = el("canvas");
      const scale = Math.min(viewport.clientWidth / 1600, viewport.clientHeight / 1000);
      canvas.style.transform = `scale(${scale})`;
      canvas.style.left = `${(viewport.clientWidth - 1600 * scale) / 2}px`;
      canvas.style.top = `${(viewport.clientHeight - 1000 * scale) / 2}px`;
    }
    function render(keepImage = false) {
      const page = pages[index];
      if (!keepImage) image.src = page.image;
      image.alt = page.caption;
      figure.hidden = !page.interactive;
      bilinear.hidden = !page.bilinear;
      trilinear.hidden = !page.trilinear;
      // Both diagrams uncover together; the live iframe retains slider values.
      bilinear.style.clipPath = page.bilinearPackets ? "none" : "inset(0 0 0 50%)";
      video.hidden = !page.dispersion;
      dispersionCover.hidden = !page.dispersion || dispersionState !== "idle";
      el("play").hidden = el("restart").hidden = !(page.dispersion || incoming());
      el("play").textContent = "Play";
      jump.value = index;
      el("status").textContent = page.caption;
      el("previous").disabled = index === 0;
      el("next").disabled = index === pages.length - 1;
    }
    function stopTransition() {
      playbackToken += 1;
      cancelFrame();
      active = preparing = false;
      transition.pause();
      transition.hidden = true;
      transition.style.opacity = "0";
      cover.hidden = true;
      el("next").disabled = index === pages.length - 1;
    }
    // Keep the opaque starting image above the movie until a decoded frame
    // reaches the compositor. A resolved play() promise alone is not sufficient.
    function whenFirstFrame(media, ready, failed) {
      let done = false, frameID = null, raf1 = null, raf2 = null;
      const timeout = win.setTimeout(() => { cleanup(); failed(); }, 15000);
      function cleanup() {
        if (done) return;
        done = true;
        win.clearTimeout(timeout);
        media.removeEventListener("playing", playing);
        if (frameID !== null) media.cancelVideoFrameCallback(frameID);
        if (raf1 !== null) win.cancelAnimationFrame(raf1);
        if (raf2 !== null) win.cancelAnimationFrame(raf2);
      }
      function reveal() { if (!done) { cleanup(); ready(); } }
      function playing() {
        if (!media.requestVideoFrameCallback) {
          raf1 = win.requestAnimationFrame(() => {
            raf2 = win.requestAnimationFrame(reveal);
          });
        }
      }
      if (media.requestVideoFrameCallback) frameID = media.requestVideoFrameCallback(reveal);
      else media.addEventListener("playing", playing);
      return cleanup;
    }
    function failTransition(token) {
      if (token !== playbackToken) return;
      stopTransition(); render();
      el("status").textContent = pages[index].caption + " · animation unavailable";
    }
    async function playTransition(item) {
      stopTransition();
      const token = ++playbackToken;
      active = preparing = true;
      el("next").disabled = true;
      const [left, top, width, height] = item.bounds;
      const bounds = {left:`${left}px`,top:`${top}px`,width:`${width}px`,height:`${height}px`};
      Object.assign(transition.style, bounds);
      Object.assign(cover.style, bounds);
      cover.src = item.poster;
      transition.poster = item.poster;
      transition.setAttribute("aria-label", item.label || "Equation transformation");
      try {
        const destination = doc.createElement("img");
        destination.src = pages[index].image;
        await Promise.all([cover.decode(), destination.decode()]);
        if (token !== playbackToken) return;
        // Cover is decoded before the destination state is installed beneath it.
        cover.hidden = false;
        render();
        el("next").disabled = true;
        transition.style.opacity = "0";
        transition.src = item.video;
        transition.load();
        transition.hidden = false;
        cancelFrame = whenFirstFrame(transition, () => {
          if (token !== playbackToken) return;
          preparing = false;
          transition.style.opacity = "1";
          cover.hidden = true;
        }, () => failTransition(token));
        await transition.play();
      } catch (_) { failTransition(token); }
    }
    function resetDispersion() {
      dispersionToken++;
      cancelDispersionFrame();
      video.pause();
      video.currentTime = 0;
      video.style.opacity = "0";
      dispersionState = "idle";
      dispersionCover.hidden = !pages[index].dispersion;
      el("next").disabled = index === pages.length - 1;
      el("play").textContent = "Play";
    }
    function finishDispersion(unavailable = false) {
      if (!pages[index].dispersion || dispersionState !== "playing") return;
      cancelDispersionFrame();
      dispersionState = "finished";
      el("next").disabled = index === pages.length - 1;
      el("play").textContent = "Replay";
      if (unavailable) {
        video.pause();
        video.style.opacity = "0";
        dispersionCover.hidden = false;
        el("status").textContent = pages[index].caption + " · animation unavailable";
      }
    }
    async function startDispersion() {
      cancelDispersionFrame();
      const token = ++dispersionToken;
      dispersionState = "playing";
      el("next").disabled = true;
      dispersionCover.hidden = false;
      video.style.opacity = "0";
      video.load();
      cancelDispersionFrame = whenFirstFrame(video, () => {
        if (token !== dispersionToken) return;
        video.style.opacity = "1";
        dispersionCover.hidden = true;
      }, () => {
        if (token !== dispersionToken) return;
        finishDispersion(true);
      });
      try { await video.play(); }
      catch (_) { if (token === dispersionToken) finishDispersion(true); }
    }
    function go(value, updateHash = true, animate = false) {
      const requested = Math.max(0, Math.min(pages.length - 1, Number(value) || 0));
      // A forward reveal is unavailable until the current animation completes,
      // including while paused. Extra clicks are ignored, never queued.
      if (requested > index && (active || (pages[index].dispersion && dispersionState === "playing"))) {
        jump.value = index;
        if (!updateHash) win.history.replaceState(null, "", `#page-${index + 1}`);
        return;
      }
      const previous = index;
      resetDispersion();
      stopTransition();
      index = requested;
      const item = incoming();
      const animated = animate && index === previous + 1 && item?.from_page === pages[previous].page;
      render(animated);
      if (animated) playTransition(item);
      if (updateHash) win.history.replaceState(null, "", `#page-${index + 1}`);
    }
    function move(step) {
      if (step === 1 && pages[index].dispersion && dispersionState !== "finished") {
        if (dispersionState === "idle") startDispersion();
        return;
      }
      go(index + step, true, step === 1);
    }
    async function toggle() {
      if (incoming()) {
        if (preparing) return;
        if (!active || transition.ended) { playTransition(incoming()); return; }
        if (!transition.paused) transition.pause();
        else {
          const token = playbackToken;
          try { await transition.play(); }
          catch (_) { if (token === playbackToken) failTransition(token); }
        }
        return;
      }
      if (!pages[index].dispersion) return;
      if (!video.paused) { video.pause(); return; }
      if (dispersionState !== "playing" || video.ended) { startDispersion(); return; }
      const token = dispersionToken;
      try { await video.play(); }
      catch (_) { if (token === dispersionToken) finishDispersion(true); }
    }
    function restart() {
      if (incoming()) { stopTransition(); playTransition(incoming()); }
      else if (pages[index].dispersion) resetDispersion();
    }
    async function fullscreen() {
      try {
        if (doc.fullscreenElement) await doc.exitFullscreen();
        else {
          doc.body.classList.add("presenting");
          doc.body.classList.remove("show-controls");
          fit();
          await doc.documentElement.requestFullscreen();
        }
      } catch (_) {
        doc.body.classList.add("show-controls");
        el("help").textContent = "Firefox declined full screen. P toggles the clean window view; H toggles controls.";
      }
    }
    function command(key) {
      if (key === "ArrowRight") move(1);
      else if (key === "ArrowLeft") move(-1);
      else if (key === "Home") go(0);
      else if (key === "End") go(pages.length - 1);
      else if (key === " ") { if (pages[index].dispersion || active) toggle(); else move(1); }
      else if (key.toLowerCase() === "f") fullscreen();
      else if (key.toLowerCase() === "r") restart();
      else if (key.toLowerCase() === "h") doc.body.classList.toggle("show-controls");
      else if (key.toLowerCase() === "p") {
        doc.body.classList.toggle("presenting");
        doc.body.classList.remove("show-controls"); fit();
      }
      else if (key.toLowerCase() === "d") el("offline-diagnostics").hidden = !el("offline-diagnostics").hidden;
      else if (key === "Escape" && !doc.fullscreenElement) {
        doc.body.classList.remove("presenting", "show-controls"); fit();
      }
    }
    el("previous").addEventListener("click", () => move(-1));
    el("next").addEventListener("click", () => move(1));
    // The six construction states also advance when the audience slide is clicked.
    const advanceAtom = () => { if (pages[index].frame_label === "transference-uv") move(1); };
    image.addEventListener("click", advanceAtom);
    transition.addEventListener("click", advanceAtom);
    jump.addEventListener("change", () => go(jump.value));
    el("play").addEventListener("click", toggle);
    el("restart").addEventListener("click", restart);
    el("fullscreen").addEventListener("click", () => { el("fullscreen").blur(); fullscreen(); });
    for (const id of ["previous", "next", "play", "restart"]) el(id).addEventListener("click", () => el(id).blur());
    for (const event of ["play", "pause"]) video.addEventListener(event, () => {
      if (pages[index].dispersion) el("play").textContent = video.paused ? "Play" : "Pause";
    });
    video.addEventListener("ended", () => finishDispersion());
    video.addEventListener("error", () => finishDispersion(true));
    for (const event of ["play", "pause"]) transition.addEventListener(event, () => { el("play").textContent = transition.paused ? "Play" : "Pause"; });
    transition.addEventListener("ended", () => {
      if (!active) return;
      cancelFrame();
      active = preparing = false;
      transition.hidden = true;
      cover.hidden = true;
      image.src = pages[index].image;
      el("play").textContent = "Replay";
      el("next").disabled = index === pages.length - 1;
    });
    transition.addEventListener("error", () => {
      if (active) failTransition(playbackToken);
    });
    doc.addEventListener("keydown", event => {
      if (event.target.closest("input, select, button, textarea")) return;
      if (["ArrowRight", "ArrowLeft", "Home", "End", " ", "f", "F", "r", "R", "h", "H", "p", "P", "d", "D", "Escape"].includes(event.key)) { event.preventDefault(); command(event.key); }
    });
    // Slider events stay inside the figure. Only ordinary navigation keys from
    // its non-control area are forwarded by this specific embedded document.
    win.addEventListener("message", event => {
      if (![figure, bilinear, trilinear].some(frame => event.source === frame.contentWindow && !frame.hidden)) return;
      if (event.data?.type === "wave-packet-navigation" && typeof event.data.key === "string") command(event.data.key);
    });
    win.addEventListener("hashchange", () => go(indexForHash(win.location.hash, pages), false));
    win.addEventListener("resize", fit);
    doc.addEventListener("fullscreenchange", () => {
      doc.body.classList.toggle("presenting", !!doc.fullscreenElement);
      doc.body.classList.remove("show-controls"); fit();
    });
    let cursorTimer;
    doc.addEventListener("pointermove", () => {
      doc.body.classList.remove("hide-pointer");
      win.clearTimeout(cursorTimer);
      cursorTimer = win.setTimeout(() => doc.body.classList.add("hide-pointer"), 1800);
    });
    render(); fit();
    return { go, move, getIndex: () => index, fit };
  }
  if (typeof module !== "undefined") module.exports = { indexForHash, mount };
  if (typeof document !== "undefined") window.berkeleyPresentation = mount(document, window);
}());
