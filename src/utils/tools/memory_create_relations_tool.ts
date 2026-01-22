/**
 * 记忆图谱 - 创建关系工具定义
 *
 * 功能: 在实体之间建立关系
 * 使用场景: 表达实体间的联系，如"认识"、"属于"、"影响"等
 */

export const createRelationsTool = {
	type: 'function',
	function: {
		name: 'memory_create_relations',
		description: '在实体之间创建关系。用于表达实体间的联系，如人物关系、从属关系、因果关系等。支持批量创建。',
		parameters: {
			type: 'object',
			properties: {
				relations: {
					type: 'array',
					description: '关系列表',
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
								description: '关系类型，例如："认识"、"属于"、"影响"、"位于"、"创建"'
							}
						},
						required: ['from', 'to', 'relationType']
					}
				},
				autoCreateEntities: {
					type: 'boolean',
					description: '是否自动创建缺失的实体（默认 false）',
					default: false
				}
			},
			required: ['relations']
		}
	}
};
