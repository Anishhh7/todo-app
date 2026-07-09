

/**
 * Shows a toast notification. type: 'success' | 'error' | 'info'
 */
function showToast(message, type = 'info') {
  let stack = document.getElementById('toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.id = 'toast-stack';
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.setAttribute('role', 'status');

  const icon = document.createElement('span');
  icon.className = 'toast__icon';
  icon.textContent = type === 'success' ? '✓' : type === 'error' ? '!' : 'i';

  const text = document.createElement('span');
  text.className = 'toast__text';
  text.textContent = message;

  toast.appendChild(icon);
  toast.appendChild(text);
  stack.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('toast--visible'));

  setTimeout(() => {
    toast.classList.remove('toast--visible');
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}

/**
 * Toggles a full-panel loading state. Expects a container with
 * data-loading-target on it; swaps in a spinner overlay.
 */
function setLoading(container, isLoading) {
  if (!container) return;
  let overlay = container.querySelector('.loading-overlay');
  if (isLoading) {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'loading-overlay';
      overlay.innerHTML = '<div class="spinner" aria-label="Loading"></div>';
      container.appendChild(overlay);
    }
  } else if (overlay) {
    overlay.remove();
  }
}

/**
 * Redirects to login if no token is present. Call at the top of
 * protected pages.
 */
function requireAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
  }
}

/**
 * Redirects away from auth pages if already logged in.
 */
function redirectIfAuthed() {
  const token = localStorage.getItem('token');
  if (token) {
    window.location.href = 'index.html';
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userName');
  window.location.href = 'login.html';
}

function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(dateString) {
  if (!dateString) return 'No due date';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return 'No due date';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ---------------- Modal ---------------- */

const modalEl = () => document.getElementById('todo-modal');

function openModal(mode, todo = null) {
  const modal = modalEl();
  if (!modal) return;

  const title = modal.querySelector('.modal__title');
  const form = document.getElementById('todo-form');
  form.reset();

  document.getElementById('todo-id').value = todo ? todo._id || todo.id : '';
  title.textContent = mode === 'edit' ? 'Edit task' : 'New task';

  if (todo) {
    document.getElementById('field-title').value = todo.title || '';
    document.getElementById('field-description').value = todo.description || '';
    document.getElementById('field-category').value = todo.category || 'Personal';
    document.getElementById('field-priority').value = todo.priority || 'Low';
    document.getElementById('field-dueDate').value = todo.dueDate ? todo.dueDate.substring(0, 10) : '';
    document.getElementById('field-completed').checked = !!todo.completed;
  }

  modal.classList.add('modal--open');
  document.body.classList.add('modal-open');
  document.getElementById('field-title').focus();
}

function closeModal() {
  const modal = modalEl();
  if (!modal) return;
  modal.classList.remove('modal--open');
  document.body.classList.remove('modal-open');
}

document.addEventListener('DOMContentLoaded', () => {
  const modal = modalEl();
  if (!modal) return;

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  const cancelBtn = document.getElementById('modal-cancel');
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('modal--open')) closeModal();
  });
});
