/**
 * 记忆图谱 - 恢复已删除内容工具定义
 *
 * 功能: 从回收站恢复已删除的实体或观察记录
 * 使用场景: 恢复误删的数据
 */

export const restoreDeletedTool = {
	type: 'function',
	function: {
		name: 'memory_restore_deleted',
		description: '从回收站恢复已删除的记忆。恢复后，实体或观察记录将重新出现在搜索结果中。',
		parameters: {
			type: 'object',
			properties: {
				entityNames: {
					type: 'array',
					description: '要恢复的实体名称列表（可选）',
					items: {
						type: 'string'
					}
				},
				observations: {
					type: 'array',
					description: '要恢复的观察记录列表（可选）',
					items: {
						type: 'object',
						properties: {
							entityName: {
								type: 'string',
								description: '实体名称'
							},
							content: {
								type: 'string',
								description: '观察内容'
							}
						},
						required: ['entityName', 'content']
					}
				}
			}
		}
	}
};
