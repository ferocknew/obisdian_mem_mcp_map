/**
 * Whoogle client for web search
 */
import { requestUrl } from 'obsidian';

export interface WhoogleConfig {
	whoogleUrl: string;
	authEnabled: boolean;
	authKey: string;
}

export interface WhoogleSearchParams {
	query: string;
	pageno?: number;
	gl?: string;
	hl?: string;
}

export interface WhoogleSearchResult {
	title: string;
	url: string;
	content: string;
	engine: string;
	published_date?: string;
	image_url?: string;
}

export interface WhoogleSearchResponse {
	query: string;
	number_of_results: number;
	page: number;
	results: WhoogleSearchResult[];
	infoboxes?: any[];
	suggestions?: string[];
	related?: string[];
}

export class WhoogleClient {
	private config: WhoogleConfig;

	constructor(config: WhoogleConfig) {
		this.config = config;
	}

	/**
	 * Perform web search using Whoogle
	 *
	 * @param params - Search parameters
	 * @returns Search results
	 */
	async search(params: WhoogleSearchParams): Promise<WhoogleSearchResponse> {
		try {
			if (!this.config.whoogleUrl) {
				throw new Error('Whoogle URL 未配置');
			}

			const {
				query,
				pageno = 1,
				gl = 'cn',
				hl = 'zh-CN'
			} = params;

			// Prepare search parameters
			const searchParams = new URLSearchParams({
				q: query,
				format: 'json',
				gl: gl,
				hl: hl,
				pws: '0',
				cr: 'countryCN',
				lr: 'lang_zh-CN',
				page: pageno.toString()
			});

			// Prepare headers
			const headers: Record<string, string> = {
				'Content-Type': 'application/json'
			};

			// Add authorization if enabled
			if (this.config.authEnabled && this.config.authKey) {
				headers['Authorization'] = `Bearer ${this.config.authKey}`;
				console.log('[Whoogle Client] ✓ 已添加 Authorization Bearer Token');
			}

			// Build search URL
			const searchUrl = `${this.config.whoogleUrl.replace(/\/$/, '')}/search?${searchParams.toString()}`;
			console.log('[Whoogle Client] 搜索 URL:', searchUrl);

			// Make search request
			const response = await requestUrl({
				url: searchUrl,
				method: 'GET',
				headers: headers
			});

			if (response.status !== 200) {
				throw new Error(`HTTP 错误: ${response.status}`);
			}

			// Parse JSON response
			const data = response.json;

			// Format results
			const results: WhoogleSearchResponse = {
				query: query,
				number_of_results: 0,
				page: pageno,
				results: []
			};

			// Handle different response formats
			const resultList = data.results || [];
			if (Array.isArray(resultList)) {
				results.number_of_results = resultList.length;

				for (const result of resultList) {
					const formattedResult: WhoogleSearchResult = {
						title: result.title || '',
						url: result.url || result.link || '',
						content: result.content || result.snippet || result.description || '',
						engine: 'whoogle'
					};

					// Add optional fields if present
					if (result.publishedDate) {
						formattedResult.published_date = result.publishedDate;
					} else if (result.date) {
						formattedResult.published_date = result.date;
					}

					if (result.img_src) {
						formattedResult.image_url = result.img_src;
					} else if (result.image) {
						formattedResult.image_url = result.image;
					}

					results.results.push(formattedResult);
				}
			}

			// Add metadata if present
			if (data.infoboxes) {
				results.infoboxes = data.infoboxes;
			}
			if (data.suggestions) {
				results.suggestions = data.suggestions;
			}
			if (data.related) {
				results.related = data.related;
			}

			console.log('[Whoogle Client] ✓ 搜索完成:', results.number_of_results, '个结果');
			return results;

		} catch (error) {
			console.error('[Whoogle Client] ✗ 搜索失败:', error);
			if (error.message && error.message.includes('401')) {
				throw new Error('认证失败: API Key 无效或未授权');
			} else if (error.message && error.message.includes('404')) {
				throw new Error('Whoogle 服务未找到，请检查 URL 配置');
			} else if (error.message && error.message.includes('timeout')) {
				throw new Error('请求超时，请检查网络连接');
			} else {
				throw new Error(`Whoogle 搜索失败: ${error.message || '未知错误'}`);
			}
		}
	}

	/**
	 * Test connection to Whoogle service
	 *
	 * @returns Test result
	 */
	async testConnection(): Promise<{ success: boolean; message: string }> {
		try {
			if (!this.config.whoogleUrl) {
				return {
					success: false,
					message: '请先配置 Whoogle URL'
				};
			}

			// Try a simple search to test connectivity
			const result = await this.search({
				query: 'test',
				pageno: 1
			});

			return {
				success: true,
				message: `✓ Whoogle 连接成功，找到 ${result.number_of_results} 个测试结果`
			};

		} catch (error) {
			console.error('[Whoogle Client] ✗ 连接测试失败:', error);
			return {
				success: false,
				message: `连接失败: ${error.message}`
			};
		}
	}
}
