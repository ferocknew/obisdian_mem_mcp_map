import { LLMDriverBase, LLMTestResult, ChatMessage, ChatResponse, ToolCall, StreamCallback, ModelsListResult } from './utils/llm/llm_driver_base';
import { AnthropicLLMDriver } from './utils/llm/llm_driver_anthropic';
import { OpenAILLMDriver } from './utils/llm/llm_driver_openai';

export interface LLMConfig {
	apiUrl: string;
	apiKey: string;
	modelName: string;
	apiType: 'anthropic' | 'openai';
	systemRules?: string;
	contextWindow?: number;
	maxOutputTokens?: number;
}

export class LLMClient {
	private driver: LLMDriverBase;
	private abortController: AbortController | null = null;

	constructor(config: LLMConfig) {
		if (config.apiType === 'anthropic') {
			this.driver = new AnthropicLLMDriver({
				apiUrl: config.apiUrl,
				apiKey: config.apiKey,
				modelName: config.modelName,
				systemRules: config.systemRules,
				contextWindow: config.contextWindow,
				maxOutputTokens: config.maxOutputTokens
			});
		} else {
			this.driver = new OpenAILLMDriver({
				apiUrl: config.apiUrl,
				apiKey: config.apiKey,
				modelName: config.modelName,
				systemRules: config.systemRules,
				contextWindow: config.contextWindow,
				maxOutputTokens: config.maxOutputTokens
			});
		}
	}

	async testConnection(): Promise<LLMTestResult> {
		console.log('[LLM Client] 开始测试 LLM 连接...');
		return await this.driver.testConnection();
	}

	async sendMessage(messages: ChatMessage[], tools?: any[]): Promise<ChatResponse> {
		console.log('[LLM Client] 发送聊天消息，Tools 数量:', tools?.length || 0);
		return await this.driver.sendMessage(messages, tools);
	}

	async sendMessageStream(messages: ChatMessage[], tools?: any[], onChunk?: StreamCallback): Promise<ChatResponse> {
		console.log('[LLM Client] 流式发送聊天消息，Tools 数量:', tools?.length || 0);
		return await this.driver.sendMessageStream(messages, tools, onChunk);
	}

	/**
	 * 设置 AbortController
	 */
	setAbortController(controller: AbortController | null): void {
		this.abortController = controller;
		console.log('[LLM Client] AbortController 已', controller ? '设置' : '清空');
	}

	/**
	 * 获取当前的中止信号
	 */
	getAbortSignal(): AbortSignal | null {
		return this.abortController?.signal || null;
	}

	/**
	 * 中止当前请求
	 */
	abort(): void {
		if (this.abortController) {
			this.abortController.abort();
			console.log('[LLM Client] ✓ 请求已中止');
		}
	}

	/**
	 * 获取模型列表
	 */
	async fetchModelsList(): Promise<ModelsListResult> {
		console.log('[LLM Client] 获取模型列表...');
		return await this.driver.fetchModelsList();
	}
}
