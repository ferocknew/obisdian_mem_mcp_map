import { Notice } from 'obsidian';
import { ChatMessage, ToolCall } from '@/utils/llm/llm_driver_base';
import { ChatStateManager } from '@/utils/chat/chat_state';
import { ChatUIManager } from '@/utils/chat/chat_ui';
import { ChatDependencies } from '@/utils/chat/chat_types';
import { ChatToolHandler } from '@/utils/chat/chat_tool_handler';
import { getAvailableTools } from '@/utils/tools/tool_definitions';

/**
 * 聊天控制器
 * 负责处理所有业务逻辑
 */
export class ChatController {
	private state: ChatStateManager;
	private ui: ChatUIManager;
	private dependencies: ChatDependencies;
	private toolHandler: ChatToolHandler;

	constructor(state: ChatStateManager, ui: ChatUIManager, dependencies: ChatDependencies) {
		this.state = state;
		this.ui = ui;
		this.dependencies = dependencies;
		this.toolHandler = new ChatToolHandler(dependencies.toolExecutor, ui);

		this.setupEventListeners();
	}

	/**
	 * 设置事件监听器
	 */
	private setupEventListeners(): void {
		// 发送按钮点击事件
		this.ui.getUI().sendButton.addEventListener('click', () => {
			this.handleSendOrStop();
		});

		// 输入框回车事件
		this.ui.getUI().input.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				this.handleSendOrStop();
			}
		});

		// 搜索按钮点击事件
		this.ui.getUI().searchButton.addEventListener('click', () => {
			this.handleToggleSearch();
		});

		// 新建聊天按钮事件
		const newChatButton = this.ui.getUI().toolbar.querySelector('.ai-chat-toolbar-button:nth-child(1)');
		newChatButton?.addEventListener('click', () => {
			this.handleNewChat();
		});

		// 查看历史按钮事件
		const historyButton = this.ui.getUI().toolbar.querySelector('.ai-chat-toolbar-button:nth-child(2)');
		historyButton?.addEventListener('click', () => {
			this.handleViewHistory();
		});

		// 标题编辑事件
		this.ui.getUI().title.addEventListener('click', () => {
			this.handleEditTitle();
		});
	}

	/**
	 * 处理发送或停止
	 */
	private async handleSendOrStop(): Promise<void> {
		if (this.state.getIsGenerating()) {
			await this.handleStopGeneration();
		} else {
			await this.handleSendMessage();
		}
	}

	/**
	 * 处理发送消息
	 */
	private async handleSendMessage(): Promise<void> {
		const message = this.ui.getInputValue();

		if (!message) {
			new Notice('请输入消息内容');
			return;
		}

		if (!this.dependencies.llmClient) {
			new Notice('请先在设置中配置LLM API');
			return;
		}

		console.log('[Chat Controller] 发送消息:', message, '联网搜索:', this.state.isWebSearchEnabled());

		// 设置生成状态
		const abortController = new AbortController();
		this.state.setGenerating(true, abortController);
		this.ui.updateSendButtonState(true);

		// 将 AbortController 传递给 LLMClient
		this.dependencies.llmClient.setAbortController(abortController);

		// 禁用输入框
		this.ui.setInputDisabled(true);

		// 显示AI思考中状态
		const thinkingDiv = this.ui.createThinkingIndicator();

		try {
			// 添加用户消息到界面
			this.ui.addMessage('user', message);

			// 添加到消息历史
			this.state.addMessage({ role: 'user', content: message });

			// 清空输入框
			this.ui.clearInput();

			// 获取可用工具
			const tools = getAvailableTools(this.state.isWebSearchEnabled());
			console.log('[Chat Controller] 可用工具数量:', tools.length);

			// 移除思考中状态
			thinkingDiv.remove();

			// 创建流式消息容器
			const streamingMsg = this.ui.createStreamingMessage('assistant');

			// 调用 LLM API (流式)
			console.log('[Chat Controller] 调用LLM API (流式)，消息历史长度:', this.state.getMessages().length);
			const response = await this.dependencies.llmClient.sendMessageStream(
				this.state.getMessages(),
				tools,
				async (chunk: any) => {
					// 检查是否已中止
					if (abortController.signal.aborted) {
						return;
					}

					// 处理文本块
					if (chunk.type === 'text' && chunk.content) {
						await this.ui.updateStreamingMessage(
							streamingMsg.contentDiv,
							streamingMsg.buffer,
							chunk.content
						);
					}
				}
			);

			// 检查是否已中止
			if (abortController.signal.aborted) {
				console.log('[Chat Controller] 请求已被中止');
				return;
			}

			// 检查是否有工具调用
			if (response.success && response.toolCalls && response.toolCalls.length > 0) {
				console.log('[Chat Controller] ✓ AI 请求调用工具，数量:', response.toolCalls.length);

				// 移除流式消息容器（因为要显示工具调用状态）
				streamingMsg.messageDiv.remove();

				await this.handleToolCalls(response.toolCalls, tools);

			} else if (response.success && response.message) {
				// 流式回复已完成，添加到消息历史
				this.state.addMessage({ role: 'assistant', content: response.message });

				console.log('[Chat Controller] ✓ 收到AI回复，当前对话历史长度:', this.state.getMessages().length);
			} else {
				// API调用失败
				const errorMessage = response.error || '未知错误';
				console.error('[Chat Controller] ✗ LLM API返回错误:', errorMessage);
				new Notice(`AI回复失败: ${errorMessage}`);

				// 移除流式消息容器
				streamingMsg.messageDiv.remove();

				// 从消息历史中移除用户消息
				this.state.removeLastMessage();

				// 显示错误提示
				this.ui.addMessage('assistant', `抱歉，我遇到了一些问题：${errorMessage}`);
			}

		} catch (error) {
			console.error('[Chat Controller] ✗ 发送消息异常:', error);

			// 检查是否是用户主动中止
			if (abortController.signal.aborted) {
				console.log('[Chat Controller] ✓ 已停止生成');
				this.ui.addMessage('assistant', '⏸ 已停止生成');
			} else {
				new Notice(`发送失败: ${error.message}`);

				// 移除思考中状态
				thinkingDiv.remove();

				// 从消息历史中移除用户消息
				if (this.state.getMessages().length > 0 &&
					this.state.getMessages()[this.state.getMessages().length - 1].role === 'user') {
					this.state.removeLastMessage();
				}

				// 显示错误提示
				this.ui.addMessage('assistant', `抱歉，发生了错误：${error.message}`);
			}
		} finally {
			// 恢复状态
			this.state.setGenerating(false, null);
			if (this.dependencies.llmClient) {
				this.dependencies.llmClient.setAbortController(null);
			}
			this.ui.updateSendButtonState(false);
			this.ui.setInputDisabled(false);
			this.ui.focusInput();
		}
	}

	/**
	 * 处理停止生成
	 */
	private async handleStopGeneration(): Promise<void> {
		console.log('[Chat Controller] 用户请求停止生成');

		const abortController = this.state.getAbortController();
		if (abortController) {
			abortController.abort();
			new Notice('正在停止...');
		}
	}

	/**
	 * 处理工具调用
	 */
	private async handleToolCalls(toolCalls: ToolCall[], tools: any[]): Promise<void> {
		// 使用工具处理器执行工具调用
		const { success, results } = await this.toolHandler.handleToolCalls(toolCalls);

		if (!success) {
			return;
		}

		// 将工具结果添加到对话历史
		for (const result of results) {
			if (result.success) {
				this.state.addMessage({
					role: 'assistant',
					content: JSON.stringify(result.result || result)
				});
			}
		}

		// 再次调用 LLM 获取最终回复
		console.log('[Chat Controller] 基于工具结果再次请求 AI');
		const finalResponse = await this.dependencies.llmClient!.sendMessage(this.state.getMessages(), tools);

		if (finalResponse.success && finalResponse.message) {
			await this.ui.addMarkdownMessage('assistant', finalResponse.message);
			this.state.addMessage({ role: 'assistant', content: finalResponse.message });
		}
	}

	/**
	 * 处理切换搜索
	 */
	private handleToggleSearch(): void {
		const enabled = this.state.toggleWebSearch();
		this.ui.updateSearchButtonState(enabled);
		new Notice(`联网搜索已${enabled ? '启用' : '禁用'}`);
	}

	/**
	 * 处理新建聊天
	 */
	private handleNewChat(): void {
		console.log('[Chat Controller] 新建聊天');

		// 重置状态
		this.state.reset();

		// 清空界面
		this.ui.clearMessages();
		this.ui.updateTitle(this.state.getTitle());
		this.ui.updateSearchButtonState(false);

		new Notice('已创建新对话');
	}

	/**
	 * 处理查看历史
	 */
	private handleViewHistory(): void {
		console.log('[Chat Controller] 查看历史');
		new Notice('历史聊天功能开发中...');
		// TODO: 实现历史聊天记录功能
	}

	/**
	 * 处理编辑标题
	 */
	private handleEditTitle(): void {
		const currentTitle = this.state.getTitle();
		const titleEl = this.ui.getUI().title;

		titleEl.empty();

		const titleInput = titleEl.createEl('input', {
			type: 'text',
			value: currentTitle,
			cls: 'ai-chat-title-input'
		});

		titleInput.focus();
		titleInput.select();

		const saveTitle = () => {
			const newTitle = titleInput.value.trim() || '新的对话';
			this.state.setTitle(newTitle);
			this.ui.updateTitle(newTitle);
			console.log('[Chat Controller] 标题已更新:', newTitle);
		};

		titleInput.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				saveTitle();
			} else if (e.key === 'Escape') {
				titleEl.empty();
				titleEl.textContent = currentTitle;
			}
		});

		titleInput.addEventListener('blur', () => {
			saveTitle();
		});
	}
}
