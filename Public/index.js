const API_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:3000/api/v1/todo" 
    : "https://todo-app-2c12.onrender.com/api/v1/todo";

// DOM Element Selectors
const taskInput = document.getElementById("task-input");
const addBtn = document.getElementById("add-btn");
const searchContainer = document.getElementById("search-container");
const searchInput = document.getElementById("search-input");
const taskCountElement = document.getElementById("task-count");
const deleteAllBtn = document.getElementById("delete-all-btn");
const taskList = document.getElementById("task-list");
const dateElement = document.getElementById("current-date");

const today = new Date();
const formattedDate = today.toLocaleDateString();
dateElement.textContent = formattedDate;

// Internal State Sync Variable
let tasks = [];

// Initialize data synchronization on load
document.addEventListener("DOMContentLoaded", loadTasks);

// Event Listeners
addBtn.addEventListener("click", addTask);
taskInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") addTask();
});

// Debounced input to prevent rapid server force-restarts while typing
searchInput.addEventListener("input", debounce(filterTasks, 400));
deleteAllBtn.addEventListener("click", deleteAllTasks);

// Debounce Engine Utility
function debounce(func, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

// UI Notification Toast Engine
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("fade-out");
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// 1. GET - Fetch and sync all elements from server
async function loadTasks() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Network response breakdown");

    const resBody = await response.json();
    console.log("Backend Raw Response Structure:", resBody);

    // 1. Check if data contains a nested array (e.g., resBody.data.todos or resBody.data.tasks)
    if (
      resBody.data &&
      typeof resBody.data === "object" &&
      !Array.isArray(resBody.data)
    ) {
      const keys = Object.keys(resBody.data);
      const arrayKey = keys.find((key) => Array.isArray(resBody.data[key]));

      if (arrayKey) {
        tasks = resBody.data[arrayKey];
      } else {
        tasks = [];
      }
    }
    // 2. Fallbacks for other structures
    else if (resBody.data && Array.isArray(resBody.data)) {
      tasks = resBody.data;
    } else if (resBody.todos && Array.isArray(resBody.todos)) {
      tasks = resBody.todos;
    } else {
      tasks = Array.isArray(resBody) ? resBody : [];
    }

    renderTasks();
  } catch (error) {
    console.error("Error loading elements:", error);
    showToast("Could not fetch tasks from server.", "error");
  }
}
// 2. POST - Add task object
async function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    if (!response.ok) throw new Error("Creation failure");
    const resBody = await response.json(); // <-- Your variable is named resBody

    if (resBody.data && resBody.data.todo) {
      tasks.push(resBody.data.todo);
    } else if (resBody.todo) {
      tasks.push(resBody.todo);
    } else {
      tasks.push(resBody);
    }

    taskInput.value = "";
    renderTasks();

    // FIX 1: Changed 'data' to 'resBody'
    // FIX 2: Added a fallback "Task added!" string in case the backend doesn't return a .message property
    showToast(resBody.message || "Task added successfully!", "success");
  } catch (error) {
    console.error("Error writing element:", error);
    showToast("Failed to add task.", "error");
  }
}

// 3. PUT/PATCH - Toggle status parameter mapping
async function toggleTaskComplete(id) {
  const targetTask = tasks.find((t) => t._id === id || t.id === id);
  if (!targetTask) return;

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !targetTask.completed })
    });

    if (response.status === 405 || response.status === 404) {
      const retryResponse = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !targetTask.completed })
      });
      if (!retryResponse.ok) throw new Error("Status modify failed on retry");
      var resBody = await retryResponse.json();
    } else {
      if (!response.ok) throw new Error("Status modify failed");
      var resBody = await response.json();
    }

    const updatedTask =
      resBody.data && resBody.data.todo ? resBody.data.todo : resBody;

    tasks = tasks.map((t) => (t._id === id || t.id === id ? updatedTask : t));
    renderTasks();
  } catch (error) {
    console.error("Status update tracking error:", error);
    showToast("Failed to update status tracking.", "error");
  }
}

// 4. PUT/PATCH - Modify text payload inline with state tracking
async function editTask(id) {
  const targetTask = tasks.find((t) => t._id === id || t.id === id);
  if (!targetTask) return;

  if (!targetTask.isEditing) {
    targetTask.isEditing = true;
    renderTasks();

    const li = document.querySelector(`li[data-id="${id}"]`);
    const input = li.querySelector(".inline-edit-input");
    if (input) {
      input.focus();
      const val = input.value;
      input.value = "";
      input.value = val;
    }
    return;
  }

  const li = document.querySelector(`li[data-id="${id}"]`);
  const inlineInput = li.querySelector(".inline-edit-input");
  const newText = inlineInput.value.trim();

  if (!newText || newText === targetTask.text) {
    targetTask.isEditing = false;
    renderTasks();
    return;
  }

  try {
    let response = await fetch(`${API_URL}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newText })
    });

    if (response.status === 405 || response.status === 404) {
      response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newText })
      });
    }

    if (!response.ok) throw new Error("Text processing modification error");
    const resBody = await response.json();

    const updatedTask =
      resBody.data && resBody.data.todo ? resBody.data.todo : resBody;
    updatedTask.isEditing = false;

    tasks = tasks.map((t) => (t._id === id || t.id === id ? updatedTask : t));
    renderTasks();
    showToast("Task has been successfully edited!");
  } catch (error) {
    console.error("Task editing pipeline interruption:", error);
    showToast("Failed to edit task.", "error");
    targetTask.isEditing = false;
    renderTasks();
  }
}

// 5. DELETE - Remove singular target
async function deleteTask(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Deletion request rejected");

    tasks = tasks.filter((t) => t._id !== id && t.id !== id);
    renderTasks();
    showToast("Task has been successfully deleted!");
  } catch (error) {
    console.error("System clearing operation error:", error);
    showToast("Failed to delete targeted task entity.", "error");
  }
}

// 6. DELETE - Purge entire stack array collection
async function deleteAllTasks() {
  if (!confirm("Are you sure you want to clear all tasks?")) return;
  try {
    const response = await fetch(API_URL, { method: "DELETE" });
    if (!response.ok) throw new Error("Global purge rejected");

    tasks = [];
    searchInput.value = "";
    renderTasks();
    showToast("All tasks have been successfully cleared.");
  } catch (error) {
    console.error("Purging structural failure:", error);
    showToast("Failed to clear full target array stack.", "error");
  }
}

// Core Layout Generator
function renderTasks() {
  taskList.innerHTML = "";

  if (tasks.length > 1 || searchInput.value.trim() !== "") {
    searchContainer.classList.remove("hidden");
  } else {
    searchContainer.classList.add("hidden");
    searchInput.value = "";
  }

  if (tasks.length > 0) {
    deleteAllBtn.classList.remove("hidden");
  } else {
    deleteAllBtn.classList.add("hidden");
  }

  taskCountElement.textContent = `${tasks.length} task${tasks.length !== 1 ? "s" : ""}`;

  tasks.forEach((task) => {
    const taskId = task._id || task.id;
    const li = document.createElement("li");
    li.className = `task-item ${task.completed ? "completed" : ""}`;
    li.setAttribute("data-id", taskId);

    const textContentHTML = task.isEditing
      ? `<input type="text" class="inline-edit-input" value="${task.text || ""}">`
      : `<span class="task-text">${task.text || ""}</span>`;

    const actionButtonText = task.isEditing ? "Save" : "Edit";

    li.innerHTML = `
            <div class="task-left">
                <input type="checkbox" class="task-checkbox" ${task.completed ? "checked" : ""}>
                ${textContentHTML}
            </div>
            <div class="task-actions">
                <button class="action-btn edit-btn">${actionButtonText}</button>
                <button class="action-btn delete-btn">Delete</button>
            </div>
        `;

    li.querySelector(".task-checkbox").addEventListener("change", () =>
      toggleTaskComplete(taskId)
    );
    li.querySelector(".delete-btn").addEventListener("click", () =>
      deleteTask(taskId)
    );
    li.querySelector(".edit-btn").addEventListener("click", () =>
      editTask(taskId)
    );

    if (task.isEditing) {
      li.querySelector(".inline-edit-input").addEventListener(
        "keypress",
        (e) => {
          if (e.key === "Enter") editTask(taskId);
        }
      );
    }

    taskList.appendChild(li);
  });
}

// Filtering Subroutine - Fetching filtered data directly from the Backend
async function filterTasks() {
  const query = searchInput.value.trim().toLowerCase();

  if (!query) {
    loadTasks();
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}?search=${encodeURIComponent(query)}`
    );
    if (!response.ok) throw new Error("Search dispatch failed");

    const resBody = await response.json();

    if (resBody.data && Array.isArray(resBody.data)) {
      tasks = resBody.data;
    } else if (resBody.data && Array.isArray(resBody.data.todos)) {
      tasks = resBody.data.todos;
    } else if (resBody.todos && Array.isArray(resBody.todos)) {
      tasks = resBody.todos;
    } else {
      tasks = Array.isArray(resBody) ? resBody : [];
    }

    renderTasks();
  } catch (error) {
    console.error("Backend search routing error:", error);
    showToast("Failed to retrieve search results from server.", "error");
  }
}
