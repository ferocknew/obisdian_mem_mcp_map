/**
 * 工具定义管理器
 *
 * 负责管理所有 LLM Function Calling 工具的注册和获取
 * 从 tools_list.ts 导入所有工具定义
 */

import {
	// 基础工具
	whoogleSearchTool,
	updateChatTitleTool,
	readDocTool,
	obsidianGlobalSearchTool,
	webFetchTool,
	obsidianOpenFileTool,
	// 记忆图谱 - 创建类
	createEntitiesTool,
	addObservationsTool,
	createRelationsTool,
	// 记忆图谱 - 搜索类
	searchNodesTool,
	semanticSearchTool,
	readGraphTool,
	openNodesTool,
	// 记忆图谱 - 删除类
	deleteEntitiesTool,
	deleteObservationsTool,
	deleteRelationsTool,
	// 记忆图谱 - 管理类
	generateEmbeddingsTool,
	viewTrashTool,
	restoreDeletedTool
} from '@/utils/llm/tools_list';

/**
 * 获取所有可用工具
 *
 * @param enableWebSearch - 是否启用联网搜索功能
 * @param hasContextDoc - 是否有可读取的上下文文档
 * @param enableMemoryGraph - 是否启用记忆图谱功能
 * @returns 可用工具列表
 *
 * 工具可用性规则:
 *   - update_chat_title: 始终可用
 *   - whoogle_search: 根据 enableWebSearch 参数决定
 *   - read_doc: 根据 hasContextDoc 参数决定
 *   - obsidian_global_search: 始终可用
 *   - web_fetch: 始终可用
 *   - obsidian_open_file: 始终可用
 *   - memory_*: 根据 enableMemoryGraph 参数决定（共 13 个）
 */
export function getAvailableTools(
	enableWebSearch: boolean,
	hasContextDoc: boolean = false,
	enableMemoryGraph: boolean = true
): any[] {
	const tools: any[] = [];

	// ========== 基础工具 ==========
	// 标题修改工具始终可用
	tools.push(updateChatTitleTool);

	// 联网搜索工具根据开关决定
	if (enableWebSearch) {
		tools.push(whoogleSearchTool);
	}

	// 文档读取工具：有上下文文档时可用
	if (hasContextDoc) {
		tools.push(readDocTool);
	}

	// Obsidian 全局搜索工具：始终可用
	tools.push(obsidianGlobalSearchTool);

	// Web 抓取工具：始终可用
	tools.push(webFetchTool);

	// 打开文档工具：始终可用
	tools.push(obsidianOpenFileTool);

	// ========== 记忆图谱工具 ==========
	if (enableMemoryGraph) {
		// 创建类工具（3个）
		tools.push(createEntitiesTool);
		tools.push(addObservationsTool);
		tools.push(createRelationsTool);

		// 搜索类工具（4个）
		tools.push(searchNodesTool);
		tools.push(semanticSearchTool);
		tools.push(readGraphTool);
		tools.push(openNodesTool);

		// 删除类工具（3个）
		tools.push(deleteEntitiesTool);
		tools.push(deleteObservationsTool);
		tools.push(deleteRelationsTool);

		// 管理类工具（3个）
		tools.push(generateEmbeddingsTool);
		tools.push(viewTrashTool);
		tools.push(restoreDeletedTool);
	}

	console.log(
		'[Tool Definitions] 可用工具数量:',
		tools.length,
		'| 联网搜索:',
		enableWebSearch,
		'| 文档读取:',
		hasContextDoc,
		'| 记忆图谱:',
		enableMemoryGraph
	);

	return tools;
}
