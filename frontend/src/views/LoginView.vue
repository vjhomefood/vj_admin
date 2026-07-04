<template>
  <div class="login-page">
    <!-- Subtle dot-grid overlay for white bg -->
    <div class="grid-overlay"></div>

    <!-- Decorative blobs -->
    <div class="blob blob-top-right"></div>
    <div class="blob blob-bottom-left"></div>

    <div class="login-card">
      <!-- Card header with logo -->
      <div class="card-header">
        <div class="header-logo">
          <img src="/vj-logo-transparent.png" alt="VJ Home Foods logo" />
        </div>
        <div class="header-brand">
          <span class="header-title">VJ Home Foods</span>
          <span class="header-sub">Order Management</span>
        </div>
      </div>

      <!-- Card body -->
      <div class="card-body">
        <div class="title-block">
          <div class="admin-badge">
            <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Admin Access Only
          </div>
          <h1 class="card-title">Welcome back</h1>
          <p class="card-subtitle">Sign in to the administrator portal</p>
        </div>

        <!-- Error alert -->
        <transition name="shake-in">
          <div v-if="error" class="error-alert" role="alert">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {{ error }}
          </div>
        </transition>

        <form class="login-form" @submit.prevent="handleLogin" autocomplete="on">
          <!-- Username -->
          <div class="field">
            <label for="admin-username">Username</label>
            <div class="input-wrap" :class="{ focused: userFocused }">
              <svg class="input-icon" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <input
                id="admin-username"
                v-model="username"
                type="text"
                placeholder="Enter admin username"
                autocomplete="username"
                required
                @focus="userFocused = true"
                @blur="userFocused = false"
              />
            </div>
          </div>

          <!-- Password -->
          <div class="field">
            <label for="admin-password">Password</label>
            <div class="input-wrap" :class="{ focused: passFocused }">
              <svg class="input-icon" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                id="admin-password"
                v-model="password"
                :type="showPass ? 'text' : 'password'"
                placeholder="Enter password"
                autocomplete="current-password"
                required
                @focus="passFocused = true"
                @blur="passFocused = false"
              />
              <button type="button" class="eye-btn" @click="showPass = !showPass" tabindex="-1" :title="showPass ? 'Hide' : 'Show'">
                <svg v-if="!showPass" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                <svg v-else width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Submit -->
          <button id="admin-login-btn" type="submit" class="submit-btn" :disabled="loading">
            <span v-if="loading" class="btn-spinner"></span>
            <span v-else class="btn-content">
              Sign In
              <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'

const router      = useRouter()
const auth        = useAuthStore()
const username    = ref('')
const password    = ref('')
const showPass    = ref(false)
const loading     = ref(false)
const error       = ref('')
const userFocused = ref(false)
const passFocused = ref(false)

async function handleLogin() {
  loading.value = true
  error.value   = ''
  try {
    await auth.adminLogin(username.value, password.value)
    router.push('/admin/dashboard')
  } catch (e) {
    error.value = 'Incorrect password'
    password.value = ''
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* ── Page ─────────────────────────────────────────────────────────────────── */
.login-page {
  min-height: 100vh;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 24px;
  font-family: 'Inter', sans-serif;
}

/* Subtle dark dot grid on white */
.grid-overlay {
  position: fixed;
  inset: 0;
  background-image: radial-gradient(circle, rgba(0,0,0,0.055) 1px, transparent 1px);
  background-size: 28px 28px;
  pointer-events: none;
}

/* Decorative soft blobs */
.blob {
  position: fixed;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  opacity: 0.18;
  z-index: 0;
}
.blob-top-right {
  width: 520px;
  height: 520px;
  background: radial-gradient(circle, #d4d4d4 0%, transparent 70%);
  top: -160px;
  right: -160px;
}
.blob-bottom-left {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, #e0e0e0 0%, transparent 70%);
  bottom: -120px;
  left: -120px;
}

/* ── Card ─────────────────────────────────────────────────────────────────── */
.login-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  border-radius: 20px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow:
    0 1px 3px rgba(0,0,0,0.06),
    0 8px 24px rgba(0,0,0,0.08),
    0 24px 64px rgba(0,0,0,0.10);
  animation: slideUp 0.40s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(28px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0)    scale(1);    }
}

/* ── Header strip ─────────────────────────────────────────────────────────── */
.card-header {
  background: #ffffff;
  border-bottom: 1px solid rgba(0,0,0,0.07);
  padding: 20px 28px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.header-logo {
  width: 44px;
  height: 44px;
  background: #f3f4f6;
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}
.header-logo img {
  width: 30px;
  height: 30px;
  object-fit: contain;
  /* Natural logo colors — no invert */
}

.header-brand {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.header-title {
  font-size: 14px;
  font-weight: 700;
  color: #111111;
  letter-spacing: -0.01em;
}
.header-sub {
  font-size: 11.5px;
  color: #9ca3af;
  font-weight: 500;
  letter-spacing: 0.01em;
}

/* ── Card body ────────────────────────────────────────────────────────────── */
.card-body {
  background: #ffffff;
  padding: 36px 32px 32px;
}

/* ── Title block ──────────────────────────────────────────────────────────── */
.title-block { margin-bottom: 28px; }

.admin-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  color: #4b5563;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: 100px;
  margin-bottom: 16px;
}

.card-title {
  font-size: 26px;
  font-weight: 800;
  color: #111111;
  letter-spacing: -0.04em;
  line-height: 1.2;
  margin: 0 0 6px;
}
.card-subtitle {
  font-size: 13.5px;
  color: #6b7280;
  margin: 0;
  font-weight: 400;
}

/* ── Error ────────────────────────────────────────────────────────────────── */
.error-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fef2f2;
  border: 1px solid rgba(239,68,68,0.25);
  color: #991b1b;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 20px;
}

/* ── Form ─────────────────────────────────────────────────────────────────── */
.login-form { display: flex; flex-direction: column; gap: 18px; }

.field { display: flex; flex-direction: column; gap: 6px; }
.field label {
  font-size: 11px;
  font-weight: 700;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  background: #fafafa;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}
.input-wrap.focused {
  border-color: #111111;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(17,17,17,0.06);
}
.input-icon {
  position: absolute;
  left: 12px;
  color: #c4c9d4;
  pointer-events: none;
  flex-shrink: 0;
  transition: color 0.15s;
}
.input-wrap.focused .input-icon { color: #6b7280; }

.input-wrap input {
  flex: 1;
  padding: 12px 40px 12px 38px;
  border: none;
  background: transparent;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
  color: #111111;
  outline: none;
}
.input-wrap input::placeholder { color: #c4c9d4; }

.eye-btn {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: #c4c9d4;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  border-radius: 4px;
  transition: color 0.15s;
}
.eye-btn:hover { color: #374151; }

/* ── Submit ───────────────────────────────────────────────────────────────── */
.submit-btn {
  margin-top: 4px;
  width: 100%;
  padding: 13px 20px;
  background: #111111;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  font-size: 14.5px;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  letter-spacing: 0.01em;
}
.submit-btn:hover:not(:disabled) {
  background: #222222;
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.18);
}
.submit-btn:active:not(:disabled) { transform: translateY(0); }
.submit-btn:disabled { opacity: 0.45; cursor: not-allowed; }

.btn-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ── Spinner ──────────────────────────────────────────────────────────────── */
.btn-spinner {
  width: 18px; height: 18px;
  border: 2.5px solid rgba(255,255,255,0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Shake enter animation ────────────────────────────────────────────────── */
.shake-in-enter-active { animation: shake 0.4s ease; }
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-6px); }
  40%       { transform: translateX(6px); }
  60%       { transform: translateX(-4px); }
  80%       { transform: translateX(4px); }
}

/* ── Responsive ───────────────────────────────────────────────────────────── */
@media (max-width: 480px) {
  .card-body { padding: 28px 24px 24px; }
  .card-header { padding: 16px 20px; }
}
</style>
