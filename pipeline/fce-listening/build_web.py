"""Writes data-listening<N>.js and glossary-listening<N>.js for the Cambridge Lab site.
Usage: python3 -I build_web.py content.json repo_dir   (part timings come from AUDIO_BOUNDS in the content)"""
import json, sys, os

C = json.load(open(sys.argv[1], encoding="utf-8"))
REPO = sys.argv[2]
BOUNDS = C["AUDIO_BOUNDS"]
N = C["TEST_NO"]
J = lambda x: json.dumps(x, ensure_ascii=False)

def lines(blocks):
    out = []
    for h_en, _h_zh, pairs in blocks:
        out.append(h_en)
        out.extend(en for en, _zh in pairs)
    return out

trans = {str(i + 1): lines(C[f"T{i + 1}"]) for i in range(4)}
q1 = [dict(number=q["n"], prompt=f'{q["stem"]} {q["q"]}', options=q["opts"], answer=q["ans"], timestamp=q["t"], evidence=f'"{q["ev"]}" {q["why"]}') for q in C["P1"]]
q2 = [dict(number=q["n"], prompt=f'{q["pre"]} ______ {q["post"]}'.replace(" ______ .", " ______.").replace(" ______ ,", " ______,"), answer=q["ans"], timestamp=q["t"], evidence=f'"{q["ev"]}"') for q in C["P2"]]
letters = list(C["P3_OPTS"].keys())
q3 = [dict(number=q["n"], prompt=f'Speaker {q["sp"]}', options={l: l for l in letters}, answer=q["ans"], timestamp=q["t"], evidence=f'"{q["ev"]}" {q["why"]}') for q in C["P3"]]
q4 = [dict(number=q["n"], prompt=q["q"], options=q["opts"], answer=q["ans"], timestamp=q["t"], evidence=f'"{q["ev"]}" {q["why"]}') for q in C["P4"]]

def part(i, title, mode, instr, qs, labels=None, heading=None, shared=None):
    d = dict(id=f"listening{N}-part-{i}", title=title, range=[qs[0]["number"], qs[-1]["number"]], mode=mode)
    if labels: d["labels"] = labels
    d.update(audioStart=BOUNDS[i - 1][0], audioEnd=BOUNDS[i - 1][1], instructions=instr)
    if heading: d["heading"] = heading
    if shared: d["sharedOptions"] = shared
    d.update(questions=qs, studyNotes=C["STUDY_NOTES"][str(i)])
    return d

test = dict(
    id=f"fce-listening-{N}", level="FCE", shortTitle=f"FCE Listening Test {N}", title=f"B2 First (FCE) Listening Test {N}",
    videoId=C["VIDEO_ID"], videoUrl=f'https://www.youtube.com/watch?v={C["VIDEO_ID"]}', preferTranscriptSource=True, questionCount=30,
    sourceNote=f"Questions were read from the video's question screens; the audio script was transcribed from the video's English captions and edited against the recording. Part and question timings link to the first playing.",
    transcriptNote="Edited English script with the repeated exam playback removed. All tested content is retained. Click highlighted words for Traditional Chinese vocabulary support.",
    parts=[part(1, "Part 1: Multiple choice", "choice", C["P1_INSTR"], q1, ["A", "B", "C"]),
           part(2, "Part 2: Sentence completion", "text", C["P2_INSTR"], q2, heading=C["P2_HEADING"].title()),
           part(3, "Part 3: Multiple matching", "choice", C["P3_INSTR"], q3, letters, shared=C["P3_OPTS"]),
           part(4, "Part 4: Multiple choice", "choice", C["P4_INSTR"], q4, ["A", "B", "C"])])

body = json.dumps(test, ensure_ascii=False, indent=2)
for i in range(1, 5):  # point each part at the shared transcript constant, like the other test files
    body = body.replace(f'"studyNotes": {json.dumps(C["STUDY_NOTES"][str(i)], ensure_ascii=False, indent=2)}'.replace("\n", "\n" + " " * 6),
                        f'"studyNotes": {json.dumps(C["STUDY_NOTES"][str(i)], ensure_ascii=False, indent=2)}'.replace("\n", "\n" + " " * 6) + f',\n      "transcript": LISTENING_{N}_TRANSCRIPTS[{i}]')
assert body.count(f"LISTENING_{N}_TRANSCRIPTS[") == 4, "transcript links not inserted"

js = f"const LISTENING_{N}_TRANSCRIPTS = {json.dumps(trans, ensure_ascii=False, indent=2)};\n\nwindow.LISTENING_TESTS = window.LISTENING_TESTS || [];\n\nwindow.LISTENING_TESTS.unshift({body});\n"
open(os.path.join(REPO, f"data-listening{N}.js"), "w", encoding="utf-8").write(js)

# glossary: single-word vocabulary items (the site looks words up one at a time)
gl = {}
for w, pos, _en, zh, *_ in C["VOCAB"]:
    w = w.strip()
    if " " not in w and "(" not in w:
        gl[w.lower()] = [pos, zh.replace(" / ", "；")]
gl.update({k: v for k, v in C.get("EXTRA_GLOSS", {}).items()})
g = "Object.assign(window.READING_GLOSSARY, {\n" + ",\n".join(f"  {J(k)}: {J(v)}" for k, v in gl.items()) + "\n});\n"
open(os.path.join(REPO, f"glossary-listening{N}.js"), "w", encoding="utf-8").write(g)
print("ok", len(gl), "glossary words")
