import { MarkdownRenderer, setIcon, App } from 'obsidian';
import { ChatMessage } from '@/utils/llm/llm_driver_base';
import { UIElements, ChatDependencies } from '@/utils/chat/chat_types';
import { chatViewStyles } from '@/utils/pages/chat_view.css';

/**
 * 聊天 UI 管理器
 * 负责 UI 的创建、更新和渲染
 */
export class ChatUIManager {
	private ui: UIElements;
	private dependencies: ChatDependencies;

	constructor(container: HTMLElement, dependencies: ChatDependencies) {
		this.dependencies = dependencies;
		this.ui = this.createInterface(container);
		this.setupMobileKeyboardHandling();
	}

	/**
	 * 清理文本中的多余空行
	 * 将多个连续换行符替换为单个换行符
	 */
	private cleanupText(content: string): string {
		if (!content) return content;
		// 移除首尾空白
		let cleaned = content.trim();
		// 将2个或更多连续换行符替换为1个
		cleaned = cleaned.replace(/\n{2,}/g, '\n');
		return cleaned;
	}

	/**
	 * 获取 UI 元素
	 */
	getUI(): UIElements {
		return this.ui;
	}

	/**
	 * 创建聊天界面
	 */
	private createInterface(container: HTMLElement): UIElements {
		// 创建AI聊天界面容器
		const chatContainer = container.createDiv({ cls: 'ai-chat-container' });
		chatContainer.style.display = 'none'; // 初始隐藏

		// 创建顶部工具栏
		const toolbar = this.createToolbar(chatContainer);

		// 创建消息显示区
		const messagesContainer = this.createMessagesContainer(chatContainer);

		// 创建底部输入区
		const inputContainer = this.createInputContainer(chatContainer);

		return {
			container: chatContainer,
			toolbar: toolbar,
			title: toolbar.querySelector('.ai-chat-title') as HTMLElement,
			messagesContainer: messagesContainer,
			inputContainer: inputContainer,
			inputToolbar: inputContainer.querySelector('.ai-chat-input-toolbar') as HTMLElement,
			input: inputContainer.querySelector('.ai-chat-input') as HTMLInputElement,
			sendButton: inputContainer.querySelector('.ai-chat-send-button') as HTMLButtonElement,
			searchButton: inputContainer.querySelector('.ai-chat-input-toolbar-button') as HTMLButtonElement,
			contextFileTag: inputContainer.querySelector('.ai-chat-context-file-tag') as HTMLElement
		};
	}

	/**
	 * 创建顶部工具栏
	 */
	private createToolbar(container: HTMLElement): HTMLElement {
		const toolbar = container.createDiv({ cls: 'ai-chat-toolbar' });

		// 左侧：聊天标题
		const title = toolbar.createDiv({
			cls: 'ai-chat-title',
			text: '新的对话'
		});

		// 右侧：工具按钮容器
		const toolButtons = toolbar.createDiv({ cls: 'ai-chat-toolbar-buttons' });

		// 新建聊天按钮
		const newChatButton = toolButtons.createEl('button', {
			cls: 'ai-chat-toolbar-button',
			attr: { 'aria-label': '新建聊天' }
		});
		setIcon(newChatButton, 'plus');

		// 查看历史按钮
		const historyButton = toolButtons.createEl('button', {
			cls: 'ai-chat-toolbar-button',
			attr: { 'aria-label': '查看历史' }
		});
		setIcon(historyButton, 'clock');

		return toolbar;
	}

	/**
	 * 创建消息显示区
	 */
	private createMessagesContainer(container: HTMLElement): HTMLElement {
		const messagesContainer = container.createDiv({ cls: 'ai-chat-messages' });
		messagesContainer.createEl('div', {
			text: '开始与AI对话吧！',
			cls: 'ai-chat-welcome'
		});
		return messagesContainer;
	}

	/**
	 * 创建底部输入区
	 */
	private createInputContainer(container: HTMLElement): HTMLElement {
		const inputContainer = container.createDiv({ cls: 'ai-chat-input-container' });

		// 创建功能按钮栏
		const inputToolbar = inputContainer.createDiv({ cls: 'ai-chat-input-toolbar' });

		// 联网搜索按钮
		const searchButton = inputToolbar.createEl('button', {
			cls: 'ai-chat-input-toolbar-button',
			attr: { 'aria-label': '联网搜索' }
		});
		setIcon(searchButton, 'globe');

		// 上下文文件标签（初始隐藏）
		const contextFileTag = inputToolbar.createDiv({ cls: 'ai-chat-context-file-tag' });
		contextFileTag.style.display = 'none';

		// 创建输入区域容器
		const inputWrapper = inputContainer.createDiv({ cls: 'ai-chat-input-wrapper' });

		// 创建文本输入框
		const input = inputWrapper.createEl('input', {
			type: 'text',
			placeholder: '输入消息...',
			cls: 'ai-chat-input'
		});

		// 创建发送按钮
		const sendButton = inputWrapper.createEl('button', {
			text: '发送',
			cls: 'ai-chat-send-button'
		});

		return inputContainer;
	}

	/**
	 * 添加消息到界面（纯文本）
	 */
	addMessage(role: 'user' | 'assistant', content: string): HTMLElement {
		// 清理多余空行
		const cleanedContent = this.cleanupText(content);

		const messageDiv = this.ui.messagesContainer.createDiv({
			cls: `ai-chat-message ${role}`
		});

		// 添加角色标签
		const roleLabel = messageDiv.createEl('div', {
			text: role === 'user' ? '我' : 'AI',
			cls: 'ai-chat-message-role'
		});

		// 添加消息内容
		const contentDiv = messageDiv.createEl('div', {
			cls: 'ai-chat-message-content'
		});
		contentDiv.textContent = cleanedContent;

		// 滚动到底部
		this.scrollToBottom();

		return messageDiv;
	}

	/**
	 * 添加消息到界面（Markdown 渲染）
	 */
	async addMarkdownMessage(role: 'user' | 'assistant', content: string): Promise<HTMLElement> {
		// 清理多余空行
		const cleanedContent = this.cleanupText(content);

		const messageDiv = this.ui.messagesContainer.createDiv({
			cls: `ai-chat-message ${role}`
		});

		// 添加角色标签
		const roleLabel = messageDiv.createEl('div', {
			text: role === 'user' ? '我' : 'AI',
			cls: 'ai-chat-message-role'
		});

		// 添加消息内容（Markdown 渲染）
		const contentDiv = messageDiv.createEl('div', {
			cls: 'ai-chat-message-content markdown-content'
		});

		// 使用 Obsidian 的 MarkdownRenderer 渲染 Markdown
		await MarkdownRenderer.render(
			this.dependencies.app,
			cleanedContent,
			contentDiv,
			'', // sourcePath
			this.dependencies.markdownComponent
		);

		// 滚动到底部
		this.scrollToBottom();

		return messageDiv;
	}

	/**
	 * 创建流式消息容器
	 */
	createStreamingMessage(role: 'user' | 'assistant'): { messageDiv: HTMLElement; contentDiv: HTMLElement; buffer: { text: string } } {
		const messageDiv = this.ui.messagesContainer.createDiv({
			cls: `ai-chat-message ${role}`
		});

		// 添加角色标签
		const roleLabel = messageDiv.createEl('div', {
			text: role === 'user' ? '我' : 'AI',
			cls: 'ai-chat-message-role'
		});

		// 添加消息内容容器
		const contentDiv = messageDiv.createEl('div', {
			cls: 'ai-chat-message-content markdown-content'
		});

		// 添加加载动画
		const loadingDiv = contentDiv.createEl('div', {
			cls: 'ai-chat-loading-animation'
		});
		loadingDiv.createEl('span', { cls: 'ai-chat-loading-dot' });
		loadingDiv.createEl('span', { cls: 'ai-chat-loading-dot' });
		loadingDiv.createEl('span', { cls: 'ai-chat-loading-dot' });

		// 滚动到底部
		this.scrollToBottom();

		return {
			messageDiv,
			contentDiv,
			buffer: { text: '' }
		};
	}

	/**
	 * 更新流式消息内容
	 */
	async updateStreamingMessage(contentDiv: HTMLElement, buffer: { text: string }, newText: string): Promise<void> {
		buffer.text += newText;

		// 清理多余空行后再渲染
		const cleanedText = this.cleanupText(buffer.text);

		// 清空并重新渲染
		contentDiv.empty();
		await MarkdownRenderer.render(
			this.dependencies.app,
			cleanedText,
			contentDiv,
			'',
			this.dependencies.markdownComponent
		);

		// 滚动到底部
		this.scrollToBottom();
	}

	/**
	 * 创建思考中提示
	 */
	createThinkingIndicator(): HTMLElement {
		const thinkingDiv = this.ui.messagesContainer.createDiv({ cls: 'ai-chat-message assistant' });
		const thinkingContent = thinkingDiv.createEl('div', {
			cls: 'ai-chat-message-content thinking'
		});
		thinkingContent.createEl('div', { text: 'AI思考中...' });
		return thinkingDiv;
	}

	/**
	 * 滚动到底部
	 */
	scrollToBottom(): void {
		this.ui.messagesContainer.scrollTop = this.ui.messagesContainer.scrollHeight;
	}

	/**
	 * 更新发送按钮状态
	 */
	updateSendButtonState(isGenerating: boolean): void {
		if (isGenerating) {
			this.ui.sendButton.textContent = '停止';
			this.ui.sendButton.addClass('ai-chat-stop-button');
		} else {
			this.ui.sendButton.textContent = '发送';
			this.ui.sendButton.removeClass('ai-chat-stop-button');
		}
	}

	/**
	 * 更新搜索按钮状态
	 */
	updateSearchButtonState(isEnabled: boolean): void {
		if (isEnabled) {
			this.ui.searchButton.addClass('active');
		} else {
			this.ui.searchButton.removeClass('active');
		}
	}

	/**
	 * 更新标题
	 */
	updateTitle(title: string): void {
		this.ui.title.textContent = title;
	}

	/**
	 * 显示容器
	 */
	show(): void {
		this.ui.container.style.display = 'flex';
	}

	/**
	 * 隐藏容器
	 */
	hide(): void {
		this.ui.container.style.display = 'none';
	}

	/**
	 * 获取输入框内容
	 */
	getInputValue(): string {
		return this.ui.input.value.trim();
	}

	/**
	 * 清空输入框
	 */
	clearInput(): void {
		this.ui.input.value = '';
	}

	/**
	 * 设置输入框禁用状态
	 */
	setInputDisabled(disabled: boolean): void {
		this.ui.input.disabled = disabled;
	}

	/**
	 * 聚焦输入框
	 */
	focusInput(): void {
		this.ui.input.focus();
	}

	/**
	 * 清空消息显示区
	 */
	clearMessages(): void {
		this.ui.messagesContainer.empty();
		this.ui.messagesContainer.createEl('div', {
			text: '开始与AI对话吧！',
			cls: 'ai-chat-welcome'
		});
	}

	/**
	 * 更新上下文文件标签
	 */
	updateContextFileTag(fileName: string | null, onRemove?: () => void): void {
		if (!fileName) {
			this.ui.contextFileTag.style.display = 'none';
			this.ui.contextFileTag.empty();
			return;
		}

		this.ui.contextFileTag.empty();
		this.ui.contextFileTag.style.display = 'flex';

		// 文件名文本
		this.ui.contextFileTag.createSpan({
			text: fileName,
			cls: 'ai-chat-context-file-name'
		});

		// 关闭按钮
		const closeButton = this.ui.contextFileTag.createEl('button', {
			cls: 'ai-chat-context-file-close',
			attr: { 'aria-label': '移除上下文' }
		});
		setIcon(closeButton, 'x');

		// 绑定移除事件
		if (onRemove) {
			closeButton.addEventListener('click', onRemove);
		}
	}

	/**
	 * 设置移动端键盘处理
	 * 使用 Visual Viewport API 监听键盘显示/隐藏
	 * 当键盘关闭时,恢复输入框位置
	 */
	private setupMobileKeyboardHandling(): void {
		const { Notice } = require('obsidian');

		// 检测是否为移动设备
		const isMobile = window.innerWidth <= 768;

		if (!isMobile) {
			new Notice('非移动设备,跳过键盘监听');
			return;
		}

		const input = this.ui.input;
		const inputContainer = this.ui.inputContainer;
		const messagesContainer = this.ui.messagesContainer;

		// 添加基础的 focus/blur 事件监听 (用于调试)
		input.addEventListener('focus', () => {
			new Notice('🔵 输入框获得焦点 (focus)', 2000);
		});

		input.addEventListener('blur', () => {
			new Notice('🔴 输入框失去焦点 (blur)', 2000);
		});

		// 方案1: 使用 Visual Viewport API (推荐)
		if (window.visualViewport) {
			let initialViewportHeight = window.visualViewport.height;
			let isKeyboardOpen = false;
			let resizeCount = 0;

			new Notice(`Visual Viewport API 可用, 初始高度: ${initialViewportHeight}px`, 3000);

			const handleViewportResize = () => {
				resizeCount++;
				const currentHeight = window.visualViewport!.height;
				const heightDifference = initialViewportHeight - currentHeight;

				// 键盘弹出的阈值(高度减少超过100px认为是键盘弹出)
				const keyboardThreshold = 100;

				new Notice(`🔄#${resizeCount} 视口: ${currentHeight}px, 初始: ${initialViewportHeight}px, 差异: ${heightDifference}px, 状态: ${isKeyboardOpen ? '开' : '关'}`, 3000);

				if (heightDifference > keyboardThreshold && !isKeyboardOpen) {
					// 键盘弹出
					isKeyboardOpen = true;
					console.log('[Keyboard] 键盘弹出, 视口高度变化:', heightDifference);
					new Notice(`✅ 键盘弹出! 高度减少 ${heightDifference}px`, 3000);

					// 滚动消息容器到底部
					setTimeout(() => {
						messagesContainer.scrollTop = messagesContainer.scrollHeight;
					}, 100);
				} else if (heightDifference <= keyboardThreshold && isKeyboardOpen) {
					// 键盘关闭
					isKeyboardOpen = false;
					console.log('[Keyboard] 键盘关闭, 恢复布局');
					new Notice(`✅ 键盘关闭! 恢复输入框 (差异:${heightDifference})`, 3000);

					// 恢复输入容器位置(确保在底部)
					setTimeout(() => {
						// 滚动到底部,确保输入框可见
						inputContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
					}, 100);
				} else {
					// 调试: 显示未触发条件的原因
					new Notice(`⚠️ 未触发 - 阈值:${keyboardThreshold} 差异:${heightDifference} 状态:${isKeyboardOpen ? '开' : '关'}`, 2500);
				}
			};

			// 监听视口大小变化
			window.visualViewport.addEventListener('resize', handleViewportResize);

			// 更新初始高度(处理屏幕旋转等情况)
			window.visualViewport.addEventListener('scroll', () => {
				if (!isKeyboardOpen) {
					initialViewportHeight = window.visualViewport!.height;
				}
			});

			console.log('[Keyboard] 使用 Visual Viewport API 监听键盘状态');
		} else {
			// 方案2: 降级方案 - 使用 window.resize
			let initialWindowHeight = window.innerHeight;
			let isKeyboardOpen = false;

			new Notice(`降级方案: window.resize, 初始高度: ${initialWindowHeight}px`, 3000);

			const handleWindowResize = () => {
				const currentHeight = window.innerHeight;
				const heightDifference = initialWindowHeight - currentHeight;
				const keyboardThreshold = 100;

				new Notice(`窗口变化: ${currentHeight}px, 差异: ${heightDifference}px`, 2000);

				if (heightDifference > keyboardThreshold && !isKeyboardOpen) {
					// 键盘弹出
					isKeyboardOpen = true;
					console.log('[Keyboard] 键盘弹出 (降级方案)');
					new Notice(`✅ 键盘弹出 (降级)! 高度减少 ${heightDifference}px`, 3000);

					setTimeout(() => {
						messagesContainer.scrollTop = messagesContainer.scrollHeight;
					}, 100);
				} else if (heightDifference <= keyboardThreshold && isKeyboardOpen) {
					// 键盘关闭
					isKeyboardOpen = false;
					console.log('[Keyboard] 键盘关闭 (降级方案)');
					new Notice(`✅ 键盘关闭 (降级)! 恢复输入框位置`, 3000);

					setTimeout(() => {
						inputContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
					}, 100);
				}
			};

			window.addEventListener('resize', handleWindowResize);
			console.log('[Keyboard] 使用 window.resize 降级方案');
		}
	}

	/**
	 * 获取样式
	 */
	static getStyles(): string {
		return chatViewStyles;
	}
}
