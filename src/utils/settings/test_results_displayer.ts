import { AllTestResults } from './configuration_tester';

export class TestResultsDisplayer {
	displayTestResults(containerEl: HTMLElement, results: AllTestResults): void {
		let resultsEl = containerEl.querySelector('.config-test-results') as HTMLElement;

		if (!resultsEl) {
			const saveButtonSeparator = containerEl.querySelector('hr:last-of-type');
			if (saveButtonSeparator && saveButtonSeparator.previousElementSibling) {
				resultsEl = containerEl.createEl('div', {
					cls: 'config-test-results'
				});
				resultsEl.style.marginTop = '15px';
				resultsEl.style.padding = '15px';
				resultsEl.style.border = '1px solid var(--background-modifier-border)';
				resultsEl.style.borderRadius = '4px';
				resultsEl.style.backgroundColor = 'var(--background-secondary)';
				saveButtonSeparator.parentElement?.insertBefore(resultsEl, saveButtonSeparator);
			}
		}

		if (!resultsEl) {
			console.error('[Test Results Displayer] 无法创建测试结果显示区域');
			return;
		}

		resultsEl.empty();
		resultsEl.createEl('h4', { text: '配置测试结果' });

		if (results.mcpTest) {
			this.displayMcpTestResult(resultsEl, results.mcpTest);
		}

		if (results.llmTest) {
			this.displayLlmTestResult(resultsEl, results.llmTest);
		}

		if (!results.mcpTest && !results.llmTest) {
			const noConfigEl = resultsEl.createEl('div');
			noConfigEl.style.marginTop = '10px';
			noConfigEl.style.fontSize = '13px';
			noConfigEl.style.opacity = '0.7';
			noConfigEl.textContent = '未配置任何服务，无需测试';
		}
	}

	private displayMcpTestResult(containerEl: HTMLElement, result: { success: boolean; message: string }): void {
		const mcpResultEl = containerEl.createEl('div');
		mcpResultEl.style.marginTop = '10px';
		mcpResultEl.style.padding = '8px';
		mcpResultEl.style.borderRadius = '4px';
		mcpResultEl.style.backgroundColor = result.success
			? 'var(--background-modifier-success)'
			: 'var(--background-modifier-error)';

		const mcpTitle = mcpResultEl.createEl('div');
		mcpTitle.style.fontWeight = 'bold';
		mcpTitle.style.marginBottom = '4px';
		mcpTitle.textContent = 'MCP 服务器';

		const mcpMessage = mcpResultEl.createEl('div');
		mcpMessage.style.fontSize = '13px';
		mcpMessage.textContent = result.message;
	}

	private displayLlmTestResult(
		containerEl: HTMLElement,
		result: { success: boolean; message: string; error?: string }
	): void {
		const llmResultEl = containerEl.createEl('div');
		llmResultEl.style.marginTop = '10px';
		llmResultEl.style.padding = '8px';
		llmResultEl.style.borderRadius = '4px';
		llmResultEl.style.backgroundColor = result.success
			? 'var(--background-modifier-success)'
			: 'var(--background-modifier-error)';

		const llmTitle = llmResultEl.createEl('div');
		llmTitle.style.fontWeight = 'bold';
		llmTitle.style.marginBottom = '4px';
		llmTitle.textContent = 'LLM API';

		const llmMessage = llmResultEl.createEl('div');
		llmMessage.style.fontSize = '13px';
		llmMessage.textContent = result.message;

		if (!result.success && result.error) {
			const llmError = llmResultEl.createEl('div');
			llmError.style.fontSize = '12px';
			llmError.style.marginTop = '4px';
			llmError.style.opacity = '0.8';
			llmError.textContent = `详细错误: ${result.error}`;
		}
	}
}
