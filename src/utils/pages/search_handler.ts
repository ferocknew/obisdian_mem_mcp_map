/**
 * 搜索页面 - 搜索处理模块
 *
 * 负责处理搜索逻辑
 */

import { Notice } from 'obsidian';
import { APIClient } from '@/utils/api/api_client';
import { SearchUIBuilder } from './search_ui';

export class SearchHandler {
	private apiClient: APIClient;
	private uiBuilder: SearchUIBuilder;

	constructor(apiClient: APIClient, uiBuilder: SearchUIBuilder) {
		this.apiClient = apiClient;
		this.uiBuilder = uiBuilder;
	}

	/**
	 * 处理搜索
	 */
	async handleSearch(query: string, searchType: 'keyword' | 'semantic'): Promise<{ success: boolean; results?: any; error?: string }> {
		if (!query.trim()) {
			new Notice('请输入搜索内容');
			return { success: false, error: '请输入搜索内容' };
		}

		console.log('搜索关键词:', query, '搜索类型:', searchType);

		// 检查 API 是否已连接
		if (!this.apiClient.isConnected()) {
			return { success: false, error: 'API 未连接，请先在设置中配置 API 地址' };
		}

		try {
			let results;
			if (searchType === 'keyword') {
				// 关键词搜索
				results = await this.apiClient.searchNodes(query);
			} else {
				// 向量搜索
				results = await this.apiClient.semanticSearch(query, 20);
			}

			console.log('搜索结果:', results);
			return { success: true, results };
		} catch (error) {
			console.error('搜索失败:', error);
			return { success: false, error: error.message };
		}
	}
}
