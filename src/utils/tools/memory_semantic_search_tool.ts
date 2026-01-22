/**
 * 记忆图谱 - 语义搜索工具定义
 *
 * 功能: 基于语义相似度进行搜索
 * 使用场景: 模糊搜索、概念关联查找、主题发现
 */

export const semanticSearchTool = {
	type: 'function',
	function: {
		name: 'memory_semantic_search',
		description: '基于语义相似度搜索知识图谱。使用向量找出与查询语义相关的实体，适合模糊搜索和概念关联。比关键词搜索更智能，能理解语义。',
		parameters: {
			type: 'object',
			properties: {
				query: {
					type: 'string',
					description: '搜索查询，可以是问题、描述或概念。例如："如何学习编程"、"人工智能相关技术"'
				},
				limit: {
					type: 'integer',
					description: '返回结果数量限制，默认 10',
					default: 10
				}
			},
			required: ['query']
		}
	}
};
