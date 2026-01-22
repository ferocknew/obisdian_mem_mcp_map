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
	private initialWebSearchEnabled: boolean;

	constructor(state: ChatStateManager, ui: ChatUIManager, dependencies: ChatDependencies, initialWebSearchEnabled: boolean = false) {
		this.state = state;
		this.ui = ui;
		this.dependencies = dependencies;
		this.toolHandler = new ChatToolHandler(dependencies.toolExecutor, ui);
		this.initialWebSearchEnabled = initialWebSearchEnabled;

		// 设置标题更新回调
		this.dependencies.toolExecutor.setUpdateTitleCallback((title: string) => {
			this.state.setTitle(title);
			this.ui.updateTitle(title);
		});

		// 设置文档读取回调
		this.dependencies.toolExecutor.setReadDocCallback(async () => {
			const contextFile = this.state.getContextFile();
			if (!contextFile) {
				throw new Error('没有可读取的文档');
			}
			return contextFile.content;
		});

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

		// 初始化上下文文件标签（隐藏状态）
		this.updateContextFileUI();
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

			// 构建发送给 AI 的消息
			let messageToSend = message;
			const contextFile = this.state.getContextFile();

			// 如果有上下文文件，添加系统提示引导 AI 使用 read_doc 工具
			if (contextFile) {
				messageToSend = `[系统提示：当前打开了文档 "${contextFile.name}"，你可以使用 read_doc 工具来读取完整内容]\n\n${message}`;
				console.log('[Chat Controller] 已添加文档提示:', contextFile.name);
			}

			// 添加到消息历史
			this.state.addMessage({ role: 'user', content: messageToSend });

			// 清空输入框
			this.ui.clearInput();

			// 获取可用工具（传递是否有上下文文档）
			const tools = getAvailableTools(
				this.state.isWebSearchEnabled(),
				this.state.hasContextFile()
			);
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

				// 如果 AI 在调用工具前返回了文本内容,先显示这些内容
				if (response.message && response.message.trim()) {
					// 如果流式 buffer 为空,说明是非流式响应,需要手动更新内容
					if (streamingMsg.buffer.text === '') {
						await this.ui.updateStreamingMessage(
							streamingMsg.contentDiv,
							streamingMsg.buffer,
							response.message
						);
					}
					// 保留流式消息容器,不移除
					console.log('[Chat Controller] ✓ 已显示 AI 的文本内容:', response.message.substring(0, 50) + '...');
				} else {
					// 如果没有文本内容,才移除流式消息容器
					streamingMsg.messageDiv.remove();
				}

				await this.handleToolCalls(response.toolCalls, tools);

			} else if (response.success && response.message) {
				// 如果没有触发过流式更新(buffer为空),说明是非流式响应,需要手动更新内容
				if (streamingMsg.buffer.text === '') {
					await this.ui.updateStreamingMessage(
						streamingMsg.contentDiv,
						streamingMsg.buffer,
						response.message
					);
				}

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

		// 将 AI 的工具调用请求添加到对话历史
		this.state.addMessage({
			role: 'assistant',
			content: '',
			toolCalls: toolCalls
		});

		// 将工具执行结果添加到对话历史(无论成功还是失败)
		for (let i = 0; i < results.length; i++) {
			const result = results[i];
			const toolCall = toolCalls[i];

			// 构造工具结果消息
			let toolResultContent: string;
			if (result.success) {
				// 成功时返回实际结果
				toolResultContent = JSON.stringify(result.result || { status: 'success', message: result.displayText });
			} else {
				// 失败时返回错误信息
				toolResultContent = JSON.stringify({
					status: 'error',
					error: result.error,
					message: `工具 ${result.toolName} 执行失败: ${result.error}`
				});
			}

			this.state.addMessage({
				role: 'tool',
				content: toolResultContent,
				toolCallId: toolCall.id,
				toolName: toolCall.function.name
			});
		}

		// 再次调用 LLM 获取最终回复
		console.log('[Chat Controller] 基于工具结果再次请求 AI');
		const finalResponse = await this.dependencies.llmClient!.sendMessage(this.state.getMessages(), tools);

		// 检查是否又返回了新的工具调用（递归处理）
		if (finalResponse.success && finalResponse.toolCalls && finalResponse.toolCalls.length > 0) {
			console.log('[Chat Controller] ✓ AI 再次请求调用工具，数量:', finalResponse.toolCalls.length);

			// 如果同时返回了文本内容，先显示
			if (finalResponse.message && finalResponse.message.trim()) {
				await this.ui.addMarkdownMessage('assistant', finalResponse.message);
				console.log('[Chat Controller] ✓ 已显示 AI 的文本内容');
			}

			// 递归处理新的工具调用
			await this.handleToolCalls(finalResponse.toolCalls, tools);
		} else if (finalResponse.success && finalResponse.message) {
			// 没有工具调用，显示最终回复
			await this.ui.addMarkdownMessage('assistant', finalResponse.message);
			this.state.addMessage({ role: 'assistant', content: finalResponse.message });
		} else if (!finalResponse.success) {
			// 如果第二次请求也失败,显示错误
			const errorMsg = `抱歉,处理工具结果时出错: ${finalResponse.error || '未知错误'}`;
			await this.ui.addMarkdownMessage('assistant', errorMsg);
			this.state.addMessage({ role: 'assistant', content: errorMsg });
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
	 * 设置上下文文件
	 */
	setContextFile(fileName: string, content: string): void {
		this.state.setContextFile({ name: fileName, content });
		this.updateContextFileUI();
		console.log('[Chat Controller] 上下文文件已设置:', fileName);
	}

	/**
	 * 移除上下文文件
	 */
	removeContextFile(): void {
		this.state.setContextFile(null);
		this.updateContextFileUI();
		new Notice('已移除上下文文件');
		console.log('[Chat Controller] 上下文文件已移除');
	}

	/**
	 * 更新上下文文件UI
	 */
	private updateContextFileUI(): void {
		const contextFile = this.state.getContextFile();
		this.ui.updateContextFileTag(
			contextFile?.name || null,
			() => this.removeContextFile()
		);
	}

	/**
	 * 处理新建聊天
	 */
	private handleNewChat(): void {
		console.log('[Chat Controller] 新建聊天');

		// 重置状态，使用初始搜索开关状态
		this.state.reset(this.initialWebSearchEnabled);

		// 清空界面
		this.ui.clearMessages();
		this.ui.updateTitle(this.state.getTitle());
		this.ui.updateSearchButtonState(this.initialWebSearchEnabled);
		this.updateContextFileUI();

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
