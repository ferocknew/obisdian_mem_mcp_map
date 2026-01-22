/**
 * 记忆图谱 - 添加观察记录工具定义
 *
 * 功能: 为已有实体添加新的观察记录
 * 使用场景: 补充实体信息、更新实体状态、记录新发现
 */

export const addObservationsTool = {
	type: 'function',
	function: {
		name: 'memory_add_observations',
		description: '为已有实体添加新的观察记录。用于补充实体信息、更新实体状态或记录新发现。支持批量添加。',
		parameters: {
			type: 'object',
			properties: {
				observations: {
					type: 'array',
					description: '观察记录列表',
					items: {
						type: 'object',
						properties: {
							entityName: {
								type: 'string',
								description: '实体名称，必须是已存在的实体'
							},
							content: {
								type: 'string',
								description: '观察内容，描述关于该实体的新信息或发现'
							}
						},
						required: ['entityName', 'content']
					}
				}
			},
			required: ['observations']
		}
	}
};
