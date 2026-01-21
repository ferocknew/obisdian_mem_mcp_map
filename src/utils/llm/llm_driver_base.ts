export interface LLMTestResult {
	success: boolean;
	message: string;
	error?: string;
}

export interface LLMDriverConfig {
	apiUrl: string;
	apiKey: string;
	modelName: string;
}

export abstract class LLMDriverBase {
	protected config: LLMDriverConfig;

	constructor(config: LLMDriverConfig) {
		this.config = config;
	}

	abstract testConnection(): Promise<LLMTestResult>;

	protected validateConfig(): LLMTestResult | null {
		if (!this.config.apiUrl) {
			return { success: false, message: '请配置 LLM API URL' };
		}

		if (!this.config.apiKey) {
			return { success: false, message: '请配置 LLM API Key' };
		}

		if (!this.config.modelName) {
			return { success: false, message: '请配置模型名称' };
		}

		return null;
	}

	protected handleError(error: any, apiType: string): LLMTestResult {
		console.error(`[${apiType} Driver] 连接失败:`, error);

		let errorMessage = '连接失败';
		if (error.message.includes('401')) {
			errorMessage = 'API Key 无效或未授权';
		} else if (error.message.includes('404')) {
			errorMessage = '模型不存在或 API URL 错误';
		} else if (error.message.includes('429')) {
			errorMessage = 'API 请求频率超限';
		} else if (error.message.includes('500')) {
			errorMessage = 'API 服务器错误';
		}

		return {
			success: false,
			message: errorMessage,
			error: error.message
		};
	}
}
