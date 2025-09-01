// --- STORAGE HELPERS ---
function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}
function loadData(key) {
  return JSON.parse(localStorage.getItem(key)) || [];
}

// --- TEACHER LOGIN ---
function teacherLogin() {
  const email = document.getElementById("teacherEmail").value;
  const pass = document.getElementById("teacherPassword").value;
  const teacher = JSON.parse(localStorage.getItem("teacher")) || {email:"teacher@quiz.com", password:"1234"};
  if (email === teacher.email && pass === teacher.password) {
    localStorage.setItem("loggedIn", "teacher");
    document.getElementById("teacherLoginBox").classList.add("hidden");
    document.getElementById("teacherDashboard").classList.remove("hidden");
  } else {
    alert("Invalid teacher credentials");
  }
}

// --- TEACHER DASHBOARD ---
function showCreateQuiz() {
  hideSections();
  document.getElementById("quizSection").classList.remove("hidden");
}
function addQuestion() {
  const container = document.getElementById("quizQuestions");
  const div = document.createElement("div");
  div.innerHTML = `
    <input type="text" placeholder="Question" class="q">
    <input type="text" placeholder="Correct Answer" class="a">
  `;
  container.appendChild(div);
}
function saveQuiz() {
  const questions = [];
  document.querySelectorAll("#quizQuestions div").forEach(div => {
    const q = div.querySelector(".q").value;
    const a = div.querySelector(".a").value;
    if (q && a) questions.push({q, a});
  });
  saveData("quiz", questions);
  alert("Quiz saved!");
}
function showCreateStudent() {
  hideSections();
  document.getElementById("studentSection").classList.remove("hidden");
}
function createStudent() {
  const id = document.getElementById("studentId").value;
  const email = document.getElementById("studentEmail").value;
  const pass = document.getElementById("studentPass").value;
  let students = loadData("students");
  students.push({id, email, password: pass, result: null, answers: []});
  saveData("students", students);
  alert("Student added!");
}
function showResults() {
  hideSections();
  document.getElementById("resultSection").classList.remove("hidden");
  const results = document.getElementById("resultsTable");
  results.innerHTML = "";
  const students = loadData("students");
  students.forEach((s, i) => {
    results.innerHTML += `
      <tr>
        <td>${s.id}</td>
        <td>${s.result !== null ? s.result : "N/A"}</td>
        <td><button onclick="shareResult(${i})">Share</button></td>
      </tr>`;
  });
}
function shareResult(index) {
  let students = loadData("students");
  students[index].shared = true;
  saveData("students", students);
  alert("Result shared with student");
}
function showTeacherProfile() {
  hideSections();
  document.getElementById("teacherProfileSection").classList.remove("hidden");
}
function updateTeacherProfile() {
  const newPass = document.getElementById("teacherNewPass").value;
  let teacher = JSON.parse(localStorage.getItem("teacher")) || {email:"teacher@quiz.com", password:"1234"};
  teacher.password = newPass;
  localStorage.setItem("teacher", JSON.stringify(teacher));
  alert("Password updated!");
}
function backToDashboard() { hideSections(); }
function hideSections() {
  document.querySelectorAll("#teacherDashboard section").forEach(s=>s.classList.add("hidden"));
}

// --- STUDENT LOGIN ---
function studentLogin() {
  const id = document.getElementById("studentLoginId").value;
  const pass = document.getElementById("studentLoginPass").value;
  const students = loadData("students");
  const student = students.find(s=>s.id===id && s.password===pass);
  if (student) {
    localStorage.setItem("loggedIn", "student");
    localStorage.setItem("currentStudent", id);
    document.getElementById("studentLoginBox").classList.add("hidden");
    document.getElementById("studentDashboard").classList.remove("hidden");
  } else {
    alert("Invalid student credentials");
  }
}

// --- STUDENT DASHBOARD ---
function startQuiz() {
  hideStudentSections();
  document.getElementById("quizTakeSection").classList.remove("hidden");
  const quiz = loadData("quiz");
  const form = document.getElementById("quizForm");
  form.innerHTML = "";
  quiz.forEach((q,i)=>{
    form.innerHTML += `<p>${q.q}</p><input type="text" id="ans${i}"><br>`;
  });
}
function submitQuiz() {
  const quiz = loadData("quiz");
  let score=0; let answers=[];
  quiz.forEach((q,i)=>{
    const ans=document.getElementById("ans"+i).value;
    answers.push({q:q.q, correct:q.a, given:ans});
    if(ans===q.a) score++;
  });
  let students=loadData("students");
  let id=localStorage.getItem("currentStudent");
  let s=students.find(st=>st.id===id);
  s.result=score;
  s.answers=answers;
  saveData("students",students);
  alert("Quiz submitted!");
  backToStudentDashboard();
}
function showStudentProfile() {
  hideStudentSections();
  document.getElementById("studentProfileSection").classList.remove("hidden");
}
function updateStudentProfile() {
  const newPass=document.getElementById("studentNewPass").value;
  let students=loadData("students");
  let id=localStorage.getItem("currentStudent");
  let s=students.find(st=>st.id===id);
  s.password=newPass;
  saveData("students",students);
  alert("Password updated!");
}
function reviewAnswers() {
  hideStudentSections();
  document.getElementById("reviewSection").classList.remove("hidden");
  let id=localStorage.getItem("currentStudent");
  let students=loadData("students");
  let s=students.find(st=>st.id===id);
  let div=document.getElementById("reviewContent");
  div.innerHTML="";
  s.answers.forEach(a=>{
    div.innerHTML+=`<p>Q: ${a.q}<br>Your Answer: ${a.given}<br>Correct Answer: ${a.correct}</p><hr>`;
  });
}
function viewSharedResult() {
  hideStudentSections();
  document.getElementById("studentResultSection").classList.remove("hidden");
  let id=localStorage.getItem("currentStudent");
  let students=loadData("students");
  let s=students.find(st=>st.id===id);
  let div=document.getElementById("studentResultContent");
  div.innerHTML = s.shared ? `<p>Your Score: ${s.result}</p>` : `<p>No shared result yet</p>`;
}
function backToStudentDashboard() { hideStudentSections(); }
function hideStudentSections() {
  document.querySelectorAll("#studentDashboard section").forEach(s=>s.classList.add("hidden"));
}

// --- LOGOUT ---
function logout(role) {
  localStorage.removeItem("loggedIn");
  if(role==="teacher") location.href="teacher.html";
  else location.href="student.html";
}
