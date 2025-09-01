# VS Code Playwright Extension Setup Guide

## ✅ Configuration Complete!

I've configured VS Code with optimized Playwright settings. Here's what's been set up:

## 📁 Files Created

```
.vscode/
├── settings.json         # Playwright extension settings
├── launch.json          # Debug configurations
├── tasks.json           # Build and test tasks
├── extensions.json      # Recommended extensions
└── playwright.code-snippets # Code snippets for tests
```

## 🚀 How to Use

### 1. **Open Test Explorer**
- Click the **Testing** icon in the Activity Bar (left sidebar)
- Or press `Ctrl+Shift+P` → "Test: Focus on Test Explorer View"
- You'll see all your E2E tests in a tree view

### 2. **Run Tests Visually**
- ▶️ Click the play button next to any test to run it
- 🐛 Click the debug icon to debug with breakpoints
- 📁 Expand test suites to see individual test cases

### 3. **Debug Tests Step-by-Step**
- Set breakpoints by clicking in the gutter
- Right-click test → "Debug Test"
- Use `F10` (step over), `F11` (step into), `F5` (continue)

### 4. **Record New Tests**
- `Ctrl+Shift+P` → "Test: Record new test"
- Interact with your app in the browser
- VS Code generates the test code automatically!

### 5. **Code Snippets** (Type these prefixes + Tab)
- `pwtest` → Complete test suite with authentication
- `pwit` → Individual test case
- `pwlogin` → Login helper
- `pwnav` → Navigation and URL verification
- `pwform` → Form filling and submission
- `pwmobile` → Mobile viewport setup

## 🛠 Key Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+;` then `A` | Run all tests |
| `Ctrl+;` then `F` | Run failed tests |
| `Ctrl+;` then `T` | Run test at cursor |
| `F5` | Debug current test |
| `Ctrl+Shift+P` → "Test:" | All test commands |

## 🎯 Quick Start Workflow

1. **Start your dev server**: `npm run dev`

2. **Open Test Explorer** in VS Code

3. **See your tests**:
   ```
   📁 auth-flow.spec.ts
   ├── ✅ should login with valid credentials
   ├── ✅ should show validation errors
   └── 📁 Mobile Authentication
   
   📁 recipe-management.spec.ts
   ├── ✅ should create a new recipe
   └── 📁 Recipe Editing
   
   📁 search-and-favorites.spec.ts
   ├── ✅ should search recipes by title
   └── 📁 Recipe Favorites
   ```

4. **Run specific tests** by clicking ▶️

5. **Debug failing tests** by setting breakpoints and clicking 🐛

## 🔧 Debug Configurations

Three debug modes are available in the Debug panel (`Ctrl+Shift+D`):

1. **Debug Playwright Tests** - Debug all tests
2. **Debug Current Test File** - Debug only the current file
3. **Run Playwright UI Mode** - Interactive test runner

## 📊 Test Results

After running tests, you'll see:
- ✅ **Green checkmarks** for passing tests
- ❌ **Red X's** for failing tests
- **Screenshots** and **videos** for failed tests
- **Trace files** for detailed execution analysis

## 🎨 Enhanced Features

- **Auto-complete** for Playwright APIs
- **Syntax highlighting** for test files
- **IntelliSense** for test helpers and fixtures
- **Error highlighting** in real-time
- **Quick fixes** and refactoring suggestions

## 📱 Mobile Testing

Tests automatically run on both desktop and mobile viewports:
- Desktop Chrome, Firefox, Safari
- Mobile Chrome (Pixel 5), Mobile Safari (iPhone 12)

## 🚨 Pro Tips

1. **Use data-testid attributes** (already added to Navbar):
   ```typescript
   await page.click('[data-testid="user-menu-button"]');
   ```

2. **Leverage TestHelpers** for common operations:
   ```typescript
   const helpers = createTestHelpers(page);
   await helpers.loginAsUser();
   await helpers.createRecipe(testRecipes.chocolateCake);
   ```

3. **Use snippets** for faster test writing:
   - Type `pwtest` + Tab for a complete test suite
   - Type `pwit` + Tab for individual test cases

4. **Debug visually**:
   - Set breakpoints and step through tests
   - Use trace viewer for failed tests
   - Take screenshots during debugging

## 🎉 You're All Set!

The VS Code Playwright extension is now optimally configured for your Recipe Hub project. You can visually run, debug, and maintain your E2E tests with ease!

**Next Steps:**
1. Open the Testing panel in VS Code
2. Start your dev server (`npm run dev`)
3. Click ▶️ to run your first E2E test
4. Watch the magic happen! 🚀