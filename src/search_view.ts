import { ItemView, WorkspaceLeaf, Notice, Menu, TFile } from 'obsidian';
import MemoryGraphPlugin from './main';
import { APIClient } from './api_client';

export const VIEW_TYPE_MEMORY_SEARCH = 'memory-search-view';

export class MemorySearchView extends ItemView {
	plugin: MemoryGraphPlugin;
	searchInput: HTMLInputElement;
	searchButton: HTMLButtonElement;
	resultsContainer: HTMLElement;
	apiClient: APIClient;
	tabsContainer: HTMLElement;

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
		const container = this.containerEl.children[1];
		container.empty();
		container.addClass('memory-search-view');

		// 初始化 API 客户端
		await this.initializeAPIClient();

		// 创建标签页容器
		this.tabsContainer = container.createDiv({ cls: 'memory-search-tabs' });

		// 创建关键词搜索标签
		const keywordTab = this.tabsContainer.createEl('button', {
			text: '关键词搜索（空格多个词 = And）',
			cls: 'memory-search-tab active'
		});
		keywordTab.setAttribute('data-type', 'keyword');

		// 创建向量搜索标签
		const semanticTab = this.tabsContainer.createEl('button', {
			text: '向量搜索',
			cls: 'memory-search-tab'
		});
		semanticTab.setAttribute('data-type', 'semantic');

		// 标签切换事件
		const tabs = [keywordTab, semanticTab];
		tabs.forEach(tab => {
			tab.addEventListener('click', () => {
				tabs.forEach(t => t.removeClass('active'));
				tab.addClass('active');
			});
		});

		// 创建搜索框容器
		const searchContainer = container.createDiv({ cls: 'memory-search-container' });

		// 创建搜索输入框
		this.searchInput = searchContainer.createEl('input', {
			type: 'text',
			placeholder: '输入搜索内容...',
			cls: 'memory-search-input'
		});

		// 监听回车键
		this.searchInput.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				this.handleSearch();
			}
		});

		// 创建搜索按钮
		this.searchButton = searchContainer.createEl('button', {
			text: '搜索',
			cls: 'memory-search-button'
		});

		this.searchButton.addEventListener('click', () => {
			this.handleSearch();
		});

		// 创建结果容器
		this.resultsContainer = container.createDiv({ cls: 'memory-search-results' });
		this.resultsContainer.createEl('div', {
			text: '输入关键词并点击搜索按钮',
			cls: 'memory-search-placeholder'
		});

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
			} else {
				console.warn('[Search View] 未配置 API 地址');
			}
		} catch (error) {
			console.error('[Search View] API 客户端初始化失败:', error);
		}
	}

	private async handleSearch() {
		const query = this.searchInput.value.trim();

		if (!query) {
			new Notice('请输入搜索内容');
			return;
		}

		// 从活动标签获取搜索类型
		const activeTab = this.tabsContainer.querySelector('.memory-search-tab.active') as HTMLElement;
		const searchType = activeTab?.getAttribute('data-type') || 'keyword';

		// 显示加载状态
		this.resultsContainer.empty();
		this.resultsContainer.createEl('div', {
			text: '搜索中...',
			cls: 'memory-search-loading'
		});

		// 禁用搜索按钮
		this.searchButton.disabled = true;
		this.searchButton.textContent = '搜索中...';

		try {
			console.log('搜索关键词:', query, '搜索类型:', searchType);

			// 检查 API 是否已连接
			if (!this.apiClient.isConnected()) {
				await this.initializeAPIClient();
			}

			if (!this.apiClient.isConnected()) {
				throw new Error('API 未连接，请先在设置中配置 API 地址');
			}

			let results;
			if (searchType === 'keyword') {
				// 关键词搜索
				results = await this.apiClient.searchNodes(query);
			} else {
				// 向量搜索
				results = await this.apiClient.semanticSearch(query, 20);
			}

			console.log('搜索结果:', results);
			console.log('搜索结果类型:', typeof results);
			console.log('搜索结果键:', Object.keys(results));
			this.displayResults(results, searchType);

		} catch (error) {
			console.error('搜索失败:', error);
			this.resultsContainer.empty();
			this.resultsContainer.createEl('div', {
				text: `搜索失败: ${error.message}`,
				cls: 'memory-search-error'
			});
			new Notice(`搜索失败: ${error.message}`);
		} finally {
			// 恢复搜索按钮
			this.searchButton.disabled = false;
			this.searchButton.textContent = '搜索';
		}
	}

	private displayResults(results: any, searchType: string) {
		this.resultsContainer.empty();

		// 处理不同搜索类型的结果格式
		let entities = [];

		console.log('[Display Results] 原始结果:', results);
		console.log('[Display Results] 搜索类型:', searchType);

		if (searchType === 'keyword') {
			// 关键词搜索返回的是 { entities: [...] }
			entities = results.entities || [];
		} else {
			// 向量搜索可能返回多种格式，尝试所有可能的字段
			entities = results.results || results.entities || results.data || [];

			// 如果 results 本身就是数组
			if (Array.isArray(results)) {
				entities = results;
			}
		}

		console.log('[Display Results] 提取的实体数量:', entities.length);
		console.log('[Display Results] 实体数据:', entities);

		if (entities.length === 0) {
			this.resultsContainer.createEl('div', {
				text: '未找到相关结果',
				cls: 'memory-search-empty'
			});
			return;
		}

		// 显示结果数量
		const countDiv = this.resultsContainer.createDiv({ cls: 'result-count' });
		countDiv.textContent = `找到 ${entities.length} 个结果`;

		entities.forEach((entity: any) => {
			const resultItem = this.resultsContainer.createDiv({ cls: 'memory-search-result-item' });

			const header = resultItem.createDiv({ cls: 'result-header' });

			// 实体名称
			const nameSpan = header.createEl('span', {
				text: entity.name || entity.entity_name || '未命名',
				cls: 'result-name'
			});

			// 实体类型
			const type = entity.entity_type || entity.entityType || entity.type || '未分类';
			header.createEl('span', { text: type, cls: 'result-type' });

			// 如果是向量搜索，显示相似度分数
			if (searchType === 'semantic' && entity.similarity !== undefined) {
				const scoreSpan = header.createEl('span', {
					text: `相似度: ${(entity.similarity * 100).toFixed(1)}%`,
					cls: 'result-score'
				});
			}

			// 观察记录
			const observations = entity.observations || [];
			if (observations.length > 0) {
				const observationsDiv = resultItem.createDiv({ cls: 'result-observations' });
				observations.forEach((obs: any) => {
					// 观察可能是对象 {id, content} 或字符串
					const obsText = typeof obs === 'string' ? obs : (obs.content || '');
					observationsDiv.createEl('div', { text: obsText, cls: 'observation-item' });
				});
			}

			// 点击事件：检查并打开对应的 MD 文件
			resultItem.addEventListener('click', async (e) => {
				await this.handleEntityClick(entity, e);
			});
		});
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

		// 构建 MD 文件路径: <同步目录>/<实体名称>/<实体名称>.md
		const mdFilePath = `${syncFolder}/${entityName}/${entityName}.md`;
		console.log('[Entity Click] 检查文件路径:', mdFilePath);

		// 检查文件是否存在
		const file = this.app.vault.getAbstractFileByPath(mdFilePath);
		const fileExists = file instanceof TFile;

		if (fileExists) {
			// 文件存在，显示"再次同步"菜单
			console.log('[Entity Click] 文件存在，显示再次同步菜单');
			this.showEntityMenu(entity, event, true);
		} else {
			// 文件不存在，显示"生成本地 MarkDown"菜单
			console.log('[Entity Click] 文件不存在，显示生成菜单');
			this.showEntityMenu(entity, event, false);
		}
	}

	private showEntityMenu(entity: any, event: MouseEvent, fileExists: boolean) {
		const entityName = entity.name || entity.entity_name || '未命名';
		const syncFolder = this.plugin.settings.syncTargetFolder;

		const menu = new Menu();

		if (fileExists) {
			// 文件已存在，显示"打开"和"再次下载"选项
			menu.addItem((item) => {
				item
					.setTitle('打开')
					.setIcon('file-text')
					.onClick(async () => {
						console.log('[Entity Menu] 选择打开:', entityName);
						const mdFilePath = `${syncFolder}/${entityName}/${entityName}.md`;
						const file = this.app.vault.getAbstractFileByPath(mdFilePath);
						if (file instanceof TFile) {
							await this.app.workspace.getLeaf(false).openFile(file);
						} else {
							new Notice(`文件不存在: ${mdFilePath}`);
						}
					});
			});

			menu.addItem((item) => {
				item
					.setTitle('再次下载')
					.setIcon('refresh-cw')
					.onClick(async () => {
						console.log('[Entity Menu] 选择再次同步:', entityName);
						await this.resyncMarkdownFiles(entity);
					});
			});
		} else {
			// 文件不存在，显示"生成本地 MarkDown"选项
			menu.addItem((item) => {
				item
					.setTitle('生成本地 MarkDown')
					.setIcon('file-plus')
					.onClick(async () => {
						console.log('[Entity Menu] 选择生成本地 MarkDown:', entityName);
						await this.generateMarkdownFiles(entity);
					});
			});
		}

		menu.showAtMouseEvent(event);
	}

	private async resyncMarkdownFiles(entity: any) {
		const entityName = entity.name || entity.entity_name || '未命名';

		console.log('[Resync MD] 搜索结果实体数据:', entity);

		try {
			new Notice(`正在获取 ${entityName} 的完整数据...`);

			// 使用 read_graph API 获取完整的图谱数据（包含关系）
			const graphData = await this.apiClient.readGraph();
			console.log('[Resync MD] 完整图谱数据:', graphData);

			// 从图谱中找到目标实体
			const entities = graphData.entities || [];
			const fullEntity = entities.find((e: any) =>
				(e.name || e.entity_name) === entityName
			);

			if (!fullEntity) {
				new Notice(`未找到实体 ${entityName} 的完整数据`);
				return;
			}

			const entityType = fullEntity.entity_type || fullEntity.entityType || fullEntity.type || '未分类';
			const observations = fullEntity.observations || [];
			const entityId = fullEntity.id || fullEntity.uuid || fullEntity.entity_id || '';

			// 从图谱的 relations 数组中提取与当前实体相关的关系
			const allRelations = graphData.relations || [];
			const relations = allRelations.filter((r: any) =>
				(r.from === entityName || r.from_entity === entityName)
			);

			console.log('[Resync MD] 提取的关系数据:', relations);

			new Notice(`正在重新同步 ${entityName} 的 MarkDown 文件...`);

			// 获取同步目录
			const syncFolder = this.plugin.settings.syncTargetFolder;
			if (!syncFolder) {
				new Notice('请先在设置中配置同步目标目录');
				return;
			}

			// 实体目录路径
			const entityFolderPath = `${syncFolder}/${entityName}`;
			const observationFolderPath = `${entityFolderPath}/观察`;

			// 删除旧的观察文件
			const observationFolder = this.app.vault.getAbstractFileByPath(observationFolderPath);
			if (observationFolder) {
				const files = this.app.vault.getFiles().filter(f => f.path.startsWith(observationFolderPath));
				for (const file of files) {
					await this.app.vault.delete(file);
					console.log('[Resync MD] 删除旧观察文件:', file.path);
				}
			}

			// 确保观察目录存在
			if (!observationFolder) {
				await this.app.vault.createFolder(observationFolderPath);
				console.log('[Resync MD] 创建观察目录:', observationFolderPath);
			}

			// 生成新的主实体 MD 文件（覆盖，传入关系数据）
			const mainMdPath = `${entityFolderPath}/${entityName}.md`;
			const mainMdContent = this.generateMainEntityMarkdown(entityName, entityType, observations, entityId, relations);

			const mainFile = this.app.vault.getAbstractFileByPath(mainMdPath);
			if (mainFile instanceof TFile) {
				await this.app.vault.modify(mainFile, mainMdContent);
				console.log('[Resync MD] 覆盖主实体文件:', mainMdPath);
			} else {
				await this.app.vault.create(mainMdPath, mainMdContent);
				console.log('[Resync MD] 创建主实体文件:', mainMdPath);
			}

			// 生成新的观察 MD 文件
			for (const observation of observations) {
				const observationTitle = this.extractObservationTitle(observation);
				const observationMdPath = `${observationFolderPath}/${observationTitle}.md`;
				const observationMdContent = this.generateObservationMarkdown(observation, entityName);

				await this.app.vault.create(observationMdPath, observationMdContent);
				console.log('[Resync MD] 创建观察文件:', observationMdPath);
			}

			new Notice(`✓ 成功重新同步 ${entityName} 的 MarkDown 文件`);

			// 打开主实体文件
			const updatedMainFile = this.app.vault.getAbstractFileByPath(mainMdPath);
			if (updatedMainFile instanceof TFile) {
				await this.app.workspace.getLeaf(false).openFile(updatedMainFile);
			}

		} catch (error) {
			console.error('[Resync MD] 重新同步失败:', error);
			new Notice(`重新同步失败: ${error.message}`);
		}
	}

	private async generateMarkdownFiles(entity: any) {
		const entityName = entity.name || entity.entity_name || '未命名';

		console.log('[Generate MD] 搜索结果实体数据:', entity);

		try {
			new Notice(`正在获取 ${entityName} 的完整数据...`);

			// 使用 read_graph API 获取完整的图谱数据（包含关系）
			const graphData = await this.apiClient.readGraph();
			console.log('[Generate MD] 完整图谱数据:', graphData);

			// 从图谱中找到目标实体
			const entities = graphData.entities || [];
			const fullEntity = entities.find((e: any) =>
				(e.name || e.entity_name) === entityName
			);

			if (!fullEntity) {
				new Notice(`未找到实体 ${entityName} 的完整数据`);
				return;
			}

			const entityType = fullEntity.entity_type || fullEntity.entityType || fullEntity.type || '未分类';
			const observations = fullEntity.observations || [];
			const entityId = fullEntity.id || fullEntity.uuid || fullEntity.entity_id || '';

			// 从图谱的 relations 数组中提取与当前实体相关的关系
			const allRelations = graphData.relations || [];
			const relations = allRelations.filter((r: any) =>
				(r.from === entityName || r.from_entity === entityName)
			);

			console.log('[Generate MD] 提取的关系数据:', relations);

			new Notice(`正在生成 ${entityName} 的 MarkDown 文件...`);

			// 获取同步目录
			const syncFolder = this.plugin.settings.syncTargetFolder;
			if (!syncFolder) {
				new Notice('请先在设置中配置同步目标目录');
				return;
			}

			// 创建实体目录
			const entityFolderPath = `${syncFolder}/${entityName}`;
			const entityFolder = this.app.vault.getAbstractFileByPath(entityFolderPath);

			if (!entityFolder) {
				await this.app.vault.createFolder(entityFolderPath);
				console.log('[Generate MD] 创建实体目录:', entityFolderPath);
			}

			// 创建观察目录
			const observationFolderPath = `${entityFolderPath}/观察`;
			const observationFolder = this.app.vault.getAbstractFileByPath(observationFolderPath);

			if (!observationFolder) {
				await this.app.vault.createFolder(observationFolderPath);
				console.log('[Generate MD] 创建观察目录:', observationFolderPath);
			}

			// 生成主实体 MD 文件（传入关系数据）
			const mainMdPath = `${entityFolderPath}/${entityName}.md`;
			const mainMdContent = this.generateMainEntityMarkdown(entityName, entityType, observations, entityId, relations);

			// 检查文件是否已存在，如果存在则覆盖
			const existingMainFile = this.app.vault.getAbstractFileByPath(mainMdPath);
			if (existingMainFile instanceof TFile) {
				await this.app.vault.modify(existingMainFile, mainMdContent);
				console.log('[Generate MD] 覆盖主实体文件:', mainMdPath);
			} else {
				await this.app.vault.create(mainMdPath, mainMdContent);
				console.log('[Generate MD] 创建主实体文件:', mainMdPath);
			}

			// 生成观察 MD 文件
			for (const observation of observations) {
				const observationTitle = this.extractObservationTitle(observation);
				const observationMdPath = `${observationFolderPath}/${observationTitle}.md`;
				const observationMdContent = this.generateObservationMarkdown(observation, entityName);

				// 检查文件是否已存在，如果存在则覆盖
				const existingObsFile = this.app.vault.getAbstractFileByPath(observationMdPath);
				if (existingObsFile instanceof TFile) {
					await this.app.vault.modify(existingObsFile, observationMdContent);
					console.log('[Generate MD] 覆盖观察文件:', observationMdPath);
				} else {
					await this.app.vault.create(observationMdPath, observationMdContent);
					console.log('[Generate MD] 创建观察文件:', observationMdPath);
				}
			}

			new Notice(`✓ 成功生成 ${entityName} 的 MarkDown 文件`);

			// 打开主实体文件
			const mainFile = this.app.vault.getAbstractFileByPath(mainMdPath);
			if (mainFile instanceof TFile) {
				await this.app.workspace.getLeaf(false).openFile(mainFile);
			}

		} catch (error) {
			console.error('[Generate MD] 生成失败:', error);
			new Notice(`生成失败: ${error.message}`);
		}
	}

	private generateMainEntityMarkdown(entityName: string, entityType: string, observations: any[], entityId?: string, relations?: any[]): string {
		const now = new Date();
		const dateStr = now.toISOString().split('T')[0];

		// 从观察中提取关键词
		const keywords = this.extractKeywords(observations);

		// 构建 frontmatter 中的 relations 字段
		let relationsFrontmatter = '';
		if (relations && relations.length > 0) {
			relationsFrontmatter = 'relations:\n';
			for (const relation of relations) {
				const relationType = relation.relation_type || relation.relationType || relation.type || '关联';
				const targetEntity = relation.to_entity || relation.to || relation.target || '';
				const description = relation.description || '';
				const bidirectional = relation.bidirectional !== undefined ? relation.bidirectional : false;

				relationsFrontmatter += `  - type: "${relationType}"\n`;
				relationsFrontmatter += `    target: "${targetEntity}"\n`;
				if (description) {
					relationsFrontmatter += `    description: "${description}"\n`;
				}
				relationsFrontmatter += `    bidirectional: ${bidirectional}\n`;
			}
		}

		let content = `---
title: ${entityName}
id: ${entityId || 'unknown'}
created_at: ${dateStr}
updated_at: ${dateStr}
tags:
  - ${entityType}
keywords:
${keywords.map(k => `  - ${k}`).join('\n')}
${relationsFrontmatter}---

# ${entityName}

**实体类型**: ${entityType}

## 基本信息
- **创建时间**: ${dateStr}
- **观察数量**: ${observations.length}

## 关联关系
`;

		// 添加关联关系内容
		if (relations && relations.length > 0) {
			for (const relation of relations) {
				const relationType = relation.relation_type || relation.relationType || relation.type || '关联';
				const targetEntity = relation.to_entity || relation.to || relation.target || '';
				content += `- ${relationType}: [[${targetEntity}]]\n`;
			}
		} else {
			content += `<!-- 暂无关联关系 -->\n`;
		}

		content += `\n### 观察\n`;

		// 添加观察链接
		for (const observation of observations) {
			const title = this.extractObservationTitle(observation);
			content += `- [[${title}]]\n`;
		}

		return content;
	}

	private generateObservationMarkdown(observation: any, entityName: string): string {
		// 观察可能是对象 {id, content} 或字符串
		const obsText = typeof observation === 'string' ? observation : (observation.content || '');
		const obsId = typeof observation === 'object' && observation.id ? observation.id : '';

		// 如果有 ID，添加 frontmatter
		let content = '';
		if (obsId) {
			content = `---
id: ${obsId}
---

`;
		}

		content += `${obsText}

## 关联关系
- 属于: [[${entityName}]]
`;

		return content;
	}

	private extractObservationTitle(observation: any): string {
		// 观察可能是对象 {id, content} 或字符串
		const obsText = typeof observation === 'string' ? observation : (observation.content || '');

		// 提取观察的标题（取第一行，如果超过20字符则截断）
		const firstLine = obsText.split('\n')[0].trim();
		const title = firstLine.length > 20 ? firstLine.substring(0, 20).trim() : firstLine;

		// 移除特殊字符，避免文件名问题
		return title.replace(/[\/\\:*?"<>|]/g, '');
	}

	private extractKeywords(observations: any[]): string[] {
		// 简单的关键词提取：从观察中提取常见词汇
		const keywords: Set<string> = new Set();

		observations.forEach(obs => {
			// 观察可能是对象 {id, content} 或字符串
			const obsText = typeof obs === 'string' ? obs : (obs.content || '');

			// 提取中文词汇（简单实现）
			const words = obsText.match(/[\u4e00-\u9fa5]{2,}/g) || [];
			words.slice(0, 3).forEach((word: string) => keywords.add(word));
		});

		return Array.from(keywords).slice(0, 5);
	}

	private addStyles() {
		// 添加自定义样式
		const style = document.createElement('style');
		style.textContent = `
			.memory-search-view {
				padding: 10px;
				height: 100%;
				display: flex;
				flex-direction: column;
			}

			.memory-search-tabs {
				display: flex;
				gap: 8px;
				margin-bottom: 15px;
				border-bottom: 2px solid var(--background-modifier-border);
				padding-bottom: 8px;
			}

			.memory-search-tab {
				padding: 8px 16px;
				border: none;
				border-radius: 4px 4px 0 0;
				background: transparent;
				color: var(--text-muted);
				font-size: 14px;
				cursor: pointer;
				transition: all 0.2s;
				position: relative;
			}

			.memory-search-tab:hover {
				background: var(--background-modifier-hover);
				color: var(--text-normal);
			}

			.memory-search-tab.active {
				background: var(--interactive-accent);
				color: var(--text-on-accent);
				font-weight: 500;
			}

			.memory-search-tab.active::after {
				content: '';
				position: absolute;
				bottom: -10px;
				left: 0;
				right: 0;
				height: 2px;
				background: var(--interactive-accent);
			}

			.memory-search-container {
				margin-bottom: 15px;
				display: flex;
				gap: 8px;
				align-items: center;
			}

			.memory-search-input {
				flex: 1;
				padding: 8px 12px;
				border: 1px solid var(--background-modifier-border);
				border-radius: 4px;
				background: var(--background-primary);
				color: var(--text-normal);
				font-size: 14px;
			}

			.memory-search-input:focus {
				outline: none;
				border-color: var(--interactive-accent);
			}

			.memory-search-button {
				padding: 8px 20px;
				border: none;
				border-radius: 4px;
				background: var(--interactive-accent);
				color: var(--text-on-accent);
				font-size: 14px;
				cursor: pointer;
				white-space: nowrap;
			}

			.memory-search-button:hover {
				background: var(--interactive-accent-hover);
			}

			.memory-search-button:disabled {
				opacity: 0.5;
				cursor: not-allowed;
			}

			.memory-search-results {
				flex: 1;
				overflow-y: auto;
			}

			.memory-search-placeholder,
			.memory-search-loading,
			.memory-search-error,
			.memory-search-empty {
				text-align: center;
				padding: 20px;
				color: var(--text-muted);
			}

			.memory-search-error {
				color: var(--text-error);
			}

			.result-count {
				padding: 8px 12px;
				margin-bottom: 10px;
				font-size: 13px;
				color: var(--text-muted);
				border-bottom: 1px solid var(--background-modifier-border);
			}

			.memory-search-result-item {
				padding: 12px;
				margin-bottom: 8px;
				border: 1px solid var(--background-modifier-border);
				border-radius: 4px;
				background: var(--background-secondary);
				cursor: pointer;
				transition: background 0.2s;
			}

			.memory-search-result-item:hover {
				background: var(--background-modifier-hover);
			}

			.result-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 8px;
				gap: 8px;
				flex-wrap: wrap;
			}

			.result-name {
				font-weight: 600;
				color: var(--text-normal);
				flex: 1;
			}

			.result-type {
				font-size: 12px;
				padding: 2px 8px;
				border-radius: 3px;
				background: var(--background-modifier-border);
				color: var(--text-muted);
			}

			.result-score {
				font-size: 12px;
				padding: 2px 8px;
				border-radius: 3px;
				background: var(--interactive-accent);
				color: var(--text-on-accent);
			}

			.result-observations {
				margin-top: 8px;
			}

			.observation-item {
				padding: 4px 0;
				font-size: 13px;
				color: var(--text-muted);
				border-left: 2px solid var(--background-modifier-border);
				padding-left: 8px;
				margin-bottom: 4px;
			}
		`;
		document.head.appendChild(style);
	}
}
