/**
 * 工具执行器 - 执行 LLM 请求的工具调用
 */

import { WhoogleClient, WhoogleSearchResponse } from './whoogle';
import { ToolCall } from '../llm/llm_driver_base';

export interface ToolExecutionResult {
	success: boolean;
	toolName: string;
	result?: any;
	error?: string;
	displayText?: string;
}

export class ToolExecutor {
	private whoogleClient: WhoogleClient | null = null;

	/**
	 * 设置 Whoogle 客户端
	 */
	setWhoogleClient(client: WhoogleClient | null): void {
		this.whoogleClient = client;
		console.log('[Tool Executor] Whoogle 客户端已', client ? '设置' : '清空');
	}

	/**
	 * 执行单个工具调用
	 */
	async executeToolCall(toolCall: ToolCall): Promise<ToolExecutionResult> {
		const functionName = toolCall.function.name;
		const args = JSON.parse(toolCall.function.arguments);

		console.log(`[Tool Executor] 执行工具: ${functionName}，参数:`, args);

		try {
			switch (functionName) {
				case 'whoogle_search':
					return await this.executeWhoogleSearch(args);
				default:
					return {
						success: false,
						toolName: functionName,
						error: `未知的工具: ${functionName}`
					};
			}
		} catch (error) {
			console.error(`[Tool Executor] 工具执行失败:`, error);
			return {
				success: false,
				toolName: functionName,
				error: error.message
			};
		}
	}

	/**
	 * 执行 Whoogle 搜索
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
	 * 格式化搜索结果为文本
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
	 */
	async executeToolCalls(toolCalls: ToolCall[]): Promise<ToolExecutionResult[]> {
		console.log('[Tool Executor] 批量执行工具，数量:', toolCalls.length);

		const results: ToolExecutionResult[] = [];

		for (const toolCall of toolCalls) {
			const result = await this.executeToolCall(toolCall);
			results.push(result);
		}

		return results;
	}
}
