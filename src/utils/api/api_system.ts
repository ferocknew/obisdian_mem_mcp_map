/**
 * Memory Server API - 系统管理模块
 * 负责连接、健康检查、状态查询等系统级操作
 */

import { requestUrl } from 'obsidian';

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
 * API 系统管理客户端
 */
export class APISystemClient {
	private config: MemoryServerConfig | null = null;
	private baseUrl: string = '';
	private endpoints: APIEndpoint[] = [];

	/**
	 * 连接到 Memory Server
	 * @param config 服务器配置
	 */
	async connect(config: MemoryServerConfig): Promise<void> {
		console.log('[API System] 开始连接到 Memory Server');
		console.log('[API System] API URL:', config.apiUrl);

		this.config = config;

		try {
			// 获取 OpenAPI 规范
			console.log('[API System] 正在获取 OpenAPI 规范...');
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
			console.log('[API System] OpenAPI 规范获取成功');
			console.log('[API System] API 标题:', openApiSpec.info?.title);
			console.log('[API System] API 版本:', openApiSpec.info?.version);

			// 提取 base URL（去掉 /openapi.json 部分）
			const url = new URL(config.apiUrl);
			this.baseUrl = `${url.protocol}//${url.host}`;
			console.log('[API System] Base URL:', this.baseUrl);

			// 解析所有端点
			this.endpoints = this.parseEndpoints(openApiSpec);
			console.log('[API System] ✓ 连接成功，找到', this.endpoints.length, '个 API 端点');

		} catch (error) {
			console.error('[API System] ✗ 连接失败:', error);
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
	getHeaders(): Record<string, string> {
		const headers: Record<string, string> = {
			'Content-Type': 'application/json'
		};

		if (this.config?.apiKey) {
			headers['Authorization'] = `Bearer ${this.config.apiKey}`;
		}

		return headers;
	}

	/**
	 * 获取 Base URL
	 */
	getBaseUrl(): string {
		return this.baseUrl;
	}

	/**
	 * 发送 API 请求
	 */
	async request(path: string, method: string = 'GET', body?: any): Promise<any> {
		if (!this.config) {
			throw new Error('API 客户端未连接');
		}

		const url = `${this.baseUrl}${path}`;
		console.log(`[API System] ${method} ${url}`);
		if (body) {
			console.log(`[API System] >>> 请求体:`, JSON.stringify(body, null, 2));
		}

		try {
			const response = await requestUrl({
				url,
				method,
				headers: this.getHeaders(),
				body: body ? JSON.stringify(body) : undefined
			});

			if (response.status >= 400) {
				console.error(`[API System] <<< 响应错误 (${response.status}):`, response.text);
				throw new Error(`HTTP ${response.status}: ${response.text}`);
			}

			return response.json;
		} catch (error) {
			console.error(`[API System] 请求失败:`, error);
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
	 * 断开连接
	 */
	async disconnect(): Promise<void> {
		console.log('[API System] 断开连接');
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
