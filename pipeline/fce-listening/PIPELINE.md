# FCE Listening test → teaching docx + website (one test per run)

Source videos: the "Viet FCE" YouTube channel, titled **"Full B2 First (FCE) Listening Test NN with Answers"**
(playlist "B2 first (FCE) Listening Tests (New Format)"). Reference test: No. 61 (`example-content61.json`).

## 1. Find the video
In Chrome (Claude in Chrome), search YouTube for `Full B2 First (FCE) Listening Test NN with Answers` and open the
Viet FCE result whose title has exactly that number. Record the video id. If no matching video exists, stop and report.

## 2. Transcript
On the watch page run JS: expand the description (`#description-inline-expander #expand`), click the button whose text is
"Show transcript", wait ~4 s. Then call **get_page_text** on the tab — it returns every transcript segment with its
timestamp (javascript_tool output is truncated at ~1000 chars, so do not use it for the text).
Read the description chapters for the Part 1–4 start times.

## 3. Question screens
Hide overlays, then seek and screenshot:
```js
const st=document.createElement('style'); st.textContent='.ytp-caption-window-container,.ytp-chrome-bottom,.ytp-chrome-top,.ytp-gradient-bottom,.ytp-gradient-top,.ytp-watermark,.ytp-ce-element,#masthead-container,#secondary,ytd-engagement-panel-section-list-renderer,.caption-window{display:none!important} video.html5-main-video{position:fixed!important;left:0!important;top:0!important;width:100vw!important;height:100vh!important;z-index:999999!important;background:#000;object-fit:contain!important}'; document.head.appendChild(st);
try{document.querySelector('#movie_player').unloadModule('captions')}catch(e){}
const v=document.querySelector('video'); v.pause(); v.muted=true; v.currentTime=SECONDS;
```
Seek to ~25 s after each part's chapter start (the question paper shows during the preview/reading time). Part 4 may
need a second screenshot later in the part. Read every question, option and Part 3 letter list from the screenshots.

## 4. Write content NN JSON
Same keys as `example-content61.json`:
- `TEST_NO`, `VIDEO_ID`, `P2_TOPIC`, `P3_TOPIC`, `P4_TOPIC`, `AUDIO_BOUNDS` (part start/end seconds)
- `P1` (n, stem, q, opts, ans, t, ev, why), `P2` (n, pre, post, ans[list of accepted answers], key, t, ev), `P2_HEADING`
- `P3_OPTS` (A–H), `P3` (n, sp, ans, t, ev, why), `P4` (n, q, opts, ans, t, ev, why), `P1_INSTR`…`P4_INSTR`
- `T1`–`T4`: transcript blocks `[heading_en, heading_zh, [[english_line, traditional_chinese_line], …]]` — ONE playing only
  (drop the repeat), restore punctuation/capitals/names, label speakers ("Man:", "Woman:", "Speaker 1:", "Presenter:", names)
- `VOCAB`: exactly 60 rows `[word, pos, english_def, chinese_def, sentence_with_____, chinese_translation]` (CEFR B1/B2)
- `STUDY_NOTES`: {"1":[3 notes], "2":[…], "3":[…], "4":[…]}; `EXTRA_GLOSS`: {word: [pos, 中文]} for extra single words
Work out each answer from the transcript yourself and quote the decisive line as `ev`.
`t` drives the site's "Play from this question" link, so it is where the QUESTION STARTS in the first playing
(never the evidence line): Part 1 = the "Question N, you hear…" announcement (−2 s); Part 3 = the "Speaker N"
announcement (−2 s); Part 2 = ~10 s before the answer word, but after the previous answer; Part 4 = the
interviewer's question that leads to the item (Q24 = start of the recording). `t` must increase from 1 to 30.
`AUDIO_BOUNDS` come from the transcript's "now turn to part N" lines, not from estimates.

## 5. Build
```bash
node pipeline/fce-listening/build_docx.js contentNN.json FCE_Listening_No._NN.docx   # needs npm docx
python3 -I pipeline/fce-listening/build_web.py contentNN.json .                      # writes data-/glossary-listeningNN.js
```
Render the docx to PDF and look at the pages. Add both script tags to `index.html` (cards show in reverse load order:
keep listening tests in descending number order so the board lists them ascending), update README's test list,
commit and push to `main`.

## 6. Deliver
Save the docx to `C:\Users\Jennifer\Documents\FCE reading tests turn into HTML website\FCE Listening docx\`.
