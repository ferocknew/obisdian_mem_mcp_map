/**
 * 记忆图谱 - 生成向量工具定义
 *
 * 功能: 为实体生成向量（用于语义搜索）
 * 使用场景: 初始化语义搜索功能、更新实体向量
 */

export const generateEmbeddingsTool = {
	type: 'function',
	function: {
		name: 'memory_generate_embeddings',
		description: '为实体生成向量（用于语义搜索）。可以为指定实体生成向量，或自动处理缺失向量的实体。',
		parameters: {
			type: 'object',
			properties: {
				entityNames: {
					type: 'array',
					description: '指定实体名称列表。如果为空，则处理缺失向量的实体',
					items: {
						type: 'string'
					}
				},
				limit: {
					type: 'integer',
					description: '处理数量限制（仅当 entityNames 为空时生效），默认 20',
					default: 20
				}
			}
		}
	}
};
