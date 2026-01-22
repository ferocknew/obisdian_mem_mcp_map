import { LLMClient } from '@/llm_client';
import { ChatMessage } from '@/utils/llm/llm_driver_base';
import { WhoogleClient } from '@/utils/tools/whoogle';
import { ToolExecutor } from '@/utils/tools/tool_executor';
import { App, Component } from 'obsidian';

/**
 * 聊天配置
 */
export interface ChatConfig {
	app: App;
	llmClient?: LLMClient | null;
	whoogleClient?: WhoogleClient | null;
}

/**
 * 聊天状态
 */
export interface ChatState {
	messages: ChatMessage[];
	title: string;
	webSearchEnabled: boolean;
	isGenerating: boolean;
	abortController: AbortController | null;
	contextFile: { name: string; content: string } | null;
}

/**
 * UI 元素引用
 */
export interface UIElements {
	container: HTMLElement;
	toolbar: HTMLElement;
	title: HTMLElement;
	messagesContainer: HTMLElement;
	inputContainer: HTMLElement;
	inputToolbar: HTMLElement;
	input: HTMLInputElement;
	sendButton: HTMLButtonElement;
	searchButton: HTMLButtonElement;
	contextFileTag: HTMLElement;
}

/**
 * 聊天组件依赖
 */
export interface ChatDependencies {
	app: App;
	markdownComponent: Component;
	llmClient: LLMClient | null;
	toolExecutor: ToolExecutor;
	whoogleClient: WhoogleClient | null;
}
