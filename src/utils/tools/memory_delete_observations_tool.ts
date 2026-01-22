/**
 * 记忆图谱 - 删除观察记录工具定义
 *
 * 功能: 逻辑删除特定的观察记录（移至回收站）
 * 使用场景: 删除过时或错误的观察记录
 */

export const deleteObservationsTool = {
	type: 'function',
	function: {
		name: 'memory_delete_observations',
		description: '逻辑删除实体的特定观察记录（移至回收站）。注意：这是逻辑删除，不会物理删除数据，可以通过回收站恢复。',
		parameters: {
			type: 'object',
			properties: {
				deletions: {
					type: 'array',
					description: '删除列表',
					items: {
						type: 'object',
						properties: {
							entityName: {
								type: 'string',
								description: '实体名称'
							},
							observations: {
								type: 'array',
								description: '要删除的观察内容列表',
								items: {
									type: 'string'
								}
							}
						},
						required: ['entityName', 'observations']
					}
				}
			},
			required: ['deletions']
		}
	}
};
