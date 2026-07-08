const API_URL = "http://localhost:3000/api/v1";

// State
let isSignUp = false;
let currentType = "task";
let currentFilter = "all";
let tasks = [];
let token = localStorage.getItem("authToken");
let user = JSON.parse(localStorage.getItem("user") || "null");

// DOM Elements
const authScreen = document.getElementById("authScreen");
const appScreen = document.getElementById("appScreen");
const authForm = document.getElementById("authForm");
const authSubmit = document.getElementById("authSubmit");
const toggleAuth = document.getElementById("toggleAuth");
const authTitle = document.getElementById("authTitle");
const toggleText = document.getElementById("toggleText");
const nameGroup = document.getElementById("nameGroup");
const confirmGroup = document.getElementById("confirmGroup");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const nameInput = document.getElementById("name");
const confirmInput = document.getElementById("confirm");
const darkToggle = document.getElementById("darkToggle");
const logoutBtn = document.getElementById("logoutBtn");
const quickAddBtns = document.querySelectorAll(".quick-add-btn");
const filterBtns = document.querySelectorAll(".filter-btn");
const quickInput = document.getElementById("quickInput");
const addQuickBtn = document.getElementById("addQuickBtn");
const tasksList = document.getElementById("tasksList");

// Init
document.addEventListener("DOMContentLoaded", () => {
  if (token && user) {
    showApp();
    loadTasks();
    updatePlaceholder();
  } else {
    showAuth();
  }

  // Dark mode
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark-mode");
    darkToggle.textContent = "☀️";
  }
});

// === AUTH ===
function showAuth() {
  authScreen.classList.remove("hidden");
  appScreen.classList.add("hidden");
}

function showApp() {
  authScreen.classList.add("hidden");
  appScreen.classList.remove("hidden");
}

toggleAuth.addEventListener("click", () => {
  isSignUp = !isSignUp;
  if (isSignUp) {
    authTitle.textContent = "Create new account";
    toggleText.textContent = "Already have an account?";
    toggleAuth.textContent = "Sign In";
    nameGroup.style.display = "block";
    confirmGroup.style.display = "block";
    authSubmit.textContent = "Sign Up";
  } else {
    authTitle.textContent = "Sign in to your account";
    toggleText.textContent = "Don't have an account?";
    toggleAuth.textContent = "Sign Up";
    nameGroup.style.display = "none";
    confirmGroup.style.display = "none";
    authSubmit.textContent = "Sign In";
  }
  authForm.reset();
});

authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (isSignUp) {
    const name = nameInput.value.trim();
    const confirm = confirmInput.value.trim();
    if (!name || password !== confirm) {
      showError("authError", "Fill all fields and passwords must match");
      return;
    }
    await signup(name, email, password, confirm);
  } else {
    await signin(email, password);
  }
});

async function signup(name, email, password, passwordConfirm) {
  try {
    const res = await fetch(`${API_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, passwordConfirm })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    token = data.token;
    user = data.data.user;
    localStorage.setItem("authToken", token);
    localStorage.setItem("user", JSON.stringify(user));
    showSuccess("authSuccess", "Account created! Redirecting...");
    setTimeout(() => {
      showApp();
      loadTasks();
      updatePlaceholder();
    }, 1000);
  } catch (e) {
    showError("authError", e.message);
  }
}

async function signin(email, password) {
  try {
    const res = await fetch(`${API_URL}/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    token = data.token;
    user = data.data.user;
    localStorage.setItem("authToken", token);
    localStorage.setItem("user", JSON.stringify(user));
    showSuccess("authSuccess", "Signed in! Redirecting...");
    setTimeout(() => {
      showApp();
      loadTasks();
      updatePlaceholder();
    }, 1000);
  } catch (e) {
    showError("authError", e.message);
  }
}

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");
  token = null;
  user = null;
  tasks = [];
  showAuth();
  authForm.reset();
});

// === TASKS ===
async function loadTasks() {
  try {
    const res = await fetch(`${API_URL}/todo`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    tasks = data.data.todo || [];
    renderTasks();
  } catch (e) {
    console.error(e);
  }
}

quickAddBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    quickAddBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentType = btn.dataset.type;
    updatePlaceholder();
  });
});

function updatePlaceholder() {
  quickInput.placeholder =
    currentType === "task" ? "Add a task..." : "Add a note...";
}

addQuickBtn.addEventListener("click", addTask);
quickInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") addTask();
});

async function addTask() {
  const title = quickInput.value.trim();
  if (!title) return;

  try {
    const res = await fetch(`${API_URL}/todo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title,
        type: currentType,
        category: "personal",
        priority: "medium"
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    tasks.push(data.data.todo);
    quickInput.value = "";
    renderTasks();
  } catch (e) {
    showError("authError", e.message);
  }
}

filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

function renderTasks() {
  let filtered = tasks;

  if (currentFilter === "task")
    filtered = filtered.filter((t) => t.type === "task");
  else if (currentFilter === "note")
    filtered = filtered.filter((t) => t.type === "note");
  else if (currentFilter === "pending")
    filtered = filtered.filter((t) => !t.completed);
  else if (currentFilter === "completed")
    filtered = filtered.filter((t) => t.completed);

  if (filtered.length === 0) {
    tasksList.innerHTML =
      '<div class="empty-state"><div class="empty-icon">📋</div><h3>No items</h3><p>Create one to get started</p></div>';
    return;
  }

  tasksList.innerHTML = filtered
    .map(
      (t) => `
        <div class="task-item ${t.completed ? "completed" : ""}">
            <input type="checkbox" class="task-checkbox" ${t.completed ? "checked" : ""} onchange="toggleTask('${t._id}', this.checked)">
            <div class="task-content">
                <div class="task-title">${escapeHtml(t.title)}</div>
                <div class="task-meta">
                    <span class="task-badge ${t.type}">${t.type}</span>
                    <span class="task-badge">${t.priority}</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="task-action" onclick="editTask('${t._id}')">✏️</button>
                <button class="task-action" onclick="deleteTask('${t._id}')">🗑️</button>
            </div>
        </div>
    `
    )
    .join("");
}

async function toggleTask(id, completed) {
  try {
    await fetch(`${API_URL}/todo/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ completed })
    });
    tasks = tasks.map((t) => (t._id === id ? { ...t, completed } : t));
    renderTasks();
  } catch (e) {
    console.error(e);
  }
}

function editTask(id) {
  const task = tasks.find((t) => t._id === id);
  if (!task) return;
  quickInput.value = task.title;
  deleteTask(id);
}

async function deleteTask(id) {
  try {
    await fetch(`${API_URL}/todo/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    tasks = tasks.filter((t) => t._id !== id);
    renderTasks();
  } catch (e) {
    console.error(e);
  }
}

darkToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  const isDark = document.body.classList.contains("dark-mode");
  darkToggle.textContent = isDark ? "☀️" : "🌙";
  localStorage.setItem("darkMode", isDark);
});

function showError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 4000);
}

function showSuccess(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 4000);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
