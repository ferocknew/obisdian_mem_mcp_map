import { Plugin, Notice, WorkspaceLeaf } from 'obsidian';
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

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
