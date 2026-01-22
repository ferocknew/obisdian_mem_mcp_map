export const styles = `
/* 设置页面样式 */
.mcp-status {
	padding: 10px;
	border-radius: 4px;
	background-color: var(--background-secondary);
}

.mcp-tools-list {
	max-height: 500px;
	overflow-y: auto;
}

.mcp-tools-list::-webkit-scrollbar {
	width: 8px;
}

.mcp-tools-list::-webkit-scrollbar-track {
	background: var(--background-secondary);
	border-radius: 4px;
}

.mcp-tools-list::-webkit-scrollbar-thumb {
	background: var(--background-modifier-border);
	border-radius: 4px;
}

.mcp-tools-list::-webkit-scrollbar-thumb:hover {
	background: var(--text-muted);
}
`;
