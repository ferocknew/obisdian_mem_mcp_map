import { App, TFile } from 'obsidian';

export class MarkdownGenerator {
	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	generateMainEntityMarkdown(
		entityName: string,
		entityType: string,
		observations: any[],
		entityId?: string,
		relations?: any[]
	): string {
		const now = new Date();
		const dateStr = now.toISOString().split('T')[0];

		const keywords = this.extractKeywords(observations);
		const relationsFrontmatter = this.buildRelationsFrontmatter(relations);

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

	generateObservationMarkdown(observation: any, entityName: string): string {
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

	extractObservationTitle(observation: any): string {
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

	private buildRelationsFrontmatter(relations?: any[]): string {
		if (!relations || relations.length === 0) {
			return '';
		}

		let frontmatter = 'relations:\n';
		for (const relation of relations) {
			const relationType = relation.relation_type || relation.relationType || relation.type || '关联';
			const targetEntity = relation.to_entity || relation.to || relation.target || '';
			const description = relation.description || '';
			const bidirectional = relation.bidirectional !== undefined ? relation.bidirectional : false;

			frontmatter += `  - type: "${relationType}"\n`;
			frontmatter += `    target: "${targetEntity}"\n`;
			if (description) {
				frontmatter += `    description: "${description}"\n`;
			}
			frontmatter += `    bidirectional: ${bidirectional}\n`;
		}

		return frontmatter;
	}

	async createOrUpdateFile(filePath: string, content: string): Promise<void> {
		const existingFile = this.app.vault.getAbstractFileByPath(filePath);
		if (existingFile instanceof TFile) {
			await this.app.vault.modify(existingFile, content);
			console.log('[Markdown Generator] 覆盖文件:', filePath);
		} else {
			await this.app.vault.create(filePath, content);
			console.log('[Markdown Generator] 创建文件:', filePath);
		}
	}

	async ensureFolderExists(folderPath: string): Promise<void> {
		const folder = this.app.vault.getAbstractFileByPath(folderPath);
		if (!folder) {
			await this.app.vault.createFolder(folderPath);
			console.log('[Markdown Generator] 创建目录:', folderPath);
		}
	}
}
