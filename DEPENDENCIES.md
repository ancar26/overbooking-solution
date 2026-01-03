# Complete Dependencies & Tools Guide

## 📦 All Required Packages

### System Requirements
- **Node.js**: 20.19+ or 22.12+ (installed via nvm)
- **npm**: 10.8+ (comes with Node.js)
- **nvm**: Node Version Manager (for switching Node.js versions)

---

## 🎯 Frontend Dependencies

### Production Dependencies (included in final app)
```json
{
  "react": "^19.2.0",           // UI library - creates interactive components
  "react-dom": "^19.2.0"        // Renders React components to the browser
}
```

### Development Dependencies (only for development)
```json
{
  "@eslint/js": "^9.39.1",                    // ESLint core rules
  "@types/react": "^19.2.5",                 // TypeScript types for React
  "@types/react-dom": "^19.2.3",             // TypeScript types for React DOM
  "@vitejs/plugin-react": "^5.1.1",          // Vite plugin to handle React
  "eslint": "^9.39.1",                        // Code quality checker
  "eslint-plugin-react-hooks": "^7.0.1",     // ESLint rules for React hooks
  "eslint-plugin-react-refresh": "^0.4.24",  // ESLint rules for React refresh
  "globals": "^16.5.0",                       // Global variables for ESLint
  "vite": "^7.2.4"                            // Build tool & dev server
}
```

**Total Frontend Packages**: 10 packages

---

## 🔧 Backend Dependencies

### Production Dependencies
```json
{
  "express": "^4.18.2",    // Web server framework
  "cors": "^2.8.5"         // Allows frontend to talk to backend
}
```

**Total Backend Packages**: 2 packages

---

## 📊 Complete Installation Commands

### Frontend
```bash
cd frontend
npm install
```

This installs all 10 packages listed above.

### Backend
```bash
cd backend
npm install
```

This installs all 2 packages listed above.

---

## 🔍 What Each Package Does

### Frontend Packages

| Package | Purpose | Why We Need It |
|---------|---------|----------------|
| **react** | UI library | Creates the user interface components |
| **react-dom** | Browser renderer | Displays React components in the browser |
| **vite** | Build tool | Fast development server & bundles code for production |
| **@vitejs/plugin-react** | Vite plugin | Makes Vite understand React code |
| **eslint** | Code linter | Finds errors and style issues in code |
| **@eslint/js** | ESLint rules | Standard JavaScript linting rules |
| **eslint-plugin-react-hooks** | React linting | Catches React hook mistakes |
| **eslint-plugin-react-refresh** | React refresh | Supports hot module replacement |
| **globals** | ESLint config | Defines browser/Node.js global variables |
| **@types/react** | TypeScript types | Better IDE support (even without TypeScript) |

### Backend Packages

| Package | Purpose | Why We Need It |
|---------|---------|----------------|
| **express** | Web framework | Creates HTTP server and API endpoints |
| **cors** | Cross-origin | Allows frontend (port 5173) to call backend (port 3000) |

---

## 🚀 Quick Reference: Install Everything

```bash
# Make sure you're using Node.js 20
nvm use 20

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install backend dependencies
cd backend && npm install && cd ..
```

