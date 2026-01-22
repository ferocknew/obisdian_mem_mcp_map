/**
 * 工具执行器 - 基础类和接口定义
 */

import { WhoogleClient } from './whoogle';
import { ToolCall } from '../llm/llm_driver_base';
import { APIClient } from '@/utils/api/api_client';

/**
 * 工具执行结果
 */
export interface ToolExecutionResult {
	success: boolean;
	toolName: string;
	result?: any;
	error?: string;
	displayText?: string;
}

/**
 * 工具执行器基类
 *
 * 负责管理客户端依赖和批量执行逻辑
 */
export class ToolExecutorBase {
	protected whoogleClient: WhoogleClient | null = null;
	protected updateTitleCallback: ((title: string) => void) | null = null;
	protected readDocCallback: (() => Promise<string>) | null = null;
	protected apiClient: APIClient | null = null;
	protected globalSearchCallback: ((query: string, limit: number) => Promise<any>) | null = null;
	protected openFileCallback: ((path: string) => Promise<void>) | null = null;

	/**
	 * 设置 Whoogle 客户端
	 */
	setWhoogleClient(client: WhoogleClient | null): void {
		this.whoogleClient = client;
		console.log('[Tool Executor] Whoogle 客户端已', client ? '设置' : '清空');
	}

	/**
	 * 设置 API 客户端（记忆图谱）
	 */
	setAPIClient(client: APIClient | null): void {
		this.apiClient = client;
		console.log('[Tool Executor] API 客户端已', client ? '设置' : '清空');
	}

	/**
	 * 设置标题更新回调
	 */
	setUpdateTitleCallback(callback: ((title: string) => void) | null): void {
		this.updateTitleCallback = callback;
		console.log('[Tool Executor] 标题更新回调已', callback ? '设置' : '清空');
	}

	/**
	 * 设置文档读取回调
	 */
	setReadDocCallback(callback: (() => Promise<string>) | null): void {
		this.readDocCallback = callback;
		console.log('[Tool Executor] 文档读取回调已', callback ? '设置' : '清空');
	}

	/**
	 * 设置全局搜索回调
	 */
	setGlobalSearchCallback(callback: ((query: string, limit: number) => Promise<any>) | null): void {
		this.globalSearchCallback = callback;
		console.log('[Tool Executor] 全局搜索回调已', callback ? '设置' : '清空');
	}

	/**
	 * 设置打开文件回调
	 */
	setOpenFileCallback(callback: ((path: string) => Promise<void>) | null): void {
		this.openFileCallback = callback;
		console.log('[Tool Executor] 打开文件回调已', callback ? '设置' : '清空');
	}

	/**
	 * 检查 API 客户端是否可用
	 */
	protected checkAPIClient(toolName: string): ToolExecutionResult | null {
		if (!this.apiClient) {
			return {
				success: false,
				toolName,
				error: 'API 客户端未配置'
			};
		}
		if (!this.apiClient.isConnected()) {
			return {
				success: false,
				toolName,
				error: '未连接到记忆图谱服务'
			};
		}
		return null;
	}
}
