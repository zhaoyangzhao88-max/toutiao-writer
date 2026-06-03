# 今日头条爆款文章写作助手

> 基于 Claude API 的全栈 AI 写作工作台 —— 从素材采集到爆款标题，从五维诊断到反 AI 检测，一站式生成高质量头条文章。

---

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | React 18 + TypeScript + Tailwind CSS 3 | 界面与交互 |
| 状态管理 | Zustand + localStorage 持久化 | 12 步工作流状态自动保存 |
| 富文本 | TipTap 编辑器 + 移动端预览 | 所见即所得写作体验 |
| 后端 | Python FastAPI + Uvicorn | REST API + SSE 流式输出 |
| AI 引擎 | Anthropic Claude API (claude-sonnet-4-6) | 文章生成、诊断、优化 |
| 文档导出 | python-docx | Word 文档排版与封面 |

---

## 准备工作

| 工具 | 最低版本 | 检查命令 |
|------|----------|----------|
| Node.js | >= 18 | `node -v` |
| Python | >= 3.10 | `python --version` |
| Anthropic API Key | - | [申请地址](https://console.anthropic.com/) |
| Firecrawl API Key（可选） | - | [申请地址](https://firecrawl.dev/) |
| Tavily API Key（可选） | - | [申请地址](https://tavily.com/) |
| Unsplash Access Key（可选） | - | [申请地址](https://unsplash.com/developers) |

> Firecrawl 和 Tavily 是搜索能力的补充，不填也能使用基础功能。Unsplash 用于配图搜索。

---

## 快速开始

### 1. 克隆并进入项目

```bash
git clone <你的仓库地址>
cd toutiao-writer
```

### 2. 启动后端

```bash
cd backend

# 复制环境变量配置文件
cp .env.example .env

# 编辑 .env，填入你的 API Key（必填：ANTHROPIC_API_KEY）
# 用记事本或任意编辑器打开 .env 文件修改

# 安装 Python 依赖
pip install -r requirements.txt

# 启动后端服务（开发模式，文件修改自动重载）
uvicorn main:app --reload
```

后端启动后运行在 `http://localhost:8000`，可访问 `http://localhost:8000/api/health` 验证。

### 3. 启动前端

打开另一个终端窗口：

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 4. 打开浏览器

访问 **http://localhost:5173** 即可使用。

---

## 环境变量说明

编辑 `backend/.env` 文件，填入以下变量：

| 变量名 | 说明 | 是否必填 | 示例值 |
|--------|------|----------|--------|
| `ANTHROPIC_API_KEY` | Claude API 密钥，核心 AI 引擎 | **必填** | `sk-ant-api03-xxxxx` |
| `CLAUDE_MODEL` | 使用的 Claude 模型 | 可选，默认 `claude-sonnet-4-6` | `claude-sonnet-4-6` |
| `FIRECRAWL_API_KEY` | Firecrawl 搜索/抓取 API 密钥 | 可选 | `fc-xxxxx` |
| `TAVILY_API_KEY` | Tavily 搜索/提取 API 密钥 | 可选 | `tvly-xxxxx` |
| `UNSPLASH_ACCESS_KEY` | Unsplash 图片搜索密钥 | 可选 | `xxxxx` |
| `DOCX_OUTPUT_DIR` | Word 文档导出目录 | 可选 | `E:/VSCODE/文章` |

> 搜索采用三级降级策略：Firecrawl -> Tavily -> 直接 HTTP 请求。配置的 API Key 越多，搜索越稳定。

---

## 项目结构

```
toutiao-writer/
├── README.md
├── backend/
│   ├── .env.example              # 环境变量模板
│   ├── config.py                 # 配置管理（从 .env 读取）
│   ├── main.py                   # FastAPI 入口，路由注册
│   ├── requirements.txt          # Python 依赖
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py            # Pydantic 数据模型
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── material.py           # 素材获取 API
│   │   ├── writing.py            # 写作生成 API (SSE)
│   │   ├── optimize.py           # 诊断与优化 API
│   │   └── export.py             # DOCX 导出 API
│   └── services/
│       ├── __init__.py
│       ├── claude_client.py      # Claude API 调用封装
│       ├── search_client.py      # 三级降级搜索客户端
│       ├── docx_generator.py     # Word 文档生成器
│       └── prompts/
│           ├── __init__.py
│           ├── step4_deconstruct.py   # 概念拆解 Prompt
│           ├── step5_titles.py        # 标题生成 Prompt
│           ├── step6_article.py       # 正文写作 Prompt
│           ├── step7_diagnosis.py     # 五维诊断 Prompt
│           ├── step8_hook.py          # 开头优化 Prompt
│           └── step9_ai_check.py      # AI 检测 Prompt (22信号)
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.ts             # Vite 配置 + API 代理
    ├── tailwind.config.js
    ├── tsconfig.json
    └── src/
        ├── main.tsx               # React 入口
        ├── App.tsx                # 主应用 + 步骤路由
        ├── index.css              # 全局样式
        ├── lib/
        │   ├── api.ts             # API 请求封装
        │   └── constants.ts       # 12 步定义、触发器类型等常量
        ├── types/
        │   └── workflow.ts        # TypeScript 类型定义
        ├── store/
        │   └── useWorkflowStore.ts # Zustand 状态管理 + 持久化
        └── components/
            ├── layout/
            │   ├── AppShell.tsx    # 页面外壳（顶栏 + 步骤导航）
            │   └── StepNav.tsx     # 步骤指示器
            ├── ui/
            │   ├── Badge.tsx       # 标签组件
            │   ├── Button.tsx      # 按钮组件
            │   ├── Card.tsx        # 卡片组件
            │   ├── Modal.tsx       # 弹窗组件
            │   ├── ProgressBar.tsx # 进度条
            │   ├── StatusIcon.tsx  # 状态图标
            │   └── Stepper.tsx     # 步骤条
            └── steps/
                ├── Step1Material.tsx   # 素材获取
                ├── Step2Guide.tsx      # 好问题引导
                ├── Step3Extract.tsx    # 素材提炼
                ├── Step4Deconstruct.tsx # 概念拆解
                ├── Step5Titles.tsx     # 标题生成
                ├── Step6Editor.tsx     # 正文编辑器
                ├── Step7Diagnosis.tsx  # 五维诊断
                ├── Step8Hook.tsx       # 开头优化
                ├── Step9AiCheck.tsx    # AI 检测
                ├── Step10Images.tsx    # 配图
                ├── Step11Export.tsx    # 文档导出
                └── Step12Preview.tsx   # 展示发布
```

---

## 12 步工作流

| 步骤 | 名称 | 阶段 | 核心功能 |
|------|------|------|----------|
| 1 | 获取素材 | 分析与增补 | 三种模式输入原材料：URL 抓取、长文粘贴、话题搜索 |
| 2 | 好问题引导 | 分析与增补 | 五个关键问题帮你找准切入角度和写作方向 |
| 3 | 素材提炼 | 分析与增补 | AI 自动提取核心话题、关键数据、案例、金句 |
| 4 | 概念拆解 | 写作 | 识别模糊概念并替换为具体表达，消除"正确的废话" |
| 5 | 生成标题 | 写作 | 基于 8 种心理触发器生成高打开率标题 |
| 6 | 正文写作 | 写作 | AI 辅助写作，SSE 流式输出，TipTap 富文本编辑 |
| 7 | 五维诊断 | 暂停诊断 | 信息量、结构、情绪、语言、可信度五维度诊断报告 |
| 8 | 开头优化 | 优化 | 数据冲击 / 悬念 / 场景沉浸三种开头改写方案 |
| 9 | AI 检测 | 优化 | 22 个信号特征扫描，标注"AI 味"并给出修改建议 |
| 10 | 配图 | 交付 | 根据文章关键词自动搜索配图素材 |
| 11 | 生成文档 | 交付 | 导出 Word 文档，含排版格式和封面 |
| 12 | 展示发布 | 交付 | 最终预览，统计字数、段落数和预估阅读时长 |

### 阶段划分

```
┌───────────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ 分析与增补     │ -> │ 写作      │ -> │ 暂停诊断  │ -> │ 优化      │ -> │ 交付      │
│ 步骤 1-3      │    │ 步骤 4-6  │    │ 步骤 7    │    │ 步骤 8-9  │    │ 步骤 10-12│
│ 蓝            │    │ 紫        │    │ 琥珀      │    │ 绿        │    │ 玫瑰      │
└───────────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
```

---

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                      浏览器 (localhost:5173)                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  React 18 + Zustand（12 步工作流 + localStorage 持久化） │  │
│  │  TipTap 富文本编辑器  |  SSE 流式接收  |  移动端预览    │  │
│  └──────────────────────┬────────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────────┘
                          │ /api/*
                          │ Vite 代理
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              FastAPI 后端 (localhost:8000)                   │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐ │
│  │ material │  │ writing  │  │ optimize │  │   export   │ │
│  │  router  │  │  router  │  │  router  │  │   router   │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬──────┘ │
│       │              │             │              │         │
│  ┌────┴──────────────┴─────────────┴──────────────┴──────┐ │
│  │                   services 层                          │ │
│  │  claude_client  |  search_client  |  docx_generator   │ │
│  └────────────────────────┬──────────────────────────────┘ │
└───────────────────────────┼─────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
     ┌──────────┐   ┌─────────────┐   ┌──────────┐
     │  Claude  │   │  Firecrawl  │   │  Tavily  │
     │   API    │   │    API      │   │   API    │
     └──────────┘   └─────────────┘   └──────────┘
```

---

## 核心特性

### 3 种素材输入模式

| 模式 | 用途 | 流程 |
|------|------|------|
| URL 抓取 | 已有参考文章链接 | 输入网址 -> 自动抓取内容 -> 提炼素材 |
| 长文粘贴 | 已有草稿或素材 | 粘贴文字 -> AI 分析提炼 |
| 话题搜索 | 只有选题方向 | 输入关键词 -> 搜索相关资料 -> 提炼素材 |

### 3 级搜索降级

```
Firecrawl 搜索/抓取（最优先）
  └─ 失败或未配置 -> Tavily 搜索/提取（备用）
       └─ 失败或未配置 -> 直接 HTTP 请求（兜底）
```

无论配置了多少个 API Key，系统都能工作。配置越多，搜索越准确。

### 8 种标题心理触发器

| 触发器 | 核心原理 | 示例 |
|--------|----------|------|
| 认知冲突 | "你以为的其实都是错的" | 制造认知落差 |
| 好奇缺口 | "这件事背后藏着什么" | 勾起探索欲 |
| 恐惧损失 | "不做这件事你会后悔" | 损失厌恶驱动 |
| 争议挑衅 | "这个观点你敢认同吗" | 激发辩论冲动 |
| 社会证明 | "100 万人已经这样做了" | 从众效应 |
| 结果承诺 | "读完这篇文章你能省 1 万块" | 明确收益预期 |
| 身份代入 | "每一个打工人都应该看看" | 唤起群体认同 |
| 数字锚定 | "3 个方法让你的效率翻 10 倍" | 具体化吸引注意 |

### 五维诊断报告

每篇文章从五个维度自动评分诊断：
- **信息量**：是否有新知识、新数据、新观点
- **结构**：逻辑是否清晰、段落是否冗余
- **情绪**：情绪曲线是否自然、是否有共鸣点
- **语言**：表达是否简洁、是否有"正确的废话"
- **可信度**：数据是否有出处、案例是否具体

### AI 检测引擎（22 个信号特征）

分三级扫描，不与"是否 AI 写的"做二元判断，而是标注"哪里有人工味不足"：

- **强信号（4 项）**：零犹豫、虚假精确、伪真实故事、过度拟合深度
- **中信号（8 项）**：统一排比、平滑情绪曲线、翻译腔、过度连接词等
- **弱信号（10 项）**：结尾祝福、问句收尾、金句堆砌、无具体人名等

每个检测信号都提供**具体位置**和**可执行的修改建议**。

### SSE 流式文章生成

正文写作使用 Server-Sent Events 流式传输，Claude 每生成一个 token 即刻展示，无需等待全文完成。

### TipTap 富文本编辑器 + 移动端预览

基于 TipTap 的所见即所得编辑器，支持正文排版调整，并可预览移动端头条 App 展示效果。

### DOCX 导出

一键导出为 Word 文档，包含封面、排版格式和段落样式，可直接提交或发布。

### Zustand 状态持久化

整个 12 步工作流的状态自动保存到浏览器 localStorage。关闭页面、重启浏览器都不会丢失进度。

---

## 注意事项

### API Key

- **Anthropic API Key 是必填项**。没有它，AI 写作、诊断、优化功能无法使用。请先到 [Anthropic Console](https://console.anthropic.com/) 注册并获取密钥。
- Firecrawl 和 Tavily 是可选的。如果不配置，URL 抓取和话题搜索会走降级方案（直接 HTTP 请求），功能受限但可用。
- Unsplash 用于步骤 10 配图搜索，不配置不影响任何其他功能。

### 浏览器兼容

开发和使用推荐使用最新版 Chrome、Edge 或 Firefox。不支持 IE。

### 数据存储

工作流数据存储在浏览器 localStorage 中，不会上传到任何服务器。清除浏览器数据会导致进度丢失。

---

## 开发指南

### 添加新的写作步骤

1. **后端**：在 `backend/services/prompts/` 下创建新的 Prompt 文件，在 `backend/routers/` 中添加对应的 API 路由。
2. **前端**：在 `frontend/src/components/steps/` 下创建新步骤组件，在 `App.tsx` 的 `renderStep()` 中添加路由分支。
3. **类型定义**：在 `frontend/src/types/workflow.ts` 中添加该步骤的数据接口，并在 `WorkflowState` 中注册新字段。
4. **状态管理**：在 `frontend/src/store/useWorkflowStore.ts` 中添加对应的 setter。
5. **常量**：在 `frontend/src/lib/constants.ts` 中更新 `STEP_LABELS` 和 `PHASES`。

### 修改 AI Prompt

所有 Claude 调用的 System Prompt 都在 `backend/services/prompts/` 目录下，每个步骤一个文件。修改后重启后端即可生效。

### 调整工作流阶段

编辑 `frontend/src/lib/constants.ts` 中的 `PHASES` 数组，修改阶段名称、步骤归属和主题色。

---

## 许可证

MIT License

---

## 支持

遇到问题？有功能建议？

- 提交 Issue 到项目仓库
- 查看 `backend/.env.example` 确认环境变量配置是否正确
- 确认 Anthropic API Key 余额充足且未过期

---

**祝你写出十万加。**
