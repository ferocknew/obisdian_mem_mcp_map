import { Plugin, Notice, WorkspaceLeaf, Menu, TFile, TFolder, Editor, MarkdownView } from 'obsidian';
import { DEFAULT_SETTINGS, MemoryGraphSettings, MemoryGraphSettingTab } from './settings';
import { MemorySearchView, VIEW_TYPE_MEMORY_SEARCH } from './search_view';

export default class MemoryGraphPlugin extends Plugin {
	settings: MemoryGraphSettings;

	async onload() {
		console.log('Loading Memory Graph Plugin');

		// 加载设置
		await this.loadSettings();

		// 注册侧边栏视图
		this.registerView(
			VIEW_TYPE_MEMORY_SEARCH,
			(leaf) => new MemorySearchView(leaf, this)
		);

		// 添加设置页面
		this.addSettingTab(new MemoryGraphSettingTab(this.app, this));

		// 添加 ribbon 图标
		this.addRibbonIcon('brain', '打开记忆图谱', () => {
			this.activateView();
		});

		// 添加命令：打开记忆图谱
		this.addCommand({
			id: 'open-memory-graph',
			name: '打开记忆图谱',
			callback: () => {
				this.activateView();
			}
		});

		// 添加命令：重新加载插件（仅开发模式）
		this.addCommand({
			id: 'reload-plugin',
			name: '🔄 重新加载插件 (开发用)',
			callback: async () => {
				console.log('Reloading Memory Graph Plugin...');
				// 注意：这个命令只是示例，实际的重新加载需要通过 Obsidian 的命令面板
				// 建议使用: Cmd+P -> "Reload plugins without reloading app"
				new Notice('请使用命令面板中的 "Reload plugins without reloading app"');
			}
		});

		// 注册编辑器右键菜单
		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu: Menu, editor: Editor, view: MarkdownView) => {
				menu.addItem((item) => {
					item
						.setTitle('分析并上传到记忆图谱系统')
						.setIcon('brain-circuit')
						.onClick(async () => {
							await this.analyzeAndUploadFromEditor(editor, view);
						});
				});
			})
		);

		// 注册文件和文件夹右键菜单
		this.registerEvent(
			this.app.workspace.on('file-menu', (menu: Menu, file: TFile, source: string) => {
				// file-menu 事件会同时触发文件和文件夹的右键菜单
				// 通过 vault 获取抽象文件来判断类型
				const abstractFile = this.app.vault.getAbstractFileByPath(file.path);

				if (abstractFile instanceof TFolder) {
					// 文件夹菜单
					menu.addItem((item) => {
						item
							.setTitle('分析并上传到记忆图谱系统')
							.setIcon('brain-circuit')
							.onClick(async () => {
								await this.analyzeAndUploadFolder(abstractFile);
							});
					});
				} else if (abstractFile instanceof TFile) {
					// 文件菜单
					menu.addItem((item) => {
						item
							.setTitle('分析并上传到记忆图谱系统')
							.setIcon('brain-circuit')
							.onClick(async () => {
								await this.analyzeAndUploadFile(abstractFile);
							});
					});
				}
			})
		);
	}

	onunload() {
		console.log('Unloading Memory Graph Plugin');
		// 清理所有视图
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_MEMORY_SEARCH);
	}

	async activateView() {
		const { workspace } = this.app;

		// 检查是否已经有打开的视图
		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_MEMORY_SEARCH);

		if (leaves.length > 0) {
			// 如果已经存在，激活它
			leaf = leaves[0];
		} else {
			// 否则在右侧边栏创建新的视图
			leaf = workspace.getRightLeaf(false);
			if (leaf) {
				await leaf.setViewState({
					type: VIEW_TYPE_MEMORY_SEARCH,
					active: true,
				});
			}
		}

		// 显示视图
		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}

	/**
	 * 从编辑器分析并上传内容
	 */
	async analyzeAndUploadFromEditor(editor: Editor, view: MarkdownView) {
		console.log('[Context Menu] 从编辑器分析并上传');

		const selection = editor.getSelection();
		const content = selection || editor.getValue();

		if (!content.trim()) {
			new Notice('没有可分析的内容');
			return;
		}

		new Notice('分析并上传功能开发中...');
		console.log('[Context Menu] 待分析内容长度:', content.length);
		console.log('[Context Menu] 文件路径:', view.file?.path);

		// TODO: 实现分析和上传逻辑
		// 1. 调用 LLM 分析内容，提取实体、关系、观察
		// 2. 调用 API Client 上传到记忆图谱系统
	}

	/**
	 * 分析并上传单个文件
	 */
	async analyzeAndUploadFile(file: TFile) {
		console.log('[Context Menu] 分析并上传文件:', file.path);

		try {
			const content = await this.app.vault.read(file);

			if (!content.trim()) {
				new Notice('文件内容为空');
				return;
			}

			new Notice(`正在分析文件: ${file.name}`);
			console.log('[Context Menu] 文件内容长度:', content.length);

			// TODO: 实现分析和上传逻辑
			// 1. 调用 LLM 分析文件内容
			// 2. 提取实体、关系、观察
			// 3. 上传到记忆图谱系统

			new Notice('分析并上传功能开发中...');
		} catch (error) {
			console.error('[Context Menu] 读取文件失败:', error);
			new Notice('读取文件失败');
		}
	}

	/**
	 * 分析并上传文件夹中的所有文件
	 */
	async analyzeAndUploadFolder(folder: TFolder) {
		console.log('[Context Menu] 分析并上传文件夹:', folder.path);

		const files = this.getMarkdownFilesInFolder(folder);

		if (files.length === 0) {
			new Notice('文件夹中没有 Markdown 文件');
			return;
		}

		new Notice(`找到 ${files.length} 个文件，准备分析...`);
		console.log('[Context Menu] 文件列表:', files.map(f => f.path));

		// TODO: 实现批量分析和上传逻辑
		// 1. 遍历所有文件
		// 2. 对每个文件调用 LLM 分析
		// 3. 批量上传到记忆图谱系统

		new Notice('分析并上传功能开发中...');
	}

	/**
	 * 递归获取文件夹中的所有 Markdown 文件
	 */
	private getMarkdownFilesInFolder(folder: TFolder): TFile[] {
		const files: TFile[] = [];

		for (const child of folder.children) {
			if (child instanceof TFile && child.extension === 'md') {
				files.push(child);
			} else if (child instanceof TFolder) {
				files.push(...this.getMarkdownFilesInFolder(child));
			}
		}

		return files;
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
