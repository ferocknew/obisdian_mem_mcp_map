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
	 * 在移动端，当键盘弹起时，调整输入区域使其紧贴键盘
	 */
	private setupMobileKeyboardHandling(): void {
		// 检测是否为移动设备
		const isMobile = window.innerWidth <= 768;

		if (!isMobile) return;

		const input = this.ui.input;
		const container = this.ui.container;
		const state = {
			originalMaxHeight: '',
			isKeyboardOpen: false
		};

		// 输入框获得焦点
		input.addEventListener('focus', () => {
			console.log('[Chat UI] 输入框获得焦点');
			state.isKeyboardOpen = true;

			// 保存原始 max-height
			state.originalMaxHeight = container.style.maxHeight || '';

			// 键盘弹起时，减小容器高度，为键盘留出空间
			// 这样整个容器会向下移动，输入框就会可见
			setTimeout(() => {
				const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
				const keyboardHeight = window.innerHeight - viewportHeight;

				console.log('[Chat UI] 键盘高度:', keyboardHeight, '视口高度:', viewportHeight);

				if (keyboardHeight > 100) {
					// 有键盘弹起，调整容器高度
					const newMaxHeight = Math.max(400, 570 - keyboardHeight / 2);
					container.style.maxHeight = `${newMaxHeight}px`;
					console.log('[Chat UI] 调整容器高度到:', newMaxHeight);
				}
			}, 300);
		});

		// 输入框失去焦点
		input.addEventListener('blur', () => {
			console.log('[Chat UI] 输入框失去焦点');
			state.isKeyboardOpen = false;

			// 恢复原始容器高度
			setTimeout(() => {
				container.style.maxHeight = state.originalMaxHeight || '570px';
				console.log('[Chat UI] 恢复容器高度');
			}, 500);
		});

		// 监听 visualViewport 变化
		if ('visualViewport' in window) {
			window.visualViewport!.addEventListener('resize', () => {
				if (state.isKeyboardOpen) {
					const viewportHeight = window.visualViewport!.height;
					const keyboardHeight = window.innerHeight - viewportHeight;

					if (keyboardHeight > 100) {
						const newMaxHeight = Math.max(400, 570 - keyboardHeight / 2);
						container.style.maxHeight = `${newMaxHeight}px`;
					}
				}
			});
		}
	}

	/**
	 * 获取样式
	 */
	static getStyles(): string {
		return chatViewStyles;
	}
}
