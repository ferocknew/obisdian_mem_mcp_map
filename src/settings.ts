import { App, PluginSettingTab, Setting, TFolder } from 'obsidian';
import MemoryGraphPlugin from './main';
import { APIClient, APIEndpoint } from './api_client';
import { LLMClient } from './llm_client';
import { ConfigurationTester } from './utils/settings/configuration_tester';
import { TestResultsDisplayer } from './utils/settings/test_results_displayer';

export interface MemoryGraphSettings {
	syncTargetFolder: string;
	mcpApiUrl: string;
	mcpApiKey: string;
	llmApiUrl: string;
	llmApiKey: string;
	llmModelName: string;
	llmApiType: 'anthropic' | 'openai';
	llmSystemRules: string;
	searchWhoogleUrl: string;
	searchAuthEnabled: boolean;
	searchAuthKey: string;
}

export const DEFAULT_SETTINGS: MemoryGraphSettings = {
	syncTargetFolder: '',
	mcpApiUrl: '',
	mcpApiKey: '',
	llmApiUrl: '',
	llmApiKey: '',
	llmModelName: '',
	llmApiType: 'anthropic',
	llmSystemRules: '',
	searchWhoogleUrl: '',
	searchAuthEnabled: false,
	searchAuthKey: ''
}

export class MemoryGraphSettingTab extends PluginSettingTab {
	plugin: MemoryGraphPlugin;
	private apiClient: APIClient | null = null;
	private configTester: ConfigurationTester;
	private resultsDisplayer: TestResultsDisplayer;

	constructor(app: App, plugin: MemoryGraphPlugin) {
		super(app, plugin);
		this.plugin = plugin;
		this.configTester = new ConfigurationTester(app);
		this.resultsDisplayer = new TestResultsDisplayer();
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

		// 分隔线
		containerEl.createEl('hr');

		// MCP 服务器配置
		containerEl.createEl('h3', { text: 'Mem 服务器配置' });

		// MCP 服务器API 地址
		new Setting(containerEl)
			.setName('Mem 服务器API 地址（OpenAPi）')
			.setDesc('输入 Mem 服务器的 OpenAPi 地址（完整 URL，例如: https://url/openapi.json）')
			.addText(text => {
				text.setValue(this.plugin.settings.mcpApiUrl || '');
				text.onChange(async (value) => {
					this.plugin.settings.mcpApiUrl = value;
					await this.plugin.saveSettings();
				});
			});

		// 服务器 api_key
		new Setting(containerEl)
			.setName('服务器 API Key')
			.setDesc('输入 Mem 服务器的 API 密钥（可选）')
			.addText(text => {
				text.setValue(this.plugin.settings.mcpApiKey || '');
				text.onChange(async (value) => {
					this.plugin.settings.mcpApiKey = value;
					await this.plugin.saveSettings();
				});
			});

		// 测试连接按钮
		new Setting(containerEl)
			.setName('测试连接')
			.setDesc('点击按钮测试与 Mem 服务器的连接')
			.addButton(button => {
				button.setButtonText('测试连接');
				button.setCta();
				button.onClick(async () => {
					button.setDisabled(true);
					button.setButtonText('连接中...');

					try {
						await this.testConnection();
					} finally {
						button.setDisabled(false);
						button.setButtonText('测试连接');
					}
				});
			});

		// 状态提示区域
		const statusEl = containerEl.createEl('div', {
			cls: 'setting-item-description mcp-status'
		});
		statusEl.style.marginTop = '10px';
		statusEl.style.minHeight = '20px';

		// 横线分隔
		const separatorEl = containerEl.createEl('hr');
		separatorEl.style.marginTop = '20px';
		separatorEl.style.marginBottom = '20px';

		// LLM API 配置
		containerEl.createEl('h3', { text: 'LLM API 配置' });

		// LLM API URL
		new Setting(containerEl)
			.setName('LLM API URL')
			.setDesc('输入 LLM 服务的 API 地址（例如: https://api.anthropic.com/v1 或 https://api.openai.com/v1）')
			.addText(text => {
				text.setValue(this.plugin.settings.llmApiUrl || '');
				text.onChange(async (value) => {
					this.plugin.settings.llmApiUrl = value;
					await this.plugin.saveSettings();
				});
			});

		// LLM API Key
		new Setting(containerEl)
			.setName('LLM API Key')
			.setDesc('输入 LLM 服务的 API 密钥')
			.addText(text => {
				text.setValue(this.plugin.settings.llmApiKey || '');
				text.setPlaceholder('sk-...');
				text.inputEl.type = 'password';
				text.onChange(async (value) => {
					this.plugin.settings.llmApiKey = value;
					await this.plugin.saveSettings();
				});
			});

		// LLM 模型名称
		new Setting(containerEl)
			.setName('模型名称')
			.setDesc('输入要使用的模型名称（例如: claude-3-5-sonnet-20241022 或 gpt-4）')
			.addText(text => {
				text.setValue(this.plugin.settings.llmModelName || '');
				text.onChange(async (value) => {
					this.plugin.settings.llmModelName = value;
					await this.plugin.saveSettings();
				});
			});

		// 接口类型
		new Setting(containerEl)
			.setName('接口类型')
			.setDesc('选择 LLM API 的接口类型')
			.addDropdown(dropdown => {
				dropdown.addOption('anthropic', 'Anthropic');
				dropdown.addOption('openai', '经典 OpenAI');
				dropdown.setValue(this.plugin.settings.llmApiType || 'anthropic');
				dropdown.onChange(async (value: 'anthropic' | 'openai') => {
					this.plugin.settings.llmApiType = value;
					await this.plugin.saveSettings();
				});
			});

		// SYSTEM 规则
		new Setting(containerEl)
			.setName('SYSTEM 规则')
			.setDesc('输入 LLM 的系统提示词规则（支持多行）')
			.addTextArea(text => {
				text.setValue(this.plugin.settings.llmSystemRules || '');
				text.setPlaceholder('请输入系统规则...');
				text.inputEl.rows = 10;
				text.inputEl.cols = 50;
				text.onChange(async (value) => {
					this.plugin.settings.llmSystemRules = value;
					await this.plugin.saveSettings();
				});
			});

		// 横线分隔
		const llmSeparatorEl = containerEl.createEl('hr');
		llmSeparatorEl.style.marginTop = '20px';
		llmSeparatorEl.style.marginBottom = '20px';

		// 搜索工具配置
		containerEl.createEl('h3', { text: '搜索工具配置' });

		// Whoogle URL
		new Setting(containerEl)
			.setName('Whoogle URL')
			.setDesc('输入 Whoogle 搜索服务的 URL（例如: https://search.example.com）')
			.addText(text => {
				text.setValue(this.plugin.settings.searchWhoogleUrl || '');
				text.setPlaceholder('https://search.example.com');
				text.onChange(async (value) => {
					this.plugin.settings.searchWhoogleUrl = value;
					await this.plugin.saveSettings();
				});
			});

		// 启用验证
		new Setting(containerEl)
			.setName('启用身份验证')
			.setDesc('是否在请求头中添加 Authorization Bearer Token')
			.addToggle(toggle => {
				toggle.setValue(this.plugin.settings.searchAuthEnabled || false);
				toggle.onChange(async (value) => {
					this.plugin.settings.searchAuthEnabled = value;
					await this.plugin.saveSettings();
					// 刷新界面以显示/隐藏验证 Key 输入框
					this.display();
				});
			});

		// 验证 Key（仅在启用验证时显示）
		if (this.plugin.settings.searchAuthEnabled) {
			new Setting(containerEl)
				.setName('验证 Key')
				.setDesc('输入 Bearer Token 验证密钥')
				.addText(text => {
					text.setValue(this.plugin.settings.searchAuthKey || '');
					text.setPlaceholder('your-bearer-token');
					text.inputEl.type = 'password';
					text.onChange(async (value) => {
						this.plugin.settings.searchAuthKey = value;
						await this.plugin.saveSettings();
					});
				});
		}

		// 横线分隔
		const searchSeparatorEl = containerEl.createEl('hr');
		searchSeparatorEl.style.marginTop = '20px';
		searchSeparatorEl.style.marginBottom = '20px';

		// 保存配置按钮
		new Setting(containerEl)
			.setName('保存配置')
			.setDesc('保存所有配置更改并测试连接')
			.addButton(button => {
				button.setButtonText('保存配置');
				button.setCta();
				button.onClick(async () => {
					button.setDisabled(true);
					button.setButtonText('保存中...');

					try {
						// 保存配置
						await this.plugin.saveSettings();
						console.log('[Settings] ✓ 配置已保存');

						// 测试配置
						button.setButtonText('测试配置中...');
						this.configTester.setApiClient(this.apiClient);
						const testResults = await this.configTester.testAllConfigurations(this.plugin.settings);

						// 更新 apiClient 引用
						this.apiClient = this.configTester.getApiClient();

						// 显示测试结果
						this.resultsDisplayer.displayTestResults(containerEl, testResults);

						button.setButtonText('✓ 已保存');
						setTimeout(() => {
							button.setButtonText('保存配置');
							button.setDisabled(false);
						}, 2000);
					} catch (error) {
						console.error('[Settings] 保存配置失败:', error);
						button.setButtonText('✗ 保存失败');
						setTimeout(() => {
							button.setButtonText('保存配置');
							button.setDisabled(false);
						}, 2000);
					}
				});
			});

		// 横线分隔
		const saveButtonSeparator = containerEl.createEl('hr');
		saveButtonSeparator.style.marginTop = '20px';
		saveButtonSeparator.style.marginBottom = '20px';

		// Tools 列表展示区域
		const toolsContainerEl = containerEl.createEl('div');
		toolsContainerEl.createEl('h3', { text: 'OpenApi 接口列表' });

		const toolsListEl = containerEl.createEl('div', {
			cls: 'setting-item-description mcp-tools-list'
		});
		toolsListEl.style.marginTop = '10px';
		toolsListEl.style.minHeight = '50px';
		toolsListEl.style.padding = '10px';
		toolsListEl.style.border = '1px solid var(--background-modifier-border)';
		toolsListEl.style.borderRadius = '4px';
		toolsListEl.style.backgroundColor = 'var(--background-secondary)';
		toolsListEl.textContent = '点击"测试连接"后将显示 API 接口列表';
	}

	private async testConnection(): Promise<void> {
		console.log('[Settings] 开始测试连接到 Memory Server');

		// 查找显示元素
		const containerEl = this.containerEl;
		const toolsListElements = containerEl.querySelectorAll('.mcp-tools-list');

		if (toolsListElements.length === 0) {
			console.error('[Settings] 未找到显示元素');
			return;
		}

		const toolsListEl = toolsListElements[0] as HTMLElement;
		toolsListEl.empty();
		toolsListEl.textContent = '正在连接 Memory Server...';

		// 验证配置
		if (!this.plugin.settings.mcpApiUrl) {
			toolsListEl.empty();
			const errorEl = toolsListEl.createEl('div');
			errorEl.style.color = 'var(--text-error)';
			errorEl.textContent = '请先配置 API 地址';
			return;
		}

		try {
			// 断开之前的连接
			if (this.apiClient) {
				console.log('[Settings] 断开之前的连接...');
				await this.apiClient.disconnect();
			}

			// 创建新的 API 客户端
			console.log('[Settings] 创建新的 API 客户端...');
			this.apiClient = new APIClient(this.app);

			// 连接到服务器
			console.log('[Settings] 连接到 Memory Server...');
			await this.apiClient.connect({
				apiUrl: this.plugin.settings.mcpApiUrl,
				apiKey: this.plugin.settings.mcpApiKey
			});
			console.log('[Settings] ✓ 连接成功');

			// 获取端点列表
			const endpoints = this.apiClient.getEndpoints();
			console.log('[Settings] ✓ 获取到', endpoints.length, '个 API 端点');

			// 显示端点列表
			toolsListEl.empty();

			if (endpoints.length === 0) {
				console.log('[Settings] 未找到任何 API 端点');
				toolsListEl.textContent = '未找到任何 API 端点';
				return;
			}

			toolsListEl.createEl('div', {
				text: `共找到 ${endpoints.length} 个 API 端点：`,
				cls: 'setting-item-description'
			}).style.marginBottom = '10px';

			// 按标签分组显示
			const groupedEndpoints = this.groupEndpointsByTag(endpoints);

			for (const [tag, tagEndpoints] of Object.entries(groupedEndpoints)) {
				// 标签标题
				const tagHeader = toolsListEl.createEl('div');
				tagHeader.style.marginTop = '15px';
				tagHeader.style.marginBottom = '8px';
				tagHeader.createEl('strong', { text: tag });

				// 该标签下的端点
				tagEndpoints.forEach((endpoint: APIEndpoint) => {
					const endpointItem = toolsListEl.createEl('div');
					endpointItem.style.marginBottom = '8px';
					endpointItem.style.padding = '8px';
					endpointItem.style.backgroundColor = 'var(--background-primary)';
					endpointItem.style.borderRadius = '4px';
					endpointItem.style.border = '1px solid var(--background-modifier-border)';

					// 方法和路径
					const methodPath = endpointItem.createEl('div');
					const methodSpan = methodPath.createEl('span');
					methodSpan.style.fontWeight = 'bold';
					methodSpan.style.color = this.getMethodColor(endpoint.method);
					methodSpan.textContent = endpoint.method;
					methodPath.appendText(' ' + endpoint.path);

					// 摘要
					if (endpoint.summary) {
						const summary = endpointItem.createEl('div', {
							cls: 'setting-item-description'
						});
						summary.style.marginTop = '4px';
						summary.textContent = endpoint.summary;
					}

					// 详细描述（可折叠）
					if (endpoint.description && endpoint.description !== endpoint.summary) {
						const descToggle = endpointItem.createEl('details');
						descToggle.style.marginTop = '4px';
						const descSummary = descToggle.createEl('summary', {
							text: '查看详细说明',
							cls: 'setting-item-description'
						});
						descSummary.style.cursor = 'pointer';
						descSummary.style.fontSize = '12px';

						const descContent = descToggle.createEl('div', {
							cls: 'setting-item-description'
						});
						descContent.style.marginTop = '4px';
						descContent.style.fontSize = '12px';
						descContent.style.whiteSpace = 'pre-wrap';
						descContent.textContent = endpoint.description;
					}
				});
			}

			console.log('[Settings] ✓ API 端点列表渲染完成');

		} catch (error) {
			console.error('[Settings] ✗ 连接失败:', error);
			toolsListEl.empty();
			const errorEl = toolsListEl.createEl('div');
			errorEl.style.color = 'var(--text-error)';
			errorEl.innerHTML = `
				<strong>连接失败</strong><br/>
				错误信息：${error.message}<br/><br/>
				请检查：<br/>
				1. API 地址是否正确（应该是 OpenAPI JSON 文件的 URL）<br/>
				2. API Key 是否有效（如果需要）<br/>
				3. Memory Server 是否正常运行<br/>
			`;
		}
	}

	private groupEndpointsByTag(endpoints: APIEndpoint[]): Record<string, APIEndpoint[]> {
		const grouped: Record<string, APIEndpoint[]> = {};

		endpoints.forEach(endpoint => {
			const tag = endpoint.tags && endpoint.tags.length > 0
				? endpoint.tags[0]
				: '其他';

			if (!grouped[tag]) {
				grouped[tag] = [];
			}
			grouped[tag].push(endpoint);
		});

		return grouped;
	}

	private getMethodColor(method: string): string {
		switch (method.toUpperCase()) {
			case 'GET':
				return 'var(--text-success)';
			case 'POST':
				return 'var(--text-accent)';
			case 'PUT':
				return 'var(--text-warning)';
			case 'DELETE':
				return 'var(--text-error)';
			default:
				return 'var(--text-normal)';
		}
	}
}