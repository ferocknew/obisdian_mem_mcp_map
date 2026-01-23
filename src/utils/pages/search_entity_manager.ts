/**
 * 搜索页面 - 实体文件管理模块
 *
 * 负责生成和同步实体的 Markdown 文件
 */

import { Notice, TFile, App } from 'obsidian';
import { APIClient } from '@/utils/api/api_client';
import MemoryGraphPlugin from '@/main';

export class SearchEntityManager {
	private app: App;
	private plugin: MemoryGraphPlugin;
	private apiClient: APIClient;

	constructor(app: App, plugin: MemoryGraphPlugin, apiClient: APIClient) {
		this.app = app;
		this.plugin = plugin;
		this.apiClient = apiClient;
	}

	/**
	 * 重新同步 Markdown 文件
	 */
	async resyncMarkdownFiles(entity: any): Promise<void> {
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

	/**
	 * 生成新的 Markdown 文件
	 */
	async generateMarkdownFiles(entity: any): Promise<void> {
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

	/**
	 * 生成主实体 Markdown 内容
	 */
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
category: MAIN_ENTITY
type: 实体
entity_class: ${entityType}
entity_label: ${entityName}
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

	/**
	 * 生成观察记录 Markdown 内容
	 */
	private generateObservationMarkdown(observation: any, entityName: string): string {
		const obsText = typeof observation === 'string' ? observation : (observation.content || '');
		const obsId = typeof observation === 'object' && observation.id ? observation.id : '';
		const now = new Date();
		const dateStr = now.toISOString().split('T')[0];

		let content = '';
		if (obsId) {
			content = `---
id: ${obsId}
category: OBSERVATION
type: 观察
parent_entity: ${entityName}
created_at: ${dateStr}
---

`;
		} else {
			content = `---
category: OBSERVATION
type: 观察
parent_entity: ${entityName}
created_at: ${dateStr}
---

`;
		}

		content += `${obsText}

## 关联关系
- 属于: [[${entityName}]]
`;

		return content;
	}

	/**
	 * 提取观察记录标题
	 */
	private extractObservationTitle(observation: any): string {
		const obsText = typeof observation === 'string' ? observation : (observation.content || '');
		const firstLine = obsText.split('\n')[0].trim();
		const title = firstLine.length > 20 ? firstLine.substring(0, 20).trim() : firstLine;
		return title.replace(/[\/\\:*?"<>|]/g, '');
	}

	/**
	 * 删除实体
	 */
	async deleteEntity(entity: any, onRefresh?: () => void): Promise<void> {
		const entityName = entity.name || entity.entity_name || '未命名';

		try {
			// 调用 API 删除实体
			const result = await this.apiClient.delete.deleteEntities([entityName]);

			if (result.deleted_count > 0) {
				new Notice(`✓ 成功删除实体: ${entityName}`);

				// 如果存在本地 Markdown 文件，也删除
				const syncFolder = this.plugin.settings.syncTargetFolder;
				if (syncFolder) {
					const entityFolderPath = `${syncFolder}/${entityName}`;
					const entityFolder = this.app.vault.getAbstractFileByPath(entityFolderPath);

					if (entityFolder) {
						await this.app.vault.delete(entityFolder, true);
						new Notice(`✓ 已删除本地文件: ${entityFolderPath}`);
					}
				}

				// 从搜索结果中移除已删除的实体
				if (onRefresh) {
					onRefresh();
				}
			} else {
				new Notice(`删除失败: ${result.failed_entities?.[0]?.error || '未知错误'}`);
			}

		} catch (error) {
			console.error('[Delete Entity] 删除失败:', error);
			new Notice(`删除失败: ${error.message}`);
		}
	}

	/**
	 * 提取关键词
	 */
	private extractKeywords(observations: any[]): string[] {
		const keywords: Set<string> = new Set();

		observations.forEach(obs => {
			const obsText = typeof obs === 'string' ? obs : (obs.content || '');
			const words = obsText.match(/[\u4e00-\u9fa5]{2,}/g) || [];
			words.slice(0, 3).forEach((word: string) => keywords.add(word));
		});

		return Array.from(keywords).slice(0, 5);
	}
}
