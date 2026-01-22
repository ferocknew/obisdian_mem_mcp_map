import { App, PluginSettingTab } from 'obsidian';
import type MemoryGraphPlugin from '@/main';
import { SettingsConnectionManager } from './settings_connection';
import { SettingsModelsManager } from './settings_models';
import { SettingsUIBuilder } from './settings_ui_builder';

/**
 * Memory Graph 插件设置页面
 *
 * 采用模块化架构，将不同职责拆分到专门的类中
 */
export class MemoryGraphSettingTab extends PluginSettingTab {
	plugin: MemoryGraphPlugin;
	private connectionManager: SettingsConnectionManager;
	private modelsManager: SettingsModelsManager;

	constructor(app: App, plugin: MemoryGraphPlugin) {
		super(app, plugin);
		this.plugin = plugin;
		this.connectionManager = new SettingsConnectionManager(app);
		this.modelsManager = new SettingsModelsManager();
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// 使用 UI 构建器创建界面
		const uiBuilder = new SettingsUIBuilder(
			containerEl,
			this.plugin,
			this.connectionManager,
			this.modelsManager
		);
		uiBuilder.build();
	}

	/**
	 * 获取连接管理器（供外部使用）
	 */
	getConnectionManager(): SettingsConnectionManager {
		return this.connectionManager;
	}
}
