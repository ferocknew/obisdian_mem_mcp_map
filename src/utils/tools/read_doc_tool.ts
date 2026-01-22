/**
 * read_doc 工具定义
 *
 * 允许 AI 主动读取当前打开的笔记内容
 * 避免每次对话都将整个笔记内容塞入上下文，节省 token
 */

export const readDocTool = {
	type: 'function',
	function: {
		name: 'read_doc',
		description: '读取当前打开的笔记文档内容。当用户提到"当前文档"、"这个笔记"、"文件内容"等时，可以使用此工具获取完整内容。',
		parameters: {
			type: 'object',
			properties: {},
			required: []
		}
	}
};
