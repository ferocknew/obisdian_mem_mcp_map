/**
 * 记忆图谱 - 关键词搜索工具定义
 *
 * 功能: 在知识图谱中进行关键词精确搜索
 * 使用场景: 查找包含特定关键词的实体、观察记录
 */

export const searchNodesTool = {
	type: 'function',
	function: {
		name: 'memory_search_nodes',
		description: '在知识图谱中进行关键词精确搜索。在实体名称、类型、观察记录中匹配包含指定关键词的内容。支持多关键词搜索（空格分隔表示 AND 关系）。',
		parameters: {
			type: 'object',
			properties: {
				query: {
					type: 'string',
					description: '搜索关键词。支持多关键词，空格分隔表示 AND 关系。例如："Python 编程" 会搜索同时包含 Python 和编程的实体'
				}
			},
			required: ['query']
		}
	}
};
