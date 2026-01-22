import { App, Component } from 'obsidian';
import { LLMClient } from '@/llm_client';
import { WhoogleClient } from '@/utils/tools/whoogle';
import { ToolExecutor } from '@/utils/tools/tool_executor';
import { ChatStateManager } from '@/utils/chat/chat_state';
import { ChatUIManager } from '@/utils/chat/chat_ui';
import { ChatController } from '@/utils/chat/chat_controller';
import { ChatDependencies } from '@/utils/chat/chat_types';
import { ChatMessage } from '@/utils/llm/llm_driver_base';

/**
 * AI 聊天视图类（入口文件）
 * 负责管理 AI 聊天界面的所有功能
 * 内部使用 MVC 架构实现
 */
export class ChatView {
	// MVC 组件
	private state: ChatStateManager;
	private ui: ChatUIManager;
	private controller: ChatController;
	private markdownComponent: Component;
	private dependencies: ChatDependencies;
	private initialWebSearchEnabled: boolean;

	// 公开的 UI 元素（保持向后兼容）
	readonly chatContainer: HTMLElement;
	readonly chatToolbar: HTMLElement;
	readonly chatTitle: HTMLElement;
	readonly chatMessagesContainer: HTMLElement;
	readonly chatInputContainer: HTMLElement;
	readonly chatInputToolbar: HTMLElement;
	readonly chatInput: HTMLInputElement;
	readonly chatSendButton: HTMLButtonElement;
	readonly searchButton: HTMLButtonElement;

	// 公开的数据（保持向后兼容）
	currentChatMessages: ChatMessage[] = [];
	currentChatTitle: string = '新的对话';

	constructor(parentContainer: HTMLElement, app: App, llmClient?: LLMClient, initialWebSearchEnabled: boolean = false) {
		// 保存初始搜索状态
		this.initialWebSearchEnabled = initialWebSearchEnabled;
		// 创建 Markdown 组件
		this.markdownComponent = new Component();
		this.markdownComponent.load();

		// 创建工具执行器
		const toolExecutor = new ToolExecutor();

		// 创建依赖
		this.dependencies = {
			app: app,
			markdownComponent: this.markdownComponent,
			llmClient: llmClient || null,
			toolExecutor: toolExecutor,
			whoogleClient: null
		};

		// 创建状态管理器，传入初始搜索开关状态
		this.state = new ChatStateManager(initialWebSearchEnabled);

		// 创建 UI 管理器
		this.ui = new ChatUIManager(parentContainer, this.dependencies);

		// 创建控制器，传递初始搜索状态
		this.controller = new ChatController(this.state, this.ui, this.dependencies, this.initialWebSearchEnabled);

		// 获取 UI 元素（保持向后兼容）
		const uiElements = this.ui.getUI();
		this.chatContainer = uiElements.container;
		this.chatToolbar = uiElements.toolbar;
		this.chatTitle = uiElements.title;
		this.chatMessagesContainer = uiElements.messagesContainer;
		this.chatInputContainer = uiElements.inputContainer;
		this.chatInputToolbar = uiElements.inputToolbar;
		this.chatInput = uiElements.input;
		this.chatSendButton = uiElements.sendButton;
		this.searchButton = uiElements.searchButton;

		// 同步搜索按钮的初始状态
		this.ui.updateSearchButtonState(this.initialWebSearchEnabled);

		// 同步公开数据
		this.syncPublicData();
	}

	/**
	 * 同步公开数据（保持向后兼容）
	 */
	private syncPublicData(): void {
		this.currentChatMessages = this.state.getMessages() as any;
		this.currentChatTitle = this.state.getTitle();
	}

	/**
	 * 创建聊天界面（向后兼容方法）
	 */
	createInterface(): void {
		// 界面已在构造函数中创建
	}

	/**
	 * 显示聊天
	 */
	show(): void {
		this.ui.show();
	}

	/**
	 * 隐藏聊天
	 */
	hide(): void {
		this.ui.hide();
	}

	/**
	 * 设置 LLM 客户端
	 */
	setLLMClient(client: LLMClient | null): void {
		this.dependencies.llmClient = client;
		console.log('[Chat View] LLM客户端已', client ? '设置' : '清空');
	}

	/**
	 * 设置 Whoogle 客户端
	 */
	setWhoogleClient(client: WhoogleClient | null): void {
		this.dependencies.whoogleClient = client;
		this.dependencies.toolExecutor.setWhoogleClient(client);
		console.log('[Chat View] Whoogle 客户端已', client ? '设置' : '清空');
	}

	/**
	 * 设置上下文文件
	 */
	setContextFile(fileName: string, content: string): void {
		this.controller.setContextFile(fileName, content);
	}

	/**
	 * 移除上下文文件
	 */
	removeContextFile(): void {
		this.controller.removeContextFile();
	}

	/**
	 * 获取样式 CSS
	 */
	static getStyles(): string {
		return ChatUIManager.getStyles();
	}

	/**
	 * 清理资源
	 */
	unload(): void {
		this.markdownComponent.unload();
	}
}
