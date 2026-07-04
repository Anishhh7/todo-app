// ========================================
// API & CONFIG
// ========================================

const API_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:3000/api/v1"
    : "https://todo-app-2c12.onrender.com/api/v1";

let authToken = localStorage.getItem("authToken");
let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;

// ========================================
// STATE MANAGEMENT
// ========================================

const state = {
  tasks: [],
  filteredTasks: [],
  currentFilter: "all",
  currentCategory: "all",
  searchQuery: "",
  editingTaskId: null,
  viewingTaskId: null,
  isAuthMode: "signin", // signin or signup
};

const categoryColors = {
  work: "#3b82f6",
  personal: "#8b5cf6",
  shopping: "#ec4899",
  health: "#10b981",
  finance: "#f59e0b",
  education: "#06b6d4",
  other: "#6b7280",
};

// ========================================
// DOM ELEMENTS
// ========================================

const elements = {
  // Auth
  authModal: document.getElementById("auth-modal"),
  authForm: document.getElementById("auth-form"),
  authTitle: document.getElementById("auth-title"),
  authSubtitle: document.getElementById("auth-subtitle"),
  authEmail: document.getElementById("auth-email"),
  authPassword: document.getElementById("auth-password"),
  authSubmit: document.getElementById("auth-submit"),
  toggleAuthBtn: document.getElementById("toggle-auth-btn"),

  // App
  appWrapper: document.getElementById("app-wrapper"),
  userEmail: document.getElementById("user-email"),
  logoutBtn: document.getElementById("logout-btn"),
  currentDate: document.getElementById("current-date"),

  // Task Modal
  taskModal: document.getElementById("task-modal"),
  taskForm: document.getElementById("task-form"),
  taskTitle: document.getElementById("task-title"),
  taskCategory: document.getElementById("task-category"),
  taskType: document.getElementById("task-type"),
  taskDescription: document.getElementById("task-description"),
  taskPriority: document.getElementById("task-priority"),
  taskDueDate: document.getElementById("task-due-date"),
  closeModal: document.getElementById("close-modal"),
  cancelTask: document.getElementById("cancel-task"),
  newTaskBtn: document.getElementById("new-task-btn"),
  modalTitle: document.getElementById("modal-title"),

  // View Modal
  viewModal: document.getElementById("view-modal"),
  viewTitle: document.getElementById("view-title"),
  viewContent: document.getElementById("view-content"),
  closeViewModal: document.getElementById("close-view-modal"),
  closeViewBtn: document.getElementById("close-view-btn"),
  editFromView: document.getElementById("edit-from-view"),
  deleteFromView: document.getElementById("delete-from-view"),

  // Main UI
  taskList: document.getElementById("task-list"),
  searchInput: document.getElementById("search-input"),
  emptyState: document.getElementById("empty-state"),
  emptyNewTask: document.getElementById("empty-new-task"),

  // Sidebar
  categoryFilter: document.getElementById("category-filter"),
  filterButtons: document.querySelectorAll(".filter-btn"),
  statTotal: document.getElementById("stat-total"),
  statCompleted: document.getElementById("stat-completed"),
  statPending: document.getElementById("stat-pending"),

  // Toast
  toastContainer: document.getElementById("toast-container"),
};

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener("DOMContentLoaded", () => {
  setCurrentDate();

  if (authToken && currentUser) {
    showApp();
    loadTasks();
  } else {
    showAuthModal();
  }
});

// ========================================
// AUTH FUNCTIONS
// ========================================

function showAuthModal() {
  elements.authModal.classList.remove("hidden");
  elements.appWrapper.classList.add("hidden");
  elements.authForm.reset();
  updateAuthMode();
}

function showApp() {
  elements.authModal.classList.add("hidden");
  elements.appWrapper.classList.remove("hidden");
  elements.userEmail.textContent = currentUser?.email || "User";
}

function updateAuthMode() {
  const isSignIn = state.isAuthMode === "signin";
  elements.authTitle.textContent = isSignIn ? "Sign In" : "Create Account";
  elements.authSubtitle.textContent = isSignIn
    ? "Welcome back to TaskFlow"
    : "Join TaskFlow today";
  elements.authSubmit.textContent = isSignIn ? "Sign In" : "Sign Up";
  elements.toggleAuthBtn.textContent = isSignIn
    ? "Create one"
    : "Sign in instead";
}

elements.toggleAuthBtn.addEventListener("click", () => {
  state.isAuthMode = state.isAuthMode === "signin" ? "signup" : "signin";
  updateAuthMode();
  elements.authForm.reset();
});

elements.authForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = elements.authEmail.value.trim();
  const password = elements.authPassword.value.trim();

  if (!email || !password) {
    showToast("Please fill in all fields", "error");
    return;
  }

  try {
    elements.authSubmit.disabled = true;
    elements.authSubmit.textContent =
      state.isAuthMode === "signin" ? "Signing in..." : "Creating account...";

    const endpoint =
      state.isAuthMode === "signin"
        ? `${API_URL}/auth/signin`
        : `${API_URL}/auth/signup`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Authentication failed");
    }

    authToken = data.token;
    currentUser = data.user;

    localStorage.setItem("authToken", authToken);
    localStorage.setItem("currentUser", JSON.stringify(currentUser));

    showToast(
      state.isAuthMode === "signin"
        ? "Signed in successfully!"
        : "Account created successfully!",
      "success"
    );

    showApp();
    state.tasks = [];
    state.filteredTasks = [];
    loadTasks();
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    elements.authSubmit.disabled = false;
    elements.authSubmit.textContent =
      state.isAuthMode === "signin" ? "Sign In" : "Sign Up";
  }
});

elements.logoutBtn.addEventListener("click", () => {
  if (confirm("Are you sure you want to log out?")) {
    authToken = null;
    currentUser = null;
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    state.tasks = [];
    state.filteredTasks = [];
    state.isAuthMode = "signin";
    showToast("Logged out successfully", "success");
    showAuthModal();
  }
});

// ========================================
// TASK OPERATIONS - CRUD
// ========================================

async function loadTasks() {
  try {
    const response = await fetch(`${API_URL}/tasks`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (!response.ok) {
      if (response.status === 401) {
        logoutUser();
        return;
      }
      throw new Error("Failed to load tasks");
    }

    const data = await response.json();
    state.tasks = data.tasks || [];
    applyFilters();
    renderTasks();
    updateStats();
  } catch (error) {
    console.error("Error loading tasks:", error);
    showToast("Failed to load tasks", "error");
  }
}

async function createTask(taskData) {
  try {
    const response = await fetch(`${API_URL}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(taskData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create task");
    }

    const data = await response.json();
    state.tasks.push(data.task);
    showToast("Task created successfully!", "success");
    applyFilters();
    renderTasks();
    updateStats();
    closeTaskModal();
  } catch (error) {
    console.error("Error creating task:", error);
    showToast(error.message, "error");
  }
}

async function updateTask(taskId, taskData) {
  try {
    const response = await fetch(`${API_URL}/tasks/${taskId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(taskData),
    });

    if (!response.ok) {
      throw new Error("Failed to update task");
    }

    const data = await response.json();
    const index = state.tasks.findIndex((t) => t._id === taskId);
    if (index !== -1) {
      state.tasks[index] = data.task;
    }

    showToast("Task updated successfully!", "success");
    applyFilters();
    renderTasks();
    updateStats();
    closeTaskModal();
  } catch (error) {
    console.error("Error updating task:", error);
    showToast(error.message, "error");
  }
}

async function deleteTask(taskId) {
  if (!confirm("Are you sure you want to delete this task?")) return;

  try {
    const response = await fetch(`${API_URL}/tasks/${taskId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (!response.ok) {
      throw new Error("Failed to delete task");
    }

    state.tasks = state.tasks.filter((t) => t._id !== taskId);
    showToast("Task deleted successfully!", "success");
    applyFilters();
    renderTasks();
    updateStats();
    closeViewModal();
  } catch (error) {
    console.error("Error deleting task:", error);
    showToast(error.message, "error");
  }
}

// ========================================
// TASK FORM HANDLING
// ========================================

elements.taskType.addEventListener("change", (e) => {
  const label = document.getElementById("description-label");
  if (e.target.value === "note") {
    label.textContent = "Note Content";
  } else {
    label.textContent = "Description";
  }
});

elements.newTaskBtn.addEventListener("click", openTaskModal);
elements.emptyNewTask.addEventListener("click", openTaskModal);

function openTaskModal(taskId = null) {
  state.editingTaskId = taskId;

  if (taskId) {
    const task = state.tasks.find((t) => t._id === taskId);
    if (!task) return;

    elements.modalTitle.textContent = "Edit Task";
    elements.taskTitle.value = task.title;
    elements.taskCategory.value = task.category;
    elements.taskType.value = task.type;
    elements.taskDescription.value = task.description || "";
    elements.taskPriority.value = task.priority || "medium";
    elements.taskDueDate.value = task.dueDate ? task.dueDate.split("T")[0] : "";
  } else {
    elements.modalTitle.textContent = "New Task";
    elements.taskForm.reset();
    elements.taskType.value = "";
  }

  elements.taskModal.classList.remove("hidden");
}

function closeTaskModal() {
  elements.taskModal.classList.add("hidden");
  state.editingTaskId = null;
  elements.taskForm.reset();
}

elements.closeModal.addEventListener("click", closeTaskModal);
elements.cancelTask.addEventListener("click", closeTaskModal);

elements.taskForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const taskData = {
    title: elements.taskTitle.value.trim(),
    category: elements.taskCategory.value,
    type: elements.taskType.value,
    description: elements.taskDescription.value.trim(),
    priority: elements.taskPriority.value,
    dueDate: elements.taskDueDate.value || null,
  };

  if (!taskData.title || !taskData.category || !taskData.type) {
    showToast("Please fill in all required fields", "error");
    return;
  }

  if (state.editingTaskId) {
    await updateTask(state.editingTaskId, taskData);
  } else {
    await createTask(taskData);
  }
});

// ========================================
// TASK DISPLAY & RENDERING
// ========================================

function renderTasks() {
  const taskList = elements.taskList;
  taskList.innerHTML = "";

  if (state.filteredTasks.length === 0) {
    elements.emptyState.classList.remove("hidden");
    return;
  }

  elements.emptyState.classList.add("hidden");

  state.filteredTasks.forEach((task) => {
    const taskEl = createTaskElement(task);
    taskList.appendChild(taskEl);
  });
}

function createTaskElement(task) {
  const li = document.createElement("li");
  li.className = `task-item ${task.completed ? "completed" : ""}`;
  li.setAttribute("data-id", task._id);

  const categoryColor = categoryColors[task.category] || "#6b7280";
  const createdDate = new Date(task.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const dueDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "No due date";

  let descriptionHTML = "";
  if (task.type === "note") {
    descriptionHTML = `<div class="task-description note">${escapeHtml(
      task.description || ""
    )}</div>`;
  } else if (task.description) {
    descriptionHTML = `<div class="task-description">${escapeHtml(
      task.description.substring(0, 100)
    )}${task.description.length > 100 ? "..." : ""}</div>`;
  }

  li.innerHTML = `
    <div class="task-header">
      <input 
        type="checkbox" 
        class="task-checkbox" 
        ${task.completed ? "checked" : ""}
      />
      <div class="task-info">
        <h3 class="task-title">${escapeHtml(task.title)}</h3>
        <div class="task-meta">
          <span class="task-category">
            <span class="category-dot" style="background: ${categoryColor}"></span>
            ${escapeHtml(task.category)}
          </span>
          <span class="task-priority ${task.priority}">${task.priority}</span>
        </div>
        ${descriptionHTML}
      </div>
    </div>

    <div class="task-footer">
      <div class="task-dates">
        <div class="task-date-item">
          <span class="task-date-label">Created</span>
          <span>${createdDate}</span>
        </div>
        ${
          task.dueDate
            ? `<div class="task-date-item">
              <span class="task-date-label">Due</span>
              <span>${dueDate}</span>
            </div>`
            : ""
        }
      </div>
      <div class="task-actions">
        <button class="task-action-btn view-btn" title="View details">View</button>
        <button class="task-action-btn edit-btn" title="Edit task">Edit</button>
        <button class="task-action-btn delete delete-btn" title="Delete task">Delete</button>
      </div>
    </div>
  `;

  // Event Listeners
  const checkbox = li.querySelector(".task-checkbox");
  checkbox.addEventListener("change", () => {
    updateTask(task._id, { completed: !task.completed });
  });

  li.querySelector(".view-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    viewTask(task._id);
  });

  li.querySelector(".edit-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    openTaskModal(task._id);
  });

  li.querySelector(".delete-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    deleteTask(task._id);
  });

  return li;
}

function viewTask(taskId) {
  const task = state.tasks.find((t) => t._id === taskId);
  if (!task) return;

  state.viewingTaskId = taskId;
  elements.viewTitle.textContent = task.title;

  const categoryColor = categoryColors[task.category] || "#6b7280";
  const createdDate = new Date(task.createdAt).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const dueDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "No due date set";

  let contentHTML = `
    <div class="view-section">
      <span class="view-section-label">Category</span>
      <div class="view-section-content">
        <span class="task-category">
          <span class="category-dot" style="background: ${categoryColor}"></span>
          ${escapeHtml(task.category)}
        </span>
      </div>
    </div>

    <div class="view-section">
      <span class="view-section-label">Type</span>
      <div class="view-section-content">
        ${task.type === "note" ? "Note" : "Task"}
      </div>
    </div>

    <div class="view-section">
      <span class="view-section-label">Priority</span>
      <div class="view-section-content">
        <span class="task-priority ${task.priority}">${task.priority}</span>
      </div>
    </div>

    <div class="view-section">
      <span class="view-section-label">Status</span>
      <div class="view-section-content">
        ${task.completed ? "✓ Completed" : "○ Pending"}
      </div>
    </div>

    ${
      task.description
        ? `<div class="view-section">
      <span class="view-section-label">${
          task.type === "note" ? "Note Content" : "Description"
        }</span>
      <div class="view-section-content">${escapeHtml(task.description)}</div>
    </div>`
        : ""
    }

    <div class="view-section">
      <span class="view-section-label">Dates</span>
      <div class="view-section-content">
        <div style="margin-bottom: 8px;">
          <strong>Created:</strong> ${createdDate}
        </div>
        <div>
          <strong>Due:</strong> ${dueDate}
        </div>
      </div>
    </div>
  `;

  elements.viewContent.innerHTML = contentHTML;
  elements.viewModal.classList.remove("hidden");
}

function closeViewModal() {
  elements.viewModal.classList.add("hidden");
  state.viewingTaskId = null;
}

elements.closeViewModal.addEventListener("click", closeViewModal);
elements.closeViewBtn.addEventListener("click", closeViewModal);

elements.editFromView.addEventListener("click", () => {
  closeViewModal();
  openTaskModal(state.viewingTaskId);
});

elements.deleteFromView.addEventListener("click", () => {
  closeViewModal();
  deleteTask(state.viewingTaskId);
});

// ========================================
// FILTERING & SEARCH
// ========================================

function applyFilters() {
  let filtered = [...state.tasks];

  // Filter by status
  if (state.currentFilter === "active") {
    filtered = filtered.filter((t) => !t.completed);
  } else if (state.currentFilter === "completed") {
    filtered = filtered.filter((t) => t.completed);
  }

  // Filter by category
  if (state.currentCategory !== "all") {
    filtered = filtered.filter((t) => t.category === state.currentCategory);
  }

  // Filter by search query
  if (state.searchQuery) {
    const query = state.searchQuery.toLowerCase();
    filtered = filtered.filter((t) =>
      t.title.toLowerCase().includes(query) ||
      t.category.toLowerCase().includes(query)
    );
  }

  state.filteredTasks = filtered;
}

// Category filtering
const categoryButtons = document.querySelectorAll(".category-btn");
categoryButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    categoryButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    state.currentCategory = btn.getAttribute("data-category");
    applyFilters();
    renderTasks();
  });
});

// Status filtering
elements.filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    elements.filterButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    state.currentFilter = btn.getAttribute("data-filter");
    applyFilters();
    renderTasks();
  });
});

// Search
const debounceSearch = debounce(() => {
  state.searchQuery = elements.searchInput.value.trim();
  applyFilters();
  renderTasks();
}, 300);

elements.searchInput.addEventListener("input", debounceSearch);

// ========================================
// STATS
// ========================================

function updateStats() {
  const total = state.tasks.length;
  const completed = state.tasks.filter((t) => t.completed).length;
  const pending = total - completed;

  elements.statTotal.textContent = total;
  elements.statCompleted.textContent = completed;
  elements.statPending.textContent = pending;
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function setCurrentDate() {
  const today = new Date();
  const formatted = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  elements.currentDate.textContent = formatted;
}

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("fade-out");
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

function debounce(func, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function logoutUser() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem("authToken");
  localStorage.removeItem("currentUser");
  state.tasks = [];
  state.filteredTasks = [];
  showToast("Session expired. Please log in again.", "error");
  showAuthModal();
}

// Close modals on background click
elements.taskModal.addEventListener("click", (e) => {
  if (e.target === elements.taskModal) closeTaskModal();
});

elements.viewModal.addEventListener("click", (e) => {
  if (e.target === elements.viewModal) closeViewModal();
});

elements.authModal.addEventListener("click", (e) => {
  if (e.target === elements.authModal && currentUser) {
    // Don't close if user is just trying to scroll
  }
});
