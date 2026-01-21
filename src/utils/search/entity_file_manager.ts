import { App, TFile, Notice } from 'obsidian';
import { APIClient } from '../../api_client';
import { MarkdownGenerator } from './markdown_generator';

export class EntityFileManager {
	private app: App;
	private apiClient: APIClient;
	private markdownGenerator: MarkdownGenerator;

	constructor(app: App, apiClient: APIClient) {
		this.app = app;
		this.apiClient = apiClient;
		this.markdownGenerator = new MarkdownGenerator(app);
	}

	async generateMarkdownFiles(entity: any, syncFolder: string): Promise<void> {
		const entityName = entity.name || entity.entity_name || '未命名';

		console.log('[Generate MD] 搜索结果实体数据:', entity);

		try {
			new Notice(`正在获取 ${entityName} 的完整数据...`);

			const graphData = await this.apiClient.readGraph();
			console.log('[Generate MD] 完整图谱数据:', graphData);

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

			console.log('[Generate MD] 提取的关系数据:', relations);

			new Notice(`正在生成 ${entityName} 的 MarkDown 文件...`);

			const entityFolderPath = `${syncFolder}/${entityName}`;
			const observationFolderPath = `${entityFolderPath}/观察`;

			await this.markdownGenerator.ensureFolderExists(entityFolderPath);
			await this.markdownGenerator.ensureFolderExists(observationFolderPath);

			const mainMdPath = `${entityFolderPath}/${entityName}.md`;
			const mainMdContent = this.markdownGenerator.generateMainEntityMarkdown(
				entityName,
				entityType,
				observations,
				entityId,
				relations
			);

			await this.markdownGenerator.createOrUpdateFile(mainMdPath, mainMdContent);

			for (const observation of observations) {
				const observationTitle = this.markdownGenerator.extractObservationTitle(observation);
				const observationMdPath = `${observationFolderPath}/${observationTitle}.md`;
				const observationMdContent = this.markdownGenerator.generateObservationMarkdown(
					observation,
					entityName
				);

				await this.markdownGenerator.createOrUpdateFile(observationMdPath, observationMdContent);
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

	async resyncMarkdownFiles(entity: any, syncFolder: string): Promise<void> {
		const entityName = entity.name || entity.entity_name || '未命名';

		console.log('[Resync MD] 搜索结果实体数据:', entity);

		try {
			new Notice(`正在获取 ${entityName} 的完整数据...`);

			const graphData = await this.apiClient.readGraph();
			console.log('[Resync MD] 完整图谱数据:', graphData);

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

			console.log('[Resync MD] 提取的关系数据:', relations);

			new Notice(`正在重新同步 ${entityName} 的 MarkDown 文件...`);

			const entityFolderPath = `${syncFolder}/${entityName}`;
			const observationFolderPath = `${entityFolderPath}/观察`;

			const observationFolder = this.app.vault.getAbstractFileByPath(observationFolderPath);
			if (observationFolder) {
				const files = this.app.vault.getFiles().filter(f => f.path.startsWith(observationFolderPath));
				for (const file of files) {
					await this.app.vault.delete(file);
					console.log('[Resync MD] 删除旧观察文件:', file.path);
				}
			}

			if (!observationFolder) {
				await this.markdownGenerator.ensureFolderExists(observationFolderPath);
			}

			const mainMdPath = `${entityFolderPath}/${entityName}.md`;
			const mainMdContent = this.markdownGenerator.generateMainEntityMarkdown(
				entityName,
				entityType,
				observations,
				entityId,
				relations
			);

			await this.markdownGenerator.createOrUpdateFile(mainMdPath, mainMdContent);

			for (const observation of observations) {
				const observationTitle = this.markdownGenerator.extractObservationTitle(observation);
				const observationMdPath = `${observationFolderPath}/${observationTitle}.md`;
				const observationMdContent = this.markdownGenerator.generateObservationMarkdown(
					observation,
					entityName
				);

				await this.app.vault.create(observationMdPath, observationMdContent);
				console.log('[Resync MD] 创建观察文件:', observationMdPath);
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

	async checkFileExists(entityName: string, syncFolder: string): Promise<boolean> {
		const mdFilePath = `${syncFolder}/${entityName}/${entityName}.md`;
		const file = this.app.vault.getAbstractFileByPath(mdFilePath);
		return file instanceof TFile;
	}

	async openFile(entityName: string, syncFolder: string): Promise<void> {
		const mdFilePath = `${syncFolder}/${entityName}/${entityName}.md`;
		const file = this.app.vault.getAbstractFileByPath(mdFilePath);
		if (file instanceof TFile) {
			await this.app.workspace.getLeaf(false).openFile(file);
		} else {
			new Notice(`文件不存在: ${mdFilePath}`);
		}
	}
}
