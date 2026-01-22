/**
 * 基础工具执行器
 *
 * 负责执行基础工具调用：
 *   - whoogle_search: 网络搜索
 *   - update_chat_title: 修改聊天标题
 *   - read_doc: 读取当前文档
 *   - obsidian_global_search: Obsidian 全局搜索
 *   - web_fetch: Web 抓取
 *   - obsidian_open_file: 打开文档
 */

import { WhoogleSearchResponse } from './whoogle';
import { ToolExecutorBase, ToolExecutionResult } from './tool_executor_base';

export class ToolExecutorBasic extends ToolExecutorBase {

	/**
	 * 执行 Whoogle 搜索
	 */
	async executeWhoogleSearch(args: { query: string; pageno?: number }): Promise<ToolExecutionResult> {
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
	 */
	async executeUpdateChatTitle(args: { title: string }): Promise<ToolExecutionResult> {
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
	 * 执行读取文档
	 */
	async executeReadDoc(args: any): Promise<ToolExecutionResult> {
		if (!this.readDocCallback) {
			return {
				success: false,
				toolName: 'read_doc',
				error: '文档读取回调未配置'
			};
		}

		try {
			console.log('[Tool Executor] 读取当前文档内容');

			const content = await this.readDocCallback();

			if (!content || content.trim() === '') {
				return {
					success: false,
					toolName: 'read_doc',
					error: '文档内容为空或不存在'
				};
			}

			console.log('[Tool Executor] ✓ 文档读取成功，长度:', content.length);

			return {
				success: true,
				toolName: 'read_doc',
				result: { content },
				displayText: `已读取文档内容（${content.length} 字符）`
			};
		} catch (error) {
			console.error('[Tool Executor] ✗ 读取文档失败:', error);
			return {
				success: false,
				toolName: 'read_doc',
				error: error.message
			};
		}
	}

	/**
	 * 执行 Obsidian 全局搜索
	 */
	async executeObsidianGlobalSearch(args: { query: string; limit?: number }): Promise<ToolExecutionResult> {
		if (!this.globalSearchCallback) {
			return {
				success: false,
				toolName: 'obsidian_global_search',
				error: '全局搜索回调未配置'
			};
		}

		try {
			console.log('[Tool Executor] 执行全局搜索，关键词:', args.query);

			const result = await this.globalSearchCallback(args.query, args.limit || 20);

			console.log('[Tool Executor] ✓ 全局搜索完成，结果数量:', result?.results?.length || 0);

			return {
				success: true,
				toolName: 'obsidian_global_search',
				result,
				displayText: `关键词"${args.query}"找到 ${result?.results?.length || 0} 条结果`
			};
		} catch (error) {
			console.error('[Tool Executor] ✗ 全局搜索失败:', error);
			return {
				success: false,
				toolName: 'obsidian_global_search',
				error: error.message
			};
		}
	}

	/**
	 * 执行 Web 抓取
	 */
	async executeWebFetch(args: { url: string; returnFormat?: 'markdown' | 'text' }): Promise<ToolExecutionResult> {
		try {
			console.log('[Tool Executor] 抓取网页:', args.url);

			// 使用 Obsidian 的 requestUrl API
			const Obsidian = (window as any).Obsidian;
			if (!Obsidian || !Obsidian.requestUrl) {
				return {
					success: false,
					toolName: 'web_fetch',
					error: 'Obsidian requestUrl API 不可用'
				};
			}

			const response = await Obsidian.requestUrl({
				url: args.url,
				method: 'GET'
			});

			if (response.status !== 200) {
				return {
					success: false,
					toolName: 'web_fetch',
					error: `HTTP ${response.status}: ${response.statusText}`
				};
			}

			const content = response.text || '';
			console.log('[Tool Executor] ✓ 网页抓取成功，长度:', content.length);

			return {
				success: true,
				toolName: 'web_fetch',
				result: { url: args.url, content, format: args.returnFormat || 'markdown' },
				displayText: `已抓取网页内容（${content.length} 字符）`
			};
		} catch (error) {
			console.error('[Tool Executor] ✗ 抓取网页失败:', error);
			return {
				success: false,
				toolName: 'web_fetch',
				error: error.message
			};
		}
	}

	/**
	 * 执行打开文档
	 */
	async executeObsidianOpenFile(args: { path: string }): Promise<ToolExecutionResult> {
		if (!this.openFileCallback) {
			return {
				success: false,
				toolName: 'obsidian_open_file',
				error: '打开文件回调未配置'
			};
		}

		try {
			console.log('[Tool Executor] 打开文档:', args.path);

			await this.openFileCallback(args.path);

			console.log('[Tool Executor] ✓ 文档已打开');

			return {
				success: true,
				toolName: 'obsidian_open_file',
				result: { path: args.path },
				displayText: `已打开文档: ${args.path}`
			};
		} catch (error) {
			console.error('[Tool Executor] ✗ 打开文档失败:', error);
			return {
				success: false,
				toolName: 'obsidian_open_file',
				error: error.message
			};
		}
	}
}
