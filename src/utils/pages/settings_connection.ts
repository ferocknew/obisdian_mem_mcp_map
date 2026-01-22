/**
 * 设置页面 - 连接测试模块
 *
 * 负责测试 API 连接并显示端点列表
 */

import { App } from 'obsidian';
import { APIClient, APIEndpoint } from '@/utils/api/api_client';
import type { MemoryGraphSettings } from '@/settings';

export class SettingsConnectionManager {
	private app: App;
	private apiClient: APIClient | null = null;

	constructor(app: App) {
		this.app = app;
	}

	/**
	 * 获取当前的 API 客户端
	 */
	getApiClient(): APIClient | null {
		return this.apiClient;
	}

	/**
	 * 设置 API 客户端
	 */
	setApiClient(client: APIClient | null): void {
		this.apiClient = client;
	}

	/**
	 * 测试连接并返回端点列表
	 */
	async testConnection(settings: MemoryGraphSettings): Promise<{ success: boolean; endpoints: APIEndpoint[]; error?: string }> {
		console.log('[Settings Connection] 开始测试连接到 Memory Server');

		// 验证配置
		if (!settings.mcpApiUrl) {
			return {
				success: false,
				endpoints: [],
				error: '请先配置 API 地址'
			};
		}

		try {
			// 断开之前的连接
			if (this.apiClient) {
				console.log('[Settings Connection] 断开之前的连接...');
				await this.apiClient.disconnect();
			}

			// 创建新的 API 客户端
			console.log('[Settings Connection] 创建新的 API 客户端...');
			this.apiClient = new APIClient(this.app);

			// 连接到服务器
			console.log('[Settings Connection] 连接到 Memory Server...');
			await this.apiClient.connect({
				apiUrl: settings.mcpApiUrl,
				apiKey: settings.mcpApiKey
			});
			console.log('[Settings Connection] ✓ 连接成功');

			// 获取端点列表
			const endpoints = this.apiClient.getEndpoints();
			console.log('[Settings Connection] ✓ 获取到', endpoints.length, '个 API 端点');

			return {
				success: true,
				endpoints
			};
		} catch (error) {
			console.error('[Settings Connection] ✗ 连接失败:', error);
			return {
				success: false,
				endpoints: [],
				error: error.message
			};
		}
	}

	/**
	 * 按标签分组端点
	 */
	groupEndpointsByTag(endpoints: APIEndpoint[]): Record<string, APIEndpoint[]> {
		const grouped: Record<string, APIEndpoint[]> = {};

		endpoints.forEach(endpoint => {
			const tag = endpoint.tags && endpoint.tags.length > 0
				? endpoint.tags[0]
				: '其他';

			if (!grouped[tag]) {
				grouped[tag] = [];
			}
			grouped[tag].push(endpoint);
		});

		return grouped;
	}

	/**
	 * 获取 HTTP 方法对应的颜色
	 */
	getMethodColor(method: string): string {
		switch (method.toUpperCase()) {
			case 'GET':
				return 'var(--text-success)';
			case 'POST':
				return 'var(--text-accent)';
			case 'PUT':
				return 'var(--text-warning)';
			case 'DELETE':
				return 'var(--text-error)';
			default:
				return 'var(--text-normal)';
		}
	}
}
