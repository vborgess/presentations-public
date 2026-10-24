# Berkeley presentation — ready for GitHub Pages

Source release: `20261024T225331Z-f9385302`. Contains 178 reveal states, vector
slides, 26 videos, three interactive figures, and the matching PDF.

## Upload through GitHub in your browser

1. Unzip the archive. Open `github-pages-site`.
2. In a public repository, select **Add file → Upload files**.
3. Upload the loose files in `github-pages-site` (including `index.html` and this
   README), then **Commit changes**. Upload the contents, not the ZIP and not the
   enclosing `github-pages-site` folder.
4. Repeat **Add file → Upload files** for each folder below, one folder per upload.
   Drag each whole folder so GitHub preserves its name. Each batch is under
   100 files and every individual file is under 25 MB.
   - `downloads`: 1 files
   - `figures`: 3 files
   - `posters`: 26 files
   - `slides-1`: 60 files
   - `slides-2`: 59 files
   - `slides-3`: 58 files
   - `videos`: 26 files
5. In **Settings → Pages**, select **Deploy from a branch**, `main`, `/ (root)`,
   and **Save**. Wait for the Pages deployment to finish in Actions.
6. Open `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`.
7. Add that address as a button on Google Sites.

`.nojekyll` is included to disable Jekyll. If Finder hides it, create it using
GitHub **Add file → Create new file**, name it `.nojekyll`, enter a blank line,
and commit. No build command, packages, or GitHub Actions workflow is required.

You can also upload the entire folder with Git or GitHub Desktop; the 100-file
browser batch limit does not apply to those methods. No Git LFS is needed.
To use `/berkeley/` inside an existing Pages website, place all these files and
folders under `berkeley/` together. Every resource uses a relative URL.

## Presentation controls

F: enter full screen. H: show/hide controls. Esc: exit. P: clean window.
Left/right: reveals. Space: play/pause. R: restart. PDF: download the slides.
D: diagnostics outside presentation mode. The full media check downloads all assets.

## What is included

Only public presentation assets are included. No TeX sources, research papers,
build logs, credentials, or private filesystem paths are packaged. The player
and interactive documents are preserved from the current release. Asset names
include content hashes to avoid mixing cached resources when you update a talk.
Slides load as needed; the next two are prefetched unless data saving is enabled.
Videos load on demand. The PDF matches the exported presentation.

## Verification and updates

Source/dependency hashes, every exported media byte, relative paths, file sizes,
JavaScript syntax, and the current playback-controller regression tests passed.
HTTP serving, actual video decoding, and full-screen behavior on GitHub Pages
still need a browser check after deployment. This folder has not been published.

After editing the presentation, rebuild its canonical HTML first and generate a
new website export. Replace `index.html` and upload all newly named assets.
Keep the previous release available separately until the update has been tested.
For presenting without internet, use the single-file offline HTML separately.
