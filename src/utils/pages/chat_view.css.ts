/**
 * AI聊天页面样式
 */
export const chatViewStyles = `
	/* AI聊天界面样式 */
	.ai-chat-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.ai-chat-toolbar {
		display: flex;
		gap: 4px;
		padding: 8px 12px;
		border-bottom: 1px solid var(--background-modifier-border);
		background: var(--background-primary);
		justify-content: space-between;
		align-items: center;
	}

	.ai-chat-title {
		flex: 1;
		font-size: 14px;
		font-weight: 500;
		color: var(--text-normal);
		cursor: pointer;
		padding: 4px 8px;
		border-radius: 3px;
		transition: all 0.15s ease;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 300px;
	}

	.ai-chat-title:hover {
		background: var(--background-modifier-hover);
		color: var(--text-accent);
	}

	.ai-chat-title-input {
		width: 100%;
		max-width: 300px;
		padding: 4px 8px;
		border: 1px solid var(--interactive-accent);
		border-radius: 3px;
		background: var(--background-primary);
		color: var(--text-normal);
		font-size: 14px;
		font-weight: 500;
		font-family: inherit;
	}

	.ai-chat-title-input:focus {
		outline: none;
		border-color: var(--interactive-accent);
	}

	.ai-chat-toolbar-buttons {
		display: flex;
		gap: 4px;
		align-items: center;
	}

	.ai-chat-toolbar-button {
		width: 28px;
		height: 28px;
		padding: 0;
		border: none;
		border-radius: 3px;
		background: transparent;
		color: var(--text-muted);
		cursor: pointer;
		transition: all 0.15s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0.7;
	}

	.ai-chat-toolbar-button:hover {
		background: transparent;
		color: var(--text-normal);
		opacity: 1;
	}

	.ai-chat-toolbar-button svg {
		width: 16px;
		height: 16px;
	}

	.ai-chat-messages {
		flex: 1;
		overflow-y: auto;
		padding: 15px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.ai-chat-welcome {
		text-align: center;
		padding: 40px 20px;
		color: var(--text-muted);
		font-size: 14px;
	}

	.ai-chat-message {
		display: flex;
		flex-direction: column;
		gap: 6px;
		max-width: 85%;
		animation: fadeIn 0.3s ease-in;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.ai-chat-message.user {
		align-self: flex-end;
	}

	.ai-chat-message.assistant {
		align-self: flex-start;
	}

	.ai-chat-message-role {
		font-size: 12px;
		font-weight: 500;
		color: var(--text-muted);
		padding: 0 8px;
	}

	.ai-chat-message.user .ai-chat-message-role {
		text-align: right;
	}

	.ai-chat-message-content {
		padding: 10px 14px;
		border-radius: 8px;
		font-size: 14px;
		line-height: 1.5;
		word-wrap: break-word;
		white-space: pre-wrap;
		user-select: text;
		-webkit-user-select: text;
		-moz-user-select: text;
		-ms-user-select: text;
		cursor: text;
	}

	.ai-chat-message.user .ai-chat-message-content {
		background: var(--background-secondary);
		color: var(--text-normal);
		border: 2px solid var(--interactive-accent);
		border-bottom-right-radius: 2px;
	}

	/* 用户消息选中文字样式 */
	.ai-chat-message.user .ai-chat-message-content ::selection {
		background: var(--text-selection);
		color: var(--text-normal);
	}

	.ai-chat-message.user .ai-chat-message-content ::-moz-selection {
		background: var(--text-selection);
		color: var(--text-normal);
	}

	.ai-chat-message.assistant .ai-chat-message-content {
		background: var(--background-secondary);
		color: var(--text-normal);
		border: 1px solid var(--background-modifier-border);
		border-bottom-left-radius: 2px;
	}

	/* AI消息选中文字样式 */
	.ai-chat-message.assistant .ai-chat-message-content ::selection {
		background: var(--text-selection);
		color: var(--text-normal);
	}

	.ai-chat-message.assistant .ai-chat-message-content ::-moz-selection {
		background: var(--text-selection);
		color: var(--text-normal);
	}

	.ai-chat-message-content.thinking {
		font-style: italic;
		opacity: 0.7;
		animation: pulse 1.5s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 0.7;
		}
		50% {
			opacity: 1;
		}
	}

	.ai-chat-input-container {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 12px;
		border-top: 1px solid var(--background-modifier-border);
		background: var(--background-primary);
	}

	.ai-chat-input-toolbar {
		display: flex;
		gap: 6px;
		align-items: center;
		padding: 4px 0;
	}

	.ai-chat-input-toolbar-button {
		width: 32px;
		height: 32px;
		padding: 0;
		border: 1px solid transparent;
		border-radius: 6px;
		background: transparent;
		color: var(--text-muted);
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.ai-chat-input-toolbar-button:hover {
		background: var(--background-modifier-hover);
		color: var(--text-normal);
		border-color: var(--background-modifier-border);
	}

	.ai-chat-input-toolbar-button.active {
		background: var(--interactive-accent);
		color: var(--text-on-accent);
		border-color: var(--interactive-accent);
	}

	.ai-chat-input-toolbar-button svg {
		width: 18px;
		height: 18px;
	}

	/* 上下文文件标签 */
	.ai-chat-context-file-tag {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 10px;
		border: 1px dashed var(--background-modifier-border);
		border-radius: 6px;
		background: var(--background-secondary);
		font-size: 13px;
		color: var(--text-muted);
		transition: all 0.2s ease;
	}

	.ai-chat-context-file-tag:hover {
		border-color: var(--text-muted);
		background: var(--background-modifier-hover);
	}

	.ai-chat-context-file-name {
		max-width: 200px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--text-normal);
	}

	.ai-chat-context-file-close {
		width: 18px;
		height: 18px;
		padding: 0;
		border: none;
		background: transparent;
		color: var(--text-muted);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 3px;
		transition: all 0.15s ease;
	}

	.ai-chat-context-file-close:hover {
		background: var(--background-modifier-error);
		color: var(--text-error);
	}

	.ai-chat-context-file-close svg {
		width: 14px;
		height: 14px;
	}

	.ai-chat-input-wrapper {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.ai-chat-input {
		flex: 1;
		height: 40px;
		padding: 0 12px;
		border: 1px solid var(--background-modifier-border);
		border-radius: 6px;
		background: var(--background-primary);
		color: var(--text-normal);
		font-size: 14px;
		font-family: inherit;
	}

	.ai-chat-input:focus {
		outline: none;
		border-color: var(--interactive-accent);
	}

	.ai-chat-send-button {
		padding: 10px 24px;
		height: 40px;
		border: none;
		border-radius: 6px;
		background: var(--interactive-accent);
		color: var(--text-on-accent);
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.ai-chat-send-button:hover {
		background: var(--interactive-accent-hover);
	}

	.ai-chat-send-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* 停止按钮样式（红色） */
	.ai-chat-send-button.ai-chat-stop-button {
		background: var(--text-error);
		color: var(--text-on-accent);
	}

	.ai-chat-send-button.ai-chat-stop-button:hover {
		background: #dc2626; /* 更深的红色 */
	}

	/* Markdown 内容样式 */
	.ai-chat-message-content.markdown-content {
		line-height: 1.6;
	}

	.ai-chat-message-content.markdown-content > * {
		margin: 0.3em 0;
	}

	.ai-chat-message-content.markdown-content > *:first-child {
		margin-top: 0;
	}

	.ai-chat-message-content.markdown-content > *:last-child {
		margin-bottom: 0;
	}

	.ai-chat-message-content.markdown-content p {
		margin: 0.3em 0;
	}

	.ai-chat-message-content.markdown-content p:first-child {
		margin-top: 0;
	}

	.ai-chat-message-content.markdown-content p:last-child {
		margin-bottom: 0;
	}

	.ai-chat-message-content.markdown-content ul,
	.ai-chat-message-content.markdown-content ol {
		margin: 0.2em 0;
		padding-left: 1.5em;
	}

	.ai-chat-message-content.markdown-content code {
		background: var(--code-background);
		padding: 2px 6px;
		border-radius: 3px;
		font-family: var(--font-monospace);
		font-size: 0.9em;
	}

	.ai-chat-message-content.markdown-content pre {
		background: var(--code-background);
		padding: 12px;
		border-radius: 6px;
		overflow-x: auto;
		margin: 0.3em 0;
	}

	.ai-chat-message-content.markdown-content pre code {
		background: transparent;
		padding: 0;
	}

	.ai-chat-message-content.markdown-content a {
		color: var(--link-color);
		text-decoration: none;
	}

	.ai-chat-message-content.markdown-content a:hover {
		text-decoration: underline;
	}

	.ai-chat-message-content.markdown-content strong {
		font-weight: 600;
	}

	.ai-chat-message-content.markdown-content em {
		font-style: italic;
	}

	.ai-chat-message-content.markdown-content h1,
	.ai-chat-message-content.markdown-content h2,
	.ai-chat-message-content.markdown-content h3,
	.ai-chat-message-content.markdown-content h4,
	.ai-chat-message-content.markdown-content h5,
	.ai-chat-message-content.markdown-content h6 {
		margin-top: 0.4em;
		margin-bottom: 0.2em;
		font-weight: 600;
	}

	.ai-chat-message-content.markdown-content h1 {
		font-size: 1.5em;
	}

	.ai-chat-message-content.markdown-content h2 {
		font-size: 1.3em;
	}

	.ai-chat-message-content.markdown-content h3 {
		font-size: 1.15em;
	}

	.ai-chat-message-content.markdown-content blockquote {
		border-left: 3px solid var(--interactive-accent);
		padding-left: 1em;
		margin: 0.3em 0;
		color: var(--text-muted);
	}

	/* 加载动画样式 */
	.ai-chat-loading-animation {
		display: flex;
		gap: 6px;
		align-items: center;
		padding: 4px 0;
	}

	.ai-chat-loading-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--text-muted);
		animation: loadingDot 1.4s ease-in-out infinite;
	}

	.ai-chat-loading-dot:nth-child(1) {
		animation-delay: 0s;
	}

	.ai-chat-loading-dot:nth-child(2) {
		animation-delay: 0.2s;
	}

	.ai-chat-loading-dot:nth-child(3) {
		animation-delay: 0.4s;
	}

	@keyframes loadingDot {
		0%, 80%, 100% {
			opacity: 0.3;
			transform: scale(0.8);
		}
		40% {
			opacity: 1;
			transform: scale(1.2);
		}
	}

	/* 移动端适配：优化键盘弹起时的布局 */
	@media (max-width: 768px) {
		/* 整个聊天容器：限制在视口内 */
		.ai-chat-container {
			flex: 1;
			display: flex;
			flex-direction: column;
			min-height: 0;
			/* 限制最大高度，为 Obsidian 底部工具栏预留空间 */
			max-height: 650px;
			overflow: hidden;
		}

		/* 工具栏最小化 */
		.ai-chat-toolbar {
			padding: 2px 4px;
			gap: 2px;
			flex-shrink: 0;
			min-height: 32px;
			max-height: 32px;
		}

		.ai-chat-title {
			font-size: 12px;
			max-width: 160px;
			padding: 2px 4px;
			line-height: 1.2;
		}

		.ai-chat-toolbar-button {
			width: 22px;
			height: 22px;
		}

		.ai-chat-toolbar-button svg {
			width: 13px;
			height: 13px;
		}

		/* 消息区域：占据剩余空间 */
		.ai-chat-messages {
			padding: 6px;
			gap: 4px;
			flex: 1;
			min-height: 0;
			overflow-y: auto;
		}

		.ai-chat-message {
			max-width: 90%;
		}

		/* 输入区域：固定在底部 */
		.ai-chat-input-container {
			padding: 2px 4px;
			padding-bottom: 4px;
			gap: 1px;
			flex-shrink: 0;
			border-top-width: 1px;
			max-height: 89px;
		}

		.ai-chat-input-toolbar {
			gap: 2px;
			padding: 1px 0;
		}

		.ai-chat-input-toolbar-button {
			width: 24px;
			height: 24px;
		}

		.ai-chat-input-toolbar-button svg {
			width: 15px;
			height: 15px;
		}

		.ai-chat-input-wrapper {
			gap: 3px;
		}

		.ai-chat-input {
			height: 30px;
			padding: 0 6px;
			font-size: 14px;
		}

		.ai-chat-send-button {
			height: 30px;
			padding: 5px 10px;
			font-size: 12px;
		}

		.ai-chat-context-file-tag {
			padding: 2px 4px;
			font-size: 11px;
			gap: 2px;
		}

		.ai-chat-context-file-name {
			max-width: 130px;
		}

		.ai-chat-context-file-close {
			width: 13px;
			height: 13px;
		}

		.ai-chat-context-file-close svg {
			width: 11px;
			height: 11px;
		}
	}
`;
