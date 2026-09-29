# CtrlWAM project page — minimal pack

Open `CtrlWAM-Site-Full.dc.html` from this folder — double-click works (`file://`) because the three live figures are inlined into the page as `window.__resourceBlobs` entries (the first `<script>` in the file). A static server (`python -m http.server`) also works. If you edit one of the `*-View.dc.html` figures, re-inline it: replace the corresponding string in that inline script with the new file text (the inline copy always wins; delete the entry to fall back to fetching the sibling file over HTTP). `support.js` is the component runtime.

```
pack-site/
  CtrlWAM-Site-Full.dc.html            the page
  CtrlWAM-Teaser-Figure-View.dc.html   Overview figure (live)
  CtrlWAM-Model-Figure-View.dc.html    Model figure with token-flow overlay (live)
  CtrlWAM-Warp-Schedule-A-View.dc.html Motivation schedule plot with denoising sweep (live)
  support.js
  site/website/   site.css  site.js  teaser.js  data.js  teaser-data.js
  site/deck/      charts.js (SVG charts + hover tooltips)
  site/vendor/    ctrlwam-anim.js (Remotion animation bundle, patched)  katex/  fonts/
  site/media/     all images (see per-section map below)
```

Conventions used below: **static** = the `src` is literally in the file named; **data-driven** = the path is built at runtime from an index (frame list / episode list), so you replace the files on disk and keep the names, or edit the index.

---

## 1. Nav + Hero (`header#top`)

| Asset | Path | Where referenced | Notes |
|---|---|---|---|
| Logo (nav) | `site/media/logo/logo-site.png` | `CtrlWAM-Site-Full.dc.html` (`a.brand img`) | static |
| Favicon | `site/media/logo/icon.png` | page `<helmet>` | static |
| Backdrop animation `TitleBackdrop` | driving strip: `site/media/egocf/real/raw/f08.jpg … f40.jpg` (33 frames, 5 Hz) | `site/vendor/ctrlwam-anim.js`, defaults `FE.driveFrames` | data-driven; the 440×326 driving panel is center-cropped |
| | robot strip: `site/media/robotwin/ep232/ctrlwam/f0000, f0010, … f0450.jpg` (every other shipped episode-232 frame, 46 frames, 6 Hz = 2× real time) | `FE.robotFrames`, `FE.robotHz` | data-driven; to use another episode change the list in the bundle (frames must exist in `site/media/robotwin`) |
| Buttons arXiv / Paper / Video / Code | placeholder URLs | `div.actions` in the page | replace `href`s |

## 2. Overview (`section#overview`)

| Asset | Path | Where referenced | Notes |
|---|---|---|---|
| Teaser figure (live HTML) | `CtrlWAM-Teaser-Figure-View.dc.html` | `<dc-import name="CtrlWAM-Teaser-Figure-View">` | figure items are in `static defaults()`; image slots are filled by `Component.SITE_IMG` (see below) |
| Corrective-learning pairs — noised | `nb0-d` `site/media/egocf/multi_agent_nudge_left/raw/f32.jpg` · `nb0-r` `site/media/robotwin/ep104/ctrlwam/f0135.jpg` · `nb1-d` `site/media/egocf/multi_agent_stop/raw/f22.jpg` · `nb1-r` `site/media/robotwin/ep104/ctrlwam/f0250.jpg` | `SITE_IMG` in the View file | keyed by slot id |
| Corrective-learning pairs — clean | `cb0-d` `site/media/egocf/real/raw/f32.jpg` · `cb0-r` `site/media/robotwin/ep104/gt/f0135.jpg` · `cb1-d` `site/media/egocf/real/raw/f22.jpg` · `cb1-r` `site/media/robotwin/ep104/gt/f0250.jpg` | `SITE_IMG` | keyed by slot id |
| Right card — driving | scene `site/media/egocf/real/raw/f12.jpg`, frames `…/f22.jpg`, `…/f40.jpg` | `SITE_IMG` keys `driving scene`, `driving frame#0`, `driving frame#1` | keyed by slot label |
| Right card — robotics | scene `site/media/robotwin/ep104/gt/f0000.jpg`, frames `…/f0125.jpg`, `…/f0315.jpg` | keys `robotics scene`, `robotics frame#0/#1` | keyed by slot label |
| Middle card scene (transparent cut-out) | `site/media/teaser-fig/scene-720.png` | embedded item `src` in `defaults()` | static |
| Logo inside the figure | embedded data-URI in the View file | item label `logo` | leave as is |

To replace any slot without editing code: drag an image onto the slot or double-click it in the page; the choice is stored in the browser under `ctrlwam-teaser-figure-view-images` (per slot id). To change the shipped default, edit `SITE_IMG`.

## 3. Motivation (`section#motivation`)

### 3a. Standard-noising scene (stop-motion + top-down)
| Asset | Path | Where referenced | Notes |
|---|---|---|---|
| Driving frames t₁–t₈ | `site/media/drive-seq/t1.jpg … t8.jpg` (800 px wide, 4:3 crop via `object-fit:cover`) | page, `div.frame.seq img[data-set="drive"]` | static; keep 8 frames, names `tN.jpg` |
| Manipulation frames t₁–t₈ | `site/media/robot-seq/t1.jpg … t8.jpg` | `img[data-set="robot"]` | static |
| Noise texture | `site/media/schematic/noise.png` | `site.css` (`.scene .frame .noise`) | static |
| Top-down views | inline SVG (`svg.road`, `svg.road.robot`) | page | vector, edit in place; path ids `p-*` (driving) and `r-*` (robot) are animated by `site.js` |

### 3b. Denoising-progress animation (`DenoisingProgress`)
| Asset | Path | Where referenced | Notes |
|---|---|---|---|
| Poster | `site/media/site/denoising.png` | `data-poster` | static |
| Driving trace (SFT clip 50) | `site/media/denoise/driving/stepNN_vid.jpg` + `stepNN_act.png`, every denoising step NN ∈ 00…34 (35 steps) | bundle defaults `DE.rows[0].available`, sigmas in `DE.rows[0].sigmas` | data-driven |
| Manipulation trace (SFT-from4000 episode 21, right gripper) | `site/media/denoise/manipulation/stepNN_vid.jpg` + `_act.png`, every step NN ∈ 00…29 (30 steps) | `DE.rows[1]` | data-driven |
| Index | `site/media/denoise/meta.json` | reference only (not loaded) | |

Regenerate (other sample, other step subset): `alpamayo/projects/alpax/docs/paper/figures/scripts/export_denoise_media.py --driving 50 --manipulation 21 --out site/media/denoise --bundle site/vendor/ctrlwam-anim.js` writes the frames from the raw denoising dumps (action panels carry the scale bar bottom-right on every step; the axis box is grown so it never overlaps a path), `meta.json`, and rewrites the two `DE.rows` literals (`available` / `sigmas` / `sub`) in the bundle. The animation plays whatever steps are listed in `available` and cross-fades between neighbours, so the list can be any subset of the exported files.

### 3c. Standard noising schedule plot (live)
`CtrlWAM-Warp-Schedule-A-View.dc.html` — pure vector + KaTeX, no images. The denoising sweep (blue dashed → red schedule → mismatch arrow) is drawn by `startFlow()`; plays once, ↺ replays.

## 4. Method (`section#method`)

### 01 Physically aligned noising — teaser animation (`div#teaser`, `teaser.js`)
| Asset | Path | Where referenced |
|---|---|---|
| Driving recorded | `site/media/egocf/real/raw/f32.jpg, f22.jpg, f12.jpg` | `teaser.js` `DRIVE_REC` |
| Driving rendered (noised action executed) | `site/media/egocf/multi_agent_stop/raw/f32.jpg, f22.jpg, f12.jpg` | `DRIVE_REN` |
| Robot recorded | `site/media/robotwin/ep104/gt/f0225.jpg, f0135.jpg, f0045.jpg` | `ROBOT_REC` |
| Robot rendered | `site/media/robotwin/ep104/gtswap/f0270.jpg, f0180.jpg, f0090.jpg` | `ROBOT_REN` |
| Noise texture | `site/media/schematic/noise.png` | `teaser.js` |
Layout/curves come from `site/website/teaser-data.js` (exported from the figure editor).

### 02 Warped schedules — `WarpSchedule` animation
Vector only (bundle `_E` defaults: ς ∈ {1,2,3,5}, probe ς = 5). Poster `site/media/site/denoising.png`.

### 03 Multi-agent — `MultiAgentMask` animation
Vector only (bundle `VE`, phases in `Xd`). Poster `site/media/site/model.png`.

## 5. Model (`section#architecture`)
`CtrlWAM-Model-Figure-View.dc.html` (live). Images inside are embedded data-URIs from the figure editor (`static defaults()`); the token-flow overlay is `startFlow()` with column x-centres in `cols`. Icons are vector. To change the figure, edit the editor copy and re-derive, or edit `defaults()` directly.

## 6. Results (`section#results`)

### Driving — `EgoCounterfactual` animation + explorer (`#cf-explorer`)
| Asset | Path | Where referenced | Notes |
|---|---|---|---|
| Poster | `site/media/figures/CtrlWAM_counterfactual_qualitative_ego_3x6.png` | `data-poster` | static |
| Arms (bundle + explorer) | `site/media/egocf/<arm>/raw/f08.jpg … f40.jpg` for `multi_agent_factual`, `multi_agent_stop`, `multi_agent_accel` (bundle) + `multi_agent_nudge_left`, `multi_agent_nudge_right` (explorer) | bundle `WE.arms`; `data.js` → `CTRLWAM_DATA.egocf.arms` | data-driven; frames 8–40 at 5 Hz, t₀ = 8 |
| Bird's-eye insets | `site/media/egocf/<arm>/bev.png` | `site.js` (`bev.src`) | static per arm |
| Real clip (reference) | `site/media/egocf/real/raw|traj/f08…f40.jpg` | hero backdrop, teaser | |
| Index | `site/media/egocf/cfg.json` | reference only | |

### Multi-agent — static
`site/media/figures/CtrlWAM_multiagent_qualitative.png` (page `img.zoomable`).

### Manipulation — `RoboTwinRollout` animation + explorer (`#rt-explorer`)
| Asset | Path | Where referenced | Notes |
|---|---|---|---|
| Poster | `site/media/site/robotwin.png` | `data-poster` | static |
| Episode frames (the 4 episodes where CtrlWAM's trajectory accuracy beats both baselines by the largest margin: 104, 232, 782, 215) | `site/media/robotwin/ep<N>/{gt,cosmos_sft,gtswap,ctrlwam}/fNNNN.jpg`, every 5th video frame (30 fps → 6 frames/s, the densest the WorldArena dumps hold) from 0000 to the last frame; 600×444 JPEG (2× the panel size, for HiDPI); 27–91 frames per method, 852 JPEGs / 15 MB | animation: bundle `BE` (episode 104, 64 frames); explorer: `data.js` → `CTRLWAM_DATA.robotwin[<N>]` with `complete: true` (the other 7 dumped episodes stay listed with `complete: false` and are hidden), plays at 165 ms per frame (real time) and holds the last frame 1 s before looping | data-driven; the explorer only creates `<img>` tags for the selected episode |
| Changing the selection / density | `alpamayo/projects/alpax/docs/paper/figures/scripts/export_robotwin_frames.py --pack . --ours-best --top 4` (or `--episodes`; `--stride`, default 1 = every 5th video frame, 2 = every 10th; `--size`, default 600x444; `--anim-episode`) | rewrites the JPEGs (prunes dropped episodes and denser frames), `meta.json`, the `robotwin` block of `data.js` and `BE.frames`; then set the explorer interval in `site.js` to 165 ms × stride | source: WorldArena `slurm/generations/side_by_side/frames/episode_<N>/<method>/frame_<i>.png` |
| Index | `site/media/robotwin/meta.json` | reference only (`frames` = 4/6/8-column presets, `all` = exported frames) | |
| Bar chart | inline `data-chart` JSON on `div.chart` | page; rendered by `charts.js` | numbers live in the JSON |

## 7. Citation (`section#cite`) — text only.

---

## Replacing images with your own — what to change

Every image on the page is either **a file under `site/media/` that you overwrite keeping the name**, or **a path literal in one of five text files**: `CtrlWAM-Site-Full.dc.html` (static `src`, posters, and the inlined teaser figure), `site/website/data.js` (explorer frame lists), `site/website/teaser.js` (Method-01 teaser), `site/website/site.js` (media base only) and `site/vendor/ctrlwam-anim.js` (animation defaults `FE` / `DE` / `WE` / `BE`; minified, but the literals are plain and unique — search for the key names). Paths in the bundle, `data.js` and `teaser.js` are relative to `site/media/`. Nothing needs a rebuild; hard-reload the page after editing (`Ctrl/⌘+Shift+R`).

| I want to replace… | Drop your files here (keep the names) | Then edit | Constraints |
|---|---|---|---|
| Nav logo / favicon | `site/media/logo/logo-site.png`, `site/media/logo/icon.png` | nothing (or change the `src` / `href` in the page `<helmet>` and `a.brand`) | any size; PNG with transparency |
| Hero backdrop — driving strip | `site/media/egocf/real/raw/f08.jpg … f40.jpg` | for a different count or folder: `FE.driveFrames` in the bundle (an `Array.from` over 33 indices building `egocf/real/raw/f<8+t>.jpg`; change the length, the offset or the folder), `FE.driveHz` | 800–1000 px wide JPEG; shown centre-cropped at 440×326 |
| Hero backdrop — robot strip | `site/media/robotwin/ep232/ctrlwam/f0000, f0020, … f0440.jpg` | for another episode / count: `FE.robotFrames` (an `Array.from` over 46 indices building `robotwin/ep232/ctrlwam/f<10*t>.jpg`; change the length, the step or the folder), `FE.robotHz` | every listed file must exist |
| Teaser figure slots (Overview) | put the files anywhere under `site/media/` | the `SITE_IMG` map **inside `CtrlWAM-Site-Full.dc.html`** (the teaser figure is inlined there; that copy wins). Keys: slot ids `nb0-d nb0-r nb1-d nb1-r cb0-d cb0-r cb1-d cb1-r` and labels `driving scene`, `driving frame#0/#1`, `robotics scene`, `robotics frame#0/#1`. Change `CtrlWAM-Teaser-Figure-View.dc.html` too only if you re-inline it | slots use `object-fit: cover`; any aspect works. For a local-only preview, drag an image onto a slot in the browser instead (stored in localStorage, not shipped) |
| Teaser middle-card scene cut-out | `site/media/teaser-fig/scene-720.png` | nothing | transparent PNG |
| Motivation stop-motion (3a) | `site/media/drive-seq/t1.jpg … t8.jpg`, `site/media/robot-seq/t1.jpg … t8.jpg` | nothing; a different count needs the eight `<img data-set=…>` tags in the page | exactly 8 per set unless you edit the page; 4:3 crop |
| Denoising animation (3b) | `site/media/denoise/driving/stepNN_vid.jpg` + `stepNN_act.png`, `site/media/denoise/manipulation/…` | `DE.rows[0]` / `DE.rows[1]` in the bundle: `available` = the NN you provide (any subset, ascending), `sigmas` = one value per denoising step (length = number of steps of your run), `sub` = the two-part caption. Or regenerate everything from raw dumps with `export_denoise_media.py` (see 3b) | 400×280 (10:7); vid JPEG, act PNG; `available` must not list a missing file |
| Method-01 teaser frames | any files under `site/media/` | `DRIVE_REC`, `DRIVE_REN`, `ROBOT_REC`, `ROBOT_REN` in `site/website/teaser.js` (three paths each, late → early) | three per list |
| Ego-counterfactual arms (6, animation + explorer) | `site/media/egocf/<arm>/raw/f08.jpg … f40.jpg` and `site/media/egocf/<arm>/bev.png` for each of the 5 arms | to rename / add / drop arms: `CTRLWAM_DATA.egocf.arms` in `data.js` (key, label, colour, metrics; `frames`, `hz`, `t0`) **and** `WE.arms` in the bundle (the animation shows the first three); the factual `bev.png` `src` is also static in the page | 33 frames per arm at 5 Hz, indices 8–40, named `fNN.jpg`; `bev.png` any size |
| Ego-counterfactual poster | `site/media/figures/CtrlWAM_counterfactual_qualitative_ego_3x6.png` | nothing (or the `data-poster` on the `EgoCounterfactual` div) | ≤1600 px |
| Multi-agent qualitative figure | `site/media/figures/CtrlWAM_multiagent_qualitative.png` | nothing (page `img.zoomable`) | ≤1600 px |
| RoboTwin roll-outs (6, animation + explorer) | `site/media/robotwin/ep<N>/{gt,cosmos_sft,gtswap,ctrlwam}/fNNNN.jpg` | explorer: `CTRLWAM_DATA.robotwin["<N>"]` in `data.js` (`frames` = your NNNN list, `last`, `instr`, `traj` scores, `complete: true`; add a new key for a new episode); animation: `BE.frames` (and `BE.episode`, `BE.instruction`, the `acc` values) in the bundle. Or regenerate from the WorldArena dumps with `export_robotwin_frames.py` (see 6) | same NNNN list for all four methods; 600×444 JPEG; frame-rate assumption 165 ms per listed frame in `site.js` |
| Animation posters | `site/media/site/denoising.png`, `model.png`, `robotwin.png` | nothing (or the `data-poster` attributes in the page) | ≤1600 px, same aspect as the animation |
| Noise texture (3a, Method-01) | `site/media/schematic/noise.png` | nothing | tiling PNG |

Rules of thumb:
1. Keep the filename pattern for data-driven sets (`fNN.jpg`, `fNNNN.jpg`, `stepNN_vid.jpg`/`_act.png`, `tN.jpg`); swap the files, no code change.
2. If a list in `data.js` or the bundle names a file that is missing, that frame renders blank — check the browser console (404s) after editing.
3. Recommended sizes: video frames 800–1000 px wide JPEG q≈82 (RoboTwin frames 600×444 q85, denoising panels 400×280); posters ≤1600 px; PNG only where transparency or line art needs it.
4. Media base for the bundle and scripts is `site/media/` (`window.CTRLWAM_MEDIA_BASE` in `site.js`, `data-media` on `#teaser`, `MEDIA` in `site.js`); change all if you move the folder.
5. The three live figures are inlined into the page as `window.__resourceBlobs`; editing a `*-View.dc.html` file alone changes nothing until you re-inline it (see the top of this file).
