/**
 * Whoogle 客户端
 *
 * 用于通过 Whoogle 服务进行网络搜索
 * Whoogle 是一个隐私友好的 Google 搜索代理
 *
 * 功能:
 *   - 执行网络搜索并返回结构化结果
 *   - 支持认证配置
 *   - 支持多种搜索参数（地区、语言、分页等）
 *   - 连接测试功能
 */
import { requestUrl } from 'obsidian';

/**
 * Whoogle 配置
 */
export interface WhoogleConfig {
	whoogleUrl: string;
	authEnabled: boolean;
	authKey: string;
}

/**
 * 搜索参数
 */
export interface WhoogleSearchParams {
	query: string;        // 搜索关键词
	pageno?: number;      // 页码，默认 1
	gl?: string;          // 地区代码，默认 'cn'
	hl?: string;          // 语言代码，默认 'zh-CN'
}

/**
 * 单个搜索结果
 */
export interface WhoogleSearchResult {
	title: string;              // 标题
	url: string;                // 链接
	content: string;            // 摘要内容
	engine: string;             // 搜索引擎标识
	published_date?: string;    // 发布日期（可选）
	image_url?: string;         // 图片链接（可选）
}

/**
 * 搜索响应
 */
export interface WhoogleSearchResponse {
	query: string;                  // 搜索关键词
	number_of_results: number;      // 结果数量
	page: number;                   // 当前页码
	results: WhoogleSearchResult[]; // 搜索结果列表
	infoboxes?: any[];              // 信息框（可选）
	suggestions?: string[];         // 搜索建议（可选）
	related?: string[];             // 相关搜索（可选）
}

/**
 * Whoogle 客户端类
 */
export class WhoogleClient {
	private config: WhoogleConfig;

	constructor(config: WhoogleConfig) {
		this.config = config;
		console.log('[Whoogle Client] 初始化，URL:', config.whoogleUrl, '认证:', config.authEnabled);
	}

	/**
	 * 执行网络搜索
	 *
	 * @param params - 搜索参数
	 * @returns 搜索结果
	 * @throws 搜索失败时抛出错误
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
	 * 测试 Whoogle 服务连接
	 *
	 * @returns 测试结果
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
