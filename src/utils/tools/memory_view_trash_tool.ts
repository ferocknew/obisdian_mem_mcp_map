/**
 * 记忆图谱 - 查看回收站工具定义
 *
 * 功能: 查看已删除的内容
 * 使用场景: 查看历史删除记录、准备恢复数据
 */

export const viewTrashTool = {
	type: 'function',
	function: {
		name: 'memory_view_trash',
		description: '查看回收站中已删除的内容，包括实体和观察记录。支持分页查看。',
		parameters: {
			type: 'object',
			properties: {
				limit: {
					type: 'integer',
					description: '返回的实体数量限制，默认 20',
					default: 20
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
