# 🚀 Quick Start Guide

## ⚡ Fix Your Current Issue

**Problem**: Terminal shows Node.js 18.20.8, but Vite needs 20+

**Solution** - Run this in your terminal (zsh):
```bash
nvm use 20
node --version  # Should show: v20.19.6
```

**To make it permanent** (so you don't have to run `nvm use 20` every time):
```bash
nvm alias default 20
```

**Note**: Use **zsh** (your default shell) - nvm is already configured there. See `SHELL_GUIDE.md` for details.

---

## 📦 Complete Package List

### Frontend (10 packages)
- react, react-dom
- vite, @vitejs/plugin-react
- eslint + plugins
- TypeScript types

### Backend (2 packages)
- express
- cors

**See `DEPENDENCIES.md` for full details**

---

## 🔧 Tools Explained

| Tool | What It Does | Do You Need It? |
|------|--------------|-----------------|
| **nvm** | Switches Node.js versions | ✅ Yes - you have it |
| **Node.js** | Runs JavaScript code | ✅ Yes - need version 20+ |
| **npm** | Installs packages | ✅ Yes - comes with Node.js |
| **Vite** | Frontend dev server | ✅ Yes - installed via npm |
| **yarn** | Alternative to npm | ❌ No - npm is fine |

**See `TOOLS_EXPLAINED.md` for detailed explanation**

---

## ✅ Start Your App

### Terminal 1 - Backend
```bash
nvm use 20              # Make sure you're on Node.js 20
cd backend
npm start               # Server runs on http://127.0.0.1:3000
```

### Terminal 2 - Frontend
```bash
nvm use 20              # Make sure you're on Node.js 20
cd frontend
npm run dev            # App runs on http://127.0.0.1:5173
```

---

## 🎯 Remember

**Every new terminal needs**:
```bash
nvm use 20
```

**OR set it once as default**:
```bash
nvm alias default 20
```

Then all new terminals will use Node.js 20 automatically!

