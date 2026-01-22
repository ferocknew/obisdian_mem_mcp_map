// 插件设置接口和默认配置
// 实际的设置页面实现在 src/utils/pages/settings.ts

export interface MemoryGraphSettings {
	syncTargetFolder: string;
	mcpApiUrl: string;
	mcpApiKey: string;
	llmApiUrl: string;
	llmApiKey: string;
	llmModelName: string;
	llmContextWindow: number;
	llmMaxOutputTokens: number;
	llmApiType: 'anthropic' | 'openai';
	llmSystemRules: string;
	searchWhoogleUrl: string;
	searchAuthEnabled: boolean;
	searchAuthKey: string;
	searchDefaultEnabled: boolean;
}

export const DEFAULT_SETTINGS: MemoryGraphSettings = {
	syncTargetFolder: '',
	mcpApiUrl: '',
	mcpApiKey: '',
	llmApiUrl: '',
	llmApiKey: '',
	llmModelName: '',
	llmContextWindow: 128,
	llmMaxOutputTokens: 96,
	llmApiType: 'anthropic',
	llmSystemRules: '',
	searchWhoogleUrl: '',
	searchAuthEnabled: false,
	searchAuthKey: '',
	searchDefaultEnabled: false
}

// 导出设置页面类
export { MemoryGraphSettingTab } from '@/utils/pages/settings';
