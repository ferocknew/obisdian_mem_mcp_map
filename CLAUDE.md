# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个 Obsidian 插件项目,用于创建本地记忆图谱并与知识图谱记忆服务（Memory Server）交互。插件允许用户在 Obsidian 中配置和连接到记忆服务的 OpenAPI 接口,实现实体、关系、观察记录的管理和语义搜索功能。

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
obisdian_mem_mcp_map/
├── src/
│   ├── main.ts           # 插件主入口,继承自 Obsidian Plugin 类
│   ├── settings.ts       # 设置界面和配置管理
│   ├── api_client.ts     # API 客户端封装,处理与记忆服务的 HTTP 通信
│   └── search_view.ts    # 记忆图谱搜索视图,提供关键词和向量搜索界面
├── esbuild.config.mjs    # esbuild 构建配置
├── manifest.json         # Obsidian 插件清单
└── package.json         # 项目依赖配置
```

## 核心架构

### 插件架构

1. **MemoryGraphPlugin** (`src/main.ts`)
   - 继承自 Obsidian 的 `Plugin` 类
   - 管理插件生命周期: `onload()` 和 `onunload()`
   - 负责加载和保存设置
   - 注册 ribbon 图标和命令

2. **MemoryGraphSettingTab** (`src/settings.ts`)
   - Obsidian 设置页面的实现
   - 提供三个主要设置:
     - 同步目标目录选择器(从 vault 根目录获取文件夹列表)
     - Mem 服务器 API 地址(OpenAPI URL)
     - 服务器 API Key(可选的认证密钥)
   - 集成 APIClient 来测试连接并显示可用的 API 接口

3. **APIClient** (`src/api_client.ts`)
   - 封装 HTTP 客户端,使用 Obsidian 的 `requestUrl` API
   - 连接到知识图谱记忆服务的 OpenAPI 接口
   - 提供实体、关系、搜索等操作方法
   - 支持 Bearer Token 认证

4. **MemorySearchView** (`src/search_view.ts`)
   - 自定义侧边栏视图,提供记忆图谱搜索界面
   - 支持两种搜索模式:
     - 关键词搜索: 精确匹配实体名称、类型和观察记录
     - 向量搜索: 基于语义相似度的模糊搜索
   - 搜索结果可点击生成或同步本地 Markdown 文件
   - 自动生成实体文件夹结构: `<实体名>/<实体名>.md` 和 `<实体名>/观察/*.md`
   - 支持从图谱数据生成包含关系链接的 Markdown 文件

### API 配置格式

插件配置示例:

- **API 地址**: `https://aimem.n.6do.me:8086/openapi.json`
- **API Key**: 可选的 Bearer Token

### 可用的 API 接口

记忆服务提供以下主要功能:

**实体管理**:
- `POST /tools/entities/create` - 创建实体
- `POST /tools/entities/add_observations` - 添加观察记录
- `POST /tools/entities/delete` - 删除实体
- `POST /tools/entities/delete_observations` - 删除观察记录

**关系管理**:
- `POST /tools/relations/create` - 创建关系
- `POST /tools/relations/delete` - 删除关系

**搜索功能**:
- `GET /tools/search/read_graph` - 读取完整图谱(支持分页)
- `GET /tools/search/nodes` - 关键词精确搜索
- `POST /tools/search/open` - 按名称检索节点
- `GET /tools/search/semantic` - 语义相似度搜索
- `POST /tools/search/embeddings` - 生成向量

**回收站**:
- `GET /tools/trash/view` - 查看回收站
- `POST /tools/trash/restore` - 恢复已删除内容

## 构建系统

- **打包工具**: esbuild
- **入口文件**: `src/main.ts`
- **输出文件**: `main.js` (CommonJS 格式)
- **外部依赖**: obsidian, electron, CodeMirror 相关包等
- **Source Maps**: 开发模式启用 inline sourcemap

## 开发调试

1. 运行 `pnpm dev` 启动开发模式
2. 在 Obsidian 中打开开发者控制台查看日志:
   - macOS: `Cmd + Option + I`
   - Windows/Linux: `Ctrl + Shift + I`
3. 修改代码后按 `Cmd/Ctrl + R` 重新加载 Obsidian
4. 详细调试指南参见 `DEBUG.md`

## 代码规范

- **TypeScript 配置**:
  - 目标: ES6
  - 模块: ESNext
  - 启用严格模式: `noImplicitAny`, `strictNullChecks`
  - 模块解析: node

- **命名约定**:
  - 文件名: 小写,使用下划线分隔 (如: `api_client.ts`)
  - 类名: PascalCase (如: `APIClient`)
  - 函数/方法: camelCase (如: `testConnection`)

## Markdown 文件生成规则

搜索视图会根据图谱数据自动生成本地 Markdown 文件:

1. **文件结构**:
   - 主实体文件: `<同步目录>/<实体名>/<实体名>.md`
   - 观察文件: `<同步目录>/<实体名>/观察/<观察标题>.md`

2. **主实体文件内容**:
   - Frontmatter: 包含 title, id, tags, keywords, relations
   - 基本信息: 创建时间、观察数量
   - 关联关系: 使用 `[[目标实体]]` 格式的双向链接
   - 观察列表: 链接到观察文件

3. **观察文件内容**:
   - 观察内容文本
   - 反向链接到主实体

## 关键注意事项

- 使用 pnpm 而非 npm
- 修改代码后需要重新加载 Obsidian 才能生效
- API 连接使用 HTTPS 协议,通过 Obsidian 的 `requestUrl` 绕过 CORS 限制
- 设置页面会动态验证 API 配置并尝试连接服务器
- 支持 Bearer Token 认证方式
- 所有 console.log 带有前缀标识: `[API Client]`, `[Settings]`, `[Search View]`, `[Generate MD]`, `[Resync MD]`
- 搜索视图使用 `VIEW_TYPE_MEMORY_SEARCH` 作为视图类型标识
- 文件名中的特殊字符会被自动移除以避免文件系统问题
