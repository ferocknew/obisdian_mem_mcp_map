/**
 * 文件监听 Hook
 *
 * 监听 Obsidian vault 中的文件修改事件
 * 用于自动同步观察文件到服务器
 */

import { Plugin, TFile, TAbstractFile, Notice } from 'obsidian';
import MemoryGraphPlugin from '@/main';

export class FileWatcher {
	private plugin: MemoryGraphPlugin;
	private syncFolder: string;
	private debounceTimer: Map<string, NodeJS.Timeout>;
	private debounceDelay: number = 1000; // 防抖延迟 1 秒
	private isEnabled: boolean = false; // 是否启用自动同步

	constructor(plugin: MemoryGraphPlugin) {
		this.plugin = plugin;
		this.syncFolder = plugin.settings.syncTargetFolder || '';
		this.debounceTimer = new Map();
		this.isEnabled = plugin.settings.autoSyncObservations || false;
	}

	/**
	 * 设置是否启用自动同步
	 */
	setEnabled(enabled: boolean): void {
		this.isEnabled = enabled;
		console.log('[File Watcher] 自动同步', enabled ? '已启用' : '已禁用');
	}

	/**
	 * 检查是否启用
	 */
	isAutoSyncEnabled(): boolean {
		return this.isEnabled;
	}

	/**
	 * 注册文件修改监听器
	 */
	register(): void {
		console.log('[File Watcher] 注册文件修改监听器');

		this.plugin.registerEvent(
			this.plugin.app.vault.on('modify', async (file: TAbstractFile) => {
				await this.onFileModified(file);
			})
		);
	}

	/**
	 * 文件修改事件处理
	 */
	private async onFileModified(file: TAbstractFile): Promise<void> {
		// 如果未启用自动同步，跳过
		if (!this.isEnabled) {
			return;
		}

		// 只处理 Markdown 文件
		if (!(file instanceof TFile) || file.extension !== 'md') {
			return;
		}

		// 只处理同步目标文件夹下的文件
		if (!this.syncFolder || !file.path.startsWith(this.syncFolder)) {
			return;
		}

		// 防抖：清除之前的定时器
		if (this.debounceTimer.has(file.path)) {
			clearTimeout(this.debounceTimer.get(file.path));
		}

		// 设置新的定时器
		const timer = setTimeout(async () => {
			await this.processFileModification(file);
			this.debounceTimer.delete(file.path);
		}, this.debounceDelay);

		this.debounceTimer.set(file.path, timer);

		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log('[File Watcher] 📝 检测到文件修改（防抖中...）');
		console.log('[File Watcher] 文件路径:', file.path);
	}

	/**
	 * 处理文件修改（防抖后执行）
	 */
	private async processFileModification(file: TFile): Promise<void> {
		console.log('[File Watcher] 🚀 开始处理文件修改');
		console.log('[File Watcher] 文件路径:', file.path);
		console.log('[File Watcher] 文件大小:', file.stat.size, 'bytes');
		console.log('[File Watcher] 修改时间:', new Date(file.stat.mtime).toLocaleString());

		// 判断文件类型
		const isObservationFile = file.path.includes('/观察/');

		if (isObservationFile) {
			console.log('[File Watcher] 📄 文件类型: 观察文件');
			await this.handleObservationModified(file);
		} else {
			console.log('[File Watcher] 📁 文件类型: 主实体文件');
			await this.handleEntityModified(file);
		}

		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
	}

	/**
	 * 处理观察文件修改
	 */
	private async handleObservationModified(file: TFile): Promise<void> {
		try {
			console.log('[File Watcher] 📖 读取文件内容...');

			const content = await this.plugin.app.vault.read(file);
			const obsContent = this.extractObservationContent(content);
			const frontmatter = this.parseFrontmatter(content);

			console.log('[File Watcher] 解析 frontmatter:', frontmatter);
			console.log('[File Watcher] 观察内容长度:', obsContent.length, '字符');
			console.log('[File Watcher] 观察内容预览:', obsContent.substring(0, 100) + '...');

			// 前置判断 1: 检查必要字段
			const observationId = frontmatter.id;
			const parentEntity = frontmatter.parent_entity;

			if (!observationId) {
				console.warn('[File Watcher] ⚠️ 缺少 id 字段，跳过同步');
				return;
			}

			if (!parentEntity) {
				console.warn('[File Watcher] ⚠️ 缺少 parent_entity 字段，跳过同步');
				return;
			}

			console.log('[File Watcher] 观察记录 ID:', observationId);
			console.log('[File Watcher] 所属实体:', parentEntity);

			// 前置判断 2: 计算内容哈希并对比
			const oldHash = frontmatter.content_hash;
			const newHash = this.calculateHash(obsContent);

			console.log('[File Watcher] 旧内容哈希:', oldHash || '（首次生成）');
			console.log('[File Watcher] 新内容哈希:', newHash);

			// 如果内容未变化，跳过同步
			if (oldHash === newHash) {
				console.log('[File Watcher] ✅ 内容未变化，跳过同步');
				return;
			}

			console.log('[File Watcher] 🔄 检测到内容变化，准备同步到服务器');
			new Notice(`🔄 正在同步观察记录: ${file.name}`);

			// 获取 API 客户端
			const apiClient = this.getAPIClient();
			if (!apiClient) {
				console.error('[File Watcher] ❌ 无法获取 API 客户端');
				new Notice('❌ 无法连接到服务器');
				return;
			}

			// 调用更新 API
			console.log('[File Watcher] 📡 调用 update_observations API');
			const updateResult = await apiClient.create.updateObservationsById([{
				observation_id: observationId,
				content: obsContent
			}]);

			console.log('[File Watcher] API 响应:', updateResult);

			// 更新本地 content_hash
			console.log('[File Watcher] 💾 更新本地 content_hash');
			const updatedContent = this.updateContentHash(content, newHash);
			await this.plugin.app.vault.modify(file, updatedContent);

			console.log('[File Watcher] ✅ 同步完成');
			new Notice(`✅ 已同步观察记录: ${file.name}`);

		} catch (error) {
			console.error('[File Watcher] ❌ 处理失败:', error);
			new Notice(`❌ 同步失败: ${error.message}`);
		}
	}

	/**
	 * 处理主实体文件修改
	 */
	private async handleEntityModified(file: TFile): Promise<void> {
		console.log('[File Watcher] 📖 读取主实体文件...');

		try {
			const content = await this.plugin.app.vault.read(file);
			const frontmatter = this.parseFrontmatter(content);

			console.log('[File Watcher] 实体名称:', frontmatter.title);
			console.log('[File Watcher] 实体类型:', frontmatter.entity_class || frontmatter.type);
			console.log('[File Watcher] 实体 ID:', frontmatter.id);

			// TODO: 后续在这里实现主实体文件同步逻辑

		} catch (error) {
			console.error('[File Watcher] ❌ 读取失败:', error);
		}
	}

	/**
	 * 获取 API 客户端
	 */
	private getAPIClient() {
		const leaves = this.plugin.app.workspace.getLeavesOfType('memory-search');
		if (leaves.length > 0) {
			const view = leaves[0].view as any;
			return view.apiClient;
		}
		return null;
	}

	/**
	 * 提取观察内容（去除 frontmatter 和关联关系）
	 */
	private extractObservationContent(content: string): string {
		// 去除 frontmatter
		let text = content.replace(/^---\n[\s\S]+?\n---\n/, '');

		// 去除关联关系部分
		text = text.replace(/\n## 关联关系[\s\S]*$/, '');

		return text.trim();
	}

	/**
	 * 解析 frontmatter
	 */
	private parseFrontmatter(content: string): Record<string, any> {
		const match = content.match(/^---\n([\s\S]+?)\n---/);
		if (!match) return {};

		const frontmatter: Record<string, any> = {};
		match[1].split('\n').forEach(line => {
			const colonIndex = line.indexOf(':');
			if (colonIndex > 0) {
				const key = line.substring(0, colonIndex).trim();
				const value = line.substring(colonIndex + 1).trim();
				frontmatter[key] = value;
			}
		});

		return frontmatter;
	}

	/**
	 * 计算简单哈希
	 */
	private calculateHash(content: string): string {
		let hash = 0;
		for (let i = 0; i < content.length; i++) {
			hash = ((hash << 5) - hash) + content.charCodeAt(i);
			hash = hash & hash;
		}
		return hash.toString(36);
	}

	/**
	 * 更新 content_hash 字段
	 */
	private updateContentHash(content: string, newHash: string): string {
		return content.replace(
			/^---\n([\s\S]+?)\n---/,
			(match, frontmatter) => {
				if (frontmatter.includes('content_hash:')) {
					// 已有 content_hash，更新它
					return frontmatter.replace(
						/content_hash:\s*\S+/,
						`content_hash: ${newHash}`
					) + '\n---';
				} else {
					// 没有 content_hash，添加它
					return frontmatter + `content_hash: ${newHash}\n---`;
				}
			}
		);
	}
}
