import { Plugin, Notice } from 'obsidian';
import { DEFAULT_SETTINGS, MemoryGraphSettings, MemoryGraphSettingTab } from './settings';

export default class MemoryGraphPlugin extends Plugin {
	settings: MemoryGraphSettings;

	async onload() {
		console.log('Loading Memory Graph Plugin');

		// 加载设置
		await this.loadSettings();

		// 添加设置页面
		this.addSettingTab(new MemoryGraphSettingTab(this.app, this));

		// 添加 ribbon 图标
		this.addRibbonIcon('brain', '打开记忆图谱', (evt: MouseEvent) => {
			console.log('Memory Graph ribbon icon clicked');
		});

		// 添加命令：打开记忆图谱
		this.addCommand({
			id: 'open-memory-graph',
			name: '打开记忆图谱',
			callback: () => {
				console.log('Open Memory Graph command triggered');
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
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
