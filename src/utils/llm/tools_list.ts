/**
 * 工具列表 - 所有注入 AI 聊天的 Function Calling 工具定义
 * 从各个工具文件导入工具定义
 */

// ========== 基础工具 ==========
export { whoogleSearchTool } from '@/utils/tools/whoogle_search_tool';
export { updateChatTitleTool } from '@/utils/tools/update_title_tool';
export { readDocTool } from '@/utils/tools/read_doc_tool';
export { obsidianGlobalSearchTool } from '@/utils/tools/obsidian_global_search_tool';
export { webFetchTool } from '@/utils/tools/web_fetch_tool';
export { obsidianOpenFileTool } from '@/utils/tools/obsidian_open_file_tool';

// ========== 记忆图谱 - 创建类工具 ==========
export { createEntitiesTool } from '@/utils/tools/memory_create_entities_tool';
export { addObservationsTool } from '@/utils/tools/memory_add_observations_tool';
export { createRelationsTool } from '@/utils/tools/memory_create_relations_tool';

// ========== 记忆图谱 - 搜索类工具 ==========
export { searchNodesTool } from '@/utils/tools/memory_search_nodes_tool';
export { semanticSearchTool } from '@/utils/tools/memory_semantic_search_tool';
export { readGraphTool } from '@/utils/tools/memory_read_graph_tool';
export { openNodesTool } from '@/utils/tools/memory_open_nodes_tool';

// ========== 记忆图谱 - 删除类工具 ==========
export { deleteEntitiesTool } from '@/utils/tools/memory_delete_entities_tool';
export { deleteObservationsTool } from '@/utils/tools/memory_delete_observations_tool';
export { deleteRelationsTool } from '@/utils/tools/memory_delete_relations_tool';

// ========== 记忆图谱 - 管理类工具 ==========
export { generateEmbeddingsTool } from '@/utils/tools/memory_generate_embeddings_tool';
export { viewTrashTool } from '@/utils/tools/memory_view_trash_tool';
export { restoreDeletedTool } from '@/utils/tools/memory_restore_deleted_tool';
