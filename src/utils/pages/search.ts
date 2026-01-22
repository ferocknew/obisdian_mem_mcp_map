import { Notice, Menu, TFile, App } from 'obsidian';
import { APIClient } from '@/api_client';
import MemoryGraphPlugin from '@/main';
import { searchPageStyles } from './search.css';

export class SearchPageView {
	app: App;
	plugin: MemoryGraphPlugin;
	apiClient: APIClient;
	container: HTMLElement;
	searchInput: HTMLInputElement;
	searchButton: HTMLButtonElement;
	resultsContainer: HTMLElement;

	constructor(app: App, plugin: MemoryGraphPlugin, apiClient: APIClient, container: HTMLElement) {
		this.app = app;
		this.plugin = plugin;
		this.apiClient = apiClient;
		this.container = container;
	}

	createInterface() {
		this.container.empty();
		this.container.addClass('memory-search-view-container');

		// 创建搜索框容器
		const searchInputContainer = this.container.createDiv({ cls: 'memory-search-container' });

		// 创建搜索输入框
		this.searchInput = searchInputContainer.createEl('input', {
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
		this.searchButton = searchInputContainer.createEl('button', {
			text: '搜索',
			cls: 'memory-search-button'
		});

		this.searchButton.addEventListener('click', () => {
			this.handleSearch();
		});

		// 创建结果容器
		this.resultsContainer = this.container.createDiv({ cls: 'memory-search-results' });
		this.resultsContainer.createEl('div', {
			text: '输入关键词并点击搜索按钮',
			cls: 'memory-search-placeholder'
		});
	}

	show() {
		this.container.style.display = 'flex';
	}

	hide() {
		this.container.style.display = 'none';
	}

	async handleSearch(searchType: string = 'keyword') {
		const query = this.searchInput.value.trim();

		if (!query) {
			new Notice('请输入搜索内容');
			return;
		}

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

		if (searchType === 'keyword') {
			entities = results.entities || [];
		} else {
			entities = results.results || results.entities || results.data || [];
			if (Array.isArray(results)) {
				entities = results;
			}
		}

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
			header.createEl('span', {
				text: entity.name || entity.entity_name || '未命名',
				cls: 'result-name'
			});

			// 实体类型
			const type = entity.entity_type || entity.entityType || entity.type || '未分类';
			header.createEl('span', { text: type, cls: 'result-type' });

			// 如果是向量搜索，显示相似度分数
			if (searchType === 'semantic' && entity.similarity !== undefined) {
				header.createEl('span', {
					text: `相似度: ${(entity.similarity * 100).toFixed(1)}%`,
					cls: 'result-score'
				});
			}

			// 观察记录
			const observations = entity.observations || [];
			if (observations.length > 0) {
				const observationsDiv = resultItem.createDiv({ cls: 'result-observations' });
				observations.forEach((obs: any) => {
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

		// 构建 MD 文件路径
		const mdFilePath = `${syncFolder}/${entityName}/${entityName}.md`;
		const file = this.app.vault.getAbstractFileByPath(mdFilePath);
		const fileExists = file instanceof TFile;

		if (fileExists) {
			this.showEntityMenu(entity, event, true);
		} else {
			this.showEntityMenu(entity, event, false);
		}
	}

	private showEntityMenu(entity: any, event: MouseEvent, fileExists: boolean) {
		const entityName = entity.name || entity.entity_name || '未命名';
		const syncFolder = this.plugin.settings.syncTargetFolder;

		const menu = new Menu();

		if (fileExists) {
			menu.addItem((item) => {
				item
					.setTitle('打开')
					.setIcon('file-text')
					.onClick(async () => {
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
						await this.resyncMarkdownFiles(entity);
					});
			});
		} else {
			menu.addItem((item) => {
				item
					.setTitle('生成本地 MarkDown')
					.setIcon('file-plus')
					.onClick(async () => {
						await this.generateMarkdownFiles(entity);
					});
			});
		}

		menu.showAtMouseEvent(event);
	}

	private async resyncMarkdownFiles(entity: any) {
		const entityName = entity.name || entity.entity_name || '未命名';

		try {
			new Notice(`正在获取 ${entityName} 的完整数据...`);

			const graphData = await this.apiClient.readGraph();
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

			const allRelations = graphData.relations || [];
			const relations = allRelations.filter((r: any) =>
				(r.from === entityName || r.from_entity === entityName)
			);

			new Notice(`正在重新同步 ${entityName} 的 MarkDown 文件...`);

			const syncFolder = this.plugin.settings.syncTargetFolder;
			if (!syncFolder) {
				new Notice('请先在设置中配置同步目标目录');
				return;
			}

			const entityFolderPath = `${syncFolder}/${entityName}`;
			const observationFolderPath = `${entityFolderPath}/观察`;

			// 删除旧的观察文件
			const observationFolder = this.app.vault.getAbstractFileByPath(observationFolderPath);
			if (observationFolder) {
				const files = this.app.vault.getFiles().filter(f => f.path.startsWith(observationFolderPath));
				for (const file of files) {
					await this.app.vault.delete(file);
				}
			}

			// 确保观察目录存在
			if (!observationFolder) {
				await this.app.vault.createFolder(observationFolderPath);
			}

			// 生成主实体文件
			const mainMdPath = `${entityFolderPath}/${entityName}.md`;
			const mainMdContent = this.generateMainEntityMarkdown(entityName, entityType, observations, entityId, relations);

			const mainFile = this.app.vault.getAbstractFileByPath(mainMdPath);
			if (mainFile instanceof TFile) {
				await this.app.vault.modify(mainFile, mainMdContent);
			} else {
				await this.app.vault.create(mainMdPath, mainMdContent);
			}

			// 生成观察文件
			for (const observation of observations) {
				const observationTitle = this.extractObservationTitle(observation);
				const observationMdPath = `${observationFolderPath}/${observationTitle}.md`;
				const observationMdContent = this.generateObservationMarkdown(observation, entityName);
				await this.app.vault.create(observationMdPath, observationMdContent);
			}

			new Notice(`✓ 成功重新同步 ${entityName} 的 MarkDown 文件`);

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

		try {
			new Notice(`正在获取 ${entityName} 的完整数据...`);

			const graphData = await this.apiClient.readGraph();
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

			const allRelations = graphData.relations || [];
			const relations = allRelations.filter((r: any) =>
				(r.from === entityName || r.from_entity === entityName)
			);

			new Notice(`正在生成 ${entityName} 的 MarkDown 文件...`);

			const syncFolder = this.plugin.settings.syncTargetFolder;
			if (!syncFolder) {
				new Notice('请先在设置中配置同步目标目录');
				return;
			}

			const entityFolderPath = `${syncFolder}/${entityName}`;
			const entityFolder = this.app.vault.getAbstractFileByPath(entityFolderPath);

			if (!entityFolder) {
				await this.app.vault.createFolder(entityFolderPath);
			}

			const observationFolderPath = `${entityFolderPath}/观察`;
			const observationFolder = this.app.vault.getAbstractFileByPath(observationFolderPath);

			if (!observationFolder) {
				await this.app.vault.createFolder(observationFolderPath);
			}

			// 生成主实体文件
			const mainMdPath = `${entityFolderPath}/${entityName}.md`;
			const mainMdContent = this.generateMainEntityMarkdown(entityName, entityType, observations, entityId, relations);

			const existingMainFile = this.app.vault.getAbstractFileByPath(mainMdPath);
			if (existingMainFile instanceof TFile) {
				await this.app.vault.modify(existingMainFile, mainMdContent);
			} else {
				await this.app.vault.create(mainMdPath, mainMdContent);
			}

			// 生成观察文件
			for (const observation of observations) {
				const observationTitle = this.extractObservationTitle(observation);
				const observationMdPath = `${observationFolderPath}/${observationTitle}.md`;
				const observationMdContent = this.generateObservationMarkdown(observation, entityName);

				const existingObsFile = this.app.vault.getAbstractFileByPath(observationMdPath);
				if (existingObsFile instanceof TFile) {
					await this.app.vault.modify(existingObsFile, observationMdContent);
				} else {
					await this.app.vault.create(observationMdPath, observationMdContent);
				}
			}

			new Notice(`✓ 成功生成 ${entityName} 的 MarkDown 文件`);

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

		const keywords = this.extractKeywords(observations);

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

		for (const observation of observations) {
			const title = this.extractObservationTitle(observation);
			content += `- [[${title}]]\n`;
		}

		return content;
	}

	private generateObservationMarkdown(observation: any, entityName: string): string {
		const obsText = typeof observation === 'string' ? observation : (observation.content || '');
		const obsId = typeof observation === 'object' && observation.id ? observation.id : '';

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
		const obsText = typeof observation === 'string' ? observation : (observation.content || '');
		const firstLine = obsText.split('\n')[0].trim();
		const title = firstLine.length > 20 ? firstLine.substring(0, 20).trim() : firstLine;
		return title.replace(/[\/\\:*?"<>|]/g, '');
	}

	private extractKeywords(observations: any[]): string[] {
		const keywords: Set<string> = new Set();

		observations.forEach(obs => {
			const obsText = typeof obs === 'string' ? obs : (obs.content || '');
			const words = obsText.match(/[\u4e00-\u9fa5]{2,}/g) || [];
			words.slice(0, 3).forEach((word: string) => keywords.add(word));
		});

		return Array.from(keywords).slice(0, 5);
	}

	static getStyles(): string {
		return searchPageStyles;
	}
}
