import { App, PluginSettingTab, Setting } from 'obsidian';
import MemoryGraphPlugin from './main';

export interface MemoryGraphSettings {
	mcpServerUrl: string;
	mcpApiKey: string;
	autoSync: boolean;
	syncInterval: number;
}

export const DEFAULT_SETTINGS: MemoryGraphSettings = {
	mcpServerUrl: 'http://localhost:3000',
	mcpApiKey: '',
	autoSync: false,
	syncInterval: 60
}

export class MemoryGraphSettingTab extends PluginSettingTab {
	plugin: MemoryGraphPlugin;

	constructor(app: App, plugin: MemoryGraphPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// 标题
		containerEl.createEl('h2', { text: 'Memory Graph 插件设置' });

		// MCP 服务器地址
		new Setting(containerEl)
			.setName('MCP 服务器地址')
			.setDesc('输入 MCP 服务器的 URL 地址')
			.addText(text => text
				.setPlaceholder('http://localhost:3000')
				.setValue(this.plugin.settings.mcpServerUrl)
				.onChange(async (value) => {
					this.plugin.settings.mcpServerUrl = value;
					await this.plugin.saveSettings();
				}));

		// MCP API 密钥
		new Setting(containerEl)
			.setName('MCP API 密钥')
			.setDesc('输入 MCP 服务器的认证密钥（可选）')
			.addText(text => text
				.setPlaceholder('输入 API 密钥')
				.setValue(this.plugin.settings.mcpApiKey)
				.onChange(async (value) => {
					this.plugin.settings.mcpApiKey = value;
					await this.plugin.saveSettings();
				}));

		// 自动同步开关
		new Setting(containerEl)
			.setName('自动同步')
			.setDesc('启用后自动与 MCP 服务器同步记忆数据')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoSync)
				.onChange(async (value) => {
					this.plugin.settings.autoSync = value;
					await this.plugin.saveSettings();
				}));

		// 同步间隔
		new Setting(containerEl)
			.setName('同步间隔（秒）')
			.setDesc('设置自动同步的时间间隔')
			.addText(text => text
				.setPlaceholder('60')
				.setValue(this.plugin.settings.syncInterval.toString())
				.onChange(async (value) => {
					const num = parseInt(value);
					if (!isNaN(num)) {
						this.plugin.settings.syncInterval = num;
						await this.plugin.saveSettings();
					}
				}));
	}
}
