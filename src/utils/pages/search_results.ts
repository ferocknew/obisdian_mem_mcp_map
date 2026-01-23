/**
 * 搜索页面 - 结果显示模块
 *
 * 负责显示搜索结果和实体菜单
 */

import { Menu, TFile, Notice } from 'obsidian';
import { SearchEntityManager } from './search_entity_manager';
import MemoryGraphPlugin from '@/main';

export class SearchResultsDisplay {
	private plugin: MemoryGraphPlugin;
	private entityManager: SearchEntityManager;

	constructor(plugin: MemoryGraphPlugin, entityManager: SearchEntityManager) {
		this.plugin = plugin;
		this.entityManager = entityManager;
	}

	/**
	 * 显示搜索结果
	 */
	displayResults(resultsContainer: HTMLElement, results: any, searchType: string, onEntityClick: (entity: any, event: MouseEvent) => void): void {
		resultsContainer.empty();

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
			resultsContainer.createEl('div', {
				text: '未找到相关结果',
				cls: 'memory-search-empty'
			});
			return;
		}

		// 显示结果数量
		const countDiv = resultsContainer.createDiv({ cls: 'result-count' });
		countDiv.textContent = `找到 ${entities.length} 个结果`;

		entities.forEach((entity: any) => {
			this.createResultItem(resultsContainer, entity, searchType, onEntityClick);
		});
	}

	/**
	 * 创建单个结果项
	 */
	private createResultItem(container: HTMLElement, entity: any, searchType: string, onClick: (entity: any, event: MouseEvent) => void): void {
		const resultItem = container.createDiv({ cls: 'memory-search-result-item' });

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

		// 点击事件
		resultItem.addEventListener('click', async (e) => {
			onClick(entity, e as MouseEvent);
		});
	}

	/**
	 * 显示实体菜单
	 */
	async showEntityMenu(
		entity: any,
		event: MouseEvent,
		fileExists: boolean,
		onRefresh?: () => void
	): Promise<void> {
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
						const file = this.plugin.app.vault.getAbstractFileByPath(mdFilePath);
						if (file instanceof TFile) {
							await this.plugin.app.workspace.getLeaf(false).openFile(file);
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
						await this.entityManager.resyncMarkdownFiles(entity);
					});
			});
		} else {
			menu.addItem((item) => {
				item
					.setTitle('生成本地 MarkDown')
					.setIcon('file-plus')
					.onClick(async () => {
						await this.entityManager.generateMarkdownFiles(entity);
					});
			});
		}

		// 添加删除选项
		menu.addItem((item) => {
			item
				.setTitle('删除')
				.setIcon('trash')
				.onClick(async () => {
					// 确认删除
					const confirmed = await this.confirmDelete(entityName);
					if (confirmed) {
						await this.entityManager.deleteEntity(entity, onRefresh);
					}
				});
		});

		menu.showAtMouseEvent(event);
	}

	/**
	 * 确认删除对话框
	 */
	private async confirmDelete(entityName: string): Promise<boolean> {
		const modal = document.createElement('div');
		modal.style.cssText = `
			position: fixed;
			top: 0; left: 0; right: 0; bottom: 0;
			background: rgba(0, 0, 0, 0.5);
			display: flex;
			align-items: center;
			justify-content: center;
			z-index: 1000;
		`;

		const dialog = document.createElement('div');
		dialog.style.cssText = `
			background: var(--background-primary);
			padding: 20px;
			border-radius: 8px;
			min-width: 300px;
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		`;

		dialog.innerHTML = `
			<h3 style="margin-top: 0; margin-bottom: 15px;">确认删除</h3>
			<p style="margin-bottom: 20px;">确定要删除实体 <strong>${entityName}</strong> 吗？</p>
			<p style="margin-bottom: 20px; color: var(--text-muted); font-size: 0.9em;">
				此操作将删除实体及其所有关联关系，本地 Markdown 文件也会被删除。
			</p>
			<div style="display: flex; gap: 10px; justify-content: flex-end;">
				<button id="cancel-btn" style="
					padding: 8px 16px;
					border: 1px solid var(--background-modifier-border);
					background: var(--background-secondary);
					border-radius: 4px;
					cursor: pointer;
				">取消</button>
				<button id="confirm-btn" style="
					padding: 8px 16px;
					border: none;
					background: var(--color-red);
					color: white;
					border-radius: 4px;
					cursor: pointer;
				">删除</button>
			</div>
		`;

		modal.appendChild(dialog);
		document.body.appendChild(modal);

		return new Promise<boolean>((resolve) => {
			const cancelBtn = dialog.querySelector('#cancel-btn') as HTMLButtonElement;
			const confirmBtn = dialog.querySelector('#confirm-btn') as HTMLButtonElement;

			const cleanup = () => {
				document.body.removeChild(modal);
			};

			cancelBtn.onclick = () => {
				cleanup();
				resolve(false);
			};

			confirmBtn.onclick = () => {
				cleanup();
				resolve(true);
			};

			// 点击遮罩层关闭
			modal.onclick = (e) => {
				if (e.target === modal) {
					cleanup();
					resolve(false);
				}
			};
		});
	}
}
