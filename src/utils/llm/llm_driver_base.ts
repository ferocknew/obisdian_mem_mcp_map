export interface LLMTestResult {
	success: boolean;
	message: string;
	error?: string;
}

export interface ModelInfo {
	id: string;
	name?: string;
	description?: string;
}

export interface ModelsListResult {
	success: boolean;
	models?: ModelInfo[];
	error?: string;
}

export interface LLMDriverConfig {
	apiUrl: string;
	apiKey: string;
	modelName: string;
	systemRules?: string;
	contextWindow?: number;
	maxOutputTokens?: number;
}

export interface ChatMessage {
	role: 'user' | 'assistant' | 'system' | 'tool';
	content: string | any[];
	toolCalls?: ToolCall[];
	toolCallId?: string;
	toolName?: string;
}

export interface ToolCall {
	id: string;
	type: 'function';
	function: {
		name: string;
		arguments: string;
	};
}

export interface ToolResult {
	tool_call_id: string;
	content: string;
}

export interface ChatResponse {
	success: boolean;
	message?: string;
	error?: string;
	toolCalls?: ToolCall[];
	stopReason?: string;
}

export interface StreamChunk {
	type: 'text' | 'tool_use' | 'error';
	content?: string;
	toolCall?: ToolCall;
	error?: string;
}

export type StreamCallback = (chunk: StreamChunk) => void;

export abstract class LLMDriverBase {
	protected config: LLMDriverConfig;
	protected abortController: AbortController | null = null;

	constructor(config: LLMDriverConfig) {
		this.config = config;
	}

	abstract testConnection(): Promise<LLMTestResult>;
	abstract sendMessage(messages: ChatMessage[], tools?: any[]): Promise<ChatResponse>;
	abstract sendMessageStream(messages: ChatMessage[], tools?: any[], onChunk?: StreamCallback): Promise<ChatResponse>;
	abstract fetchModelsList(): Promise<ModelsListResult>;

	setAbortController(controller: AbortController | null): void {
		this.abortController = controller;
	}

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
