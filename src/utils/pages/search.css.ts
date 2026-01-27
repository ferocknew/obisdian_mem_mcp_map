/**
 * 搜索页面样式
 */
export const searchPageStyles = `
	/* 搜索界面容器 */
	.memory-search-view-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	/* 标签页样式 */
	.memory-search-tabs {
		display: flex;
		gap: 8px;
		margin-bottom: 15px;
		border-bottom: 2px solid var(--background-modifier-border);
		padding-bottom: 8px;
		flex-shrink: 0;
	}

	.memory-search-tab {
		padding: 8px 16px;
		border: none;
		border-radius: 4px 4px 0 0;
		background: transparent;
		color: var(--text-muted);
		font-size: 14px;
		cursor: pointer;
		transition: all 0.2s;
		position: relative;
	}

	.memory-search-tab:hover {
		background: var(--background-modifier-hover);
		color: var(--text-normal);
	}

	.memory-search-tab.active {
		background: var(--interactive-accent);
		color: var(--text-on-accent);
		font-weight: 500;
	}

	.memory-search-tab.active::after {
		content: '';
		position: absolute;
		bottom: -10px;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--interactive-accent);
	}

	/* 搜索框容器 */
	.memory-search-container {
		margin-bottom: 15px;
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.memory-search-input {
		flex: 1;
		padding: 8px 12px;
		border: 1px solid var(--background-modifier-border);
		border-radius: 4px;
		background: var(--background-primary);
		color: var(--text-normal);
		font-size: 14px;
	}

	.memory-search-input:focus {
		outline: none;
		border-color: var(--interactive-accent);
	}

	.memory-search-button {
		padding: 8px 20px;
		border: none;
		border-radius: 4px;
		background: var(--interactive-accent);
		color: var(--text-on-accent);
		font-size: 14px;
		cursor: pointer;
		white-space: nowrap;
	}

	.memory-search-button:hover {
		background: var(--interactive-accent-hover);
	}

	.memory-search-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* 搜索结果容器 */
	.memory-search-results {
		flex: 1;
		overflow-y: auto;
	}

	.memory-search-placeholder,
	.memory-search-loading,
	.memory-search-error,
	.memory-search-empty {
		text-align: center;
		padding: 20px;
		color: var(--text-muted);
	}

	.memory-search-error {
		color: var(--text-error);
	}

	/* 结果计数 */
	.result-count {
		padding: 8px 12px;
		margin-bottom: 10px;
		font-size: 13px;
		color: var(--text-muted);
		border-bottom: 1px solid var(--background-modifier-border);
	}

	/* 搜索结果项 */
	.memory-search-result-item {
		padding: 12px;
		margin-bottom: 8px;
		border: 1px solid var(--background-modifier-border);
		border-radius: 4px;
		background: var(--background-secondary);
		cursor: pointer;
		transition: background 0.2s;
	}

	.memory-search-result-item:hover {
		background: var(--background-modifier-hover);
	}

	.result-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
		gap: 8px;
		flex-wrap: wrap;
	}

	.result-name {
		font-weight: 600;
		color: var(--text-normal);
		flex: 1;
	}

	.result-type {
		font-size: 12px;
		padding: 2px 8px;
		border-radius: 3px;
		background: var(--background-modifier-border);
		color: var(--text-muted);
	}

	.result-score {
		font-size: 12px;
		padding: 2px 8px;
		border-radius: 3px;
		background: var(--interactive-accent);
		color: var(--text-on-accent);
	}

	.result-observations {
		margin-top: 8px;
	}

	.observation-item {
		padding: 4px 0;
		font-size: 13px;
		color: var(--text-muted);
		border-left: 2px solid var(--background-modifier-border);
		padding-left: 8px;
		margin-bottom: 4px;
	}

	/* 移动端适配 */
	@media (max-width: 768px) {
		.memory-search-tabs {
			margin-bottom: 0;
			padding: 6px 8px;
			gap: 4px;
		}

		.memory-search-tab {
			padding: 6px 12px;
			font-size: 13px;
		}
	}
`;
