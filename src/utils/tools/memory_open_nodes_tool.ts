/**
 * 记忆图谱 - 按名称检索节点工具定义
 *
 * 功能: 按名称精确检索特定节点及其关系
 * 使用场景: 查看特定实体的详细信息和关系网络
 */

export const openNodesTool = {
	type: 'function',
	function: {
		name: 'memory_open_nodes',
		description: '按名称精确检索特定节点。返回指定名称的实体及其所有关系信息，包括关联的其他实体。',
		parameters: {
			type: 'object',
			properties: {
				names: {
					type: 'array',
					description: '实体名称列表',
					items: {
						type: 'string'
					}
				}
			},
			required: ['names']
		}
	}
};
