import { ItemView, WorkspaceLeaf } from 'obsidian';
import MemoryGraphPlugin from '@/main';
import { APIClient } from '@/utils/api/api_client';
import { ChatView } from '@/utils/pages/chat_view';
import { SearchPageView } from '@/utils/pages/search';
import { LLMClient } from '@/llm_client';
import { WhoogleClient } from '@/utils/tools/whoogle';

export const VIEW_TYPE_MEMORY_SEARCH = 'memory-search-view';

export class MemorySearchView extends ItemView {
	plugin: MemoryGraphPlugin;
	apiClient: APIClient;
	llmClient: LLMClient | null = null;
	whoogleClient: WhoogleClient | null = null;
	tabsContainer: HTMLElement;

	// 搜索界面
	searchPageView: SearchPageView;

	// AI聊天视图
	chatView: ChatView;

	constructor(leaf: WorkspaceLeaf, plugin: MemoryGraphPlugin) {
		super(leaf);
		this.plugin = plugin;
		this.apiClient = new APIClient(this.app);
	}

	getViewType(): string {
		return VIEW_TYPE_MEMORY_SEARCH;
	}

	getDisplayText(): string {
		return '记忆图谱搜索';
	}

	getIcon(): string {
		return 'brain';
	}

	async onOpen() {
		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();
		container.addClass('memory-search-view');

		// 初始化 API 客户端
		await this.initializeAPIClient();

		// 初始化 LLM 客户端
		this.initializeLLMClient();

		// 初始化 Whoogle 客户端
		this.initializeWhoogleClient();

		// 注册文件打开事件监听
		this.registerFileOpenListener();

		// 创建标签页容器
		this.tabsContainer = container.createDiv({ cls: 'memory-search-tabs' });

		// 创建关键词搜索标签
		const keywordTab = this.tabsContainer.createEl('button', {
			text: '关键词搜索',
			cls: 'memory-search-tab active'
		});
		keywordTab.setAttribute('data-type', 'keyword');

		// 创建向量搜索标签
		const semanticTab = this.tabsContainer.createEl('button', {
			text: '向量搜索',
			cls: 'memory-search-tab'
		});
		semanticTab.setAttribute('data-type', 'semantic');

		// 创建AI聊天标签
		const chatTab = this.tabsContainer.createEl('button', {
			text: 'AI聊天',
			cls: 'memory-search-tab'
		});
		chatTab.setAttribute('data-type', 'chat');

		// 标签切换事件
		const tabs = [keywordTab, semanticTab, chatTab];
		tabs.forEach(tab => {
			tab.addEventListener('click', () => {
				tabs.forEach(t => t.removeClass('active'));
				tab.addClass('active');
				this.switchView(tab.getAttribute('data-type') || 'keyword');
			});
		});

		// 创建搜索界面
		const searchContainer = container.createDiv();
		this.searchPageView = new SearchPageView(this.app, this.plugin, this.apiClient, searchContainer);
		this.searchPageView.createInterface();

		// 创建AI聊天界面，传入App实例、LLM客户端和默认搜索开关状态
		const initialWebSearchEnabled = this.plugin.settings.searchDefaultEnabled || false;
		this.chatView = new ChatView(container, this.app, this.llmClient || undefined, initialWebSearchEnabled);
		this.chatView.createInterface();

		// 设置 Whoogle 客户端到聊天视图
		if (this.whoogleClient) {
			this.chatView.setWhoogleClient(this.whoogleClient);
		}

		// 设置 API 客户端到聊天视图（记忆图谱工具）
		if (this.apiClient) {
			this.chatView.setAPIClient(this.apiClient);
		}

		// 默认隐藏聊天界面
		this.chatView.hide();

		// 添加样式
		this.addStyles();
	}

	async onClose() {
		// 清理资源
	}

	private async initializeAPIClient() {
		try {
			const settings = this.plugin.settings;
			if (settings.mcpApiUrl) {
				await this.apiClient.connect({
					apiUrl: settings.mcpApiUrl,
					apiKey: settings.mcpApiKey
				});
				console.log('[Search View] API 客户端初始化成功');

				// 如果聊天视图已创建，更新其 API 客户端
				if (this.chatView) {
					this.chatView.setAPIClient(this.apiClient);
				}
			} else {
				console.warn('[Search View] 未配置 API 地址');
			}
		} catch (error) {
			console.error('[Search View] API 客户端初始化失败:', error);
		}
	}

	private initializeLLMClient() {
		try {
			const settings = this.plugin.settings;
			if (settings.llmApiUrl && settings.llmApiKey && settings.llmModelName) {
				this.llmClient = new LLMClient({
					apiUrl: settings.llmApiUrl,
					apiKey: settings.llmApiKey,
					modelName: settings.llmModelName,
					apiType: settings.llmApiType,
					systemRules: settings.llmSystemRules,
					contextWindow: settings.llmContextWindow,
					maxOutputTokens: settings.llmMaxOutputTokens
				});
				console.log('[Search View] ✓ LLM 客户端初始化成功');

				// 如果聊天视图已创建，更新其LLM客户端
				if (this.chatView) {
					this.chatView.setLLMClient(this.llmClient);
				}
			} else {
				console.warn('[Search View] 未完整配置 LLM API，聊天功能将不可用');
				this.llmClient = null;
			}
		} catch (error) {
			console.error('[Search View] LLM 客户端初始化失败:', error);
			this.llmClient = null;
		}
	}

	private initializeWhoogleClient() {
		try {
			const settings = this.plugin.settings;
			if (settings.searchWhoogleUrl) {
				this.whoogleClient = new WhoogleClient({
					whoogleUrl: settings.searchWhoogleUrl,
					authEnabled: settings.searchAuthEnabled || false,
					authKey: settings.searchAuthKey || ''
				});
				console.log('[Search View] ✓ Whoogle 客户端初始化成功');

				// 如果聊天视图已创建，更新其 Whoogle 客户端
				if (this.chatView) {
					this.chatView.setWhoogleClient(this.whoogleClient);
				}
			} else {
				console.warn('[Search View] 未配置 Whoogle URL，搜索功能将不可用');
				this.whoogleClient = null;
			}
		} catch (error) {
			console.error('[Search View] Whoogle 客户端初始化失败:', error);
			this.whoogleClient = null;
		}
	}

	private switchView(viewType: string) {
		console.log('[Switch View] 切换视图:', viewType);

		// 获取活动标签并更新搜索类型
		const activeTab = this.tabsContainer.querySelector('.memory-search-tab.active') as HTMLElement;
		const searchType = activeTab?.getAttribute('data-type') || 'keyword';

		if (viewType === 'chat') {
			// 切换到聊天视图时，重新初始化LLM客户端（以防配置已更改）
			this.initializeLLMClient();

			// 显示AI聊天界面，隐藏搜索界面
			this.searchPageView.hide();
			this.chatView.show();
		} else {
			// 显示搜索界面，隐藏AI聊天界面
			this.searchPageView.show();
			this.chatView.hide();

			// 更新搜索界面的搜索类型，监听搜索按钮点击
			const oldButton = this.searchPageView.searchButton;
			if (oldButton) {
				const newButton = oldButton.cloneNode(true) as HTMLButtonElement;
				oldButton.parentNode?.replaceChild(newButton, oldButton);
				this.searchPageView.searchButton = newButton;

				newButton.addEventListener('click', () => {
					this.searchPageView.handleSearch(searchType);
				});
			}
		}
	}

	/**
	 * 注册文件打开事件监听
	 */
	private registerFileOpenListener() {
		// 监听文件打开事件
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', (leaf) => {
				if (!leaf || !leaf.view) return;

				// 检查是否是 Markdown 编辑视图
				const view = leaf.view;
				if (view.getViewType() === 'markdown') {
					const markdownView = view as any;
					const file = markdownView.file;

					if (file && file.extension === 'md') {
						// 自动将当前打开的文件内容注入到聊天上下文
						this.injectFileToChat(file);
					}
				}
			})
		);
	}

	/**
	 * 公开方法：重新初始化LLM客户端（当配置更新时调用）
	 */
	reinitLLMClient(): void {
		console.log('[Search View] 重新初始化 LLM 客户端');
		this.initializeLLMClient();
	}

	/**
	 * 将文件内容注入到聊天上下文
	 * 注意：现在只设置文件引用，不立即注入完整内容
	 * AI 可以通过 read_doc 工具按需读取
	 */
	private async injectFileToChat(file: any) {
		try {
			const content = await this.app.vault.read(file);

			if (!content.trim()) {
				console.log('[Search View] 文件内容为空，不注入上下文');
				return;
			}

			// 设置到聊天视图（提供工具让 AI 按需读取，而不是立即注入）
			if (this.chatView) {
				this.chatView.setContextFile(file.basename, content);
				console.log('[Search View] ✓ 已设置文档引用，AI 可通过 read_doc 工具读取:', file.basename);
			}
		} catch (error) {
			console.error('[Search View] 读取文件失败:', error);
		}
	}

	private addStyles() {
		const style = document.createElement('style');
		style.textContent = `
			.memory-search-view {
				padding: 10px;
				height: 100%;
				display: flex;
				flex-direction: column;
				position: relative;
			}

			/* 移动端适配 */
			@media (max-width: 768px) {
				.memory-search-view {
					height: 100dvh;
					max-height: 100dvh;
					padding: 0;
					position: relative;
					overflow: hidden;
					display: flex;
					flex-direction: column;
				}

				.memory-search-tabs {
					flex-shrink: 0;
				}
			}

			${SearchPageView.getStyles()}
			${ChatView.getStyles()}
		`;
		document.head.appendChild(style);
	}
}
