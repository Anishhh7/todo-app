const API_BASE = "https://todo-app-2c12.onrender.com/api/v1/todo";

/* UI ELEMENTS */
const els = {
  form: document.getElementById("todo-form"),
  input: document.getElementById("todo-input"),
  list: document.getElementById("todo-list"),
  empty: document.getElementById("empty-state"),
  count: document.getElementById("count-label"),
  statusDot: document.getElementById("status-dot"),
  statusText: document.getElementById("status-text"),
  errorText: document.getElementById("error-text"),
  toast: document.getElementById("toast"),
  today: document.getElementById("today"),
  clearAllBtn: document.getElementById("clear-all-btn")
};

if (els.today) {
  els.today.textContent = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

let todos = [];
let editingId = null;

/* STATUS UPDATE UI */
function setStatus(online, errMsg) {
  if (els.statusDot) els.statusDot.classList.toggle("online", online);
  if (els.statusText) {
    els.statusText.textContent = online
      ? "Backend connected"
      : "Backend unreachable";
  }
  if (els.errorText) els.errorText.textContent = errMsg || "";
}

/* TOAST NOTIFICATIONS */
function showToast(msg) {
  if (!els.toast) return;
  els.toast.textContent = msg;
  els.toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => els.toast.classList.remove("show"), 2200);
}

/* FETCH ALL */
async function fetchTodos() {
  try {
    const res = await fetch(API_BASE);
    
    // Check if the server responded with an HTTP error (like 404 or 500)
    if (!res.ok) {
      throw new Error(`Server responded with status ${res.status}`);
    }

    const data = await res.json();
    
    // Unify backend response structures safely
    const parsedData = data?.data?.todo || data || [];
    todos = Array.isArray(parsedData) ? parsedData : [];
    
    setStatus(true);
    render();
  } catch (err) {
    todos = []; // Keep it a clean array so .forEach won't throw errors
    setStatus(false, err.message);
    render();
  }
}

/* ADD ONE */
async function addTodo(text) {
  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    if (!res.ok) throw new Error(`Failed to add task (${res.status})`);

    const data = await res.json();
    const newTodo = data?.data?.todo || data;
    
    if (newTodo && (newTodo.id || newTodo._id)) {
      todos.push(newTodo);
    } else {
      todos.push({ id: Date.now(), text: text, completed: false });
    }

    setStatus(true);
    render();
    showToast("Task added");
  } catch (err) {
    setStatus(false, err.message);
    showToast("Could not reach backend");
  }
}

/* TOGGLE STATUS */
async function toggleTodo(id, completed) {
  if (!Array.isArray(todos)) todos = [];
  const idx = todos.findIndex((t) => String(t.id || t._id) === String(id));
  if (idx !== -1) todos[idx].completed = completed;

  render();

  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed })
    });
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
  } catch (err) {
    setStatus(false, err.message);
  }
}

/* SAVE TRANSACTION ACTION */
async function editTodo(id, newText) {
  if (!Array.isArray(todos)) todos = [];
  const idx = todos.findIndex((t) => String(t.id || t._id) === String(id));
  if (idx !== -1) todos[idx].text = newText;

  editingId = null;
  render();

  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newText })
    });
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    showToast("Task updated");
  } catch (err) {
    setStatus(false, err.message);
  }
}

/* DELETE SINGLE */
async function deleteTodo(id) {
  if (!Array.isArray(todos)) todos = [];
  const prev = [...todos];
  todos = todos.filter((t) => String(t.id || t._id) !== String(id));
  render();

  try {
    const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    showToast("Task deleted");
  } catch (err) {
    todos = prev;
    render();
    setStatus(false, err.message);
  }
}

/* PURGE ALL */
async function deleteAll() {
  if (!Array.isArray(todos) || !todos.length) return;
  if (!confirm("Delete all tasks?")) return;

  const prev = [...todos];
  todos = [];
  render();

  try {
    const res = await fetch(API_BASE, { method: "DELETE" });
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    showToast("All tasks deleted");
  } catch (err) {
    todos = prev;
    render();
    setStatus(false, err.message);
  }
}

/* COMPONENT RENDERING ENGINE */
function render() {
  if (!els.list) return;
  els.list.innerHTML = "";
  
  // Bulletproof safety layer: Force todos to be an array structure
  if (!Array.isArray(todos)) {
    todos = [];
  }
  
  if (els.count) els.count.textContent = todos.length;
  if (els.empty) els.empty.style.display = todos.length ? "none" : "block";
  if (els.clearAllBtn) els.clearAllBtn.disabled = todos.length === 0;

  todos.forEach((todo) => {
    if (!todo) return;
    const todoId = todo.id || todo._id;

    const li = document.createElement("li");
    li.className = todo.completed ? "completed" : "";

    // Circular Toggle Status Button
    const checkBtn = document.createElement("button");
    checkBtn.className = "check";
    if (todo.completed) checkBtn.classList.add("done");
    checkBtn.onclick = () => toggleTodo(todoId, !todo.completed);
    li.appendChild(checkBtn);

    // Context Evaluation: Checking if the element is currently chosen for Editing mode
    if (editingId === String(todoId)) {
      const editContainer = document.createElement("div");
      editContainer.className = "edit-container";

      const editInput = document.createElement("input");
      editInput.type = "text";
      editInput.className = "edit-input";
      editInput.value = todo.text || "";

      const saveBtn = document.createElement("button");
      saveBtn.className = "icon-btn";
      saveBtn.textContent = "Save";

      const handleSave = () => {
        const val = editInput.value.trim();
        if (val) editTodo(todoId, val);
      };

      saveBtn.onclick = handleSave;
      editInput.onkeyup = (e) => { if (e.key === "Enter") handleSave(); };

      editContainer.appendChild(editInput);
      editContainer.appendChild(saveBtn);
      li.appendChild(editContainer);
    } else {
      // Standard Text Output mode
      const textSpan = document.createElement("span");
      textSpan.className = "text";
      if (todo.completed) textSpan.classList.add("done");
      textSpan.textContent = todo.text || "";
      li.appendChild(textSpan);

      // Actions cluster panel 
      const actionsDiv = document.createElement("div");
      actionsDiv.className = "actions";

      const editBtn = document.createElement("button");
      editBtn.className = "icon-btn";
      editBtn.textContent = "Edit";
      editBtn.onclick = () => {
        editingId = String(todoId);
        render();
      };

      const delBtn = document.createElement("button");
      delBtn.className = "icon-btn delete";
      delBtn.textContent = "Delete";
      delBtn.onclick = () => deleteTodo(todoId);

      actionsDiv.appendChild(editBtn);
      actionsDiv.appendChild(delBtn);
      li.appendChild(actionsDiv);
    }

    els.list.appendChild(li);
  });
}

/* INITIAL ACTION ASSIGNMENTS */
if (els.form) {
  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = els.input.value.trim();
    if (!text) return;
    els.input.value = "";
    addTodo(text);
  });
}

if (els.clearAllBtn) {
  els.clearAllBtn.addEventListener("click", deleteAll);
}

// Kickstart UI engine
fetchTodos();