/**
 * 设置页面 - 模型管理模块
 *
 * 负责从 LLM API 获取可用模型列表
 */

import { LLMClient } from '@/llm_client';
import type { MemoryGraphSettings } from '@/settings';

export class SettingsModelsManager {
	private availableModels: string[] = [];
	private modelsFetchSuccess: boolean = false;

	/**
	 * 获取可用模型列表
	 */
	getAvailableModels(): string[] {
		return this.availableModels;
	}

	/**
	 * 获取模型列表获取是否成功
	 */
	getModelsFetchSuccess(): boolean {
		return this.modelsFetchSuccess;
	}

	/**
	 * 当 URL、Key 和接口类型都配置完成时，尝试拉取模型列表
	 */
	async fetchModelsListIfReady(settings: MemoryGraphSettings): Promise<boolean> {
		// 检查必要的配置是否都已填写
		if (!settings.llmApiUrl || !settings.llmApiKey || !settings.llmApiType) {
			console.log('[Settings Models] 配置不完整，跳过拉取模型列表');
			this.availableModels = [];
			this.modelsFetchSuccess = false;
			return false;
		}

		console.log('[Settings Models] 开始拉取模型列表...');

		try {
			// 创建临时的 LLM 客户端
			const llmClient = new LLMClient({
				apiUrl: settings.llmApiUrl,
				apiKey: settings.llmApiKey,
				modelName: settings.llmModelName || 'temp',
				apiType: settings.llmApiType,
				systemRules: settings.llmSystemRules,
				contextWindow: settings.llmContextWindow,
				maxOutputTokens: settings.llmMaxOutputTokens
			});

			// 拉取模型列表
			const result = await llmClient.fetchModelsList();

			if (result.success && result.models && result.models.length > 0) {
				console.log('[Settings Models] ✓ 成功拉取模型列表，模型数量:', result.models.length);
				this.availableModels = result.models.map(m => m.id);
				this.modelsFetchSuccess = true;
				return true;
			} else {
				console.log('[Settings Models] ✗ 拉取模型列表失败:', result.error);
				this.availableModels = [];
				this.modelsFetchSuccess = false;
				return false;
			}
		} catch (error) {
			console.error('[Settings Models] ✗ 拉取模型列表异常:', error);
			this.availableModels = [];
			this.modelsFetchSuccess = false;
			return false;
		}
	}
}
