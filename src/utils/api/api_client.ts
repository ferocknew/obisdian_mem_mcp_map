/**
 * Memory Server API Client - 主入口
 * 整合所有 API 模块，提供统一的访问接口
 */

import { App } from 'obsidian';
import { APISystemClient, MemoryServerConfig } from './api_system';
import { APISearchClient } from './api_search';
import { APICreateClient } from './api_create';
import { APIDeleteClient } from './api_delete';

export type { MemoryServerConfig, APIEndpoint } from './api_system';
export type {
	EntityCreateParams,
	ObservationAddParams,
	RelationCreateParams
} from './api_create';
export type {
	ObservationDeleteParams,
	RelationDeleteParams,
	RestoreObservationParams
} from './api_delete';

/**
 * Memory Server API 客户端
 * 使用 Obsidian 的 requestUrl 来绕过 CORS 限制
 */
export class APIClient {
	private systemClient: APISystemClient;
	public search: APISearchClient;
	public create: APICreateClient;
	public delete: APIDeleteClient;

	constructor(app: App) {
		this.systemClient = new APISystemClient();
		this.search = new APISearchClient(this.systemClient);
		this.create = new APICreateClient(this.systemClient);
		this.delete = new APIDeleteClient(this.systemClient);
	}

	/**
	 * 连接到 Memory Server
	 * @param config 服务器配置
	 */
	async connect(config: MemoryServerConfig): Promise<void> {
		return this.systemClient.connect(config);
	}

	/**
	 * 健康检查
	 */
	async healthCheck(): Promise<any> {
		return this.systemClient.healthCheck();
	}

	/**
	 * 获取服务器状态
	 */
	async getStatus(): Promise<any> {
		return this.systemClient.getStatus();
	}

	/**
	 * 断开连接
	 */
	async disconnect(): Promise<void> {
		return this.systemClient.disconnect();
	}

	/**
	 * 检查是否已连接
	 */
	isConnected(): boolean {
		return this.systemClient.isConnected();
	}

	/**
	 * 获取所有可用的 API 端点
	 */
	getEndpoints() {
		return this.systemClient.getEndpoints();
	}

	// ============ 向后兼容的方法（保留旧的调用方式） ============

	/**
	 * @deprecated 使用 search.searchNodes 替代
	 */
	async searchNodes(query: string): Promise<any> {
		return this.search.searchNodes(query);
	}

	/**
	 * @deprecated 使用 search.semanticSearch 替代
	 */
	async semanticSearch(query: string, limit: number = 10): Promise<any> {
		return this.search.semanticSearch(query, limit);
	}

	/**
	 * @deprecated 使用 search.readGraph 替代
	 */
	async readGraph(limit?: number, offset: number = 0): Promise<any> {
		return this.search.readGraph(limit, offset);
	}

	/**
	 * @deprecated 使用 search.openNodes 替代
	 */
	async openNodes(names: string[]): Promise<any> {
		return this.search.openNodes(names);
	}

	/**
	 * @deprecated 使用 create.createEntities 替代
	 */
	async createEntities(entities: Array<{
		name: string;
		entityType: string;
		observations?: string[];
	}>): Promise<any> {
		return this.create.createEntities(entities);
	}

	/**
	 * @deprecated 使用 create.addObservations 替代
	 */
	async addObservations(observations: Array<{
		entityName: string;
		content: string;
	}>): Promise<any> {
		return this.create.addObservations(observations);
	}
}
