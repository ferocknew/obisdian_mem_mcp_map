import { LLMDriverBase, LLMTestResult } from './utils/llm/llm_driver_base';
import { AnthropicLLMDriver } from './utils/llm/llm_driver_anthropic';
import { OpenAILLMDriver } from './utils/llm/llm_driver_openai';

export interface LLMConfig {
	apiUrl: string;
	apiKey: string;
	modelName: string;
	apiType: 'anthropic' | 'openai';
}

export class LLMClient {
	private driver: LLMDriverBase;

	constructor(config: LLMConfig) {
		if (config.apiType === 'anthropic') {
			this.driver = new AnthropicLLMDriver({
				apiUrl: config.apiUrl,
				apiKey: config.apiKey,
				modelName: config.modelName
			});
		} else {
			this.driver = new OpenAILLMDriver({
				apiUrl: config.apiUrl,
				apiKey: config.apiKey,
				modelName: config.modelName
			});
		}
	}

	async testConnection(): Promise<LLMTestResult> {
		console.log('[LLM Client] 开始测试 LLM 连接...');
		return await this.driver.testConnection();
	}
}
