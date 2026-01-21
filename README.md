# Obsidian Memory Graph Plugin

一个 Obsidian 插件，用于将笔记内容同步到知识图谱记忆服务，实现实体、关系、观察记录的管理和语义搜索功能。

## 功能特性

- 📁 选择 Obsidian vault 中的目录进行同步
- 🔗 连接到知识图谱记忆服务（Memory Server）
- 🔐 支持 API Key 认证
- 🧠 实体和关系管理
- 🔍 语义搜索和关键词搜索
- 🗑️ 回收站功能

## 技术栈

- TypeScript
- Obsidian Plugin API
- OpenAPI/REST API 集成

## 配置说明

### 1. 同步目标目录
从 Obsidian vault 根目录选择要同步的文件夹。

### 2. Mem 服务器配置
- **API 地址**：输入 OpenAPI 规范文件的完整 URL
  - 示例：`https://aimem.n.6do.me:8086/openapi.json`
- **API Key**：可选的认证密钥，用于 Bearer Token 认证

### 3. 测试连接
点击"测试连接"按钮验证配置是否正确，成功后会显示可用的 API 接口列表。

## 开发环境

**Node.js 版本：v24.12.0**

**注意：本项目使用 pnpm 作为包管理器，不使用 npm**

```bash
# 安装依赖
pnpm install

# 开发模式（监听文件变化自动构建）
pnpm dev

# 生产构建
pnpm build
```

## 参考资源

- [Obsidian 官方样例插件](https://github.com/obsidianmd/obsidian-sample-plugin)
- [Obsidian Local REST API](https://github.com/coddingtonbear/obsidian-local-rest-api)