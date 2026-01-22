/**
 * Web 抓取工具定义
 *
 * 功能: 获取网页内容
 * 使用场景: 读取指定 URL 的网页内容
 */

export const webFetchTool = {
	type: 'function',
	function: {
		name: 'web_fetch',
		description: '获取指定 URL 的网页内容。可以读取网页的完整内容，支持转换为 Markdown 或纯文本格式。适用于读取文章、文档等网页内容。',
		parameters: {
			type: 'object',
			properties: {
				url: {
					type: 'string',
					description: '要抓取的网页 URL，例如："https://example.com/article"'
				},
				returnFormat: {
					type: 'string',
					description: '返回格式：markdown（默认）或 text',
					enum: ['markdown', 'text'],
					default: 'markdown'
				}
			},
			required: ['url']
		}
	}
};
