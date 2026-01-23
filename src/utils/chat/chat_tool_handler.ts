import { Notice } from 'obsidian';
import { ToolCall } from '@/utils/llm/llm_driver_base';
import { ToolExecutor } from '@/utils/tools/tool_executor';
import { ChatUIManager } from '@/utils/chat/chat_ui';

/**
 * 工具调用处理器
 * 负责处理 Function Calling 相关逻辑
 */
export class ChatToolHandler {
	private toolExecutor: ToolExecutor;
	private ui: ChatUIManager;

	constructor(toolExecutor: ToolExecutor, ui: ChatUIManager) {
		this.toolExecutor = toolExecutor;
		this.ui = ui;
	}

	/**
	 * 处理工具调用
	 */
	async handleToolCalls(toolCalls: ToolCall[]): Promise<{ success: boolean; results: any[] }> {
		console.log('[Tool Handler] 开始处理工具调用，数量:', toolCalls.length);

		const results: any[] = [];

		try {
			for (const toolCall of toolCalls) {
				const result = await this.executeToolCall(toolCall);
				results.push(result);
			}

			return { success: true, results };
		} catch (error) {
			console.error('[Tool Handler] ✗ 处理工具调用异常:', error);
			new Notice(`工具调用失败: ${error.message}`);
			return { success: false, results };
		}
	}

	/**
	 * 执行单个工具调用
	 */
	private async executeToolCall(toolCall: ToolCall): Promise<any> {
		const toolName = toolCall.function.name;
		const toolArgs = JSON.parse(toolCall.function.arguments);

		console.log('[Tool Handler] 执行工具:', toolName, '参数:', toolArgs);

		// 显示工具调用状态
		const statusDiv = this.ui.addMessage('assistant', `🔧 调用工具: ${toolName}\n执行中...`);

		// 执行工具
		const result = await this.toolExecutor.executeToolCall(toolCall);

		// 移除旧的状态显示
		statusDiv.remove();

		// 更新工具调用状态
		if (result.success) {
			console.log('[Tool Handler] ✓ 工具执行成功:', result.displayText);

			// 使用 Markdown 渲染工具调用结果
			let statusText = `🔧 调用工具: ${toolName}\n✓ ${result.displayText}`;

			// 如果有搜索结果，添加到状态文本中
			if (result.result && result.result.results && result.result.results.length > 0) {
				const results = result.result.results.slice(0, 6);
				const validResults = results.filter((r: any) => r.title && r.title.trim() !== '' && r.url && r.url.trim() !== '');

				if (validResults.length > 0) {
					const resultsList = validResults.map((r: any, i: number) =>
						`${i + 1}. [${r.title}](${r.url})`
					).join('\n');

					statusText += `\n\n**搜索结果：**\n${resultsList}`;
				}
			}

			await this.ui.addMarkdownMessage('assistant', statusText);
		} else {
			console.error('[Tool Handler] ✗ 工具执行失败:', result.error);
			await this.ui.addMarkdownMessage('assistant', `🔧 调用工具: ${toolName}\n✗ 执行失败: ${result.error}`);
		}

		return result;
	}
}
