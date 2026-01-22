/**
 * 工具定义 - 用于 LLM Function Calling
 */

/**
 * Whoogle 搜索工具定义
 */
export const whoogleSearchTool = {
	type: 'function',
	function: {
		name: 'whoogle_search',
		description: '使用 Whoogle 进行网络搜索，获取实时信息。适用于需要查询最新资讯、事实核查、获取网页内容等场景。',
		parameters: {
			type: 'object',
			properties: {
				query: {
					type: 'string',
					description: '搜索关键词或问题，例如："上海今天天气"、"2024年人工智能发展趋势"'
				},
				pageno: {
					type: 'integer',
					description: '搜索结果页码，默认为 1',
					default: 1
				}
			},
			required: ['query']
		}
	}
};

/**
 * 获取所有可用工具
 */
export function getAvailableTools(enableWebSearch: boolean): any[] {
	const tools: any[] = [];

	if (enableWebSearch) {
		tools.push(whoogleSearchTool);
	}

	return tools;
}
