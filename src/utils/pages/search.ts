import { Notice, Menu, TFile, App } from 'obsidian';
import { APIClient } from '@/utils/api/api_client';
import MemoryGraphPlugin from '@/main';
import { searchPageStyles } from './search.css';
import { SearchUIBuilder } from './search_ui';
import { SearchHandler } from './search_handler';
import { SearchResultsDisplay } from './search_results';
import { SearchEntityManager } from './search_entity_manager';

/**
 * 搜索页面视图
 *
 * 采用模块化架构，将不同职责拆分到专门的类中
 */
export class SearchPageView {
	app: App;
	plugin: MemoryGraphPlugin;
	apiClient: APIClient;
	container: HTMLElement;
	searchInput: HTMLInputElement;
	searchButton: HTMLButtonElement;
	resultsContainer: HTMLElement;

	// 模块化组件
	private uiBuilder: SearchUIBuilder;
	private searchHandler: SearchHandler;
	private resultsDisplay: SearchResultsDisplay;
	private entityManager: SearchEntityManager;

	constructor(app: App, plugin: MemoryGraphPlugin, apiClient: APIClient, container: HTMLElement) {
		this.app = app;
		this.plugin = plugin;
		this.apiClient = apiClient;
		this.container = container;

		// 初始化各个模块
		this.uiBuilder = new SearchUIBuilder(container);
		this.searchHandler = new SearchHandler(apiClient, this.uiBuilder);
		this.entityManager = new SearchEntityManager(app, plugin, apiClient);
		this.resultsDisplay = new SearchResultsDisplay(plugin, this.entityManager);
	}

	createInterface() {
		const elements = this.uiBuilder.createInterface();
		this.searchInput = elements.searchInput;
		this.searchButton = elements.searchButton;
		this.resultsContainer = elements.resultsContainer;

		// 监听回车键
		this.searchInput.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				this.handleSearch();
			}
		});

		// 监听搜索按钮点击
		this.searchButton.addEventListener('click', () => {
			this.handleSearch();
		});
	}

	show() {
		this.uiBuilder.show();
	}

	hide() {
		this.uiBuilder.hide();
	}

	// 保存当前搜索类型和结果，用于刷新
	private currentSearchType: string = 'keyword';
	private currentSearchResults: any = null;

	async handleSearch(searchType: string = 'keyword') {
		const query = this.searchInput.value.trim();

		// 保存搜索类型
		this.currentSearchType = searchType;

		// 显示加载状态
		this.uiBuilder.showLoading(this.resultsContainer);
		this.uiBuilder.setSearchButtonState(this.searchButton, true, '搜索中...');

		// 执行搜索
		const result = await this.searchHandler.handleSearch(query, searchType as 'keyword' | 'semantic');

		// 恢复搜索按钮
		this.uiBuilder.setSearchButtonState(this.searchButton, false, '搜索');

		// 处理结果
		if (!result.success) {
			this.uiBuilder.showError(this.resultsContainer, `搜索失败: ${result.error}`);
			new Notice(`搜索失败: ${result.error}`);
			return;
		}

		// 保存搜索结果
		this.currentSearchResults = result.results;

		// 显示结果
		this.resultsDisplay.displayResults(
			this.resultsContainer,
			result.results,
			searchType,
			(entity, event) => this.handleEntityClick(entity, event)
		);
	}

	/**
	 * 刷新搜索结果
	 */
	async refreshResults() {
		if (!this.currentSearchResults) {
			return;
		}

		// 重新显示当前结果，会过滤掉已删除的实体
		this.resultsDisplay.displayResults(
			this.resultsContainer,
			this.currentSearchResults,
			this.currentSearchType,
			(entity, event) => this.handleEntityClick(entity, event)
		);
	}

	/**
	 * 从搜索结果中移除实体
	 */
	removeEntityFromResults(entityName: string) {
		if (!this.currentSearchResults) {
			return;
		}

		// 处理不同搜索类型的结果格式
		let entities = [];
		if (this.currentSearchType === 'keyword') {
			entities = this.currentSearchResults.entities || [];
		} else {
			entities = this.currentSearchResults.results || this.currentSearchResults.entities || this.currentSearchResults.data || [];
			if (Array.isArray(this.currentSearchResults)) {
				entities = this.currentSearchResults;
			}
		}

		// 过滤掉已删除的实体
		const filteredEntities = entities.filter((e: any) => {
			const name = e.name || e.entity_name || '';
			return name !== entityName;
		});

		// 更新搜索结果
		if (this.currentSearchType === 'keyword') {
			this.currentSearchResults.entities = filteredEntities;
		} else {
			if (this.currentSearchResults.results) {
				this.currentSearchResults.results = filteredEntities;
			} else if (this.currentSearchResults.entities) {
				this.currentSearchResults.entities = filteredEntities;
			} else if (this.currentSearchResults.data) {
				this.currentSearchResults.data = filteredEntities;
			}
		}

		// 刷新显示
		this.refreshResults();
	}

	private async handleEntityClick(entity: any, event: MouseEvent) {
		const entityName = entity.name || entity.entity_name || '未命名';
		console.log('[Entity Click] 点击实体:', entityName);

		// 获取同步目录配置
		const syncFolder = this.plugin.settings.syncTargetFolder;
		if (!syncFolder) {
			new Notice('请先在设置中配置同步目录');
			return;
		}

		// 构建 MD 文件路径
		const mdFilePath = `${syncFolder}/${entityName}/${entityName}.md`;
		const file = this.app.vault.getAbstractFileByPath(mdFilePath);
		const fileExists = file instanceof TFile;

		// 显示实体菜单，传递刷新回调
		await this.resultsDisplay.showEntityMenu(
			entity,
			event,
			fileExists,
			() => this.removeEntityFromResults(entityName)
		);
	}

	static getStyles(): string {
		return searchPageStyles;
	}
}
