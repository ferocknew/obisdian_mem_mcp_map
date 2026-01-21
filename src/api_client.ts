import { App, requestUrl } from 'obsidian';

export interface MemoryServerConfig {
	apiUrl: string;
	apiKey?: string;
}

export interface APIEndpoint {
	path: string;
	method: string;
	summary: string;
	description?: string;
	tags?: string[];
}

/**
 * Memory Server API 客户端
 * 使用 Obsidian 的 requestUrl 来绕过 CORS 限制
 */
export class APIClient {
	private app: App;
	private config: MemoryServerConfig | null = null;
	private baseUrl: string = '';
	private endpoints: APIEndpoint[] = [];

	constructor(app: App) {
		this.app = app;
	}

	/**
	 * 连接到 Memory Server
	 * @param config 服务器配置
	 */
	async connect(config: MemoryServerConfig): Promise<void> {
		console.log('[API Client] 开始连接到 Memory Server');
		console.log('[API Client] API URL:', config.apiUrl);

		this.config = config;

		try {
			// 获取 OpenAPI 规范
			console.log('[API Client] 正在获取 OpenAPI 规范...');
			const response = await requestUrl({
				url: config.apiUrl,
				method: 'GET',
				headers: this.getHeaders()
			});

			if (response.status !== 200) {
				throw new Error(`HTTP ${response.status}: ${response.text}`);
			}

			// 解析 OpenAPI 规范
			const openApiSpec = JSON.parse(response.text);
			console.log('[API Client] OpenAPI 规范获取成功');
			console.log('[API Client] API 标题:', openApiSpec.info?.title);
			console.log('[API Client] API 版本:', openApiSpec.info?.version);

			// 提取 base URL（去掉 /openapi.json 部分）
			const url = new URL(config.apiUrl);
			this.baseUrl = `${url.protocol}//${url.host}`;
			console.log('[API Client] Base URL:', this.baseUrl);

			// 解析所有端点
			this.endpoints = this.parseEndpoints(openApiSpec);
			console.log('[API Client] ✓ 连接成功，找到', this.endpoints.length, '个 API 端点');

		} catch (error) {
			console.error('[API Client] ✗ 连接失败:', error);
			throw new Error(`连接 Memory Server 失败: ${error.message}`);
		}
	}

	/**
	 * 解析 OpenAPI 规范中的所有端点
	 */
	private parseEndpoints(spec: any): APIEndpoint[] {
		const endpoints: APIEndpoint[] = [];

		if (!spec.paths) {
			return endpoints;
		}

		for (const [path, pathItem] of Object.entries(spec.paths)) {
			for (const [method, operation] of Object.entries(pathItem as any)) {
				if (typeof operation === 'object' && operation !== null && 'operationId' in operation) {
					endpoints.push({
						path,
						method: method.toUpperCase(),
						summary: (operation as any).summary || '',
						description: (operation as any).description || '',
						tags: (operation as any).tags || []
					});
				}
			}
		}

		return endpoints;
	}

	/**
	 * 获取所有可用的 API 端点
	 */
	getEndpoints(): APIEndpoint[] {
		return this.endpoints;
	}

	/**
	 * 获取请求头
	 */
	private getHeaders(): Record<string, string> {
		const headers: Record<string, string> = {
			'Content-Type': 'application/json'
		};

		if (this.config?.apiKey) {
			headers['Authorization'] = `Bearer ${this.config.apiKey}`;
		}

		return headers;
	}

	/**
	 * 发送 API 请求
	 */
	async request(path: string, method: string = 'GET', body?: any): Promise<any> {
		if (!this.config) {
			throw new Error('API 客户端未连接');
		}

		const url = `${this.baseUrl}${path}`;
		console.log(`[API Client] ${method} ${url}`);

		try {
			const response = await requestUrl({
				url,
				method,
				headers: this.getHeaders(),
				body: body ? JSON.stringify(body) : undefined
			});

			if (response.status >= 400) {
				throw new Error(`HTTP ${response.status}: ${response.text}`);
			}

			return response.json;
		} catch (error) {
			console.error(`[API Client] 请求失败:`, error);
			throw error;
		}
	}

	/**
	 * 健康检查
	 */
	async healthCheck(): Promise<any> {
		return this.request('/health', 'GET');
	}

	/**
	 * 获取服务器状态
	 */
	async getStatus(): Promise<any> {
		return this.request('/status', 'GET');
	}

	/**
	 * 创建实体
	 */
	async createEntities(entities: Array<{
		name: string;
		entityType: string;
		observations?: string[];
	}>): Promise<any> {
		return this.request('/tools/entities/create', 'POST', { entities });
	}

	/**
	 * 添加观察记录
	 */
	async addObservations(observations: Array<{
		entityName: string;
		content: string;
	}>): Promise<any> {
		return this.request('/tools/entities/add_observations', 'POST', { observations });
	}

	/**
	 * 搜索节点（关键词精确搜索）
	 */
	async searchNodes(query: string): Promise<any> {
		return this.request(`/tools/search/nodes?query=${encodeURIComponent(query)}`, 'GET');
	}

	/**
	 * 语义搜索
	 */
	async semanticSearch(query: string, limit: number = 10): Promise<any> {
		return this.request(
			`/tools/search/semantic?query=${encodeURIComponent(query)}&limit=${limit}`,
			'GET'
		);
	}

	/**
	 * 读取完整图谱
	 */
	async readGraph(limit?: number, offset: number = 0): Promise<any> {
		let url = `/tools/search/read_graph?offset=${offset}`;
		if (limit) {
			url += `&limit=${limit}`;
		}
		return this.request(url, 'GET');
	}

	/**
	 * 断开连接
	 */
	async disconnect(): Promise<void> {
		console.log('[API Client] 断开连接');
		this.config = null;
		this.baseUrl = '';
		this.endpoints = [];
	}

	/**
	 * 检查是否已连接
	 */
	isConnected(): boolean {
		return this.config !== null && this.baseUrl !== '';
	}
}
