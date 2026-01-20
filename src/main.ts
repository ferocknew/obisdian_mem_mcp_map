import { Plugin } from 'obsidian';
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

		// 添加命令
		this.addCommand({
			id: 'open-memory-graph',
			name: '打开记忆图谱',
			callback: () => {
				console.log('Open Memory Graph command triggered');
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
