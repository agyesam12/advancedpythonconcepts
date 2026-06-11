// =========================================================
// MOBILE NAV TOGGLE
// =========================================================
const sidenav = document.getElementById('sidenav');
const navToggle = document.getElementById('navToggle');

navToggle.addEventListener('click', () => {
  sidenav.classList.toggle('open');
  navToggle.classList.toggle('open');
});

document.querySelectorAll('.sidenav__link').forEach(link => {
  link.addEventListener('click', () => {
    sidenav.classList.remove('open');
    navToggle.classList.remove('open');
  });
});

// =========================================================
// SCROLLSPY + PROGRESS BAR
// =========================================================
const sections = document.querySelectorAll('.qa[id]');
const navLinks = document.querySelectorAll('.sidenav__link');
const progressFill = document.getElementById('progressFill');

function updateScrollState() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progressFill.style.width = pct + '%';

  let currentId = sections[0] ? sections[0].id : null;
  sections.forEach(section => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= 140) {
      currentId = section.id;
    }
  });

  navLinks.forEach(link => {
    const href = link.getAttribute('href').slice(1);
    link.classList.toggle('active', href === currentId);
  });
}

window.addEventListener('scroll', updateScrollState, { passive: true });
updateScrollState();

// =========================================================
// MUTABLE DEFAULT ARGUMENT WIDGET (Q3)
// =========================================================
(function () {
  const memoryContents = document.getElementById('memoryContents');
  const memoryBox = document.getElementById('memoryBox');
  const memoryCaption = document.getElementById('memoryCaption');
  const widgetLog = document.getElementById('widgetLog');
  const resetBtn = document.getElementById('resetBtn');
  const callButtons = document.querySelectorAll('[data-call]');

  let state = []; // shared "list object"
  let logStarted = false;

  function render() {
    memoryContents.innerHTML = '';
    if (state.length === 0) {
      const span = document.createElement('span');
      span.className = 'memory__empty';
      span.textContent = '[ ]';
      memoryContents.appendChild(span);
    } else {
      state.forEach(item => {
        const span = document.createElement('span');
        span.className = 'memory__item';
        span.textContent = `'${item}'`;
        memoryContents.appendChild(span);
      });
    }
  }

  function flash() {
    memoryBox.classList.add('flash');
    setTimeout(() => memoryBox.classList.remove('flash'), 400);
  }

  function log(html) {
    if (!logStarted) {
      widgetLog.innerHTML = '';
      logStarted = true;
    }
    const line = document.createElement('div');
    line.className = 'log-line';
    line.innerHTML = html;
    widgetLog.appendChild(line);
    widgetLog.scrollTop = widgetLog.scrollHeight;
  }

  callButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const callNum = btn.dataset.call;
      const item = { '1': 'a', '2': 'b', '3': 'c' }[callNum];
      const before = state.length;

      state.push(item);
      render();
      flash();

      const actor = document.getElementById('actorCall' + callNum);
      actor.classList.add('is-done');
      btn.disabled = true;

      const beforeStr = '[' + Array(before).fill('').map((_, i) => `'${state[i]}'`).join(', ') + ']';
      const afterStr = '[' + state.map(v => `'${v}'`).join(', ') + ']';

      log(
        `<strong>add_item('${item}')</strong> &nbsp; bucket was <code>${beforeStr}</code> ` +
        `→ appended <code>'${item}'</code> → returns <span class="arrow-out"><code>${afterStr}</code></span>`
      );

      if (callNum === '3') {
        memoryCaption.innerHTML =
          `Three calls, three "fresh" defaults expected — but it's <strong>one shared list</strong>, now holding all three items.`;
      } else {
        memoryCaption.innerHTML =
          `Same object, <strong>id unchanged</strong>. Call ${parseInt(callNum) + 1} will mutate this exact list again.`;
      }
    });
  });

  resetBtn.addEventListener('click', () => {
    state = [];
    render();
    flash();
    logStarted = false;
    widgetLog.innerHTML = `<div class="widget__log-empty">Run a call to see what happens to <code>bucket</code> and what gets returned.</div>`;
    memoryCaption.innerHTML = `Every call that omits <code>bucket</code> binds to <em>this exact object</em>.`;
    document.querySelectorAll('.actor').forEach(a => a.classList.remove('is-done'));
    callButtons.forEach(b => b.disabled = false);
  });

  render();
})();

// =========================================================
// GENERATOR LIFECYCLE WIDGET (Q4)
// =========================================================
(function () {
  const lines = document.querySelectorAll('.gline');
  const genState = document.getElementById('genState');
  const genN = document.getElementById('genN');
  const genYield = document.getElementById('genYield');
  const genOutput = document.getElementById('genOutput');
  const nextBtn = document.getElementById('genNext');

  // Steps model the execution of countdown(3)
  const steps = [
    { line: null, n: '—', state: 'created (not started)', yieldVal: '—', output: 'countdown(3) called → generator object created. No code has run yet.' },
    { line: 1, n: 3, state: 'running → suspended', yieldVal: '—', output: 'while 3 > 0: True' },
    { line: 2, n: 3, state: 'suspended at yield', yieldVal: 3, output: '→ next() returns 3. n is preserved as 3.' },
    { line: 3, n: 2, state: 'running → suspended', yieldVal: 3, output: 'resumed: n -= 1 → n = 2' },
    { line: 1, n: 2, state: 'running → suspended', yieldVal: 3, output: 'while 2 > 0: True' },
    { line: 2, n: 2, state: 'suspended at yield', yieldVal: 2, output: '→ next() returns 2.' },
    { line: 3, n: 1, state: 'running → suspended', yieldVal: 2, output: 'resumed: n -= 1 → n = 1' },
    { line: 1, n: 1, state: 'running → suspended', yieldVal: 2, output: 'while 1 > 0: True' },
    { line: 2, n: 1, state: 'suspended at yield', yieldVal: 1, output: '→ next() returns 1.' },
    { line: 3, n: 0, state: 'running → suspended', yieldVal: 1, output: 'resumed: n -= 1 → n = 0' },
    { line: 1, n: 0, state: 'running → suspended', yieldVal: 1, output: 'while 0 > 0: False — exit loop' },
    { line: 4, n: 0, state: 'running → exhausted', yieldVal: 1, output: 'print("done") → "done"' },
    { line: null, n: 0, state: 'StopIteration raised', yieldVal: 'StopIteration', output: 'Further next() calls raise StopIteration.' },
  ];

  let i = 0;

  function applyStep(step) {
    lines.forEach(l => l.classList.remove('active'));
    if (step.line !== null) {
      const target = document.querySelector(`.gline[data-line="${step.line}"]`);
      if (target) target.classList.add('active');
    }
    genState.textContent = step.state;
    genN.textContent = step.n;
    genYield.textContent = step.yieldVal;
    genOutput.textContent = step.output;

    genYield.style.color = (step.yieldVal === 'StopIteration') ? 'var(--red)' : 'var(--green)';
  }

  applyStep(steps[0]);

  nextBtn.addEventListener('click', () => {
    i = (i + 1) % steps.length;
    applyStep(steps[i]);
    if (i === steps.length - 1) {
      nextBtn.textContent = '↺ Restart countdown(3)';
    } else {
      nextBtn.textContent = 'Call next() ▶';
    }
  });
})();

// =========================================================
// PIPELINE STREAMING DEMO (Q5)
// =========================================================
(function () {
  const stages = document.querySelectorAll('.pipeline__stage');
  const runBtn = document.getElementById('pipelineRun');
  const hint = document.getElementById('pipelineHint');

  const messages = [
    'read_rows() yields one raw row from disk — nothing else is loaded.',
    'parse() converts that single row into a structured record.',
    'filter() checks this one record against the predicate.',
    'write() persists this single record immediately, then asks for the next.'
  ];

  let running = false;

  runBtn.addEventListener('click', async () => {
    if (running) return;
    running = true;
    runBtn.disabled = true;

    for (let idx = 0; idx < stages.length; idx++) {
      stages.forEach(s => s.classList.remove('active'));
      stages[idx].classList.add('active');
      hint.textContent = messages[idx];
      await new Promise(r => setTimeout(r, 550));
    }
    await new Promise(r => setTimeout(r, 350));
    stages.forEach(s => s.classList.remove('active'));
    hint.textContent = 'One record made it through the whole pipeline using constant memory. Run again for the next record.';

    runBtn.disabled = false;
    running = false;
  });
})();

// =========================================================
// SHIELD STACK ACCORDION (Q12)
// =========================================================
(function () {
  const shields = document.querySelectorAll('.shield');
  shields.forEach(shield => {
    const detail = shield.querySelector('.shield__detail');
    if (detail && !detail.querySelector('.shield__detail-inner')) {
      const inner = document.createElement('div');
      inner.className = 'shield__detail-inner';
      while (detail.firstChild) inner.appendChild(detail.firstChild);
      detail.appendChild(inner);
    }

    shield.addEventListener('click', () => {
      const isOpen = shield.classList.contains('open');
      shields.forEach(s => s.classList.remove('open'));
      if (!isOpen) shield.classList.add('open');
    });
  });

  if (shields[0]) shields[0].classList.add('open');
})();