import { requestUrl } from 'obsidian';
import { LLMDriverBase, LLMDriverConfig, LLMTestResult, ChatMessage, ChatResponse, ModelsListResult } from './llm_driver_base';

export class AnthropicLLMDriver extends LLMDriverBase {
	constructor(config: LLMDriverConfig) {
		super(config);
	}

	// 构建完整的 API URL，智能处理路径
	private buildApiUrl(path: string): string {
		const baseUrl = this.config.apiUrl.trim();
		// 如果用户已经配置了完整路径（包含 /messages 或 /v1/messages），直接使用
		if (baseUrl.includes('/messages')) {
			return baseUrl;
		}
		// 否则按照规范拼接：base url + /v1/messages
		return `${baseUrl}/v1${path}`;
	}

	// 检查是否是智谱 AI
	private isZhipuAI(): boolean {
		return this.config.apiUrl.includes('bigmodel.cn');
	}

	// 转换 tools 格式以兼容不同的 API 提供商
	private convertToolsFormat(tools: any[]): any[] {
		if (!tools || tools.length === 0) {
			return tools;
		}

		// 智谱 AI 需要将 name 字段提升到顶层
		if (this.isZhipuAI()) {
			return tools.map(tool => {
				if (tool.type === 'function' && tool.function) {
					return {
						type: 'function',
						name: tool.function.name,
						description: tool.function.description,
						parameters: tool.function.parameters
					};
				}
				return tool;
			});
		}

		return tools;
	}

	async testConnection(): Promise<LLMTestResult> {
		console.log('[Anthropic Driver] 开始测试连接...');

		const validationError = this.validateConfig();
		if (validationError) {
			return validationError;
		}

		try {
			const response = await requestUrl({
				url: this.buildApiUrl('/messages'),
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': this.config.apiKey,
					'anthropic-version': '2023-06-01'
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
				console.log('[Anthropic Driver] ✓ 连接成功');
				return {
					success: true,
					message: `✓ Anthropic API 连接成功，模型 ${this.config.modelName} 可用`
				};
			} else {
				console.error('[Anthropic Driver] ✗ 返回错误状态:', response.status);
				return {
					success: false,
					message: `API 返回错误状态: ${response.status}`,
					error: JSON.stringify(response.json)
				};
			}
		} catch (error) {
			return this.handleError(error, 'Anthropic');
		}
	}

	async sendMessage(messages: ChatMessage[], tools?: any[]): Promise<ChatResponse> {
		console.log('[Anthropic Driver] 发送消息，历史记录数:', messages.length);

		const validationError = this.validateConfig();
		if (validationError) {
			return {
				success: false,
				error: validationError.message
			};
		}

		try {
			// 构建符合 Anthropic API 规范的消息数组
			const buildAnthropicMessages = (messages: ChatMessage[]): any[] => {
				return messages.map(msg => {
					// 处理 assistant 消息（可能包含 tool_calls）
					if (msg.role === 'assistant' && msg.toolCalls && msg.toolCalls.length > 0) {
						const contentBlocks: any[] = msg.toolCalls.map(tc => ({
							type: 'tool_use',
							id: tc.id,
							name: tc.function.name,
							input: JSON.parse(tc.function.arguments)
						}));

						// 如果有文本内容，添加文本块
						if (msg.content && typeof msg.content === 'string' && msg.content.trim()) {
							contentBlocks.unshift({
								type: 'text',
								text: msg.content
							});
						}

						return {
							role: 'assistant',
							content: contentBlocks
						};
					}

					// 处理 tool 消息（工具执行结果）
					if (msg.role === 'tool') {
						return {
							role: 'user',
							content: [{
								type: 'tool_result',
								tool_use_id: msg.toolCallId,
								content: msg.content
							}]
						};
					}

					// 处理普通消息
					return {
						role: msg.role === 'system' ? 'user' : msg.role,
						content: msg.content
					};
				});
			};

			const requestBody: any = {
				model: this.config.modelName,
				max_tokens: (this.config.maxOutputTokens || 96) * 1024,
				messages: buildAnthropicMessages(messages)
			};

			// 如果配置了 SYSTEM 规则，添加到请求中
			if (this.config.systemRules && this.config.systemRules.trim()) {
				requestBody.system = this.config.systemRules;
				console.log('[Anthropic Driver] ✓ 已添加 SYSTEM 规则');
			}

			// 如果提供了 tools，添加到请求中
			if (tools && tools.length > 0) {
				const convertedTools = this.convertToolsFormat(tools);
				requestBody.tools = convertedTools;
				console.log('[Anthropic Driver] ✓ 已添加 Tools，数量:', convertedTools.length);
				if (this.isZhipuAI()) {
					console.log('[Anthropic Driver] ✓ 已转换为智谱 AI 格式');
				}
			}

			console.log('[Anthropic Driver] >>> 请求内容:', JSON.stringify(requestBody, null, 2));

			const response = await requestUrl({
				url: this.buildApiUrl('/messages'),
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': this.config.apiKey,
					'anthropic-version': '2023-06-01'
				},
				body: JSON.stringify(requestBody)
			});

			console.log('[Anthropic Driver] <<< 响应状态:', response.status);

			if (response.status === 200) {
				const data = response.json;
				console.log('[Anthropic Driver] <<< 响应内容:', JSON.stringify(data, null, 2));

				// 处理响应内容
				let textContent = '';
				const toolCalls: any[] = [];

				if (data.content && Array.isArray(data.content)) {
					for (const block of data.content) {
						if (block.type === 'text') {
							textContent += block.text;
						} else if (block.type === 'tool_use') {
							toolCalls.push({
								id: block.id,
								type: 'function',
								function: {
									name: block.name,
									arguments: JSON.stringify(block.input)
								}
							});
						}
					}
				}

				console.log('[Anthropic Driver] ✓ 收到回复，文本长度:', textContent.length, '工具调用数:', toolCalls.length);

				return {
					success: true,
					message: textContent,
					toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
					stopReason: data.stop_reason
				};
			} else {
				console.error('[Anthropic Driver] ✗ API 返回错误:', response.status, response.json);
				return {
					success: false,
					error: `API 返回错误状态: ${response.status}`
				};
			}
		} catch (error) {
			console.error('[Anthropic Driver] ✗ 发送消息失败:', error);
			return {
				success: false,
				error: error.message || '发送消息失败'
			};
		}
	}

	async sendMessageStream(messages: ChatMessage[], tools?: any[], onChunk?: any): Promise<ChatResponse> {
		console.log('[Anthropic Driver] 开始流式发送消息');
		console.log('[Anthropic Driver] Note: Obsidian\'s requestUrl doesn\'t support streaming directly');
		console.log('[Anthropic Driver] Falling back to non-streaming request');

		const validationError = this.validateConfig();
		if (validationError) {
			return {
				success: false,
				error: validationError.message
			};
		}

		// 直接使用非流式请求
		return await this.sendMessage(messages, tools);
	}

	async fetchModelsList(): Promise<ModelsListResult> {
		console.log('[Anthropic Driver] 开始获取模型列表...');

		if (!this.config.apiUrl || !this.config.apiKey) {
			return {
				success: false,
				error: '请先配置 API URL 和 API Key'
			};
		}

		// Anthropic API 没有公开的模型列表接口，返回常用模型列表
		console.log('[Anthropic Driver] ✓ 返回预定义的 Anthropic 模型列表');

		const models = [
			{ id: 'claude-opus-4-5-20251101', name: 'Claude Opus 4.5', description: '最强大的模型，适合复杂任务' },
			{ id: 'claude-sonnet-4.5-20250514', name: 'Claude Sonnet 4.5', description: '平衡性能和速度' },
			{ id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', description: '高性能模型' },
			{ id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: '上一代高性能模型' },
			{ id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', description: '快速响应模型' },
			{ id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Claude 3 系列最强模型' },
			{ id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', description: 'Claude 3 系列平衡模型' },
			{ id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: 'Claude 3 系列快速模型' }
		];

		return {
			success: true,
			models: models
		};
	}
}
