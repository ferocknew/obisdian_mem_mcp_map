/**
 * 工具执行器
 *
 * 负责执行 LLM 请求的工具调用，包括:
 *   - whoogle_search: 网络搜索
 *   - update_chat_title: 修改聊天标题
 *
 * 架构说明:
 *   - 通过依赖注入设置外部客户端和回调
 *   - 支持批量执行多个工具调用
 *   - 统一的错误处理和日志记录
 */

import { WhoogleClient, WhoogleSearchResponse } from './whoogle';
import { ToolCall } from '../llm/llm_driver_base';

/**
 * 工具执行结果
 */
export interface ToolExecutionResult {
	success: boolean;
	toolName: string;
	result?: any;
	error?: string;
	displayText?: string;
}

/**
 * 工具执行器类
 */
export class ToolExecutor {
	private whoogleClient: WhoogleClient | null = null;
	private updateTitleCallback: ((title: string) => void) | null = null;

	/**
	 * 设置 Whoogle 客户端
	 *
	 * @param client - Whoogle 客户端实例，null 表示清空
	 */
	setWhoogleClient(client: WhoogleClient | null): void {
		this.whoogleClient = client;
		console.log('[Tool Executor] Whoogle 客户端已', client ? '设置' : '清空');
	}

	/**
	 * 设置标题更新回调
	 *
	 * @param callback - 标题更新回调函数，null 表示清空
	 */
	setUpdateTitleCallback(callback: ((title: string) => void) | null): void {
		this.updateTitleCallback = callback;
		console.log('[Tool Executor] 标题更新回调已', callback ? '设置' : '清空');
	}

	/**
	 * 执行单个工具调用
	 *
	 * @param toolCall - LLM 返回的工具调用对象
	 * @returns 工具执行结果
	 */
	async executeToolCall(toolCall: ToolCall): Promise<ToolExecutionResult> {
		const functionName = toolCall.function.name;
		const args = JSON.parse(toolCall.function.arguments);

		console.log(`[Tool Executor] 执行工具: ${functionName}，参数:`, args);

		try {
			switch (functionName) {
				case 'whoogle_search':
					return await this.executeWhoogleSearch(args);
				case 'update_chat_title':
					return await this.executeUpdateChatTitle(args);
				default:
					console.error(`[Tool Executor] ✗ 未知的工具: ${functionName}`);
					return {
						success: false,
						toolName: functionName,
						error: `未知的工具: ${functionName}`
					};
			}
		} catch (error) {
			console.error(`[Tool Executor] ✗ 工具执行异常:`, error);
			return {
				success: false,
				toolName: functionName,
				error: error.message
			};
		}
	}

	/**
	 * 执行 Whoogle 搜索
	 *
	 * @param args - 搜索参数 { query: string, pageno?: number }
	 * @returns 搜索结果
	 */
	private async executeWhoogleSearch(args: any): Promise<ToolExecutionResult> {
		if (!this.whoogleClient) {
			return {
				success: false,
				toolName: 'whoogle_search',
				error: 'Whoogle 客户端未配置'
			};
		}

		try {
			console.log('[Tool Executor] 开始 Whoogle 搜索，关键词:', args.query);

			const response = await this.whoogleClient.search({
				query: args.query,
				pageno: args.pageno || 1
			});

			console.log('[Tool Executor] ✓ 搜索完成，结果数量:', response.number_of_results);

			// 格式化搜索结果
			const formattedResults = this.formatSearchResults(response);

			return {
				success: true,
				toolName: 'whoogle_search',
				result: response,
				displayText: `找到 ${response.number_of_results} 条搜索结果`
			};
		} catch (error) {
			console.error('[Tool Executor] ✗ Whoogle 搜索失败:', error);
			return {
				success: false,
				toolName: 'whoogle_search',
				error: error.message
			};
		}
	}

	/**
	 * 执行修改聊天标题
	 *
	 * @param args - 标题参数 { title: string }
	 * @returns 执行结果
	 */
	private async executeUpdateChatTitle(args: any): Promise<ToolExecutionResult> {
		if (!this.updateTitleCallback) {
			return {
				success: false,
				toolName: 'update_chat_title',
				error: '标题更新回调未配置'
			};
		}

		try {
			const newTitle = args.title?.trim();

			if (!newTitle) {
				return {
					success: false,
					toolName: 'update_chat_title',
					error: '标题不能为空'
				};
			}

			console.log('[Tool Executor] 更新聊天标题:', newTitle);

			// 调用回调函数更新标题
			this.updateTitleCallback(newTitle);

			return {
				success: true,
				toolName: 'update_chat_title',
				result: { title: newTitle },
				displayText: `已将标题修改为: ${newTitle}`
			};
		} catch (error) {
			console.error('[Tool Executor] ✗ 更新标题失败:', error);
			return {
				success: false,
				toolName: 'update_chat_title',
				error: error.message
			};
		}
	}

	/**
	 * 格式化搜索结果为文本
	 *
	 * @param response - Whoogle 搜索响应
	 * @returns 格式化后的文本（只显示前 6 个结果）
	 */
	private formatSearchResults(response: WhoogleSearchResponse): string {
		let text = `搜索关键词: ${response.query}\n`;
		text += `找到 ${response.number_of_results} 条结果\n`;

		// 只显示前 6 个结果
		const displayResults = response.results.slice(0, 6);

		displayResults.forEach((result, index) => {
			text += `${index + 1}. [${result.title}](${result.url})\n`;
			if (result.content) {
				text += `   ${result.content}\n`;
			}
		});

		return text;
	}

	/**
	 * 批量执行多个工具调用
	 *
	 * @param toolCalls - 工具调用列表
	 * @returns 执行结果列表
	 */
	async executeToolCalls(toolCalls: ToolCall[]): Promise<ToolExecutionResult[]> {
		console.log('[Tool Executor] 批量执行工具，数量:', toolCalls.length);

		const results: ToolExecutionResult[] = [];

		for (const toolCall of toolCalls) {
			const result = await this.executeToolCall(toolCall);
			results.push(result);
		}

		console.log('[Tool Executor] ✓ 批量执行完成，成功:', results.filter(r => r.success).length, '失败:', results.filter(r => !r.success).length);
		return results;
	}
}
