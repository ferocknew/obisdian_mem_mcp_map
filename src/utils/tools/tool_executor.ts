/**
 * 工具执行器 - 主入口
 *
 * 负责执行 LLM 请求的工具调用，包括:
 *   - whoogle_search: 网络搜索
 *   - update_chat_title: 修改聊天标题
 *   - read_doc: 读取当前文档
 *   - obsidian_global_search: Obsidian 全局搜索
 *   - web_fetch: Web 抓取
 *   - obsidian_open_file: 打开文档
 *   - memory_*: 记忆图谱工具（13个）
 *
 * 架构说明:
 *   - 通过组合模式委托给专门的执行器
 *   - 支持批量执行多个工具调用
 *   - 统一的错误处理和日志记录
 */

import { ToolCall } from '../llm/llm_driver_base';
import { WhoogleClient } from './whoogle';
import { APIClient } from '@/utils/api/api_client';
import { ToolExecutorBasic } from './tool_executor_basic';
import { ToolExecutorMemory } from './tool_executor_memory';
import { ToolExecutionResult } from './tool_executor_base';

/**
 * 工具执行器主类
 *
 * 采用组合模式，委托给专门的执行器处理不同类型的工具
 */
export class ToolExecutor {
	private basicExecutor: ToolExecutorBasic;
	private memoryExecutor: ToolExecutorMemory;

	constructor() {
		this.basicExecutor = new ToolExecutorBasic();
		this.memoryExecutor = new ToolExecutorMemory();
	}

	/**
	 * 设置 Whoogle 客户端
	 */
	setWhoogleClient(client: WhoogleClient | null): void {
		this.basicExecutor.setWhoogleClient(client);
	}

	/**
	 * 设置 API 客户端（记忆图谱）
	 */
	setAPIClient(client: APIClient | null): void {
		this.basicExecutor.setAPIClient(client);
		this.memoryExecutor.setAPIClient(client);
	}

	/**
	 * 设置标题更新回调
	 */
	setUpdateTitleCallback(callback: ((title: string) => void) | null): void {
		this.basicExecutor.setUpdateTitleCallback(callback);
	}

	/**
	 * 设置文档读取回调
	 */
	setReadDocCallback(callback: (() => Promise<string>) | null): void {
		this.basicExecutor.setReadDocCallback(callback);
	}

	/**
	 * 设置全局搜索回调
	 */
	setGlobalSearchCallback(callback: ((query: string, limit: number) => Promise<any>) | null): void {
		this.basicExecutor.setGlobalSearchCallback(callback);
	}

	/**
	 * 设置打开文件回调
	 */
	setOpenFileCallback(callback: ((path: string) => Promise<void>) | null): void {
		this.basicExecutor.setOpenFileCallback(callback);
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
			// 基础工具
			switch (functionName) {
				case 'whoogle_search':
					return await this.basicExecutor.executeWhoogleSearch(args);
				case 'update_chat_title':
					return await this.basicExecutor.executeUpdateChatTitle(args);
				case 'read_doc':
					return await this.basicExecutor.executeReadDoc(args);
				case 'obsidian_global_search':
					return await this.basicExecutor.executeObsidianGlobalSearch(args);
				case 'web_fetch':
					return await this.basicExecutor.executeWebFetch(args);
				case 'obsidian_open_file':
					return await this.basicExecutor.executeObsidianOpenFile(args);
			}

			// 记忆图谱工具
			switch (functionName) {
				// 创建类工具
				case 'memory_create_entities':
					return await this.memoryExecutor.executeCreateEntities(args);
				case 'memory_add_observations':
					return await this.memoryExecutor.executeAddObservations(args);
				case 'memory_create_relations':
					return await this.memoryExecutor.executeCreateRelations(args);

				// 搜索类工具
				case 'memory_search_nodes':
					return await this.memoryExecutor.executeSearchNodes(args);
				case 'memory_semantic_search':
					return await this.memoryExecutor.executeSemanticSearch(args);
				case 'memory_read_graph':
					return await this.memoryExecutor.executeReadGraph(args);
				case 'memory_open_nodes':
					return await this.memoryExecutor.executeOpenNodes(args);

				// 删除类工具
				case 'memory_delete_entities':
					return await this.memoryExecutor.executeDeleteEntities(args);
				case 'memory_delete_observations':
					return await this.memoryExecutor.executeDeleteObservations(args);
				case 'memory_delete_relations':
					return await this.memoryExecutor.executeDeleteRelations(args);

				// 管理类工具
				case 'memory_generate_embeddings':
					return await this.memoryExecutor.executeGenerateEmbeddings(args);
				case 'memory_view_trash':
					return await this.memoryExecutor.executeViewTrash(args);
				case 'memory_restore_deleted':
					return await this.memoryExecutor.executeRestoreDeleted(args);
			}

			// 未知工具
			console.error(`[Tool Executor] ✗ 未知的工具: ${functionName}`);
			return {
				success: false,
				toolName: functionName,
				error: `未知的工具: ${functionName}`
			};
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
