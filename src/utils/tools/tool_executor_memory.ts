/**
 * 记忆图谱工具执行器
 *
 * 负责执行记忆图谱相关的13个工具调用
 */

import { ToolExecutorBase, ToolExecutionResult } from './tool_executor_base';

export class ToolExecutorMemory extends ToolExecutorBase {

	// ==================== 创建类工具 ====================

	/**
	 * 执行创建实体
	 */
	async executeCreateEntities(args: { entities: Array<{ name: string; entityType: string; observations?: string[] }> | string }): Promise<ToolExecutionResult> {
		const errorResult = this.checkAPIClient('memory_create_entities');
		if (errorResult) return errorResult;

		try {
			// 修复 AI 可能返回的 JSON 字符串
			let fixedEntities = args.entities;
			if (typeof fixedEntities === 'string') {
				console.log('[Tool Executor] 检测到 entities 是字符串，尝试解析...');
				try {
					fixedEntities = JSON.parse(fixedEntities);
					console.log('[Tool Executor] ✓ 解析成功:', fixedEntities);
				} catch (e) {
					console.error('[Tool Executor] ✗ 解析失败:', e);
					throw new Error('entities 参数格式错误：无法解析 JSON 字符串');
				}
			}

			const result = await this.apiClient!.create.createEntities(fixedEntities as any);
			const createdEntities = result.new_entities || [];
			const entityNames = createdEntities.map((e: any) => e.name).join('、');

			return {
				success: true,
				toolName: 'memory_create_entities',
				result,
				displayText: `已创建 ${createdEntities.length} 个实体: ${entityNames}`
			};
		} catch (error) {
			return {
				success: false,
				toolName: 'memory_create_entities',
				error: error.message
			};
		}
	}

	/**
	 * 执行添加观察记录
	 */
	async executeAddObservations(args: { observations: Array<{ entityName: string; content: string }> | string }): Promise<ToolExecutionResult> {
		const errorResult = this.checkAPIClient('memory_add_observations');
		if (errorResult) return errorResult;

		try {
			// 修复 AI 可能返回的 JSON 字符串
			let fixedObservations = args.observations;
			if (typeof fixedObservations === 'string') {
				console.log('[Tool Executor] 检测到 observations 是字符串，尝试解析...');
				try {
					fixedObservations = JSON.parse(fixedObservations);
					console.log('[Tool Executor] ✓ 解析成功:', fixedObservations);
				} catch (e) {
					console.error('[Tool Executor] ✗ 解析失败:', e);
					throw new Error('observations 参数格式错误：无法解析 JSON 字符串');
				}
			}

			const result = await this.apiClient!.create.addObservations(fixedObservations as any);
			return {
				success: true,
				toolName: 'memory_add_observations',
				result,
				displayText: `已为 ${result.results?.length || 0} 个实体添加观察记录`
			};
		} catch (error) {
			return {
				success: false,
				toolName: 'memory_add_observations',
				error: error.message
			};
		}
	}

	/**
	 * 执行创建关系
	 */
	async executeCreateRelations(args: { relations: Array<{ from: string; to: string; relationType: string }>; autoCreateEntities?: boolean }): Promise<ToolExecutionResult> {
		const errorResult = this.checkAPIClient('memory_create_relations');
		if (errorResult) return errorResult;

		try {
			// 修复 AI 可能返回的 JSON 字符串
			let fixedRelations = args.relations;
			if (typeof fixedRelations === 'string') {
				console.log('[Tool Executor] 检测到 relations 是字符串，尝试解析...');
				try {
					fixedRelations = JSON.parse(fixedRelations);
					console.log('[Tool Executor] ✓ 解析成功:', fixedRelations);
				} catch (e) {
					console.error('[Tool Executor] ✗ 解析失败:', e);
					throw new Error('relations 参数格式错误：无法解析 JSON 字符串');
				}
			}

			const result = await this.apiClient!.create.createRelations(fixedRelations, args.autoCreateEntities);
			return {
				success: true,
				toolName: 'memory_create_relations',
				result,
				displayText: `已创建 ${result.relations?.length || 0} 条关系`
			};
		} catch (error) {
			return {
				success: false,
				toolName: 'memory_create_relations',
				error: error.message
			};
		}
	}

	// ==================== 搜索类工具 ====================

	/**
	 * 执行关键词搜索
	 */
	async executeSearchNodes(args: { query: string }): Promise<ToolExecutionResult> {
		const errorResult = this.checkAPIClient('memory_search_nodes');
		if (errorResult) return errorResult;

		try {
			const result = await this.apiClient!.search.searchNodes(args.query);
			return {
				success: true,
				toolName: 'memory_search_nodes',
				result,
				displayText: `关键词"${args.query}"找到 ${result.results?.length || 0} 个匹配节点`
			};
		} catch (error) {
			return {
				success: false,
				toolName: 'memory_search_nodes',
				error: error.message
			};
		}
	}

	/**
	 * 执行语义搜索
	 */
	async executeSemanticSearch(args: { query: string; limit?: number }): Promise<ToolExecutionResult> {
		const errorResult = this.checkAPIClient('memory_semantic_search');
		if (errorResult) return errorResult;

		try {
			const result = await this.apiClient!.search.semanticSearch(args.query, args.limit || 10);
			return {
				success: true,
				toolName: 'memory_semantic_search',
				result,
				displayText: `语义搜索找到 ${result.results?.length || 0} 个相关节点`
			};
		} catch (error) {
			return {
				success: false,
				toolName: 'memory_semantic_search',
				error: error.message
			};
		}
	}

	/**
	 * 执行读取图谱
	 */
	async executeReadGraph(args: { limit?: number; offset?: number }): Promise<ToolExecutionResult> {
		const errorResult = this.checkAPIClient('memory_read_graph');
		if (errorResult) return errorResult;

		try {
			const result = await this.apiClient!.search.readGraph(args.limit, args.offset);
			return {
				success: true,
				toolName: 'memory_read_graph',
				result,
				displayText: `已读取图谱，包含 ${result.results?.length || 0} 个实体`
			};
		} catch (error) {
			return {
				success: false,
				toolName: 'memory_read_graph',
				error: error.message
			};
		}
	}

	/**
	 * 执行按名称检索节点
	 */
	async executeOpenNodes(args: { names: string[] | string }): Promise<ToolExecutionResult> {
		const errorResult = this.checkAPIClient('memory_open_nodes');
		if (errorResult) return errorResult;

		try {
			// 修复 AI 可能返回的 JSON 字符串
			let fixedNames = args.names;
			if (typeof fixedNames === 'string') {
				console.log('[Tool Executor] 检测到 names 是字符串，尝试解析...');
				try {
					fixedNames = JSON.parse(fixedNames);
					console.log('[Tool Executor] ✓ 解析成功:', fixedNames);
				} catch (e) {
					console.error('[Tool Executor] ✗ 解析失败:', e);
					throw new Error('names 参数格式错误：无法解析 JSON 字符串');
				}
			}

			const result = await this.apiClient!.search.openNodes(fixedNames as any);
			return {
				success: true,
				toolName: 'memory_open_nodes',
				result,
				displayText: `已检索 ${result.results?.length || 0} 个节点`
			};
		} catch (error) {
			return {
				success: false,
				toolName: 'memory_open_nodes',
				error: error.message
			};
		}
	}

	// ==================== 删除类工具 ====================

	/**
	 * 执行删除实体
	 */
	async executeDeleteEntities(args: { entityNames: string[] }): Promise<ToolExecutionResult> {
		const errorResult = this.checkAPIClient('memory_delete_entities');
		if (errorResult) return errorResult;

		try {
			const result = await this.apiClient!.delete.deleteEntities(args.entityNames);
			return {
				success: true,
				toolName: 'memory_delete_entities',
				result,
				displayText: `已删除 ${result.deleted_count || 0} 个实体`
			};
		} catch (error) {
			return {
				success: false,
				toolName: 'memory_delete_entities',
				error: error.message
			};
		}
	}

	/**
	 * 执行删除观察记录
	 */
	async executeDeleteObservations(args: { deletions: Array<{ entityName: string; observations: string[] }> | string }): Promise<ToolExecutionResult> {
		const errorResult = this.checkAPIClient('memory_delete_observations');
		if (errorResult) return errorResult;

		try {
			// 修复 AI 可能返回的 JSON 字符串
			let fixedDeletions = args.deletions;
			if (typeof fixedDeletions === 'string') {
				console.log('[Tool Executor] 检测到 deletions 是字符串，尝试解析...');
				try {
					fixedDeletions = JSON.parse(fixedDeletions);
					console.log('[Tool Executor] ✓ 解析成功:', fixedDeletions);
				} catch (e) {
					console.error('[Tool Executor] ✗ 解析失败:', e);
					throw new Error('deletions 参数格式错误：无法解析 JSON 字符串');
				}
			}

			const result = await this.apiClient!.delete.deleteObservations(fixedDeletions as any);
			return {
				success: true,
				toolName: 'memory_delete_observations',
				result,
				displayText: `已删除 ${result.deleted_count || 0} 条观察记录`
			};
		} catch (error) {
			return {
				success: false,
				toolName: 'memory_delete_observations',
				error: error.message
			};
		}
	}

	/**
	 * 执行删除关系
	 */
	async executeDeleteRelations(args: { relations: Array<{ from: string; to: string; relationType: string }> | string }): Promise<ToolExecutionResult> {
		const errorResult = this.checkAPIClient('memory_delete_relations');
		if (errorResult) return errorResult;

		try {
			// 修复 AI 可能返回的 JSON 字符串
			let fixedRelations = args.relations;
			if (typeof fixedRelations === 'string') {
				console.log('[Tool Executor] 检测到 relations 是字符串，尝试解析...');
				try {
					fixedRelations = JSON.parse(fixedRelations);
					console.log('[Tool Executor] ✓ 解析成功:', fixedRelations);
				} catch (e) {
					console.error('[Tool Executor] ✗ 解析失败:', e);
					throw new Error('relations 参数格式错误：无法解析 JSON 字符串');
				}
			}

			const result = await this.apiClient!.delete.deleteRelations(fixedRelations as any);
			return {
				success: true,
				toolName: 'memory_delete_relations',
				result,
				displayText: `已删除 ${result.deleted_count || 0} 条关系`
			};
		} catch (error) {
			return {
				success: false,
				toolName: 'memory_delete_relations',
				error: error.message
			};
		}
	}

	// ==================== 管理类工具 ====================

	/**
	 * 执行生成向量
	 */
	async executeGenerateEmbeddings(args: { entityNames?: string[]; limit?: number }): Promise<ToolExecutionResult> {
		const errorResult = this.checkAPIClient('memory_generate_embeddings');
		if (errorResult) return errorResult;

		try {
			const result = await this.apiClient!.create.generateEmbeddings(args.entityNames, args.limit);
			return {
				success: true,
				toolName: 'memory_generate_embeddings',
				result,
				displayText: '已生成向量嵌入'
			};
		} catch (error) {
			return {
				success: false,
				toolName: 'memory_generate_embeddings',
				error: error.message
			};
		}
	}

	/**
	 * 执行查看回收站
	 */
	async executeViewTrash(args: { limit?: number; offset?: number }): Promise<ToolExecutionResult> {
		const errorResult = this.checkAPIClient('memory_view_trash');
		if (errorResult) return errorResult;

		try {
			const result = await this.apiClient!.delete.viewTrash(args.limit, args.offset);
			return {
				success: true,
				toolName: 'memory_view_trash',
				result,
				displayText: `回收站中有 ${result.results?.length || 0} 个项目`
			};
		} catch (error) {
			return {
				success: false,
				toolName: 'memory_view_trash',
				error: error.message
			};
		}
	}

	/**
	 * 执行恢复已删除内容
	 */
	async executeRestoreDeleted(args: { entityNames?: string[]; observations?: Array<{ entityName: string; content: string }> }): Promise<ToolExecutionResult> {
		const errorResult = this.checkAPIClient('memory_restore_deleted');
		if (errorResult) return errorResult;

		try {
			const result = await this.apiClient!.delete.restoreDeleted(args.entityNames, args.observations);
			return {
				success: true,
				toolName: 'memory_restore_deleted',
				result,
				displayText: '已恢复删除的内容'
			};
		} catch (error) {
			return {
				success: false,
				toolName: 'memory_restore_deleted',
				error: error.message
			};
		}
	}
}
