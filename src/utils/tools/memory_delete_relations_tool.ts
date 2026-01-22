/**
 * 记忆图谱 - 删除关系工具定义
 *
 * 功能: 逻辑删除实体间的关系
 * 使用场景: 删除不再成立的关系
 */

export const deleteRelationsTool = {
	type: 'function',
	function: {
		name: 'memory_delete_relations',
		description: '删除知识图谱中的特定关系。注意：这是逻辑删除，不会物理删除数据。',
		parameters: {
			type: 'object',
			properties: {
				relations: {
					type: 'array',
					description: '要删除的关系列表',
					items: {
						type: 'object',
						properties: {
							from: {
								type: 'string',
								description: '源实体名称'
							},
							to: {
								type: 'string',
								description: '目标实体名称'
							},
							relationType: {
								type: 'string',
								description: '关系类型'
							}
						},
						required: ['from', 'to', 'relationType']
					}
				}
			},
			required: ['relations']
		}
	}
};
