/**
 * 记忆图谱 - 创建实体工具定义
 *
 * 功能: 在知识图谱中创建新的实体
 * 使用场景: 记录新的人物、概念、事件等信息
 */

export const createEntitiesTool = {
	type: 'function',
	function: {
		name: 'memory_create_entities',
		description: '在知识图谱中创建新的实体。可以创建人物、概念、事件、地点等类型的实体，并添加观察记录。支持批量创建。',
		parameters: {
			type: 'object',
			properties: {
				entities: {
					type: 'array',
					description: '要创建的实体列表',
					items: {
						type: 'object',
						properties: {
							name: {
								type: 'string',
								description: '实体名称，例如："张三"、"Python编程"、"2024年AI峰会"'
							},
							entityType: {
								type: 'string',
								description: '实体类型，例如："人物"、"技术概念"、"事件"、"地点"、"组织"'
							},
							observations: {
								type: 'array',
								description: '关于该实体的观察记录列表（可选）',
								items: {
									type: 'string'
								}
							}
						},
						required: ['name', 'entityType']
					}
				}
			},
			required: ['entities']
		}
	}
};
