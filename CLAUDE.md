# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个 Obsidian 插件项目,用于创建本地记忆图谱并与知识图谱记忆服务（Memory Server）交互。插件集成了 AI 聊天功能,支持 Function Calling 实现联网搜索、实体关系管理等智能化操作。

## 开发环境要求

- **Node.js 版本**: v24.12.0
- **包管理器**: pnpm (不使用 npm)
- **TypeScript**: 5.9.3

## 常用命令

```bash
# 安装依赖
pnpm install

# 开发模式(监听文件变化自动构建)
pnpm dev

# 生产构建(包含类型检查)
pnpm build

# 版本更新
pnpm version
```

## 项目结构

```
src/
├── main.ts                    # 插件主入口
├── settings.ts                # 设置界面和配置管理
├── api_client.ts              # 记忆服务 API 客户端
├── llm_client.ts              # LLM 客户端统一接口
├── search_view.ts             # 记忆图谱搜索侧边栏视图
├── types.d.ts                 # TypeScript 类型声明
│
├── utils/
│   ├── chat/                  # AI 聊天模块 (MVC 架构)
│   │   ├── chat_view.ts       # 对外接口
│   │   ├── chat_controller.ts # 业务逻辑控制器
│   │   ├── chat_ui.ts         # UI 管理器
│   │   ├── chat_state.ts      # 状态管理器
│   │   └── chat_types.ts      # 类型定义
│   │
│   ├── llm/                   # LLM 驱动层
│   │   ├── llm_driver_base.ts    # 驱动基类和接口定义
│   │   ├── llm_driver_anthropic.ts # Anthropic API 驱动
│   │   └── llm_driver_openai.ts     # OpenAI API 驱动
│   │
│   ├── tools/                 # Function Calling 工具
│   │   ├── tool_executor.ts   # 工具执行器
│   │   ├── tool_definitions.ts # 工具定义
│   │   └── whoogle.ts         # Whoogle 搜索客户端
│   │
│   ├── pages/                 # 页面组件
│   │   ├── search.ts          # 搜索页面实现
│   │   ├── settings.ts        # 设置页面实现
│   │   └── chat_view.css.ts   # 聊天界面样式
│   │
│   ├── search/                # 搜索相关
│   │   ├── search_result_processor.ts # 搜索结果处理
│   │   ├── markdown_generator.ts      # Markdown 生成器
│   │   └── entity_file_manager.ts    # 实体文件管理
│   │
│   └── settings/              # 设置相关
│       ├── configuration_tester.ts # 配置测试器
│       └── test_results_displayer.ts # 测试结果显示器
```

## 核心架构

### 插件架构

1. **MemoryGraphPlugin** (`src/main.ts`)
   - 继承自 Obsidian 的 `Plugin` 类
   - 管理插件生命周期、设置加载、右键菜单注册
   - 注册 `VIEW_TYPE_MEMORY_SEARCH` 视图类型

2. **MemorySearchView** (`src/search_view.ts`)
   - 侧边栏视图,包含标签页切换(关键词搜索、向量搜索、AI 聊天)
   - 初始化三个客户端: APIClient、LLMClient、WhoogleClient
   - 负责客户端配置的读取和传递

### AI 聊天系统 (MVC 架构)

位于 `src/utils/chat/`,采用严格的关注点分离:

- **chat_types.ts**: 所有接口和类型定义
  - `ChatConfig`: 聊天配置
  - `ChatState`: 聊天状态
  - `UIElements`: UI 元素引用
  - `ChatDependencies`: 组件依赖注入

- **chat_state.ts**: 状态管理器
  - 消息历史管理
  - 标题、功能开关管理
  - 生成状态和 AbortController 管理

- **chat_ui.ts**: UI 管理器
  - 创建所有界面元素
  - 消息渲染(支持 Markdown)
  - 按钮状态更新
  - 使用 Obsidian 的 `setIcon` 设置图标

- **chat_controller.ts**: 业务逻辑控制器
  - 处理消息发送和停止
  - 协调 ToolExecutor 执行工具调用
  - 处理搜索结果注入上下文并二次请求 AI
  - 标题编辑、新建聊天等交互

- **chat_view.ts**: 对外接口
  - 保持向后兼容的 API
  - 组合 State、UI、Controller
  - 提供简洁的 `setLLMClient()` 和 `setWhoogleClient()` 方法

### LLM 客户端架构

位于 `src/utils/llm/`,支持多个 AI 提供商:

- **llm_driver_base.ts**: 抽象基类
  - 定义统一的接口: `sendMessage()`, `sendMessageStream()`, `testConnection()`
  - 定义数据结构: `ChatMessage`, `ChatResponse`, `ToolCall`, `StreamChunk`
  - 支持 tools 参数传递给 AI

- **llm_driver_anthropic.ts**: Anthropic Claude 实现
  - 完整的请求/响应日志记录
  - 支持 tool_use 类型的 function calling
  - 错误处理和连接测试

- **llm_driver_openai.ts**: OpenAI/兼容 API 实现
  - 支持标准 OpenAI 函数调用格式
  - 完整的调试日志
  - AbortController 支持请求中止

- **llm_client.ts**: 统一客户端
  - 根据 `apiType` 选择驱动实现
  - 管理 AbortController 生命周期
  - 提供 `abort()` 方法用于停止生成

### Function Calling 系统

位于 `src/utils/tools/`:

- **tool_definitions.ts**: 工具定义
  - `getAvailableTools(webSearchEnabled)`: 动态返回可用工具列表
  - 定义 `whoogle_search` 工具的 schema
  - 易于扩展新工具

- **tool_executor.ts**: 工具执行器
  - `executeToolCall(toolCall)`: 执行单个工具
  - `executeWhoogleSearch(args)`: 执行搜索并格式化结果
  - `formatSearchResults()`: 将结果转为可读文本

- **whoogle.ts**: Whoogle 搜索客户端
  - 支持认证配置
  - 处理不同响应格式
  - 连接测试功能

### Function Calling 工作流程

```
用户发送消息
  ↓
ChatController.handleSendMessage()
  ↓
LLMClient.sendMessage(messages, tools) → AI API
  ↓
AI 返回 tool_calls
  ↓
ChatController.handleToolCalls()
  ↓
ToolExecutor.executeToolCall() → WhoogleClient.search()
  ↓
将搜索结果添加到消息历史
  ↓
LLMClient.sendMessage() → 再次请求 AI
  ↓
基于搜索结果生成最终回复
  ↓
ChatUIManager.addMarkdownMessage() → 渲染回复
```

## 路径别名系统

项目使用 `@/` 作为 `src/` 的别名:

```typescript
// ✅ 正确
import { ChatView } from '@/utils/chat/chat_view';
import { LLMClient } from '@/llm_client';

// ❌ 错误 (不要使用相对路径)
import { ChatView } from '../../utils/chat/chat_view';
```

esbuild 配置(`aliasPlugin`)处理路径解析,tsconfig.json 映射类型定义。

## 按钮状态管理

发送按钮根据 `isGenerating` 状态动态切换:
- **空闲状态**: 显示"发送",蓝色背景
- **生成中**: 显示"停止",红色背景(`ai-chat-stop-button`类)
- 点击停止时调用 `AbortController.abort()` 中止请求

## UI 渲染规范

- **图标**: 必须使用 Obsidian 的 `setIcon(element, iconId)` 函数
- **Markdown**: 使用 `MarkdownRenderer.render(app, content, container, sourcePath, component)`
- **样式**: CSS 定义在 `*.css.ts` 文件中,通过 `export const styles = \`...\`` 导出

## 配置管理

插件设置(`MemoryGraphSettings`)包含:
- LLM API: `llmApiUrl`, `llmApiKey`, `llmModelName`, `llmApiType`, `llmSystemRules`
- 搜索配置: `searchWhoogleUrl`, `searchAuthEnabled`, `searchAuthKey`
- 记忆服务: `mcpApiUrl`, `mcpApiKey`, `syncTargetFolder`

所有客户端在 `MemorySearchView.onOpen()` 中初始化并设置到 ChatView。

## Console 日志规范

所有日志带前缀标识:
- `[Chat Controller]`: 聊天控制器逻辑
- `[Chat State]`: 状态管理
- `[Chat UI]`: UI 操作
- `[LLM Client]`: LLM 客户端
- `[Anthropic Driver]` / `[OpenAI Driver]`: 驱动层
- `[Tool Executor]`: 工具执行
- `[Whoogle Client]`: 搜索客户端
- `[Search View]`: 搜索视图

详细日志包括:
- `>>> 请求内容:` (JSON)
- `<<< 响应内容:` (JSON)
- 工具调用参数和结果

## 构建系统

- **打包工具**: esbuild
- **入口文件**: `src/main.ts`
- **输出文件**: `main.js` (CommonJS 格式)
- **外部依赖**: obsidian, electron, CodeMirror 等
- **插件**: CSS loader (将 `.css` 转为 JS 模块), Alias resolver (支持 `@/` 路径)
- **Source Maps**: 开发模式 inline, 生产模式关闭

## 关键注意事项

- **必须使用 pnpm**,不支持 npm
- **路径导入统一使用 `@/` 别名**,避免相对路径
- **图标必须用 Obsidian 的 `setIcon()`**,不要自定义 SVG
- **修改代码后需重新加载 Obsidian** (`Cmd/Ctrl + R`)
- **ChatView 的依赖通过构造函数注入**,后期用 `setLLMClient()` / `setWhoogleClient()` 更新
- **Function Calling 需要 WhoogleClient 配置**,否则工具执行失败
- **停止生成使用 AbortController**,需同时设置到 LLMClient 和检查中止信号
- **Markdown 渲染需传入 app 实例**,不是 component.app
- **文件命名**: 小写+下划线 (如 `api_client.ts`, `chat_view.ts`)
- **类命名**: PascalCase (如 `LLMClient`, `ChatController`)
