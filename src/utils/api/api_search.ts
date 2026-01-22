/**
 * Memory Server API - 搜索模块
 * 负责关键词搜索、语义搜索、图谱读取等查询操作
 */

import { APISystemClient } from './api_system';

/**
 * API 搜索客户端
 */
export class APISearchClient {
	constructor(private systemClient: APISystemClient) {}

	/**
	 * 搜索节点（关键词精确搜索）
	 *
	 * 在实体名称、类型、观察记录中匹配包含指定关键词的内容
	 * 支持多关键词搜索（空格分隔表示 AND 关系）
	 *
	 * @param query 搜索关键词
	 */
	async searchNodes(query: string): Promise<any> {
		return this.systemClient.request(
			`/tools/search/nodes?query=${encodeURIComponent(query)}`,
			'GET'
		);
	}

	/**
	 * 语义相似度搜索
	 *
	 * 基于向量找出与查询语义相关的实体，适合模糊搜索和概念关联
	 *
	 * @param query 搜索查询
	 * @param limit 返回结果数量限制，默认 10
	 */
	async semanticSearch(query: string, limit: number = 10): Promise<any> {
		return this.systemClient.request(
			`/tools/search/semantic?query=${encodeURIComponent(query)}&limit=${limit}`,
			'GET'
		);
	}

	/**
	 * 读取完整图谱（支持分页）
	 *
	 * @param limit 返回的实体数量限制（建议使用 20 避免 token 过多）
	 * @param offset 偏移量（用于分页，默认 0）
	 */
	async readGraph(limit?: number, offset: number = 0): Promise<any> {
		let url = `/tools/search/read_graph?offset=${offset}`;
		if (limit) {
			url += `&limit=${limit}`;
		}
		return this.systemClient.request(url, 'GET');
	}

	/**
	 * 按名称检索特定节点
	 *
	 * 返回指定名称的实体及其关系信息
	 *
	 * @param names 实体名称列表
	 */
	async openNodes(names: string[]): Promise<any> {
		return this.systemClient.request('/tools/search/open', 'POST', { names });
	}
}
