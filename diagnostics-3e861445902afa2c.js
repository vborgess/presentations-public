"use strict";
(() => {
  const result = document.getElementById("offline-result");
  const log = document.getElementById("offline-log");
  const report = message => { log.textContent += message + "\n"; };
  result.textContent = "JavaScript started. Waiting for the deck…";
  report("Website presentation: local site assets; opened with " + location.protocol);
  report("Browser: " + navigator.userAgent);
  window.addEventListener("error", event => {
    document.getElementById("offline-diagnostics").open = true;
    report("ERROR: " + (event.message || "Resource failed: " + (event.target?.id || event.target?.tagName)));
  }, true);
  window.addEventListener("unhandledrejection", event => report("PROMISE ERROR: " + String(event.reason)));
  document.addEventListener("securitypolicyviolation", event => report("BLOCKED: " + event.violatedDirective + " " + event.blockedURI.slice(0, 140)));
  document.addEventListener("DOMContentLoaded", () => {
    const probe = new Image();
    probe.onload = () => report("Image decoder probe: decoded");
    probe.onerror = () => report("Image decoder probe: FAILED");
    probe.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAEklEQVR4nGNk8JrJwMDAxAAGAAo1AOdDqqEIAAAAAElFTkSuQmCC";
    const image = document.getElementById("slide");
    result.textContent = window.berkeleyPresentation ? "Deck initialized. Checking the visible slide…" : "Player did not initialize; see errors below.";
    image.decode().then(() => {
      if (window.berkeleyPresentation) result.textContent = "Deck initialized; visible slide decoded.";
    }).catch(error => report("IMAGE ERROR: " + error.message));
    for (const id of ["dispersion", "equation-transition"]) {
      const video = document.getElementById(id);
      video.addEventListener("error", () => report(id + " VIDEO ERROR: " + (video.error?.message || video.error?.code)));
      video.addEventListener("playing", () => report(id + ": playing"));
      video.addEventListener("ended", () => report(id + ": reached end"));
    }
    document.getElementById("offline-check").addEventListener("click", async event => {
      const button = event.currentTarget;
      button.disabled = true;
      try {
        const data = JSON.parse(document.getElementById("deck-data").textContent);
        const images = [...new Set(data.pages.map(p => p.image).concat(data.transitions.map(t => t.poster), [document.getElementById("dispersion").poster]))].filter(Boolean);
        const videos = [...new Set([document.getElementById("dispersion").getAttribute("src"), ...data.transitions.map(t => t.video)])].filter(Boolean);
        let failures = 0, completed = 0;
        const total = images.length + videos.length;
        const check = (url, video) => new Promise(resolve => {
          const item = video ? document.createElement("video") : new Image();
          const timer = setTimeout(() => finish(false, "timeout"), 15000);
          let done = false;
          function finish(ok, detail = "") {
            if (done) return;
            done = true; clearTimeout(timer);
            item.onload = item.onerror = item.onloadedmetadata = null;
            if (video) { item.removeAttribute("src"); item.load(); }
            if (!ok) { failures++; report("FAILED " + (video ? "video" : "image") + " #" + (completed + 1) + " " + detail); }
            completed++;
            result.textContent = `Asset checks: ${completed}/${total}; failures: ${failures}`;
            resolve();
          }
          item.onerror = () => finish(false, item.error?.message || "load error");
          if (video) { item.preload = "metadata"; item.onloadedmetadata = () => finish(true); }
          else item.onload = () => finish(item.naturalWidth > 0);
          item.src = url;
        });
        // Sequential checks keep memory bounded on the laptop.
        for (const url of images) await check(url, false);
        for (const url of videos) await check(url, true);
        report(`Finished: ${images.length} images and ${videos.length} video metadata checks; ${failures} failures. Test actual playback and figures manually.`);
      } catch (error) { report("CHECK ERROR: " + error.message); }
      finally { button.disabled = false; }
    });
  });
})();
