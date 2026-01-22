/**
 * Obsidian 打开文档工具定义
 *
 * 功能: 在 Obsidian 中打开指定笔记
 * 使用场景: 引导用户打开特定的笔记文件
 */

export const obsidianOpenFileTool = {
	type: 'function',
	function: {
		name: 'obsidian_open_file',
		description: '在 Obsidian 中打开指定的笔记文件。可以用于引导用户查看某个特定的笔记或文档。',
		parameters: {
			type: 'object',
			properties: {
				path: {
					type: 'string',
					description: '笔记的相对路径或文件名，例如："我的笔记.md" 或 "文件夹/子笔记.md"'
				}
			},
			required: ['path']
		}
	}
};
