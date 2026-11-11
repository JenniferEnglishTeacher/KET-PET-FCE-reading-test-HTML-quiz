# KET / PET listening test → website + teaching docx (one test per run)

Same workflow as `pipeline/fce-listening/PIPELINE.md`; this file covers what is different for KET and PET.
Reference outputs: `example-ket8.json` (KET Test 8) and `example-pet17.json` (PET Test 17).

## Sources (work from the highest number down)
| Level | Playlist | Video titles | Queue |
|---|---|---|---|
| KET | `PLu8QKF7L4gJ7Qw0MJ80yGEwLJzYz9FZ6f` (KET PET Mr Mol, Collins A2 Key 8 Practice Tests) | "KET Listening - A2 Key 8 Practice Test N - COLLINS" | 8 → 1 |
| PET | `PLXz4HmtoxCTNbBUBFH9R49cJAl1__uXDP` (vPET, B1 Preliminary for Schools) | "B1 Preliminary for schools Listening Test N with answers (New Format)" | 17 → 1 |

Known video ids — KET: 1 KmJbdoEAdKM, 2 CFlIuU3golc, 3 s_8RNKewKC4, 4 yBSedl-cyQQ, 5 yuzVZXcQbFE, 6 3cxqbJGMvXo, 7 ur4K8q8fuTA, 8 GftulGNcRm0.
PET: 1 lH9o9--zA-k, 2 Isc2xmnwXAk, 3 cAbSxHjtE-g, 4 Wk-xcVyQIhk, 5 1CFoYVqwNs8, 6 QjK0SLfabYM, 7 OwGvNITUtG4, 8 Y85q6RJHBXo,
9 y6JNTqEG4rQ, 10 FT0M7ol777s, 11 kW53f71PKOk, 12 kSHEPIJIClk, 13 yP8k-Q4tPU8, 14 zRzqCtpXb3Q, 15 nWDLw4Wk_Jo, 16 mSUXWxHj3cY, 17 Hw-6TNZ3ZVE.
Open `https://www.youtube.com/watch?v=ID` and check the page title has the right test number.

Exam formats: KET = 5 parts / 25 Qs (P1 5 picture MCQ, P2 5 gap fill, P3 5 MCQ, P4 5 MCQ, P5 5 matching A–H with an example).
PET = 4 parts / 25 Qs (P1 7 picture MCQ, P2 6 MCQ, P3 6 gap fill, P4 6 MCQ interview).

## Transcript
On the watch page: pause the video, click `#description-inline-expander #expand`, click every button whose text is
"Show transcript", wait ~9 s, then `get_page_text`. If the panel is still empty, reload the page and try again.

## Question screens and picture questions
Inject the same overlay-hiding CSS as the FCE runbook, plus
`ytd-watch-metadata,#above-the-fold,#below,#comments{visibility:hidden!important} video.html5-main-video{z-index:2147483647!important} [class*=immersive],[class*=translate]{display:none!important}`
(the last rule hides the browser translation-caption extension). Move the mouse off the video (`hover` at the right edge).
Read text questions from normal screenshots. For each picture question, seek to the frame, then use the `zoom` action on the
region of that one question (number + question + pictures A/B/C) with `save_to_disk: true` and NO `scale` (scale shrinks the
saved file). The file lands in `/tmp/claude-chrome-screenshots-*/`; save it as JPEG (quality 82) to
`assets/listening/<level><N>-q<n>.jpg` (e.g. `ket7-q3.jpg`) and set `"img"` on the question. Also give every picture
option a short text label in `opts` (e.g. "1 hour 30 minutes", "black and white stripes") — the site and docx show both.

## Content JSON (`content-<level><N>.json`)
```
LEVEL "KET"|"PET", TEST_NO, VIDEO_ID, SOURCE_NOTE,
PARTS: [ { title, mode "choice"|"text", bounds [start,end] (seconds, from "now look at part N" lines), instr, heading?,
           shared? {A..H} (KET Part 5 matching: questions then have only n, q = the name, ans, t, ev, why),
           questions: [ choice: {n, stem?, q, opts, img?, ans, t, ev, why} | text: {n, pre, post, ans [accepted...], key, t, ev} ],
           notes [3 study notes], script [[heading_en, heading_zh, [[english_line, traditional_chinese_line], ...]], ...] } ],
VOCAB: KET exactly 40 rows, PET exactly 50 rows [word, pos, english_def, chinese_def, sentence_with_____, chinese_translation],
EXTRA_GLOSS {word: [pos, 中文]}
```
Script = ONE playing, punctuated, names restored, speaker labels. `t` = where the QUESTION starts in the first playing
(number announcement −2 s; gap fill ≈10 s before the answer but after the previous answer; long recordings = the question
that leads to the item). `t` must increase through the test. Work out every answer from the transcript and quote the decisive line.

## Build
```bash
python3 make_<level><N>.py                                                   # your script that writes the content JSON
python3 -I pipeline/listening/build_web.py content-ket7.json .              # data-ket-listening7.js + glossary-ket-listening7.js
NODE_PATH=<dir with npm docx> node pipeline/listening/build_docx.js content-ket7.json KET_Listening_No._7.docx .
```
Render the docx to PDF and check every page. In `index.html` add the data script under the `<!-- KET listening (descending) -->`
or `<!-- PET listening (descending) -->` comment and the glossary script next to the other KET/PET glossaries, keeping each
level in descending test-number order (the board then lists them ascending). Update README's KET/PET test ranges.
Check the page in Playwright (no console errors, images load, Play-from-question links, notes reveal). Commit and push.

## Deliver
Save the docx to `C:\Users\Jennifer\Documents\FCE reading tests turn into HTML website\FCE Listening docx\`
(the connected folder; KET/PET files sit beside the FCE ones, named `KET_Listening_No._N.docx` / `PET_Listening_No._N.docx`).
