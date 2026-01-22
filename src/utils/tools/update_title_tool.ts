/**
 * 修改聊天标题工具定义
 *
 * 功能: 修改当前聊天对话的标题
 * 使用场景:
 *   - 用户明确要求修改标题
 *   - 对话主题发生重大变化需要更新标题
 */

export const updateChatTitleTool = {
	type: 'function',
	function: {
		name: 'update_chat_title',
		description: '修改当前聊天对话的标题。当用户明确要求修改标题，或者对话主题发生重大变化需要更新标题时使用。',
		parameters: {
			type: 'object',
			properties: {
				title: {
					type: 'string',
					description: '新的聊天标题，应简洁明了地概括对话主题，建议不超过20个字符'
				}
			},
			required: ['title']
		}
	}
};
