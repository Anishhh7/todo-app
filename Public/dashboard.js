// dashboard.js
// Drives the dashboard: fetching todos, rendering cards & stats,
// filters/search/sort, pagination, and create/edit/delete/complete actions.

const PAGE_SIZE = 10;

const state = {
  todos: [],
  totalCount: 0,
  page: 1,
  filters: {
    search: '',
    category: '',
    priority: '',
    completed: '',
    dateFrom: '',
    dateTo: '',
  },
  sort: 'newest',
  activeView: 'all', // all | today | completed | pending | high
};

const SORT_MAP = {
  newest: '-createdAt',
  oldest: 'createdAt',
  priority: '-priority',
  dueDate: 'dueDate',
  alphabetical: 'title',
};

document.addEventListener('DOMContentLoaded', () => {
  requireAuth();
  hydrateGreeting();
  bindSidebar();
  bindTopbar();
  bindFilterBar();
  bindTodoForm();
  bindLogout();
  loadTodos();
});

/* ---------------- Greeting & sidebar ---------------- */

function hydrateGreeting() {
  const name = localStorage.getItem('userName');
  const el = document.getElementById('greeting-name');
  if (el) el.textContent = name ? name.split(' ')[0] : 'there';
}

function bindLogout() {
  const btn = document.getElementById('logout-btn');
  if (btn) btn.addEventListener('click', logout);
}

function bindSidebar() {
  const links = document.querySelectorAll('.nav-link[data-view]');
  links.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      links.forEach((l) => l.classList.remove('nav-link--active'));
      link.classList.add('nav-link--active');
      state.activeView = link.dataset.view;
      state.page = 1;
      applyViewPreset();
      loadTodos();
    });
  });
}

/**
 * Some sidebar views are shortcuts for common filter combinations.
 */
function applyViewPreset() {
  const f = state.filters;
  f.completed = '';
  f.priority = '';
  f.dateFrom = '';
  f.dateTo = '';

  if (state.activeView === 'completed') f.completed = 'true';
  if (state.activeView === 'pending') f.completed = 'false';
  if (state.activeView === 'high') f.priority = 'high';
  if (state.activeView === 'today') {
    const today = new Date().toISOString().substring(0, 10);
    f.dateFrom = today;
    f.dateTo = today;
  }

  syncFilterInputsFromState();
}

function syncFilterInputsFromState() {
  document.getElementById('filter-category').value = state.filters.category;
  document.getElementById('filter-priority').value = state.filters.priority;
  document.getElementById('filter-completed').value = state.filters.completed;
  document.getElementById('filter-date-from').value = state.filters.dateFrom;
  document.getElementById('filter-date-to').value = state.filters.dateTo;
}

/* ---------------- Top bar (search) ---------------- */

function bindTopbar() {
  const searchInput = document.getElementById('topbar-search');
  if (!searchInput) return;
  let debounceTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      state.filters.search = searchInput.value.trim();
      state.page = 1;
      loadTodos();
    }, 350);
  });
}

/* ---------------- Filter bar ---------------- */

function bindFilterBar() {
  const category = document.getElementById('filter-category');
  const priority = document.getElementById('filter-priority');
  const completed = document.getElementById('filter-completed');
  const dateFrom = document.getElementById('filter-date-from');
  const dateTo = document.getElementById('filter-date-to');
  const sort = document.getElementById('filter-sort');
  const clearBtn = document.getElementById('filter-clear');
  const newTaskBtn = document.getElementById('new-task-btn');
  const emptyStateBtn = document.getElementById('empty-state-new-task');

  category.addEventListener('change', () => {
    state.filters.category = category.value;
    state.page = 1;
    loadTodos();
  });
  priority.addEventListener('change', () => {
    state.filters.priority = priority.value;
    state.page = 1;
    loadTodos();
  });
  completed.addEventListener('change', () => {
    state.filters.completed = completed.value;
    state.page = 1;
    loadTodos();
  });
  dateFrom.addEventListener('change', () => {
    state.filters.dateFrom = dateFrom.value;
    state.page = 1;
    loadTodos();
  });
  dateTo.addEventListener('change', () => {
    state.filters.dateTo = dateTo.value;
    state.page = 1;
    loadTodos();
  });
  sort.addEventListener('change', () => {
    state.sort = sort.value;
    state.page = 1;
    loadTodos();
  });
  clearBtn.addEventListener('click', () => {
    state.filters = { search: '', category: '', priority: '', completed: '', dateFrom: '', dateTo: '' };
    state.sort = 'newest';
    state.page = 1;
    document.getElementById('topbar-search').value = '';
    sort.value = 'newest';
    syncFilterInputsFromState();
    loadTodos();
  });

  if (newTaskBtn) newTaskBtn.addEventListener('click', () => openModal('create'));
  if (emptyStateBtn) emptyStateBtn.addEventListener('click', () => openModal('create'));
}

/* ---------------- Data loading ---------------- */

async function loadTodos() {
  const listContainer = document.getElementById('todo-list');
  setLoading(document.getElementById('todo-list-wrapper'), true);

  const params = {
    search: state.filters.search || undefined,
    category: state.filters.category || undefined,
    priority: state.filters.priority || undefined,
    completed: state.filters.completed || undefined,
    sort: SORT_MAP[state.sort],
    page: state.page,
    limit: PAGE_SIZE,
  };

  if (state.filters.dateFrom || state.filters.dateTo) {
    params.dueDate = {};
    if (state.filters.dateFrom) params.dueDate.gte = state.filters.dateFrom;
    if (state.filters.dateTo) params.dueDate.lte = state.filters.dateTo;
  }

  try {
    const data = await api.getTodos(params);
    const todos = data.data || data.todos || data.results || [];
    const total = data.total ?? data.count ?? todos.length;

    state.todos = todos;
    state.totalCount = total;

    renderTodos(todos);
    renderPagination(total);
    renderStats(data.stats);
  } catch (err) {
    showToast(err.message || 'Could not load tasks.', 'error');
    renderTodos([]);
  } finally {
    setLoading(document.getElementById('todo-list-wrapper'), false);
  }
}

/* ---------------- Rendering ---------------- */

const CATEGORY_ICONS = {
  Personal: '👤',
  Education: '📚',
  Work: '💼',
  Shopping: '🛒',
  Fitness: '🏋️',
  Health: '❤️',
  Finance: '💰',
  Other: '✦',
};

function renderTodos(todos) {
  const list = document.getElementById('todo-list');
  const emptyState = document.getElementById('empty-state');

  list.innerHTML = '';

  if (!todos.length) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  todos.forEach((todo) => {
    list.appendChild(buildTodoCard(todo));
  });
}

function buildTodoCard(todo) {
  const id = todo._id || todo.id;
  const priority = (todo.priority || 'low').toLowerCase();
  const category = todo.category || 'Other';
  const completed = !!todo.completed;

  const card = document.createElement('article');
  card.className = `todo-card todo-card--${priority}${completed ? ' todo-card--completed' : ''}`;
  card.dataset.id = id;

  card.innerHTML = `
    <div class="todo-card__bar" aria-hidden="true"></div>
    <div class="todo-card__main">
      <div class="todo-card__header">
        <h3 class="todo-card__title">${escapeHtml(todo.title)}</h3>
        <span class="badge badge--priority-${priority}">${escapeHtml(capitalize(priority))}</span>
      </div>
      ${todo.description ? `<p class="todo-card__description">${escapeHtml(todo.description)}</p>` : ''}
      <div class="todo-card__meta">
        <span class="badge badge--category">${CATEGORY_ICONS[category] || '✦'} ${escapeHtml(category)}</span>
        <span class="todo-card__date">📅 ${formatDate(todo.dueDate)}</span>
        <span class="todo-card__status ${completed ? 'todo-card__status--done' : ''}">
          ${completed ? '✓ Completed' : '○ Pending'}
        </span>
      </div>
    </div>
    <div class="todo-card__actions">
      <button class="icon-btn icon-btn--complete" data-action="complete" title="${completed ? 'Mark as pending' : 'Mark as complete'}">
        ${completed ? '↺' : '✓'}
      </button>
      <button class="icon-btn icon-btn--edit" data-action="edit" title="Edit task">✎</button>
      <button class="icon-btn icon-btn--delete" data-action="delete" title="Delete task">🗑</button>
    </div>
  `;

  card.querySelector('[data-action="edit"]').addEventListener('click', () => openModal('edit', todo));
  card.querySelector('[data-action="delete"]').addEventListener('click', () => confirmDelete(id, todo.title));
  card.querySelector('[data-action="complete"]').addEventListener('click', () => toggleComplete(todo));

  return card;
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
}

function renderStats(stats) {
  const totalEl = document.getElementById('stat-total');
  const completedEl = document.getElementById('stat-completed');
  const pendingEl = document.getElementById('stat-pending');
  const overdueEl = document.getElementById('stat-overdue');

  if (stats) {
    totalEl.textContent = stats.total ?? '—';
    completedEl.textContent = stats.completed ?? '—';
    pendingEl.textContent = stats.pending ?? '—';
    overdueEl.textContent = stats.overdue ?? '—';
    return;
  }

  // Fall back to counting the current page if the backend doesn't send stats.
  const todos = state.todos;
  const now = new Date();
  totalEl.textContent = state.totalCount ?? todos.length;
  completedEl.textContent = todos.filter((t) => t.completed).length;
  pendingEl.textContent = todos.filter((t) => !t.completed).length;
  overdueEl.textContent = todos.filter((t) => !t.completed && t.dueDate && new Date(t.dueDate) < now).length;
}

function renderPagination(total) {
  const container = document.getElementById('pagination');
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  container.innerHTML = '';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'pagination__btn';
  prevBtn.textContent = 'Previous';
  prevBtn.disabled = state.page <= 1;
  prevBtn.addEventListener('click', () => {
    state.page -= 1;
    loadTodos();
  });

  const label = document.createElement('span');
  label.className = 'pagination__label';
  label.textContent = `Page ${state.page} of ${totalPages}`;

  const nextBtn = document.createElement('button');
  nextBtn.className = 'pagination__btn';
  nextBtn.textContent = 'Next';
  nextBtn.disabled = state.page >= totalPages;
  nextBtn.addEventListener('click', () => {
    state.page += 1;
    loadTodos();
  });

  container.appendChild(prevBtn);
  container.appendChild(label);
  container.appendChild(nextBtn);
}

/* ---------------- CRUD actions ---------------- */

function bindTodoForm() {
  const form = document.getElementById('todo-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('modal-save');
    const id = document.getElementById('todo-id').value;

    const payload = {
      title: document.getElementById('field-title').value.trim(),
      description: document.getElementById('field-description').value.trim(),
      category: document.getElementById('field-category').value,
      priority: document.getElementById('field-priority').value,
      dueDate: document.getElementById('field-dueDate').value || null,
      completed: document.getElementById('field-completed').checked,
    };

    if (!payload.title) {
      showToast('Give the task a title.', 'error');
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
      if (id) {
        await api.updateTodo(id, payload);
        showToast('Task updated.', 'success');
      } else {
        await api.createTodo(payload);
        showToast('Task created.', 'success');
      }
      closeModal();
      loadTodos();
    } catch (err) {
      showToast(err.message || 'Could not save the task.', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save task';
    }
  });
}

async function toggleComplete(todo) {
  const id = todo._id || todo.id;
  try {
    await api.updateTodo(id, { completed: !todo.completed });
    showToast(todo.completed ? 'Marked as pending.' : 'Task completed.', 'success');
    loadTodos();
  } catch (err) {
    showToast(err.message || 'Could not update the task.', 'error');
  }
}

function confirmDelete(id, title) {
  const ok = window.confirm(`Delete "${title}"? This can't be undone.`);
  if (!ok) return;
  deleteTodo(id);
}

async function deleteTodo(id) {
  try {
    await api.deleteTodo(id);
    showToast('Task deleted.', 'success');
    loadTodos();
  } catch (err) {
    showToast(err.message || 'Could not delete the task.', 'error');
  }
}
