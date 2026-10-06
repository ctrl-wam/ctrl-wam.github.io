# CtrlWAM project page — minimal pack

Open `index.html` from this folder. The overview teaser and model figures load their sibling `*-View.dc.html` files directly in iframes, so edits appear after saving and reloading. The schedule figure remains embedded in the first script; update that embedded entry when changing its file. `support.js` is the component runtime. Deploy the HTML files, `support.js`, and `site/` together, preserving the folder structure.

```
pack-site/
  CtrlWAM-Site-Full.dc.html            the page
  CtrlWAM-Teaser-Figure-View.dc.html   Overview figure (live)
  CtrlWAM-Model-Figure-View.dc.html    Model figure with token-flow overlay (live)
  CtrlWAM-Warp-Schedule-A-View.dc.html Motivation schedule plot with denoising sweep (live)
  CtrlWAM-Noise-Levels.html            Separate showcase page: rendering of the noised command vs. noise level (slider)
  support.js
  site/website/   site.css  site.js  teaser.js  data.js  teaser-data.js  noise-levels.js (noise-level explorer, shared by the main page and CtrlWAM-Noise-Levels.html)
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
| Nav colour | `<nav class="nav on-dark">` in the markup (dark glass over the hero); `site.js` `onScroll()` toggles `on-dark` per section afterwards | | starts dark so the bar is right before the scripts have loaded |
| Favicon | `site/media/logo/icon.png` | page `<helmet>` | static |
| Backdrop animation `TitleBackdrop` | driving strip: `site/media/egocf/real/raw/f08.jpg … f40.jpg` (33 frames, 5 Hz) | `site/vendor/ctrlwam-anim.js`, defaults `FE.driveFrames` | data-driven; the 440×326 driving panel is center-cropped |
| | robot strip: `site/media/robotwin/ep232/ctrlwam/f0000, f0010, … f0450.jpg` (every other shipped episode-232 frame, 46 frames, 6 Hz = 2× real time) | `FE.robotFrames`, `FE.robotHz` | data-driven; to use another episode change the list in the bundle (frames must exist in `site/media/robotwin`) |
| Buttons arXiv / Paper / Video / Code | placeholder URLs | `div.actions` in the page | replace `href`s |
| Nav `Paper` button | removed 2026-10-05 (`div.cta` in the nav is gone); re-add inside `nav .wrap` if a PDF link is wanted | | |

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

The deployed teaser is view-only. Update `static SITE_IMG` in `CtrlWAM-Teaser-Figure-View.dc.html` to replace its frame images; update `SCENE_SRC` for the middle scene. Browser-saved images and layouts are ignored in view-only mode.

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

#### Noise-level explorer (`div#nl-explorer`, `site/website/noise-levels.js`) — the full explorer of §8, same markup and script in both pages
| Asset | Path | Where referenced | Notes |
|---|---|---|---|
| All windows of both domains | everything under `site/media/noise-levels/` (see §8: rendered frames, decoded-latent folders for ς ∈ {1,2,3,5}, `noise.png`, per-window `index.js`, catalog `index.js`) | `noise-levels.js` loads the catalog and the selected window's `index.js` with script tags | Domain (Driving / Manipulation), Example N, action-noise slider, Warp ς; four panels: recorded video, rendering of the noised command, noised rendering (decoded latent; pixel cross-fade only as fallback), top-down action; plays only while visible, pauses when the Method tab is hidden. The two `<input type=range>` carry **no `value` attribute** on purpose: the page body is rendered by React (DC runtime), which keeps writing a markup `value` back into the slider on every re-render (the thumb snaps back) — `noise-levels.js` sets min/max/value itself |

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

### Manipulation — episode explorer (`#rt-explorer`; the `RoboTwinRollout` animation card was removed 2026-10-05 as a duplicate of the explorer)
| Asset | Path | Where referenced | Notes |
|---|---|---|---|
| Episode frames (the 4 episodes where CtrlWAM's trajectory accuracy beats both baselines by the largest margin: 104, 232, 782, 215) | `site/media/robotwin/ep<N>/{gt,cosmos_sft,gtswap,ctrlwam}/fNNNN.jpg`, every 5th video frame (30 fps → 6 frames/s, the densest the WorldArena dumps hold) from 0000 to the last frame; 600×444 JPEG (2× the panel size, for HiDPI); 27–91 frames per method, 852 JPEGs / 15 MB | (bundle `BE` is no longer mounted; the page uses only the explorer) explorer: `data.js` → `CTRLWAM_DATA.robotwin[<N>]` with `complete: true` (the other 7 dumped episodes stay listed with `complete: false` and are hidden), plays at 165 ms per frame (real time) and holds the last frame 1 s before looping | data-driven; the explorer only creates `<img>` tags for the selected episode |
| Changing the selection / density | `alpamayo/projects/alpax/docs/paper/figures/scripts/export_robotwin_frames.py --pack . --ours-best --top 4` (or `--episodes`; `--stride`, default 1 = every 5th video frame, 2 = every 10th; `--size`, default 600x444; `--anim-episode`) | rewrites the JPEGs (prunes dropped episodes and denser frames), `meta.json`, the `robotwin` block of `data.js` and `BE.frames`; then set the explorer interval in `site.js` to 165 ms × stride | source: WorldArena `slurm/generations/side_by_side/frames/episode_<N>/<method>/frame_<i>.png` |
| Index | `site/media/robotwin/meta.json` | reference only (`frames` = 4/6/8-column presets, `all` = exported frames) | |
| Bar chart | inline `data-chart` JSON on `div.chart` | page; rendered by `charts.js` | numbers live in the JSON |

## 7. Citation (`section#cite`) — text only.

## 8. Noise-level showcase — separate page `CtrlWAM-Noise-Levels.html` (the same explorer as Method › 01 of the main page, standalone; both pages host the identical `div#nl-explorer` markup and load `site/website/noise-levels.js`)

Opens from this folder like the main page (file:// works; uses `site/website/site.css`, the KaTeX bundle and the fonts). A `Domain` switch (Driving / Manipulation) and an `Example` selector labelled `Example 1 … N` (no descriptions; the default key of the domain is listed first). Driving: two forward-driving AlpaSim export windows, both with the ego going straight and the fully noised command deviating 25–30 m, nine levels t ∈ {0, 0.125, …, 1}. Manipulation: two RoboTwin flow-noised windows from the BEAST tree (`flow_noised_pkg` schema flow-beast-v1: the noise is drawn in the normalized B-spline control-point space and decoded to joint targets, so the executed excursions are smooth and the arms stay in view; 33-frame window, frame 0 = the clean conditioning frame, branch frame k realizes window frame k+1; five levels t ∈ {0, 0.25, 0.5, 0.75, 1}; head camera 320×240 stored at 640×480); a slider over the nine action-noise levels t ∈ {0, 0.125, …, 1} (σ_a = 1 − t) shows in one aligned row (never wraps) the recorded frame, the simulator rendering of the executed noised command a_t = t·a* + (1−t)·ε with flow-matching noise at σ_v = warp(σ_a; ς) = ς·σ_a / (1 + (ς−1)·σ_a) added (`Warp ς` selector 1 / 2 / 3 / 5; ς = 1 is the shared schedule σ_v = σ_a), and a square top-down action panel; the clean rendering before noise is always shown as a third video panel (history, recorded path, executed path of the selected level with the ego marker at the current time, other levels faint); below, the 32 future frames (t₀ + 0.2 s … t₀ + 6.4 s at 5 Hz; the 9 history frames are exported but not shown) play in a loop from page load (▶/❚❚ pauses, the time slider scrubs); the noise field changes every frame.

| Asset | Path | Where referenced | Notes |
|---|---|---|---|
| Frames | driving `site/media/noise-levels/<key>/{gt,t0p000,t0p125,…,t1p000}/f00.jpg … f40.jpg` (416×240 JPEG, downscaled from the 832×480 export; 410 rendered files per window plus 30 decoded-latent folders × 32 frames; 23–27 MB per window); manipulation `…/<key>/{gt,t0p000,t0p250,…,t1p000}/f00.jpg … f32.jpg` (320×240, downscaled from 640×480; 198 rendered files plus 14 decoded-latent folders × 32 frames; ~10 MB per window; 73 MB for the four windows of both domains). The panels are drawn at ~270 px wide, so half resolution is still above display size; `downscale_noise_levels.py` does the in-place pass and updates `size` in each `index.js` | built at runtime from the window's `index.js` (`levels[].dir`, `frames`); only the selected window is loaded | data-driven |
| Video noise (latent; no switch in the UI) | `site/media/noise-levels/<key>/<t dir>/lat_sv<σ_v>/f09.jpg … f40.jpg`: the training input clip (recorded history ⊕ rendered future of that level) encoded with the Wan 2.2 VAE the model uses, future latents noised with x_σ = σ_v·ε + (1−σ_v)·z (conditioning latents clean), decoded; one seeded ε per window; equal σ_v values share a folder | `latent.dirs[<level>][<ς>]` in the window's `index.js` | GPU script `export_noise_levels_latent.py` via `submit_noise_levels_latent.sh` (1 GPU, QoS low, alpamayo-core container; driving job 7689432 took 6 min for six windows, ~45 s each, four removed afterwards; manipulation (BEAST tree) job 7693052 took 3 min for three windows); this is what the model actually sees |
| Pixel fallback (internal, used only for a window without decoded frames) | `site/media/noise-levels/<key>/noise.png` = 127.5·(1 + ε), one Gaussian field at 1.5× the (downscaled) frame size (seed 1234567, `--seed` to change), clipped to 8 bit | page stacks a different seeded crop + flip of it per video frame over the rendering at opacity σ_v (warped), which equals σ·ε + (1−σ)·render in [−1, 1] pixel units up to the clipping of ε (about 32 % of samples exceed ±1), so it is a visualisation, not the exact model input | history frames (t ≤ t₀) are exported but not shown |
| Index | `site/media/noise-levels/index.js` → `window.CTRLWAM_NOISE_WINDOWS` (catalog: key, title, domain, scene, window) and `site/media/noise-levels/<key>/index.js` → `window.CTRLWAM_NOISE_LEVELS` (generic: `domain`, `size`, `vaeSize`, `frames`, `hz`, `t0`, `frameT`, `bev` = `ego` (x forward up, y left) or `xy` (robot base, x right, y forward up), `grid`, `frameToTraj`, `history`, `gtPaths`, `levels[].paths` (driving: ego path; robot: left/right gripper paths from forward kinematics of the realized joints, `cmdPaths` = commanded), `latent`) | catalog via `<script src>`; a window's index is injected as a script when selected | the exporter rewrites the catalog on every run; delete a window's folder and re-run any export to drop it |
| Windows | Driving: Example 1 = `e4cc26ed_w2` (default; highway at dusk, 128 m), Example 2 = `132a4562_w1` (fast straight, 113 m) — both from export root `alpaomni_gt_egoonly_multinode_4_2003`. Manipulation: Example 1 = `pick_dual_bottles_e0_s0016_beast` (default), Example 2 = `place_empty_cup_e7_s0116_beast` — from `RoboWAM/robotwin-demo-flow2/demo_flow/<task>/aloha_agilex/flow_beast/episode_NNNNNNN.hdf5` (the joint-space tree `flow/` is available with `--tree flow`; its arms leave the view at mid noise). The catalog carries ids, `domain` and the `--title` strings (not shown); the defaults are `DEFAULT_KEY` in the page | | |

Add / regenerate a driving window: `alpamayo/projects/alpax/docs/paper/figures/scripts/export_noise_levels.py --window <scene>/<window> --pack . --title "<label>"`; a manipulation window: `RoboWAM/cosmos-framework/.venv/bin/python …/export_noise_levels_robot.py --window <task>/<episode>/<window> --pack . --title "<label>" [--tree flow_beast|flow|flow_ee]` (h5py + cv2 + the RoboTwin URDF for forward kinematics) (`--quality`, `--size`, `--seed`, `--key`; slider bounds, defaults and panel aspect follow `index.js`, so other level counts, frame counts and sizes work; windows with all nine levels are listed in the root's `alpax_window_index_v2.json`). The page picks the new window up from the catalog; no edit needed. To drop a window delete its folder and run the exporter with `--rebuild-catalog`.

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
| Animation posters | `site/media/site/denoising.png`, `model.png` | nothing (or the `data-poster` attributes in the page) | ≤1600 px, same aspect as the animation |
| Noise texture (3a, Method-01) | `site/media/schematic/noise.png` | nothing | tiling PNG |
| Noise-level showcase (separate page) | `site/media/noise-levels/<key>/…` (see §8) | the `index.js` script tag in `CtrlWAM-Noise-Levels.html` | regenerate with `export_noise_levels.py` rather than editing by hand |

Rules of thumb:
1. Keep the filename pattern for data-driven sets (`fNN.jpg`, `fNNNN.jpg`, `stepNN_vid.jpg`/`_act.png`, `tN.jpg`); swap the files, no code change.
2. If a list in `data.js` or the bundle names a file that is missing, that frame renders blank — check the browser console (404s) after editing.
3. Recommended sizes: video frames 800–1000 px wide JPEG q≈82 (RoboTwin frames 600×444 q85, denoising panels 400×280); posters ≤1600 px; PNG only where transparency or line art needs it.
4. Media base for the bundle and scripts is `site/media/` (`window.CTRLWAM_MEDIA_BASE` in `site.js`, `data-media` on `#teaser`, `MEDIA` in `site.js`); change all if you move the folder.
5. The teaser and model figures load directly from their sibling HTML files. Only the schedule figure uses an embedded `window.__resourceBlobs` entry that must be updated after edits.
6. Range inputs inside the React-rendered page body must not carry a `value` attribute (React keeps restoring it); `#nl-level`, `#nl-time`, `#cf-time` and `#rt-frame` are initialised from JavaScript. Font files are referenced from `site.css` relative to the stylesheet (`../vendor/fonts/`), and a copy lives in `site/media/fonts/` for the animation bundle.

## Updating the overview teaser

`index.html` loads `CtrlWAM-Teaser-Figure-View.dc.html` directly in an iframe. Edit the image paths in that file's `static SITE_IMG`, save, and reload the main page. There is no embedded teaser copy to synchronize. Browser-saved image replacements do not override the configured paths. This works both when opening the HTML files locally and when serving them from a website. Deploy the teaser HTML alongside `index.html`, `support.js`, and its referenced images, preserving relative paths.

The model figure also loads directly from `CtrlWAM-Model-Figure-View.dc.html`. Its driving and manipulation frame paths are the `src` properties on the corresponding image entries in `defaults()`. Save that file and reload the main page; no embedded copy needs updating. The schedule figure still uses an embedded copy.
