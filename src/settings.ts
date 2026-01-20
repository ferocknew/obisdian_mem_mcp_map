import { App, PluginSettingTab, Setting, TFolder } from 'obsidian';
import MemoryGraphPlugin from './main';

export interface MemoryGraphSettings {
	autoSync: boolean;
	syncInterval: number;
	syncTargetFolder: string;
	mcpJson: string;
}

export const DEFAULT_SETTINGS: MemoryGraphSettings = {
	autoSync: false,
	syncInterval: 60,
	syncTargetFolder: '',
	mcpJson: ''
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

		// 获取仓库第一层的所有目录
		const rootFolders = this.app.vault.getRoot().children
			.filter(item => item instanceof TFolder) // 过滤出文件夹
			.map(folder => folder.name)
			.sort(); // 按字符串顺序排序

		// 同步目标目录
		new Setting(containerEl)
			.setName('同步目标目录')
			.setDesc('选择要同步的目标目录')
			.addDropdown(dropdown => {
				// 添加默认选项
				dropdown.addOption('', '-请选择-');

				// 添加所有目录选项
				rootFolders.forEach(folder => {
					dropdown.addOption(folder, folder);
				});

				// 设置当前值
				dropdown.setValue(this.plugin.settings.syncTargetFolder || '');

				// 监听变化
				dropdown.onChange(async (value) => {
					this.plugin.settings.syncTargetFolder = value;
					await this.plugin.saveSettings();
				});
			});

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

		// 分隔线
		containerEl.createEl('hr');

		// MCP JSON 配置
		containerEl.createEl('h3', { text: 'MCP JSON 配置' });

		const jsonDesc = containerEl.createEl('div');
		jsonDesc.createEl('p', { text: '输入 MCP 配置的 JSON 内容：' });
		jsonDesc.createEl('p', { cls: 'setting-item-description', text: '支持 MCP 相关的 JSON 配置格式' });

		// 多行文本输入框
		const textArea = containerEl.createEl('textarea', {
			attr: { id: 'mcp-json-input' },
		});
		textArea.style.width = '100%';
		textArea.style.minHeight = '200px';
		textArea.style.fontFamily = 'monospace';
		textArea.style.padding = '10px';
		textArea.style.marginTop = '10px';
		textArea.value = this.plugin.settings.mcpJson || '';

		// 状态提示区域
		const statusEl = containerEl.createEl('div', {
			cls: 'setting-item-description'
		});
		statusEl.style.marginTop = '10px';
		statusEl.style.minHeight = '20px';

		// 保存按钮
		const saveButton = containerEl.createEl('button', {
			text: '保存设置',
			cls: 'mod-cta'
		});
		saveButton.style.marginTop = '10px';
		saveButton.onclick = async () => {
			const jsonValue = textArea.value.trim();

			// 清空之前的状态提示
			statusEl.empty();

			// 验证 JSON 格式
			if (jsonValue === '') {
				this.plugin.settings.mcpJson = '';
				await this.plugin.saveSettings();
				statusEl.createEl('span', {
					text: '✓ 已清空 JSON 配置',
					cls: 'setting-item-description'
				});
				statusEl.style.color = 'var(--text-success)';
				return;
			}

			try {
				// 尝试解析 JSON
				const parsed = JSON.parse(jsonValue);

				// 保存格式化后的 JSON（可选：保持原始格式或格式化）
				this.plugin.settings.mcpJson = jsonValue;
				await this.plugin.saveSettings();

				statusEl.createEl('span', {
					text: '✓ JSON 配置保存成功',
					cls: 'setting-item-description'
				});
				statusEl.style.color = 'var(--text-success)';
			} catch (e) {
				statusEl.createEl('span', {
					text: `✗ JSON 格式错误：${e.message}`,
					cls: 'setting-item-description'
				});
				statusEl.style.color = 'var(--text-error)';
			}
		};
	}
}