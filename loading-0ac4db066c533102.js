"use strict";
// Website-only prefetch; the playback controller remains unchanged.
(() => {
  if (navigator.connection?.saveData) return;
  const data = JSON.parse(document.getElementById("deck-data").textContent);
  const image = document.getElementById("slide");
  const warmed = new Set();
  let pending = [];
  function warmNext() {
    const current = image.getAttribute("src");
    const index = data.pages.findIndex(page => page.image === current);
    if (index < 0) return;
    pending = [];
    for (const page of data.pages.slice(index + 1, index + 3)) {
      if (warmed.has(page.image)) continue;
      warmed.add(page.image);
      const next = new Image();
      next.fetchPriority = "low";
      next.src = page.image;
      pending.push(next);
    }
  }
  // Wait for the current image before competing for network bandwidth.
  image.addEventListener("load", warmNext);
  if (image.complete && image.naturalWidth) warmNext();
})();
