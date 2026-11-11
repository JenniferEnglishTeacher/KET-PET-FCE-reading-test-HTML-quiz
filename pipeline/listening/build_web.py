"""Writes data-<level>-listening<N>.js and glossary-<level>-listening<N>.js (KET / PET) for the Cambridge Lab site.
Usage: python3 -I build_web.py content.json repo_dir
The content format is described in pipeline/listening/PIPELINE.md (example: example-ket8.json)."""
import json, sys, os

C = json.load(open(sys.argv[1], encoding="utf-8"))
REPO = sys.argv[2]
LV, N = C["LEVEL"], C["TEST_NO"]
lv = LV.lower()
NAMES = {"KET": "A2 Key (KET)", "PET": "B1 Preliminary (PET)"}
J = lambda x: json.dumps(x, ensure_ascii=False)
CONST = f"LISTENING_{LV}_{N}_TRANSCRIPTS"


def script_lines(blocks):
    out = []
    for h_en, _h_zh, pairs in blocks:
        out.append(h_en)
        out.extend(en for en, _zh in pairs)
    return out


def question(q, part):
    prompt = q.get("q", "")
    if q.get("stem"):
        prompt = f'{q["stem"]} {prompt}'.strip()
    if part["mode"] == "text":
        prompt = f'{q["pre"]} ______ {q.get("post", "")}'.strip().replace(" ______ .", " ______.").replace(" ______ ,", " ______,")
    d = dict(number=q["n"], prompt=prompt)
    if part["mode"] == "choice":
        d["options"] = q["opts"] if "opts" in q else {k: k for k in part["shared"]}
    if q.get("img"):
        d["image"] = q["img"]
    d.update(answer=q["ans"], timestamp=q["t"], evidence=f'"{q["ev"]}" {q.get("why", "")}'.strip())
    return d


parts, trans = [], {}
for i, p in enumerate(C["PARTS"], 1):
    qs = [question(q, p) for q in p["questions"]]
    d = dict(id=f"{lv}-listening{N}-part-{i}", title=p["title"], range=[qs[0]["number"], qs[-1]["number"]], mode=p["mode"])
    if p["mode"] == "choice":
        d["labels"] = list(p["shared"].keys()) if p.get("shared") else ["A", "B", "C"]
    d.update(audioStart=p["bounds"][0], audioEnd=p["bounds"][1], instructions=p["instr"])
    if p.get("heading"):
        d["heading"] = p["heading"]
    if p.get("shared"):
        d["sharedOptions"] = p["shared"]
    d.update(questions=qs, studyNotes=p["notes"], transcript=f"@@T{i}@@")
    parts.append(d)
    trans[str(i)] = script_lines(p["script"])

qcount = sum(len(p["questions"]) for p in C["PARTS"])
test = dict(
    id=f"{lv}-listening-{N}", level=LV, shortTitle=f"{LV} Listening Test {N}", title=f'{NAMES[LV]} Listening Test {N}',
    videoId=C["VIDEO_ID"], videoUrl=f'https://www.youtube.com/watch?v={C["VIDEO_ID"]}', preferTranscriptSource=True, questionCount=qcount,
    sourceNote=C.get("SOURCE_NOTE", "Questions were read from the video's question screens; the audio script was transcribed from the video's English captions and edited against the recording. Part and question timings link to the first playing."),
    transcriptNote="Edited English script with the repeated exam playback removed. All tested content is retained. Click highlighted words for Traditional Chinese vocabulary support.",
    parts=parts)

body = json.dumps(test, ensure_ascii=False, indent=2)
for i in range(1, len(parts) + 1):
    body = body.replace(f'"@@T{i}@@"', f"{CONST}[{i}]")
assert body.count(f"{CONST}[") == len(parts)

js = f"const {CONST} = {json.dumps(trans, ensure_ascii=False, indent=2)};\n\nwindow.LISTENING_TESTS = window.LISTENING_TESTS || [];\n\nwindow.LISTENING_TESTS.unshift({body});\n"
open(os.path.join(REPO, f"data-{lv}-listening{N}.js"), "w", encoding="utf-8").write(js)

gl = {}
for w, pos, _en, zh, *_ in C["VOCAB"]:
    w = w.strip()
    if " " not in w and "(" not in w:
        gl[w.lower()] = [pos, zh.replace(" / ", "；")]
gl.update(C.get("EXTRA_GLOSS", {}))
g = "Object.assign(window.READING_GLOSSARY, {\n" + ",\n".join(f"  {J(k)}: {J(v)}" for k, v in gl.items()) + "\n});\n"
open(os.path.join(REPO, f"glossary-{lv}-listening{N}.js"), "w", encoding="utf-8").write(g)
print("ok", f"data-{lv}-listening{N}.js", qcount, "questions,", len(gl), "glossary words")
