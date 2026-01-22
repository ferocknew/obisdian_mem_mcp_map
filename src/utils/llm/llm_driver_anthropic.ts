import { requestUrl } from 'obsidian';
import { LLMDriverBase, LLMDriverConfig, LLMTestResult, ChatMessage, ChatResponse } from './llm_driver_base';

export class AnthropicLLMDriver extends LLMDriverBase {
	constructor(config: LLMDriverConfig) {
		super(config);
	}

	async testConnection(): Promise<LLMTestResult> {
		console.log('[Anthropic Driver] 开始测试连接...');

		const validationError = this.validateConfig();
		if (validationError) {
			return validationError;
		}

		try {
			const response = await requestUrl({
				url: `${this.config.apiUrl}/messages`,
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
			const requestBody: any = {
				model: this.config.modelName,
				max_tokens: 4096,
				messages: messages.map(msg => ({
					role: msg.role === 'system' ? 'user' : msg.role,
					content: msg.content
				}))
			};

			// 如果配置了 SYSTEM 规则，添加到请求中
			if (this.config.systemRules && this.config.systemRules.trim()) {
				requestBody.system = this.config.systemRules;
				console.log('[Anthropic Driver] ✓ 已添加 SYSTEM 规则');
			}

			// 如果提供了 tools，添加到请求中
			if (tools && tools.length > 0) {
				requestBody.tools = tools;
				console.log('[Anthropic Driver] ✓ 已添加 Tools，数量:', tools.length);
			}

			console.log('[Anthropic Driver] >>> 请求内容:', JSON.stringify(requestBody, null, 2));

			const response = await requestUrl({
				url: `${this.config.apiUrl}/messages`,
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

		const validationError = this.validateConfig();
		if (validationError) {
			return {
				success: false,
				error: validationError.message
			};
		}

		try {
			const requestBody: any = {
				model: this.config.modelName,
				max_tokens: 4096,
				stream: true,
				messages: messages.map(msg => ({
					role: msg.role === 'system' ? 'user' : msg.role,
					content: msg.content
				}))
			};

			if (this.config.systemRules && this.config.systemRules.trim()) {
				requestBody.system = this.config.systemRules;
			}

			if (tools && tools.length > 0) {
				requestBody.tools = tools;
			}

			console.log('[Anthropic Driver Stream] >>> 请求内容:', JSON.stringify(requestBody, null, 2));

			// 使用原生 fetch 支持流式响应
			const response = await fetch(`${this.config.apiUrl}/messages`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': this.config.apiKey,
					'anthropic-version': '2023-06-01'
				},
				body: JSON.stringify(requestBody),
				signal: this.abortController?.signal
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error('[Anthropic Driver Stream] ✗ API 返回错误:', response.status, errorText);
				return {
					success: false,
					error: `API 返回错误状态: ${response.status}`
				};
			}

			const reader = response.body?.getReader();
			if (!reader) {
				throw new Error('无法获取响应流');
			}

			const decoder = new TextDecoder();
			let buffer = '';
			let fullText = '';
			const toolCalls: any[] = [];
			let stopReason = '';

			while (true) {
				const { done, value } = await reader.read();

				if (done) {
					break;
				}

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');
				buffer = lines.pop() || '';

				for (const line of lines) {
					if (!line.trim() || !line.startsWith('data: ')) {
						continue;
					}

					const data = line.slice(6);
					if (data === '[DONE]') {
						continue;
					}

					try {
						const event = JSON.parse(data);

						if (event.type === 'content_block_delta') {
							if (event.delta?.type === 'text_delta') {
								const text = event.delta.text;
								fullText += text;

								if (onChunk) {
									onChunk({
										type: 'text',
										content: text
									});
								}
							}
						} else if (event.type === 'content_block_start') {
							if (event.content_block?.type === 'tool_use') {
								toolCalls.push({
									id: event.content_block.id,
									type: 'function',
									function: {
										name: event.content_block.name,
										arguments: ''
									}
								});
							}
						} else if (event.type === 'content_block_delta') {
							if (event.delta?.type === 'input_json_delta') {
								const lastToolCall = toolCalls[toolCalls.length - 1];
								if (lastToolCall) {
									lastToolCall.function.arguments += event.delta.partial_json;
								}
							}
						} else if (event.type === 'message_delta') {
							if (event.delta?.stop_reason) {
								stopReason = event.delta.stop_reason;
							}
						}
					} catch (e) {
						console.error('[Anthropic Driver Stream] 解析事件失败:', e, data);
					}
				}
			}

			console.log('[Anthropic Driver Stream] ✓ 流式接收完成，文本长度:', fullText.length, '工具调用数:', toolCalls.length);

			return {
				success: true,
				message: fullText,
				toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
				stopReason: stopReason
			};

		} catch (error) {
			console.error('[Anthropic Driver Stream] ✗ 流式发送失败:', error);
			return {
				success: false,
				error: error.message || '流式发送失败'
			};
		}
	}
}
