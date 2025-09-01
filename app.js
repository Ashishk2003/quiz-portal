/* app.js - updated: review answers, share results, better theme, fixes */
/* LocalStorage keys used:
   teacherCredentials, teacherLoggedIn,
   students (array), studentLoggedIn,
   quizzes (array), results (array),
   lastAttempt (object), uiTheme
*/

const LS = {
  get(k, fallback = null) {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
  },
  set(k, v) { localStorage.setItem(k, JSON.stringify(v)); },
  del(k) { localStorage.removeItem(k); }
};

/* theme */
function applyTheme() {
  const t = localStorage.getItem('uiTheme') || 'light';
  document.body.classList.toggle('theme-dark', t === 'dark');
}
function toggleTheme() {
  const dark = document.body.classList.toggle('theme-dark');
  localStorage.setItem('uiTheme', dark ? 'dark' : 'light');
}
document.addEventListener('click', e => { if (e.target && e.target.id === 'themeToggle') toggleTheme(); });
applyTheme();

/* ensure teacher credentials exist */
(function ensureTeacherCreds() {
  if (!LS.get('teacherCredentials')) LS.set('teacherCredentials', { email: 'teacher@test.com', password: '1234' });
})();

/* session helpers */
function isTeacherLoggedIn() { return localStorage.getItem('teacherLoggedIn') === 'true'; }
function getLoggedStudent() { return LS.get('studentLoggedIn', null); }
function requireTeacher() { if (!isTeacherLoggedIn()) location.replace('teacher.html'); }
function requireStudent() { if (!getLoggedStudent()) location.replace('student.html'); }

/* page init */
document.addEventListener('DOMContentLoaded', () => {
  applyTheme();

  // global header buttons
  document.querySelectorAll('#themeToggle').forEach(b => b.addEventListener('click', toggleTheme));
  const logoutTeacherBtn = document.getElementById('logoutTeacherBtn');
  if (logoutTeacherBtn) logoutTeacherBtn.addEventListener('click', () => { LS.del('teacherLoggedIn'); location.replace('index.html'); });

  const logoutStudentBtn = document.getElementById('logoutStudentBtn');
  if (logoutStudentBtn) logoutStudentBtn.addEventListener('click', () => { LS.del('studentLoggedIn'); location.replace('index.html'); });

  const goBackBtn = document.getElementById('goBackToDashboard');
  if (goBackBtn) goBackBtn.addEventListener('click', () => {
    if (getLoggedStudent()) location.replace('studentDashboard.html'); else location.replace('student.html');
  });

  const finishBtn = document.getElementById('finishBtn');
  if (finishBtn) finishBtn.addEventListener('click', () => { LS.del('lastAttempt'); location.replace('studentDashboard.html'); });

  // page-specific inits
  const page = document.body.dataset.page || '';
  switch (page) {
    case 'teacher-login': initTeacherLogin(); break;
    case 'student-login': initStudentLogin(); break;
    case 'teacher-dashboard': initTeacherDashboard(); break;
    case 'create-quiz': initCreateQuiz(); break;
    case 'create-student': initCreateStudent(); break;
    case 'view-results': initViewResults(); break;
    case 'teacher-profile': initTeacherProfile(); break;
    case 'student-dashboard': initStudentDashboard(); break;
    case 'student-profile': initStudentProfile(); break;
    case 'quiz': initQuizPage(); break;
    case 'review': initReviewPage(); break;
    default: break;
  }
});

/* Teacher login page */
function initTeacherLogin() {
  if (isTeacherLoggedIn()) { location.replace('teacherDashboard.html'); return; }
  const form = document.getElementById('teacherLoginForm');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('teacherEmail').value.trim();
    const pass = document.getElementById('teacherPassword').value;
    const creds = LS.get('teacherCredentials', { email: '', password: '' });
    if (email === creds.email && pass === creds.password) {
      localStorage.setItem('teacherLoggedIn', 'true');
      location.replace('teacherDashboard.html');
    } else document.getElementById('teacherLoginError').textContent = 'Invalid teacher credentials.';
  });
}

/* Student login page */
function initStudentLogin() {
  if (getLoggedStudent()) { location.replace('studentDashboard.html'); return; }
  const form = document.getElementById('studentLoginForm');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const id = document.getElementById('studentId').value.trim();
    const pass = document.getElementById('studentPassword').value;
    const students = LS.get('students', []);
    const s = (students || []).find(x => String(x.studentId).toLowerCase() === id.toLowerCase());
    if (!s) { document.getElementById('studentLoginError').textContent = 'Student not found.'; return; }
    if (s.password !== pass) { document.getElementById('studentLoginError').textContent = 'Incorrect password.'; return; }
    LS.set('studentLoggedIn', { studentId: s.studentId, email: s.email, name: s.name || '' });
    location.replace('studentDashboard.html');
  });
}

/* teacher dashboard */
function initTeacherDashboard() { requireTeacher(); }

/* create quiz */
function initCreateQuiz() {
  requireTeacher();
  const qContainer = document.getElementById('questionsContainer');
  const addBtn = document.getElementById('addQuestionBtn');
  const form = document.getElementById('quizForm');
  const msg = document.getElementById('quizMsg');

  if (qContainer.children.length === 0) addQuestionCard(qContainer);
  addBtn.addEventListener('click', () => addQuestionCard(qContainer));

  form.addEventListener('submit', e => {
    e.preventDefault();
    const title = document.getElementById('quizTitle').value.trim();
    if (!title) { msg.textContent = 'Enter a title'; return; }

    const cards = qContainer.querySelectorAll('.question-card');
    const questions = [];
    for (const card of cards) {
      const qText = (card.querySelector('.qText').value || '').trim();
      const t = Number(card.querySelector('.qTime').value) || 20;
      const o1 = (card.querySelector('.opt1').value || '').trim();
      const o2 = (card.querySelector('.opt2').value || '').trim();
      const o3 = (card.querySelector('.opt3').value || '').trim();
      const o4 = (card.querySelector('.opt4').value || '').trim();
      const ans = Number(card.querySelector('.qAnswer').value);
      if (!qText || !o1 || !o2 || !o3 || !o4 || isNaN(ans) || ans < 0 || ans > 3) { msg.textContent = 'Complete all fields'; return; }
      questions.push({ question: qText, options: [o1, o2, o3, o4], answer: ans, time: Math.max(5, Math.floor(t)) });
    }
    const quizzes = LS.get('quizzes', []);
    const id = 'Q' + String(quizzes.length + 1).padStart(3, '0');
    quizzes.push({ quizId: id, title, questions, createdAt: Date.now() });
    LS.set('quizzes', quizzes);
    msg.textContent = 'Quiz saved';
    setTimeout(() => location.replace('teacherDashboard.html'), 700);
  });
}
function addQuestionCard(container) {
  const idx = container.children.length + 1;
  const el = document.createElement('div');
  el.className = 'question-card card';
  el.innerHTML = `
    <h4>Question ${idx}</h4>
    <label>Question <input class="qText" type="text" placeholder="Question text" /></label>
    <label>Time (seconds) <input class="qTime" type="number" min="5" value="30" /></label>
    <div class="row">
      <label style="flex:1">Option 1<input class="opt1" type="text"/></label>
      <label style="flex:1">Option 2<input class="opt2" type="text"/></label>
    </div>
    <div class="row">
      <label style="flex:1">Option 3<input class="opt3" type="text"/></label>
      <label style="flex:1">Option 4<input class="opt4" type="text"/></label>
    </div>
    <label>Correct Option Index (0-3) <input class="qAnswer" type="number" min="0" max="3" value="0"/></label>
    <div class="row" style="margin-top:8px;">
      <button type="button" class="btn" onclick="this.closest('.question-card').remove();">Remove</button>
    </div>
  `;
  container.appendChild(el);
}

/* create students (persistent) */
function initCreateStudent() {
  requireTeacher();
  const addBtn = document.getElementById('addStudentBtn');
  const clearBtn = document.getElementById('clearStudentsBtn');
  const savedList = document.getElementById('savedStudentsList');
  const msg = document.getElementById('studentCreateMsg');

  function render() {
    const students = LS.get('students', []);
    savedList.innerHTML = '';
    if (!students || students.length === 0) { savedList.innerHTML = '<p class="info">No students saved.</p>'; return; }
    students.forEach(s => {
      const div = document.createElement('div');
      div.className = 'card';
      div.innerHTML = `<strong>${s.studentId}</strong> — ${s.email || '-'} <div class="row" style="margin-top:8px"><button class="btn outline" onclick="removeStudent('${s.studentId}')">Delete</button></div>`;
      savedList.appendChild(div);
    });
  }

  window.removeStudent = function(studentId) {
    let students = LS.get('students', []);
    students = students.filter(s => s.studentId.toLowerCase() !== String(studentId).toLowerCase());
    LS.set('students', students);
    render();
  };

  addBtn.addEventListener('click', () => {
    msg.textContent = '';
    const sid = document.getElementById('studentIdInput').value.trim();
    const sem = document.getElementById('studentEmailInput').value.trim();
    const sp = document.getElementById('studentPassInput').value;
    if (!sid || !sem || !sp) { msg.textContent = 'Complete all fields.'; return; }
    if (!/^[A-Za-z0-9_-]+$/.test(sid)) { msg.textContent = 'Invalid College ID chars.'; return; }
    const students = LS.get('students', []);
    if (students.some(x => x.studentId.toLowerCase() === sid.toLowerCase())) { msg.textContent = 'Student exists.'; return; }
    students.push({ studentId: sid, email: sem, password: sp, createdAt: Date.now() });
    LS.set('students', students);
    document.getElementById('studentIdInput').value = '';
    document.getElementById('studentEmailInput').value = '';
    document.getElementById('studentPassInput').value = '';
    msg.textContent = 'Student saved.';
    render();
  });

  clearBtn.addEventListener('click', () => {
    if (!confirm('Clear ALL students?')) return;
    LS.set('students', []);
    render();
    msg.textContent = 'Cleared all students.';
  });

  render();
}

/* view results + sharing */
function initViewResults() {
  requireTeacher();
  const wrap = document.getElementById('resultsContainer');
  wrap.innerHTML = '';
  const results = LS.get('results', []);
  const quizzes = LS.get('quizzes', []);

  if (!results || results.length === 0) { wrap.innerHTML = '<div class="card"><p class="info">No results yet.</p></div>'; return; }

  // group by quizId
  const grouped = results.reduce((acc, r) => { (acc[r.quizId] = acc[r.quizId] || []).push(r); return acc; }, {});
  for (const qid of Object.keys(grouped)) {
    const quiz = (quizzes || []).find(x => x.quizId === qid) || {};
    const container = document.createElement('div');
    container.className = 'card';
    container.innerHTML = `<h3>${quiz.title || qid}</h3>`;
    grouped[qid].forEach(r => {
      const row = document.createElement('div');
      row.className = 'card';
      row.style.marginBottom = '8px';
      const sharedLabel = r.shared ? `<span style="color:var(--ok);font-weight:600">Shared</span>` : `<button class="btn small" onclick="markShared('${r.quizId}','${r.studentId}', ${r.submittedAt})">Mark Shared</button>`;
      const studentEmail = (LS.get('students', []).find(s => s.studentId === r.studentId) || {}).email || '';
      const mailBtn = `<button class="btn small" onclick="shareByEmail('${r.studentId}','${studentEmail}','${encodeURIComponent(r.quizTitle)}', ${r.score}, ${r.total})">Share Email</button>`;

      row.innerHTML = `<p><strong>${r.studentId}</strong> — ${r.score}/${r.total} <small>(${new Date(r.submittedAt).toLocaleString()})</small></p>
                       <div class="row">${sharedLabel} ${mailBtn}</div>`;
      container.appendChild(row);
    });
    wrap.appendChild(container);
  }
}

// mark result as shared (persist flag)
window.markShared = function(quizId, studentId, submittedAt) {
  const results = LS.get('results', []);
  for (let r of results) {
    if (r.quizId === quizId && r.studentId === studentId && r.submittedAt === submittedAt) {
      r.shared = true;
    }
  }
  LS.set('results', results);
  alert('Marked as shared.');
  initViewResults();
};

// share via email (mailto)
window.shareByEmail = function(studentId, email, quizTitleEncoded, score, total) {
  const title = decodeURIComponent(quizTitleEncoded || '');
  if (!email) {
    alert('Student email not found. Add email in student record to use email sharing.');
    return;
  }
  const subject = `Quiz Result: ${title}`;
  const body = `Hello ${studentId},%0D%0A%0D%0AYour result for "${title}" is ${score}/${total}.%0D%0A%0D%0ABest,%0D%0ATeacher`;
  // open mail client
  location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

/* update teacher profile */
function initTeacherProfile() {
  requireTeacher();
  const creds = LS.get('teacherCredentials', { email: '', password: '' });
  document.getElementById('teacherNewEmail').value = creds.email;
  const form = document.getElementById('teacherProfileForm');
  const msg = document.getElementById('teacherProfileMsg');

  form.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('teacherNewEmail').value.trim();
    const pass = document.getElementById('teacherNewPassword').value;
    if (!email || !pass) { msg.textContent = 'Provide email and password.'; return; }
    LS.set('teacherCredentials', { email, password: pass });
    msg.textContent = 'Profile updated — logging out.';
    setTimeout(() => { LS.del('teacherLoggedIn'); location.replace('teacher.html'); }, 700);
  });
}

/* student dashboard */
function initStudentDashboard() { requireStudent(); }

/* student profile (change password) */
function initStudentProfile() {
  requireStudent();
  const session = getLoggedStudent();
  const form = document.getElementById('studentProfileForm');
  const msg = document.getElementById('studentProfileMsg');

  form.addEventListener('submit', e => {
    e.preventDefault();
    const cur = document.getElementById('currentPass').value;
    const np = document.getElementById('studentNewPass').value;
    const cp = document.getElementById('studentConfirmPass').value;
    const students = LS.get('students', []);
    const me = students.find(s => s.studentId === session.studentId);
    if (!me) { msg.textContent = 'Record missing'; return; }
    if (me.password !== cur) { msg.textContent = 'Current password incorrect'; return; }
    if (np.length < 4) { msg.textContent = 'Password >= 4 chars'; return; }
    if (np !== cp) { msg.textContent = 'Passwords do not match'; return; }
    me.password = np;
    LS.set('students', students.map(s => s.studentId === me.studentId ? me : s));
    LS.set('studentLoggedIn', { studentId: me.studentId, email: me.email, name: me.name || '' });
    msg.textContent = 'Password updated.';
  });
}

/* quiz page + submit => review */
let quizQuestions = [], currentQ = 0, studentAns = [], quizTitle = '';
function initQuizPage() {
  requireStudent();
  const quizzes = LS.get('quizzes', []);
  if (!quizzes || quizzes.length === 0) { alert('No quizzes.'); location.replace('studentDashboard.html'); return; }
  quizzes.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const quiz = JSON.parse(JSON.stringify(quizzes[0]));
  quizTitle = quiz.title;
  document.getElementById('quizTitle').textContent = quizTitle;

  quizQuestions = quiz.questions.slice();
  shuffleArray(quizQuestions);
  quizQuestions.forEach(q => shuffleQuestionOptions(q));

  currentQ = 0; studentAns = [];
  document.getElementById('nextBtn').addEventListener('click', onNextClicked);
  loadQuestion();
}
let questionTimer = null;
function loadQuestion() {
  clearInterval(questionTimer);
  const total = quizQuestions.length;
  const q = quizQuestions[currentQ];
  const container = document.getElementById('quizContainer');
  container.innerHTML = '';

  const qcard = document.createElement('div'); qcard.className = 'card';
  qcard.innerHTML = `<h3>Q${currentQ+1}/${total}</h3><p>${q.question}</p>`;
  container.appendChild(qcard);

  const optsWrap = document.createElement('div'); optsWrap.className = 'form';
  q.options.forEach((opt, i) => {
    const b = document.createElement('button'); b.type='button'; b.className='choice-btn'; b.textContent = opt;
    b.addEventListener('click', () => {
      Array.from(optsWrap.children).forEach(x => x.classList.remove('selected'));
      b.classList.add('selected');
      studentAns[currentQ] = i;
    });
    optsWrap.appendChild(b);
  });
  container.appendChild(optsWrap);

  document.getElementById('progressBar').style.width = Math.round((currentQ)/total*100) + '%';

  let timeLeft = Math.max(5, Number(q.time) || 20);
  const headerTimer = document.getElementById('headerTimer');
  headerTimer.textContent = `Time: ${timeLeft}s`;
  questionTimer = setInterval(() => {
    timeLeft--; headerTimer.textContent = `Time: ${timeLeft}s`;
    if (timeLeft <= 0) { clearInterval(questionTimer); nextQuestion(); }
  }, 1000);
}
function onNextClicked() { nextQuestion(); }
function nextQuestion() {
  clearInterval(questionTimer);
  currentQ++;
  if (currentQ >= quizQuestions.length) submitQuiz();
  else loadQuestion();
}
function submitQuiz() {
  clearInterval(questionTimer);
  const total = quizQuestions.length; let score = 0;
  for (let i=0;i<total;i++) {
    const ans = studentAns[i];
    if (ans !== undefined && ans === quizQuestions[i].answer) score++;
  }
  const me = getLoggedStudent();
  const results = LS.get('results', []);
  const quizId = (LS.get('quizzes', [])[0] || {}).quizId || 'Q000';
  const submittedAt = Date.now();
  results.push({ quizId, quizTitle, studentId: me.studentId, answers: studentAns, score, total, submittedAt, shared: false });
  LS.set('results', results);

  // Save lastAttempt (questions + correct answers + student's answers) for review page
  const attempt = {
    quizId, quizTitle,
    questions: quizQuestions.map(q => ({ question: q.question, options: q.options.slice(), answer: q.answer })),
    studentAnswers: studentAns.slice(),
    score, total, submittedAt
  };
  LS.set('lastAttempt', attempt);

  // go to review page
  location.replace('review.html');
}

/* review page init */
function initReviewPage() {
  requireStudent();
  const attempt = LS.get('lastAttempt', null);
  const wrap = document.getElementById('reviewContainer');
  if (!attempt) { wrap.innerHTML = '<div class="card"><p class="info">No review available.</p></div>'; return; }

  wrap.innerHTML = `<div class="card"><h3>${attempt.quizTitle}</h3><p>Score: ${attempt.score} / ${attempt.total}</p></div>`;
  attempt.questions.forEach((q, i) => {
    const card = document.createElement('div'); card.className = 'card';
    const selected = attempt.studentAnswers[i];
    let optsHtml = '';
    q.options.forEach((opt, j) => {
      const cls = (j === q.answer) ? 'choice-correct' : (j === selected ? 'choice-selected' : '');
      optsHtml += `<div class="choice-line ${cls}">${j+1}. ${opt} ${j===q.answer?'<strong>(Correct)</strong>':''} ${j===selected && j!==q.answer?'<em>(Your answer)</em>':''}</div>`;
    });
    card.innerHTML = `<h4>Q${i+1}. ${q.question}</h4>${optsHtml}`;
    wrap.appendChild(card);
  });
}

/* utilities */
function shuffleArray(arr) {
  for (let i=arr.length-1;i>0;i--) {
    const j = Math.floor(Math.random()*(i+1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function shuffleQuestionOptions(q) {
  const idx = q.options.map((_,i) => i);
  shuffleArray(idx);
  const newOpts = idx.map(i => q.options[i]);
  const newAnswer = idx.indexOf(q.answer);
  q.options = newOpts; q.answer = newAnswer;
}
