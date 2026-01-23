/**
 * 设置页面 - UI 构建模块
 *
 * 负责构建设置界面的各个部分
 */

import { Setting, TFolder } from 'obsidian';
import type MemoryGraphPlugin from '@/main';
import { SettingsConnectionManager } from './settings_connection';
import { APIEndpoint } from '@/utils/api/api_client';
import { SettingsModelsManager } from './settings_models';
import { ConfigurationTester } from '@/utils/settings/configuration_tester';
import { TestResultsDisplayer } from '@/utils/settings/test_results_displayer';

export class SettingsUIBuilder {
	private containerEl: HTMLElement;
	private plugin: MemoryGraphPlugin;
	private connectionManager: SettingsConnectionManager;
	private modelsManager: SettingsModelsManager;
	private configTester: ConfigurationTester;
	private resultsDisplayer: TestResultsDisplayer;

	constructor(
		containerEl: HTMLElement,
		plugin: MemoryGraphPlugin,
		connectionManager: SettingsConnectionManager,
		modelsManager: SettingsModelsManager
	) {
		this.containerEl = containerEl;
		this.plugin = plugin;
		this.connectionManager = connectionManager;
		this.modelsManager = modelsManager;
		this.configTester = new ConfigurationTester(plugin.app);
		this.resultsDisplayer = new TestResultsDisplayer();
	}

	/**
	 * 构建完整的设置界面
	 */
	build(): void {
		this.buildHeader();
		this.buildSyncFolderSetting();
		this.buildAutoSyncSection();
		this.buildSeparator();

		this.buildMemoryServerSection();
		this.buildSeparator();

		this.buildLLMAPISection();
		this.buildSeparator();

		this.buildSearchToolsSection();
		this.buildSeparator();

		this.buildSaveButton();
		this.buildSeparator();

		this.buildOpenAPISection();
	}

	/**
	 * 标题
	 */
	private buildHeader(): void {
		this.containerEl.createEl('h2', { text: 'Memory Graph 插件设置' });
	}

	/**
	 * 同步目标目录
	 */
	private buildSyncFolderSetting(): void {
		// 获取仓库第一层的所有目录
		const rootFolders = this.plugin.app.vault.getRoot().children
			.filter(item => item instanceof TFolder) // 过滤出文件夹
			.map(folder => folder.name)
			.sort(); // 按字符串顺序排序

		// 同步目标目录
		new Setting(this.containerEl)
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
	}

	/**
	 * 自动同步设置
	 */
	private buildAutoSyncSection(): void {
		this.containerEl.createEl('h3', { text: '自动同步设置' });

		// 自动同步观察记录开关
		new Setting(this.containerEl)
			.setName('自动更新观察记录')
			.setDesc('启用后，修改观察文件将自动同步到服务器')
			.addToggle(toggle => {
				toggle.setValue(this.plugin.settings.autoSyncObservations || false);
				toggle.onChange(async (value) => {
					this.plugin.settings.autoSyncObservations = value;

					// 更新 FileWatcher 状态
					if (this.plugin.fileWatcher) {
						this.plugin.fileWatcher.setEnabled(value);
					}

					await this.plugin.saveSettings();
				});
			});

		// 手动触发按钮
		new Setting(this.containerEl)
			.setName('手动触发同步')
			.setDesc('立即检查所有观察文件并同步到服务器')
			.addButton(button => {
				button.setButtonText('立即同步');
				button.setClass('mod-cta');
				button.onClick(() => {
					this.handleManualSync();
				});
			});
	}

	/**
	 * 手动触发同步
	 */
	private handleManualSync(): void {
		// TODO: 实现手动同步逻辑
		// 这里可以遍历所有观察文件，强制同步
		console.log('[Settings] 手动触发同步');
	}

	/**
	 * 分隔线
	 */
	private buildSeparator(): void {
		const separatorEl = this.containerEl.createEl('hr');
		separatorEl.style.marginTop = '20px';
		separatorEl.style.marginBottom = '20px';
	}

	/**
	 * MCP 服务器配置区域
	 */
	private buildMemoryServerSection(): void {
		this.containerEl.createEl('h3', { text: 'Mem 服务器配置' });

		// MCP 服务器API 地址
		new Setting(this.containerEl)
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
		new Setting(this.containerEl)
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
		new Setting(this.containerEl)
			.setName('测试连接')
			.setDesc('点击按钮测试与 Mem 服务器的连接')
			.addButton(button => {
				button.setButtonText('测试连接');
				button.setCta();
				button.onClick(async () => {
					button.setDisabled(true);
					button.setButtonText('连接中...');

					try {
						await this.handleTestConnection();
					} finally {
						button.setDisabled(false);
						button.setButtonText('测试连接');
					}
				});
			});
	}

	/**
	 * LLM API 配置区域
	 */
	private buildLLMAPISection(): void {
		this.containerEl.createEl('h3', { text: 'LLM API 配置' });

		// LLM API URL
		new Setting(this.containerEl)
			.setName('LLM API URL')
			.setDesc('输入 LLM 服务的 API 地址（例如: https://api.anthropic.com/v1 或 https://api.openai.com/v1）')
			.addText(text => {
				text.setValue(this.plugin.settings.llmApiUrl || '');
				text.onChange(async (value) => {
					this.plugin.settings.llmApiUrl = value;
					await this.plugin.saveSettings();
					// URL 变化时尝试拉取模型列表
					await this.modelsManager.fetchModelsListIfReady(this.plugin.settings);
				});
			});

		// LLM API Key
		new Setting(this.containerEl)
			.setName('LLM API Key')
			.setDesc('输入 LLM 服务的 API 密钥')
			.addText(text => {
				text.setValue(this.plugin.settings.llmApiKey || '');
				text.setPlaceholder('sk-...');
				text.inputEl.type = 'password';
				text.onChange(async (value) => {
					this.plugin.settings.llmApiKey = value;
					await this.plugin.saveSettings();
					// Key 变化时尝试拉取模型列表
					await this.modelsManager.fetchModelsListIfReady(this.plugin.settings);
				});
			});

		// 刷新模型列表按钮
		new Setting(this.containerEl)
			.setName('刷新模型列表')
			.setDesc('从 LLM API 获取最新的可用模型列表')
			.addButton(button => {
				button.setButtonText('刷新模型列表');
				button.onClick(async () => {
					button.setDisabled(true);
					button.setButtonText('刷新中...');

					try {
						await this.modelsManager.fetchModelsListIfReady(this.plugin.settings);
						button.setButtonText('✓ 刷新成功');
						setTimeout(() => {
							button.setButtonText('刷新模型列表');
							button.setDisabled(false);
						}, 2000);
					} catch (error) {
						console.error('[Settings] 刷新模型列表失败:', error);
						button.setButtonText('✗ 刷新失败');
						setTimeout(() => {
							button.setButtonText('刷新模型列表');
							button.setDisabled(false);
						}, 2000);
					}
				});
			});

		// LLM 模型名称 - 动态切换为下拉框或文本输入
		this.buildModelNameSetting();

		// 上下文窗口
		new Setting(this.containerEl)
			.setName('上下文窗口')
			.setDesc('设置模型的上下文窗口大小（单位：K tokens，例如 128 表示 128K）')
			.addText(text => {
				text.setValue(String(this.plugin.settings.llmContextWindow || 128));
				text.setPlaceholder('128');
				text.inputEl.type = 'number';
				text.onChange(async (value) => {
					const numValue = parseInt(value) || 128;
					this.plugin.settings.llmContextWindow = numValue;
					await this.plugin.saveSettings();
				});
			});

		// 最大输出 Tokens
		new Setting(this.containerEl)
			.setName('最大输出 Tokens')
			.setDesc('设置模型的最大输出 token 数量（单位：K tokens，例如 96 表示 96K）')
			.addText(text => {
				text.setValue(String(this.plugin.settings.llmMaxOutputTokens || 96));
				text.setPlaceholder('96');
				text.inputEl.type = 'number';
				text.onChange(async (value) => {
					const numValue = parseInt(value) || 96;
					this.plugin.settings.llmMaxOutputTokens = numValue;
					await this.plugin.saveSettings();
				});
			});

		// 接口类型
		new Setting(this.containerEl)
			.setName('接口类型')
			.setDesc('选择 LLM API 的接口类型')
			.addDropdown(dropdown => {
				dropdown.addOption('anthropic', 'Anthropic');
				dropdown.addOption('openai', '经典 OpenAI');
				dropdown.setValue(this.plugin.settings.llmApiType || 'anthropic');
				dropdown.onChange(async (value: 'anthropic' | 'openai') => {
					this.plugin.settings.llmApiType = value;
					await this.plugin.saveSettings();
					// 接口类型变化时尝试拉取模型列表
					await this.modelsManager.fetchModelsListIfReady(this.plugin.settings);
				});
			});

		// SYSTEM 规则
		new Setting(this.containerEl)
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
					// 重新初始化LLM客户端以应用新的system规则
					this.reinitLLMClient();
				});
			});
	}

	/**
	 * 构建模型名称设置（动态下拉框或文本输入）
	 */
	private buildModelNameSetting(): void {
		const modelSetting = new Setting(this.containerEl)
			.setName('模型名称')
			.setDesc(this.modelsManager.getModelsFetchSuccess()
				? '从下拉列表中选择模型'
				: '输入要使用的模型名称（例如: claude-3-5-sonnet-20241022 或 gpt-4）');

		if (this.modelsManager.getModelsFetchSuccess() && this.modelsManager.getAvailableModels().length > 0) {
			// 成功拉取到模型列表，显示下拉框
			modelSetting.addDropdown(dropdown => {
				// 添加当前值（如果不在列表中）
				const currentModel = this.plugin.settings.llmModelName || '';
				if (currentModel && !this.modelsManager.getAvailableModels().includes(currentModel)) {
					dropdown.addOption(currentModel, currentModel);
				}

				// 添加所有可用模型
				this.modelsManager.getAvailableModels().forEach(model => {
					dropdown.addOption(model, model);
				});

				dropdown.setValue(currentModel);
				dropdown.onChange(async (value) => {
					this.plugin.settings.llmModelName = value;
					await this.plugin.saveSettings();
				});
			});
		} else {
			// 未能拉取模型列表，显示文本输入框
			modelSetting.addText(text => {
				text.setValue(this.plugin.settings.llmModelName || '');
				text.onChange(async (value) => {
					this.plugin.settings.llmModelName = value;
					await this.plugin.saveSettings();
				});
			});
		}
	}

	/**
	 * 搜索工具配置区域
	 */
	private buildSearchToolsSection(): void {
		this.containerEl.createEl('h3', { text: '搜索工具配置' });

		// 默认开启搜索
		new Setting(this.containerEl)
			.setName('默认开启搜索')
			.setDesc('AI 聊天时是否默认启用联网搜索功能')
			.addToggle(toggle => {
				toggle.setValue(this.plugin.settings.searchDefaultEnabled || false);
				toggle.onChange(async (value) => {
					this.plugin.settings.searchDefaultEnabled = value;
					await this.plugin.saveSettings();
				});
			});

		// Whoogle URL
		new Setting(this.containerEl)
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
		new Setting(this.containerEl)
			.setName('启用身份验证')
			.setDesc('是否在请求头中添加 Authorization Bearer Token')
			.addToggle(toggle => {
				toggle.setValue(this.plugin.settings.searchAuthEnabled || false);
				toggle.onChange(async (value) => {
					this.plugin.settings.searchAuthEnabled = value;
					await this.plugin.saveSettings();
					// 刷新界面以显示/隐藏验证 Key 输入框
					// 重新构建界面
					this.build();
				});
			});

		// 验证 Key（仅在启用验证时显示）
		if (this.plugin.settings.searchAuthEnabled) {
			new Setting(this.containerEl)
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
	}

	/**
	 * 保存配置按钮
	 */
	private buildSaveButton(): void {
		new Setting(this.containerEl)
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
						this.configTester.setApiClient(this.connectionManager.getApiClient());
						const testResults = await this.configTester.testAllConfigurations(this.plugin.settings);

						// 更新 apiClient 引用
						this.connectionManager.setApiClient(this.configTester.getApiClient());

						// 显示测试结果
						this.resultsDisplayer.displayTestResults(this.containerEl, testResults);

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
	}

	/**
	 * OpenAPI 接口列表展示区域
	 */
	private buildOpenAPISection(): void {
		const toolsContainerEl = this.containerEl.createEl('div');
		toolsContainerEl.createEl('h3', { text: 'OpenApi 接口列表' });

		const toolsListEl = this.containerEl.createEl('div', {
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

	/**
	 * 处理测试连接
	 */
	private async handleTestConnection(): Promise<void> {
		const toolsListElements = this.containerEl.querySelectorAll('.mcp-tools-list');

		if (toolsListElements.length === 0) {
			console.error('[Settings UI] 未找到显示元素');
			return;
		}

		const toolsListEl = toolsListElements[0] as HTMLElement;
		toolsListEl.empty();
		toolsListEl.textContent = '正在连接 Memory Server...';

		const result = await this.connectionManager.testConnection(this.plugin.settings);

		if (!result.success) {
			toolsListEl.empty();
			const errorEl = toolsListEl.createEl('div');
			errorEl.style.color = 'var(--text-error)';
			if (result.error === '请先配置 API 地址') {
				errorEl.textContent = result.error;
			} else {
				errorEl.innerHTML = `
					<strong>连接失败</strong><br/>
					错误信息：${result.error}<br/><br/>
					请检查：<br/>
					1. API 地址是否正确（应该是 OpenAPI JSON 文件的 URL）<br/>
					2. API Key 是否有效（如果需要）<br/>
					3. Memory Server 是否正常运行<br/>
				`;
			}
			return;
		}

		const { endpoints } = result;
		toolsListEl.empty();

		if (endpoints.length === 0) {
			toolsListEl.textContent = '未找到任何 API 端点';
			return;
		}

		toolsListEl.createEl('div', {
			text: `共找到 ${endpoints.length} 个 API 端点：`,
			cls: 'setting-item-description'
		}).style.marginBottom = '10px';

		// 按标签分组显示
		const groupedEndpoints = this.connectionManager.groupEndpointsByTag(endpoints);

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
				methodSpan.style.color = this.connectionManager.getMethodColor(endpoint.method);
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
	}

	/**
	 * 重新初始化LLM客户端（当system规则等配置更新时）
	 */
	private reinitLLMClient(): void {
		try {
			// 获取当前打开的MemorySearchView
			const leaves = this.plugin.app.workspace.getLeavesOfType('memory-search-view');
			if (leaves.length > 0) {
				const searchView = leaves[0].view as any;
				if (searchView && typeof searchView.reinitLLMClient === 'function') {
					searchView.reinitLLMClient();
					console.log('[Settings UI] ✓ LLM客户端已重新初始化');
				}
			}
		} catch (error) {
			console.error('[Settings UI] 重新初始化LLM客户端失败:', error);
		}
	}
}
