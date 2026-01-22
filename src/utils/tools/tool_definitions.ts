/**
 * 工具定义管理器
 *
 * 负责管理所有 LLM Function Calling 工具的注册和获取
 * 从 tools_list.ts 导入所有工具定义
 */

import { whoogleSearchTool, updateChatTitleTool } from '@/utils/llm/tools_list';

/**
 * 获取所有可用工具
 *
 * @param enableWebSearch - 是否启用联网搜索功能
 * @returns 可用工具列表
 *
 * 工具可用性规则:
 *   - update_chat_title: 始终可用
 *   - whoogle_search: 根据 enableWebSearch 参数决定
 */
export function getAvailableTools(enableWebSearch: boolean): any[] {
	const tools: any[] = [];

	// 标题修改工具始终可用
	tools.push(updateChatTitleTool);

	// 联网搜索工具根据开关决定
	if (enableWebSearch) {
		tools.push(whoogleSearchTool);
	}

	console.log('[Tool Definitions] 可用工具数量:', tools.length, '联网搜索:', enableWebSearch);
	return tools;
}
