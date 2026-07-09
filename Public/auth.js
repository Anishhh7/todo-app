// auth.js
// Handles the login and signup forms.

document.addEventListener('DOMContentLoaded', () => {
  redirectIfAuthed();

  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');

  if (loginForm) initLoginForm(loginForm);
  if (signupForm) initSignupForm(signupForm);
});

function initLoginForm(form) {
  const submitBtn = form.querySelector('button[type="submit"]');
  const errorBox = document.getElementById('auth-error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError(errorBox);

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
      showError(errorBox, 'Enter your email and password.');
      return;
    }

    toggleSubmitting(submitBtn, true, 'Logging in...');
    try {
      const data = await api.login({ email, password });
      const token = data.token || (data.data && data.data.token);
      const user = data.user || (data.data && data.data.user);

      if (!token) throw new Error('Login succeeded but no token was returned.');

      localStorage.setItem('token', token);
      if (user && user.name) localStorage.setItem('userName', user.name);

      window.location.href = 'index.html';
    } catch (err) {
      showError(errorBox, err.message || 'Login failed. Please try again.');
    } finally {
      toggleSubmitting(submitBtn, false, 'Login');
    }
  });
}

function initSignupForm(form) {
  const submitBtn = form.querySelector('button[type="submit"]');
  const errorBox = document.getElementById('auth-error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError(errorBox);

    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;

    if (!name || !email || !password || !confirmPassword) {
      showError(errorBox, 'Fill in every field to continue.');
      return;
    }

    if (password !== confirmPassword) {
      showError(errorBox, 'Passwords do not match.');
      return;
    }

    toggleSubmitting(submitBtn, true, 'Creating account...');
    try {
      const data = await api.signup({ name, email, password, confirmPassword });
      const token = data.token || (data.data && data.data.token);

      if (token) {
        localStorage.setItem('token', token);
        if (name) localStorage.setItem('userName', name);
        window.location.href = 'index.html';
      } else {
        showError(errorBox, 'Account created. Please log in.', 'success');
        setTimeout(() => (window.location.href = 'login.html'), 1200);
      }
    } catch (err) {
      showError(errorBox, err.message || 'Sign up failed. Please try again.');
    } finally {
      toggleSubmitting(submitBtn, false, 'Create account');
    }
  });
}

function showError(box, message, variant = 'error') {
  if (!box) return;
  box.textContent = message;
  box.classList.remove('auth-error--hidden');
  box.classList.toggle('auth-error--success', variant === 'success');
}

function hideError(box) {
  if (!box) return;
  box.classList.add('auth-error--hidden');
  box.classList.remove('auth-error--success');
}

function toggleSubmitting(btn, isSubmitting, label) {
  if (!btn) return;
  btn.disabled = isSubmitting;
  btn.textContent = label;
}
