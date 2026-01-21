import { requestUrl } from 'obsidian';
import { LLMDriverBase, LLMDriverConfig, LLMTestResult } from './llm_driver_base';

export class OpenAILLMDriver extends LLMDriverBase {
	constructor(config: LLMDriverConfig) {
		super(config);
	}

	async testConnection(): Promise<LLMTestResult> {
		console.log('[OpenAI Driver] 开始测试连接...');

		const validationError = this.validateConfig();
		if (validationError) {
			return validationError;
		}

		try {
			const response = await requestUrl({
				url: `${this.config.apiUrl}/chat/completions`,
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${this.config.apiKey}`
				},
				body: JSON.stringify({
					model: this.config.modelName,
					max_tokens: 1,
					messages: [
						{
							role: 'user',
							content: 'Hi'
						}
					]
				})
			});

			if (response.status === 200) {
				console.log('[OpenAI Driver] ✓ 连接成功');
				return {
					success: true,
					message: `✓ OpenAI API 连接成功，模型 ${this.config.modelName} 可用`
				};
			} else {
				console.error('[OpenAI Driver] ✗ 返回错误状态:', response.status);
				return {
					success: false,
					message: `API 返回错误状态: ${response.status}`,
					error: JSON.stringify(response.json)
				};
			}
		} catch (error) {
			return this.handleError(error, 'OpenAI');
		}
	}
}
