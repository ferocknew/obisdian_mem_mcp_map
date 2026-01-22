/**
 * 记忆图谱 - 删除实体工具定义
 *
 * 功能: 逻辑删除实体（移至回收站）
 * 使用场景: 删除不再需要的实体，可以通过回收站恢复
 */

export const deleteEntitiesTool = {
	type: 'function',
	function: {
		name: 'memory_delete_entities',
		description: '逻辑删除实体及其关联关系（移至回收站）。注意：这是逻辑删除，不会物理删除数据，可以通过回收站恢复。',
		parameters: {
			type: 'object',
			properties: {
				entityNames: {
					type: 'array',
					description: '要删除的实体名称列表',
					items: {
						type: 'string'
					}
				}
			},
			required: ['entityNames']
		}
	}
};
