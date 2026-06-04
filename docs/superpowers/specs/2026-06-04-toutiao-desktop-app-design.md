# 头条文章写作助手 — 桌面端 APP 设计文档

> **架构**: Electron + PyInstaller | **目标平台**: Windows | **打包形态**: NSIS 安装包

---

## 1. 概述

将现有的 React + FastAPI Web 应用打包为 Windows 桌面端可执行程序。用户双击打开即可使用 12 步写作工作流，无需安装 Python/Node.js 开发环境。

**现有架构**:
```
React 18 + Vite (前端) ←→ /api/* proxy ←→ Python FastAPI (后端)
```
**目标架构**:
```
Electron (Chromium 窗口) ←→ localhost:17890 ←→ PyInstaller 打包的 backend.exe
```

## 2. 目录结构（新增/修改）

```
toutiao-writer/
├── electron/
│   ├── main.ts              # Electron 主进程 — 窗口 + 生命周期
│   ├── preload.ts            # 预加载脚本 — IPC 桥接
│   └── backend.ts            # Python 子进程管理器
├── electron-builder.yml      # electron-builder 打包配置
├── package.json (Root)       # Electron + 构建脚本依赖
├── tsconfig.electron.json    # Electron TypeScript 配置
├── scripts/
│   ├── build-backend.mjs     # PyInstaller 构建脚本
│   └── build-all.mjs         # 全量构建脚本
├── .gitignore                # 添加 build/ 目录
├── frontend/                  # 现有，无修改
├── backend/                   # 极小幅修改
│   ├── main.py               # 添加 --port 命令行参数
│   └── config.py             # 添加 backend_env_file 字段
└── build/
    ├── backend.exe            # PyInstaller 产物
    ├── frontend-dist/         # Vite 构建产物 (dist/)
    └── installer/             # electron-builder 产物
```

## 3. 组件设计

### 3.1 Electron 主进程 (`electron/main.ts`)

**职责**: 创建窗口，管理应用生命周期，协调前后端启停。

```
app.whenReady()
  → startBackend(port)        # 启动 Python 子进程
  → waitForHealthCheck()      # 轮询 /api/health 等待就绪
  → createWindow()            # 创建 BrowserWindow
  → loadFrontend()            # 生产模式加载文件 / 开发模式加载 Vite

app.on('window-all-closed')
  → stopBackend()             # SIGTERM 关闭子进程
  → app.quit()
```

**窗口参数**:
- 尺寸: 1400×900, 最小 1024×700
- contextIsolation: true, nodeIntegration: false
- preload 脚本注入安全的 electronAPI

### 3.2 后端进程管理 (`electron/backend.ts`)

**职责**: 启动/停止 Python 后端，健康检查，崩溃恢复。

| 功能 | 实现 |
|------|------|
| 启动 | 开发模式 `spawn('uvicorn', args)`，生产模式 `spawn(backend.exe, args)` |
| 端口 | 固定 17890，通过环境变量 `BACKEND_PORT` 传递 |
| 健康检查 | GET `/api/health` 轮询，最多等待 30 秒 |
| 环境变量 | 从 `%APPDATA%/toutiao-writer/.env` 读取用户 API Key |
| 日志 | stdout/stderr 重定向到 Electron 控制台 |
| 退出 | `SIGTERM` + 最多 2 秒等待 |

**崩溃恢复策略**:
```
backend crash → Electron 检测 exit code != 0
  → 显示"后端异常，正在重试..."提示
  → 等待 3 秒自动重启
  → 最多重试 3 次
  → 超过次数显示错误弹窗，由用户决定
```

### 3.3 预加载脚本 (`electron/preload.ts`)

**暴露的 API** (通过 `contextBridge`):

```typescript
window.electronAPI = {
  getBackendStatus(): Promise<{ running: boolean; port: number }>,
  selectExportDirectory(): Promise<string | null>,
  getAppVersion(): Promise<string>,
  onBackendStatus(callback): void,
}
```

### 3.4 Python 后端修改

**`backend/main.py`** — 添加 CLI 入口:
```python
import argparse

if __name__ == "__main__":
    import uvicorn
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=17890)
    parser.add_argument("--env-file", type=str, default="")
    args = parser.parse_args()

    os.environ.setdefault("BACKEND_ENV_FILE", args.env_file)
    uvicorn.run("main:app", host="127.0.0.1", port=args.port, log_level="info")
```

**`backend/config.py`** — 添加用户 .env 支持:
```python
class Settings(BaseSettings):
    # ... 现有字段保持不变 ...
    
    backend_env_file: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

@lru_cache()
def get_settings() -> Settings:
    s = Settings()
    # Electron 模式: 额外加载用户配置文件
    if s.backend_env_file and os.path.exists(s.backend_env_file):
        s = Settings(_env_file=s.backend_env_file)
    return s
```

## 4. API Key 管理

**用户配置存储**: `%APPDATA%/toutiao-writer/.env`

**首次启动流程**:
```
首次启动
  → 检测 %APPDATA%/toutiao-writer/.env 不存在
  → 跳转到设置页面 (Electron 内嵌)
  → 用户填入 DeepSeek API Key (必填)
  → 保存到 .env
  → 重启后端
  → 进入主界面
```

**`.env` 文件格式** (用户目录):
```
DEEPSEEK_API_KEY=sk-xxx
FIRECRAWL_API_KEY=fc-xxx
TAVILY_API_KEY=tvly-xxx
UNSPLASH_ACCESS_KEY=xxx
DOCX_OUTPUT_DIR=C:/Users/xxx/Documents/头条文章
```

## 5. 构建流程

### 5.1 前置条件

- Node.js >= 18
- Python >= 3.10
- pip 依赖已安装
- Rust 工具链 (electron-builder 需要, 部分 native 模块)

### 5.2 构建步骤

```bash
# Step 1: 构建前端
cd frontend && npm run build
# → frontend/dist/index.html + assets/

# Step 2: 打包 Python 后端
pyinstaller --onefile --name backend --distpath build backend/main.py
# → build/backend.exe (~30-50MB)

# Step 3: 安装 Electron 依赖
cd .. && npm install

# Step 4: 构建 Electron 安装包
npm run build:electron
# → build/installer/头条文章写作助手 Setup 1.0.0.exe
```

### 5.3 全量构建脚本

`scripts/build-all.mjs`:
```javascript
import { execSync } from 'child_process';
import { rmSync } from 'fs';

// 清理
rmSync('frontend/dist', { recursive: true, force: true });
rmSync('build', { recursive: true, force: true });

// 构建前端
execSync('cd frontend && npm run build', { stdio: 'inherit' });

// 打包后端
execSync('pyinstaller --onefile --name backend --distpath build backend/main.py', { stdio: 'inherit' });

// 构建 Electron 安装包
execSync('npx electron-builder --win', { stdio: 'inherit' });
```

## 6. 错误处理

| 场景 | 行为 |
|------|------|
| Python 后端启动失败 | 重试 3 次，每次间隔 3 秒，失败后显示错误弹窗 |
| 后端运行中崩溃 | 显示加载提示自动重启，3 次后弹窗让用户选择重试/退出 |
| 后端健康检查超时 | 显示"后端启动超时，请检查配置"，提供重试按钮 |
| API Key 未配置 | 首次使用自动弹出配置页面 |
| 网络请求失败（API Key 无效） | 后端返回 401，前端显示提示引导用户更新 Key |
| DOCX 导出目录不可写 | 回退到「文档」目录，提示用户 |
| Electron 窗口异常关闭 | 自动保存工作流状态 (localStorage 持久化已支持) |

## 7. 安全注意事项

- `contextIsolation: true` 禁止渲染进程直接访问 Node.js
- `nodeIntegration: false` 禁止渲染进程 require
- 后端绑定 `127.0.0.1` 仅本地可访问
- 用户 API Key 存储在 `%APPDATA%` 独立目录
- Python 子进程以当前用户权限运行

## 8. 组件关系图

```
┌──────────────────────────────────────────────────────────────────┐
│  electron/main.ts                                                │
│  ┌─────────────┐    ┌──────────────────┐    ┌─────────────────┐ │
│  │ BrowserWin  │◄──▶│  Backend Manager  │◄──▶│   Child Process  │ │
│  │             │    │  (backend.ts)     │    │   (backend.exe)  │ │
│  │  loadURL()  │    │  startBackend()   │    │                  │ │
│  │  loadFile() │    │  stopBackend()    │    │ uvicorn :17890   │ │
│  │  IPC 通信   │    │  healthCheck()    │    │                  │ │
│  └──────┬──────┘    └──────────────────┘    └──────────────────┘ │
│         │                                                       │
│  ┌──────┴──────┐                                                │
│  │  preload.ts  │                                                │
│  │  contextBridge → window.electronAPI                          │
│  └─────────────┘                                                │
└──────────────────────────────────────────────────────────────────┘
         │  IPC
┌────────▼─────────────────────────────────────────────────────────┐
│  BrowserWindow (Chromium)                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ React 18 App (frontend/dist/)                              ││
│  │  fetch('/api/...') → http://localhost:17890/api/...         ││
│  │  SSE /api/writing/article/stream (流式写作)                 ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## 9. 预计体积

| 组件 | 大小 |
|------|------|
| Electron 运行时 (Chromium) | ~45 MB |
| Python 后端 (PyInstaller) | ~35 MB |
| React 前端 (dist/) | ~1 MB |
| 其他依赖 (node_modules) | 打包不包含 |
| **安装包总计** | **~80-90 MB** |

