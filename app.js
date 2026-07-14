(() => {
  const exams = window.READING_EXAMS || [];
  const dict = window.READING_GLOSSARY || {};
  const app = document.querySelector("#app");
  const resetButton = document.querySelector("#resetCurrent");
  const wordCard = document.querySelector("#wordCard");
  const functionWords = new Set("the which across along because through a an and or but if so to of in on at for from with by as is are was were be been being have has had do does did will would can could should may might must this that these those it its they them their we our you your he she his her i me my who whom what when where why how not no very more most some any each every all other another than then there here also only just into over under after before during while about between without within".split(" "));

  const stateKey = id => `reading-lab:${id}:answers`;
  const wordsKey = id => `reading-lab:${id}:words`;
  const load = key => { try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; } };
  const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const base = word => {
    const w = word.toLowerCase().replace(/[^a-z-]/g, "");
    const tries = [w, w.replace(/ies$/, "y"), w.replace(/ing$/, ""), w.replace(/ing$/, "e"), w.replace(/ed$/, ""), w.replace(/ed$/, "e"), w.replace(/es$/, ""), w.replace(/s$/, "")];
    return tries.find(x => dict[x]) || null;
  };
  const clickable = text => esc(text).replace(/\b[A-Za-z][A-Za-z'-]{2,}\b/g, raw => {
    const key = base(raw);
    return key && !functionWords.has(key) ? `<button class="lookup" data-word="${key}" type="button">${raw}</button>` : raw;
  });
  const accepted = answer => Array.isArray(answer) ? answer.map(String) : [String(answer)];
  const isCorrect = (given, answer) => accepted(answer).some(x => x.toLowerCase() === String(given).trim().toLowerCase());
  const currentExam = () => exams.find(e => `#exam/${e.id}` === location.hash);

  function board() {
    resetButton.hidden = true;
    document.title = "Cambridge Reading Practice Board";
    const cards = (level, series = null) => exams.filter(e => e.level === level && (series ? e.series === series : !e.series)).map(e => {
      const answers = load(stateKey(e.id));
      const done = Object.keys(answers).length;
      return `<a class="exam-card ${level.toLowerCase()}" href="#exam/${e.id}">
        <div class="level-pill">${level === "FCE" ? "B2 First" : "B1 Preliminary"}</div>
        <h3>${esc(e.shortTitle)}</h3><p>${e.parts.length} parts · ${e.questionCount} questions</p>
        <div class="progress"><span style="width:${Math.round(done/e.questionCount*100)}%"></span></div>
        <small>${done} / ${e.questionCount} answered</small><span class="card-arrow">Start →</span>
      </a>`;
    }).join("");
    app.innerHTML = `<section class="board-hero"><p class="eyebrow">Cambridge exam practice</p><h1>Reading Practice Board</h1><p>Choose a test, answer directly beside the original page, and collect useful vocabulary as you read.</p></section>
      <section class="board-section"><div><p class="eyebrow">B1 level</p><h2>PET Reading Tests</h2></div><div class="card-grid">${cards("PET")}</div></section>
      <section class="board-section"><div><p class="eyebrow">B2 level</p><h2>FCE Reading Tests</h2></div><div class="board-groups">
        <div class="card-group"><h3>FCE Practice Tests 1-4</h3><div class="card-grid">${cards("FCE")}</div></div>
        <div class="card-group"><h3>Cambridge English First for Schools 3</h3><div class="card-grid">${cards("FCE", "Book 3")}</div></div>
      </div></section>`;
  }

  function examView(exam) {
    resetButton.hidden = false;
    document.title = `${exam.shortTitle} · Reading Lab`;
    const answers = load(stateKey(exam.id));
    const reviewed = load(wordsKey(exam.id));
    const answered = Object.keys(answers).length;
    const parts = exam.parts.map(p => {
      const questions = [];
      for (let n = p.range[0]; n <= p.range[1]; n++) {
        const saved = answers[n] ?? "";
        const answer = p.answers[n - p.range[0]];
        const control = p.mode === "text"
          ? `<input class="gap-input" data-q="${n}" value="${esc(saved)}" aria-label="Answer ${n}" autocomplete="off">`
          : `<div class="choice-row">${p.labels.map(label => `<button type="button" class="choice ${saved===label?"selected":""}" data-q="${n}" data-value="${label}">${label}</button>`).join("")}</div>`;
        const feedback = saved ? feedbackHtml(saved, answer, p.explanation) : "";
        questions.push(`<div class="question" id="q-${n}"><span class="q-number">${n}</span>${control}<div class="feedback">${feedback}</div></div>`);
      }
      const partDone = Object.keys(answers).filter(n => +n >= p.range[0] && +n <= p.range[1]).length === p.range[1]-p.range[0]+1;
      const pages = p.pages.map((pg, idx) => `<figure class="source-page"><a href="${pg.image}" target="_blank" title="Open full-size source page"><img src="${pg.image}" alt="${esc(exam.shortTitle)} ${esc(p.title)} source page ${idx+1}" loading="lazy"></a><details><summary>Clickable text transcript</summary><div class="transcript">${clickable(pg.transcript)}</div></details></figure>`).join("");
      return `<section class="part-card" id="${p.id}"><div class="part-heading"><div><p class="eyebrow">Questions ${p.range[0]}–${p.range[1]}</p><h2>${esc(p.title)}</h2></div><span class="part-status ${partDone?"done":""}">${partDone?"Completed":"In progress"}</span></div>
        <div class="practice-grid"><div class="source-column">${pages}</div><div class="answer-column"><div class="answer-panel"><h3>Your answers</h3>${questions.join("")}</div>
        <div class="translation-note ${partDone?"revealed":""}">${partDone ? "✓ Part completed. The supplied source has no verified Traditional Chinese passage translation, so no full translation is shown." : "Finish every question in this part to unlock the translation area."}</div></div></div></section>`;
    }).join("");
    app.innerHTML = `<section class="exam-hero"><a href="#board" class="back-link">← Practice board</a><p class="eyebrow">${esc(exam.level)} reading practice</p><h1>${esc(exam.title)}</h1><p>${esc(exam.sourceNote)}</p><div class="exam-progress"><strong>${answered} / ${exam.questionCount}</strong><span>answered</span><div class="progress"><span style="width:${Math.round(answered/exam.questionCount*100)}%"></span></div></div></section>
      <nav class="part-nav" aria-label="Test parts">${exam.parts.map(p=>`<a href="#${p.id}">${p.title.replace(/^Part \d+: /, "")}</a>`).join("")}</nav>
      ${parts}<section class="review-card"><div><p class="eyebrow">Personal word bank</p><h2>Words you looked up</h2></div><div id="reviewList">${reviewHtml(reviewed)}</div></section>`;
  }

  function feedbackHtml(given, answer, explanation) {
    const ok = isCorrect(given, answer);
    return `<p class="${ok?"correct":"incorrect"}">${ok?"Correct":"Try again"}. <span>Answer: ${esc(accepted(answer).join(" / "))}</span></p><p>${esc(explanation)}</p>`;
  }
  function reviewHtml(reviewed) {
    const keys = Object.keys(reviewed);
    if (!keys.length) return `<p class="empty-state">Click highlighted content words in a transcript to build this review list.</p>`;
    return `<div class="review-table">${keys.sort().map(word => `<div><strong>${esc(word)}</strong><span>${esc(dict[word]?.[0])}</span><span>${esc(dict[word]?.[1])}</span><button data-remove-word="${word}" type="button" aria-label="Remove ${word}">×</button></div>`).join("")}</div>`;
  }

  function render() { currentExam() ? examView(currentExam()) : board(); app.focus({preventScroll:true}); }
  addEventListener("hashchange", render);
  document.addEventListener("click", event => {
    const exam = currentExam();
    const choice = event.target.closest(".choice");
    if (exam && choice) {
      const answers = load(stateKey(exam.id)); answers[choice.dataset.q] = choice.dataset.value; save(stateKey(exam.id), answers); examView(exam); document.querySelector(`#q-${choice.dataset.q}`)?.scrollIntoView({block:"center"}); return;
    }
    const lookup = event.target.closest(".lookup");
    if (exam && lookup) {
      const word = lookup.dataset.word; const [pos, zh] = dict[word]; const reviewed = load(wordsKey(exam.id)); reviewed[word]=true; save(wordsKey(exam.id),reviewed);
      wordCard.innerHTML = `<strong>${esc(word)}</strong><span>${esc(pos)}</span><p>${esc(zh)}</p>`; wordCard.hidden=false;
      const rect=lookup.getBoundingClientRect(); wordCard.style.left=`${Math.min(innerWidth-260,Math.max(12,rect.left))}px`; wordCard.style.top=`${Math.min(innerHeight-150,rect.bottom+8)}px`;
      document.querySelector("#reviewList").innerHTML=reviewHtml(reviewed); return;
    }
    const remove = event.target.closest("[data-remove-word]");
    if (exam && remove) { const reviewed=load(wordsKey(exam.id)); delete reviewed[remove.dataset.removeWord]; save(wordsKey(exam.id),reviewed); document.querySelector("#reviewList").innerHTML=reviewHtml(reviewed); return; }
    if (!event.target.closest("#wordCard")) wordCard.hidden=true;
  });
  document.addEventListener("change", event => {
    const exam=currentExam(); if(!exam || !event.target.matches(".gap-input")) return;
    const answers=load(stateKey(exam.id)); answers[event.target.dataset.q]=event.target.value.trim(); save(stateKey(exam.id),answers); examView(exam); document.querySelector(`#q-${event.target.dataset.q}`)?.scrollIntoView({block:"center"});
  });
  resetButton.addEventListener("click",()=>{const exam=currentExam(); if(exam && confirm(`Reset all answers for ${exam.shortTitle}?`)){localStorage.removeItem(stateKey(exam.id)); examView(exam);}});
  document.querySelector("#fontToggle").addEventListener("click",()=>document.body.classList.toggle("large-text"));
  if (!location.hash) location.hash="#board"; else render();
})();
