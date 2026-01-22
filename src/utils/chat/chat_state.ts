import { ChatMessage } from '@/utils/llm/llm_driver_base';
import { ChatState } from '@/utils/chat/chat_types';

/**
 * 聊天状态管理器
 * 负责管理聊天的状态和数据
 */
export class ChatStateManager {
	private state: ChatState;

	constructor(initialWebSearchEnabled: boolean = false) {
		this.state = {
			messages: [],
			title: '新的对话',
			webSearchEnabled: initialWebSearchEnabled,
			isGenerating: false,
			abortController: null,
			contextFile: null
		};
	}

	/**
	 * 获取完整状态
	 */
	getState(): ChatState {
		return { ...this.state };
	}

	/**
	 * 获取消息历史
	 */
	getMessages(): ChatMessage[] {
		return [...this.state.messages];
	}

	/**
	 * 添加消息到历史
	 */
	addMessage(message: ChatMessage): void {
		this.state.messages.push(message);
		console.log('[Chat State] 添加消息，当前历史长度:', this.state.messages.length);
	}

	/**
	 * 移除最后一条消息
	 */
	removeLastMessage(): ChatMessage | null {
		const removed = this.state.messages.pop();
		if (removed) {
			console.log('[Chat State] 移除最后一条消息');
		}
		return removed || null;
	}

	/**
	 * 清空消息历史
	 */
	clearMessages(): void {
		this.state.messages = [];
		console.log('[Chat State] 清空消息历史');
	}

	/**
	 * 获取标题
	 */
	getTitle(): string {
		return this.state.title;
	}

	/**
	 * 设置标题
	 */
	setTitle(title: string): void {
		this.state.title = title;
		console.log('[Chat State] 标题已更新:', title);
	}

	/**
	 * 获取联网搜索状态
	 */
	isWebSearchEnabled(): boolean {
		return this.state.webSearchEnabled;
	}

	/**
	 * 切换联网搜索状态
	 */
	toggleWebSearch(): boolean {
		this.state.webSearchEnabled = !this.state.webSearchEnabled;
		console.log('[Chat State] 联网搜索已', this.state.webSearchEnabled ? '启用' : '禁用');
		return this.state.webSearchEnabled;
	}

	/**
	 * 获取生成状态
	 */
	getIsGenerating(): boolean {
		return this.state.isGenerating;
	}

	/**
	 * 设置生成状态
	 */
	setGenerating(isGenerating: boolean, abortController?: AbortController | null): void {
		this.state.isGenerating = isGenerating;
		if (abortController !== undefined) {
			this.state.abortController = abortController;
		}
		console.log('[Chat State] 生成状态:', isGenerating ? '生成中' : '空闲');
	}

	/**
	 * 获取 AbortController
	 */
	getAbortController(): AbortController | null {
		return this.state.abortController;
	}

	/**
	 * 获取上下文文件
	 */
	getContextFile(): { name: string; content: string } | null {
		return this.state.contextFile;
	}

	/**
	 * 设置上下文文件
	 */
	setContextFile(file: { name: string; content: string } | null): void {
		this.state.contextFile = file;
		if (file) {
			console.log('[Chat State] 上下文文件已设置:', file.name);
		} else {
			console.log('[Chat State] 上下文文件已清除');
		}
	}

	/**
	 * 检查是否有上下文文件
	 */
	hasContextFile(): boolean {
		return this.state.contextFile !== null;
	}

	/**
	 * 重置状态（新建聊天时使用）
	 */
	reset(initialWebSearchEnabled: boolean = false): void {
		this.state.messages = [];
		this.state.title = '新的对话';
		this.state.webSearchEnabled = initialWebSearchEnabled;
		this.state.isGenerating = false;
		this.state.abortController = null;
		this.state.contextFile = null;
		console.log('[Chat State] 状态已重置');
	}
}
