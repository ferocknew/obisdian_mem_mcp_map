/**
 * Obsidian 全局搜索工具定义
 *
 * 功能: 在整个笔记库中搜索关键词
 * 使用场景: 查找包含特定关键词的所有笔记
 */

export const obsidianGlobalSearchTool = {
	type: 'function',
	function: {
		name: 'obsidian_global_search',
		description: '在整个 Obsidian 笔记库中搜索关键词。可以搜索所有 Markdown 文件的内容和标题，支持多关键词搜索。',
		parameters: {
			type: 'object',
			properties: {
				query: {
					type: 'string',
					description: '搜索关键词，例如："Python 编程" 或 "人工智能"'
				},
				limit: {
					type: 'number',
					description: '最大返回结果数量，默认 20',
					default: 20
				}
			},
			required: ['query']
		}
	}
};
