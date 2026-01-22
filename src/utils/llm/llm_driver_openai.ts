import { requestUrl } from 'obsidian';
import { LLMDriverBase, LLMDriverConfig, LLMTestResult, ChatMessage, ChatResponse, ModelsListResult } from './llm_driver_base';

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

	async sendMessage(messages: ChatMessage[], tools?: any[]): Promise<ChatResponse> {
		console.log('[OpenAI Driver] 发送消息，历史记录数:', messages.length);

		const validationError = this.validateConfig();
		if (validationError) {
			return {
				success: false,
				error: validationError.message
			};
		}

		try {
			// 构建消息数组
			const apiMessages: any[] = [];

			// 如果配置了 SYSTEM 规则，添加到消息开头
			if (this.config.systemRules && this.config.systemRules.trim()) {
				apiMessages.push({
					role: 'system',
					content: this.config.systemRules
				});
				console.log('[OpenAI Driver] ✓ 已添加 SYSTEM 规则');
			}

			// 添加用户和助手的消息
			apiMessages.push(...messages.map(msg => ({
				role: msg.role,
				content: msg.content
			})));

			const requestBody: any = {
				model: this.config.modelName,
				max_tokens: (this.config.maxOutputTokens || 96) * 1024,
				messages: apiMessages
			};

			// 如果提供了 tools，添加到请求中
			if (tools && tools.length > 0) {
				requestBody.tools = tools;
				requestBody.tool_choice = 'auto';
				console.log('[OpenAI Driver] ✓ 已添加 Tools，数量:', tools.length);
			}

			console.log('[OpenAI Driver] >>> 请求内容:', JSON.stringify(requestBody, null, 2));

			const response = await requestUrl({
				url: `${this.config.apiUrl}/chat/completions`,
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${this.config.apiKey}`
				},
				body: JSON.stringify(requestBody)
			});

			console.log('[OpenAI Driver] <<< 响应状态:', response.status);

			if (response.status === 200) {
				const data = response.json;
				console.log('[OpenAI Driver] <<< 响应内容:', JSON.stringify(data, null, 2));

				const message = data.choices[0].message;
				const toolCalls = message.tool_calls;

				console.log('[OpenAI Driver] ✓ 收到回复，内容长度:', message.content?.length || 0, '工具调用数:', toolCalls?.length || 0);

				return {
					success: true,
					message: message.content || '',
					toolCalls: toolCalls,
					stopReason: data.choices[0].finish_reason
				};
			} else {
				console.error('[OpenAI Driver] ✗ API 返回错误:', response.status, response.json);
				return {
					success: false,
					error: `API 返回错误状态: ${response.status}`
				};
			}
		} catch (error) {
			console.error('[OpenAI Driver] ✗ 发送消息失败:', error);
			return {
				success: false,
				error: error.message || '发送消息失败'
			};
		}
	}

	async sendMessageStream(messages: ChatMessage[], tools?: any[], onChunk?: any): Promise<ChatResponse> {
		console.log('[OpenAI Driver] 开始流式发送消息');

		const validationError = this.validateConfig();
		if (validationError) {
			return {
				success: false,
				error: validationError.message
			};
		}

		try {
			const apiMessages: any[] = [];

			if (this.config.systemRules && this.config.systemRules.trim()) {
				apiMessages.push({
					role: 'system',
					content: this.config.systemRules
				});
			}

			apiMessages.push(...messages.map(msg => ({
				role: msg.role,
				content: msg.content
			})));

			const requestBody: any = {
				model: this.config.modelName,
				max_tokens: (this.config.maxOutputTokens || 96) * 1024,
				stream: true,
				messages: apiMessages
			};

			if (tools && tools.length > 0) {
				requestBody.tools = tools;
				requestBody.tool_choice = 'auto';
			}

			console.log('[OpenAI Driver Stream] >>> 请求内容:', JSON.stringify(requestBody, null, 2));

			// Note: Obsidian's requestUrl doesn't support streaming directly
			// For now, fall back to non-streaming
			return await this.sendMessage(messages, tools);

		} catch (error) {
			console.error('[OpenAI Driver] ✗ 流式发送失败:', error);
			return {
				success: false,
				error: error.message || '流式发送失败'
			};
		}
	}

	async fetchModelsList(): Promise<ModelsListResult> {
		console.log('[OpenAI Driver] 开始获取模型列表...');

		if (!this.config.apiUrl || !this.config.apiKey) {
			return {
				success: false,
				error: '请先配置 API URL 和 API Key'
			};
		}

		try {
			const response = await requestUrl({
				url: `${this.config.apiUrl}/models`,
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${this.config.apiKey}`
				}
			});

			if (response.status === 200) {
				const data = response.json;
				console.log('[OpenAI Driver] ✓ 获取模型列表成功，模型数量:', data.data?.length || 0);

				const models = (data.data || []).map((model: any) => ({
					id: model.id,
					name: model.id,
					description: model.owned_by ? `由 ${model.owned_by} 提供` : undefined
				}));

				return {
					success: true,
					models: models
				};
			} else {
				console.error('[OpenAI Driver] ✗ 获取模型列表失败:', response.status);
				return {
					success: false,
					error: `API 返回错误状态: ${response.status}`
				};
			}
		} catch (error) {
			console.error('[OpenAI Driver] ✗ 获取模型列表失败:', error);
			return {
				success: false,
				error: error.message || '获取模型列表失败'
			};
		}
	}
}
