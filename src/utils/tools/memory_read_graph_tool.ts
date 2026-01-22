/**
 * 记忆图谱 - 读取图谱工具定义
 *
 * 功能: 读取完整的知识图谱或分页读取
 * 使用场景: 查看整体图谱结构、导出数据、全局分析
 */

export const readGraphTool = {
	type: 'function',
	function: {
		name: 'memory_read_graph',
		description: '读取完整的知识图谱。支持分页读取，避免一次性返回过多数据。建议使用分页参数控制数据量。',
		parameters: {
			type: 'object',
			properties: {
				limit: {
					type: 'integer',
					description: '返回的实体数量限制。建议使用 20 避免 token 过多'
				},
				offset: {
					type: 'integer',
					description: '偏移量，用于分页。默认 0',
					default: 0
				}
			}
		}
	}
};
