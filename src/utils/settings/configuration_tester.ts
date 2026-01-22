import { App } from 'obsidian';
import { APIClient } from '../../api_client';
import { LLMClient } from '../../llm_client';
import { MemoryGraphSettings } from '../../settings';

export interface TestResult {
	success: boolean;
	message: string;
	error?: string;
}

export interface AllTestResults {
	mcpTest?: TestResult;
	llmTest?: TestResult;
}

export class ConfigurationTester {
	private app: App;
	private apiClient: APIClient | null = null;

	constructor(app: App) {
		this.app = app;
	}

	setApiClient(apiClient: APIClient | null): void {
		this.apiClient = apiClient;
	}

	async testAllConfigurations(settings: MemoryGraphSettings): Promise<AllTestResults> {
		const results: AllTestResults = {};

		if (settings.mcpApiUrl) {
			results.mcpTest = await this.testMcpConnection(settings);
		}

		if (settings.llmApiUrl && settings.llmApiKey && settings.llmModelName) {
			results.llmTest = await this.testLlmConnection(settings);
		}

		return results;
	}

	private async testMcpConnection(settings: MemoryGraphSettings): Promise<TestResult> {
		console.log('[Config Tester] 测试 MCP 服务器连接...');

		try {
			if (this.apiClient) {
				await this.apiClient.disconnect();
			}
			this.apiClient = new APIClient(this.app);
			await this.apiClient.connect({
				apiUrl: settings.mcpApiUrl,
				apiKey: settings.mcpApiKey
			});
			const endpoints = this.apiClient.getEndpoints();
			console.log('[Config Tester] ✓ MCP 服务器连接成功');
			return {
				success: true,
				message: `✓ MCP 服务器连接成功，找到 ${endpoints.length} 个 API 端点`
			};
		} catch (error) {
			console.error('[Config Tester] ✗ MCP 服务器连接失败:', error);
			return {
				success: false,
				message: `✗ MCP 服务器连接失败: ${error.message}`
			};
		}
	}

	private async testLlmConnection(settings: MemoryGraphSettings): Promise<TestResult> {
		console.log('[Config Tester] 测试 LLM API 连接...');

		try {
			const llmClient = new LLMClient({
				apiUrl: settings.llmApiUrl,
				apiKey: settings.llmApiKey,
				modelName: settings.llmModelName,
				apiType: settings.llmApiType,
				systemRules: settings.llmSystemRules,
				contextWindow: settings.llmContextWindow,
				maxOutputTokens: settings.llmMaxOutputTokens
			});
			const result = await llmClient.testConnection();
			console.log('[Config Tester] LLM 测试结果:', result);
			return result;
		} catch (error) {
			console.error('[Config Tester] ✗ LLM API 测试失败:', error);
			return {
				success: false,
				message: `✗ LLM API 测试失败: ${error.message}`,
				error: error.message
			};
		}
	}

	getApiClient(): APIClient | null {
		return this.apiClient;
	}
}
