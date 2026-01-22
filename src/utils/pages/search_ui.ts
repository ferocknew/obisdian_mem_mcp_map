/**
 * 搜索页面 - UI 创建模块
 *
 * 负责创建搜索界面的各个组件
 */

import { App } from 'obsidian';
import MemoryGraphPlugin from '@/main';

export class SearchUIBuilder {
	private container: HTMLElement;

	constructor(container: HTMLElement) {
		this.container = container;
	}

	/**
	 * 创建搜索界面
	 */
	createInterface(): { searchInput: HTMLInputElement; searchButton: HTMLButtonElement; resultsContainer: HTMLElement } {
		this.container.empty();
		this.container.addClass('memory-search-view-container');

		// 创建搜索框容器
		const searchInputContainer = this.container.createDiv({ cls: 'memory-search-container' });

		// 创建搜索输入框
		const searchInput = searchInputContainer.createEl('input', {
			type: 'text',
			placeholder: '输入搜索内容...',
			cls: 'memory-search-input'
		});

		// 创建搜索按钮
		const searchButton = searchInputContainer.createEl('button', {
			text: '搜索',
			cls: 'memory-search-button'
		});

		// 创建结果容器
		const resultsContainer = this.container.createDiv({ cls: 'memory-search-results' });
		resultsContainer.createEl('div', {
			text: '输入关键词并点击搜索按钮',
			cls: 'memory-search-placeholder'
		});

		return { searchInput, searchButton, resultsContainer };
	}

	/**
	 * 显示容器
	 */
	show(): void {
		this.container.style.display = 'flex';
	}

	/**
	 * 隐藏容器
	 */
	hide(): void {
		this.container.style.display = 'none';
	}

	/**
	 * 设置搜索按钮状态
	 */
	setSearchButtonState(button: HTMLButtonElement, disabled: boolean, text: string): void {
		button.disabled = disabled;
		button.textContent = text;
	}

	/**
	 * 显示加载状态
	 */
	showLoading(resultsContainer: HTMLElement): void {
		resultsContainer.empty();
		resultsContainer.createEl('div', {
			text: '搜索中...',
			cls: 'memory-search-loading'
		});
	}

	/**
	 * 显示错误
	 */
	showError(resultsContainer: HTMLElement, message: string): void {
		resultsContainer.empty();
		resultsContainer.createEl('div', {
			text: message,
			cls: 'memory-search-error'
		});
	}

	/**
	 * 显示空结果
	 */
	showEmptyResults(resultsContainer: HTMLElement): void {
		resultsContainer.createEl('div', {
			text: '未找到相关结果',
			cls: 'memory-search-empty'
		});
	}
}
