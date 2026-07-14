(() => {
  const exams = window.READING_EXAMS || [];
  const listeningTests = window.LISTENING_TESTS || [];
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
  const currentListening = () => listeningTests.find(e => `#listening/${e.id}` === location.hash);

  function board() {
    resetButton.hidden = true;
    document.title = "Cambridge Reading & Listening Practice Board";
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
    const listeningCards = listeningTests.map(test => {
      const answers = load(stateKey(test.id));
      const done = Object.keys(answers).length;
      return `<a class="exam-card listening-card" href="#listening/${test.id}">
        <div class="level-pill">B2 First Listening</div>
        <h3>${esc(test.shortTitle)}</h3><p>${test.parts.length} parts · ${test.questionCount} questions</p>
        <div class="progress"><span style="width:${Math.round(done/test.questionCount*100)}%"></span></div>
        <small>${done} / ${test.questionCount} answered</small><span class="card-arrow">Start →</span>
      </a>`;
    }).join("");
    app.innerHTML = `<section class="board-hero"><p class="eyebrow">Cambridge exam practice</p><h1>Reading & Listening Practice Board</h1><p>Choose a test, answer online, and collect useful vocabulary as you practise.</p></section>
      <section class="board-section"><div><p class="eyebrow">B1 level</p><h2>PET Reading Tests</h2></div><div class="card-grid">${cards("PET")}</div></section>
      <section class="board-section"><div><p class="eyebrow">B2 level</p><h2>FCE Reading Tests</h2></div><div class="board-groups">
        <div class="card-group"><h3>FCE Practice Tests 1-4</h3><div class="card-grid">${cards("FCE")}</div></div>
        <div class="card-group"><h3>Cambridge English First for Schools 3</h3><div class="card-grid">${cards("FCE", "Book 3")}</div></div>
      </div></section>
      <section class="board-section listening-section"><div><p class="eyebrow">B2 level</p><h2>FCE Listening Tests</h2></div><div class="card-grid">${listeningCards}</div></section>`;
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

  function listeningView(test) {
    resetButton.hidden = false;
    document.title = `${test.shortTitle} · Cambridge Lab`;
    const answers = load(stateKey(test.id));
    const reviewed = load(wordsKey(test.id));
    const answered = Object.keys(answers).length;
    const parts = test.parts.map(part => {
      const partDone = part.questions.every(q => String(answers[q.number] ?? "").trim());
      const sharedOptions = part.sharedOptions ? `<div class="shared-options">${Object.entries(part.sharedOptions).map(([label, value]) => `<p><strong>${label}</strong> ${clickable(value)}</p>`).join("")}</div>` : "";
      const questions = part.questions.map(q => {
        const saved = answers[q.number] ?? "";
        const control = part.mode === "text"
          ? `<input class="gap-input listening-gap" data-q="${q.number}" value="${esc(saved)}" aria-label="Answer ${q.number}" autocomplete="off" placeholder="Type, then press Enter">`
          : `<div class="listening-options">${Object.entries(q.options).map(([label, value]) => `<div class="listening-option"><button type="button" class="choice listening-choice ${saved===label?"selected":""}" data-q="${q.number}" data-value="${label}" aria-label="Question ${q.number}, option ${label}">${label}</button><span>${clickable(value)}</span></div>`).join("")}</div>`;
        return `<div class="question listen-question" id="q-${q.number}">
          <div class="q-line"><span class="q-number">${q.number}</span><div><p class="q-prompt">${clickable(q.prompt)}</p>${part.mode === "text" ? control : ""}</div></div>
          ${part.mode === "choice" ? control : ""}
          <a class="time-link" href="${test.videoUrl}&t=${q.timestamp}s" target="_blank" rel="noopener">Play from this question ↗</a>
          <div class="feedback">${saved ? listeningFeedbackHtml(saved, q) : ""}</div>
        </div>`;
      }).join("");
      const transcript = part.transcript ? `<details class="listening-transcript"><summary>Complete listening script</summary><div>${part.transcript.map(line => `<p>${clickable(line)}</p>`).join("")}</div></details>` : "";
      const notes = partDone ? `<div class="study-notes revealed"><h3>Answer study notes</h3><ul>${part.studyNotes.map(note => `<li>${clickable(note)}</li>`).join("")}</ul>${transcript}<p class="rights-note">${esc(test.transcriptNote)}</p></div>` : `<div class="study-notes">Finish every question in this part to reveal the study notes${part.transcript ? " and complete script" : ""}.</div>`;
      const textSourceOptions = part.sharedOptions ? `<div class="text-source-options">${Object.entries(part.sharedOptions).map(([label, value]) => `<p><strong>${label}</strong> ${clickable(value)}</p>`).join("")}</div>` : "";
      const textSourceQuestions = part.questions.map(q => `<div class="text-source-question"><p><strong>${q.number}</strong> ${clickable(q.prompt)}</p>${part.mode === "choice" && !part.sharedOptions ? `<div>${Object.entries(q.options).map(([label, value]) => `<p><strong>${label}</strong> ${clickable(value)}</p>`).join("")}</div>` : ""}</div>`).join("");
      const textSource = `<section class="question-text-source"><h3>Complete question text</h3><p class="question-text-instructions">${clickable(part.instructions)}</p>${part.heading ? `<h4>${clickable(part.heading)}</h4>` : ""}${textSourceOptions}${textSourceQuestions}</section>`;
      const sourceSheet = test.preferTextSource ? textSource : part.sourceImage ? `<details class="question-source"><summary>Original question sheet</summary><a href="${part.sourceImage}" target="_blank"><img src="${part.sourceImage}" alt="${esc(part.title)} original question sheet" loading="lazy"></a></details>` : `<div class="question-source text-source"><strong>Question source</strong><p>The teacher supplied this part as complete text.</p></div>`;
      return `<section class="part-card listening-part" id="${part.id}">
        <div class="part-heading"><div><p class="eyebrow">Questions ${part.range[0]}–${part.range[1]}</p><h2>${esc(part.title)}</h2></div><span class="part-status ${partDone?"done":""}">${partDone?"Completed":"In progress"}</span></div>
        <p class="listening-instructions">${clickable(part.instructions)}</p>
        ${part.heading ? `<h3 class="listening-heading">${esc(part.heading)}</h3>` : ""}
        <div class="practice-grid"><div class="source-column">
          <div class="listening-player"><iframe src="https://www.youtube-nocookie.com/embed/${test.videoId}?start=${part.audioStart}&end=${part.audioEnd}&rel=0" title="${esc(test.shortTitle)} ${esc(part.title)} audio" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe></div>
          <p class="source-caption">Use the player's CC button for the video's auto-generated English captions.</p>
          ${sourceSheet}
        </div><div class="answer-column"><div class="answer-panel listening-answers"><h3>Your answers</h3>${sharedOptions}${questions}</div>${notes}</div></div>
      </section>`;
    }).join("");
    app.innerHTML = `<section class="exam-hero listening-hero"><a href="#board" class="back-link">← Practice board</a><p class="eyebrow">B2 First listening practice</p><h1>${esc(test.title)}</h1><p>${esc(test.sourceNote)}</p><div class="exam-progress"><strong>${answered} / ${test.questionCount}</strong><span>answered</span><div class="progress"><span style="width:${Math.round(answered/test.questionCount*100)}%"></span></div></div></section>
      <nav class="part-nav" aria-label="Listening test parts">${test.parts.map(part => `<a href="#${part.id}">${part.title.replace(/^Part \d+: /, "")}</a>`).join("")}</nav>
      ${parts}<section class="review-card"><div><p class="eyebrow">Personal word bank</p><h2>Words you looked up</h2></div><div id="reviewList">${reviewHtml(reviewed)}</div></section>`;
  }

  function listeningFeedbackHtml(given, question) {
    const ok = isCorrect(given, question.answer);
    return `<p class="${ok?"correct":"incorrect"}">${ok?"Correct":"Try again"}. <span>Answer: ${esc(accepted(question.answer)[0])}</span></p><p>${clickable(question.evidence)}</p>`;
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

  function render() {
    const listening = currentListening();
    const exam = currentExam();
    if (listening) listeningView(listening); else if (exam) examView(exam); else board();
    app.focus({preventScroll:true});
  }
  addEventListener("hashchange", render);
  document.addEventListener("click", event => {
    const exam = currentExam();
    const listening = currentListening();
    const listeningChoice = event.target.closest(".listening-choice");
    if (listening && listeningChoice) {
      const answers = load(stateKey(listening.id));
      answers[listeningChoice.dataset.q] = listeningChoice.dataset.value;
      save(stateKey(listening.id), answers);
      listeningView(listening);
      document.querySelector(`#q-${listeningChoice.dataset.q}`)?.scrollIntoView({block:"center"});
      return;
    }
    const choice = event.target.closest(".choice");
    if (exam && choice) {
      const answers = load(stateKey(exam.id)); answers[choice.dataset.q] = choice.dataset.value; save(stateKey(exam.id), answers); examView(exam); document.querySelector(`#q-${choice.dataset.q}`)?.scrollIntoView({block:"center"}); return;
    }
    const lookup = event.target.closest(".lookup");
    const currentTest = exam || listening;
    if (currentTest && lookup) {
      const word = lookup.dataset.word; const [pos, zh] = dict[word]; const reviewed = load(wordsKey(currentTest.id)); reviewed[word]=true; save(wordsKey(currentTest.id),reviewed);
      wordCard.innerHTML = `<strong>${esc(word)}</strong><span>${esc(pos)}</span><p>${esc(zh)}</p>`; wordCard.hidden=false;
      const rect=lookup.getBoundingClientRect(); wordCard.style.left=`${Math.min(innerWidth-260,Math.max(12,rect.left))}px`; wordCard.style.top=`${Math.min(innerHeight-150,rect.bottom+8)}px`;
      document.querySelector("#reviewList").innerHTML=reviewHtml(reviewed); return;
    }
    const remove = event.target.closest("[data-remove-word]");
    if (currentTest && remove) { const reviewed=load(wordsKey(currentTest.id)); delete reviewed[remove.dataset.removeWord]; save(wordsKey(currentTest.id),reviewed); document.querySelector("#reviewList").innerHTML=reviewHtml(reviewed); return; }
    if (!event.target.closest("#wordCard")) wordCard.hidden=true;
  });
  document.addEventListener("change", event => {
    const listening=currentListening();
    if (listening && event.target.matches(".listening-gap")) {
      const answers=load(stateKey(listening.id)); answers[event.target.dataset.q]=event.target.value.trim(); save(stateKey(listening.id),answers); listeningView(listening); document.querySelector(`#q-${event.target.dataset.q}`)?.scrollIntoView({block:"center"}); return;
    }
    const exam=currentExam(); if(!exam || !event.target.matches(".gap-input")) return;
    const answers=load(stateKey(exam.id)); answers[event.target.dataset.q]=event.target.value.trim(); save(stateKey(exam.id),answers); examView(exam); document.querySelector(`#q-${event.target.dataset.q}`)?.scrollIntoView({block:"center"});
  });
  document.addEventListener("keydown", event => {
    const listening=currentListening();
    if (!listening || event.key !== "Enter" || !event.target.matches(".listening-gap")) return;
    event.preventDefault();
    const questionNumber=event.target.dataset.q;
    const answers=load(stateKey(listening.id)); answers[questionNumber]=event.target.value.trim(); save(stateKey(listening.id),answers); listeningView(listening); document.querySelector(`#q-${questionNumber}`)?.scrollIntoView({block:"center"});
  });
  resetButton.addEventListener("click",()=>{const test=currentExam() || currentListening(); if(test && confirm(`Reset all answers for ${test.shortTitle}?`)){localStorage.removeItem(stateKey(test.id)); render();}});
  document.querySelector("#fontToggle").addEventListener("click",()=>document.body.classList.toggle("large-text"));
  if (!location.hash) location.hash="#board"; else render();
})();
