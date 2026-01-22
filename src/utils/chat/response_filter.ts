/**
 * AI 回复过滤器
 * 用于过滤工具调用后的无意义回复
 */

/**
 * 判断 AI 回复是否为无意义内容
 *
 * @param message AI 回复内容
 * @param toolResults 工具执行结果列表
 * @returns true 表示无意义，应该过滤；false 表示有价值，应该显示
 */
export function isNoiseResponse(message: string, toolResults?: any[]): boolean {
	if (!message || message.trim() === '') {
		return true;
	}

	const trimmedMessage = message.trim();
	const lowerMessage = trimmedMessage.toLowerCase();

	// 1. 过滤纯工具调用提示（没有实质内容）
	const toolCallPatterns = [
		/^(好的|ok|收到)[，,。！!]*$/i,
		/^(正在|开始|已经)(调用|执行|使用).*(工具|tool)[，,。！!]*$/i,
		/^(工具|tool).*(调用|执行)(成功|完成)[，,。！!]*$/i,
		/^(已|正在)(搜索|查询|检索)[，,。！!]*$/i
	];

	if (toolCallPatterns.some(pattern => pattern.test(trimmedMessage))) {
		return true;
	}

	// 2. 过滤过于简短的无意义回复（少于 10 个字符，且不包含实质信息）
	if (trimmedMessage.length < 10) {
		const meaningfulShortPatterns = [
			/\d+/,           // 包含数字
			/https?:\/\//,   // 包含链接
			/```/,           // 包含代码块
		];

		if (!meaningfulShortPatterns.some(pattern => pattern.test(trimmedMessage))) {
			return true;
		}
	}

	// 3. 过滤只是重复工具名称的回复
	if (toolResults && toolResults.length > 0) {
		const toolNames = toolResults.map(r => r.toolName).filter(Boolean);
		const isOnlyToolName = toolNames.some(name =>
			trimmedMessage === name ||
			lowerMessage === name.toLowerCase()
		);

		if (isOnlyToolName) {
			return true;
		}
	}

	// 4. 过滤纯表情或符号的回复
	const emojiOnlyPattern = /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]+$/u;
	if (emojiOnlyPattern.test(trimmedMessage)) {
		return true;
	}

	// 5. 过滤"我已经..."、"我正在..."等无实质内容的回复
	const noiseIntroPatterns = [
		/^(我|已经|正在)(读取|获取|查看|分析|检索|搜索)(了|到)?[，,。！!]*$/i,
		/^(让我|我来)(看看|查看|分析|检索|搜索)[，,。！!]*$/i,
		/^(查询|搜索|分析)(中|完成)[，,。！!]*$/i
	];

	if (noiseIntroPatterns.some(pattern => pattern.test(trimmedMessage))) {
		return true;
	}

	// 6. 检查是否只是简单重复工具结果而没有分析
	// 如果回复中 90% 以上内容都是工具结果的直接引用，认为是无意义的
	if (toolResults && toolResults.length > 0) {
		const toolResultTexts = toolResults
			.map(r => r.displayText || JSON.stringify(r.result))
			.filter(Boolean);

		// 计算消息中有多少内容是工具结果的直接复制
		let matchedLength = 0;
		for (const resultText of toolResultTexts) {
			if (trimmedMessage.includes(resultText)) {
				matchedLength += resultText.length;
			}
		}

		// 如果 90% 以上都是工具结果的直接复制，认为无意义
		const matchRatio = matchedLength / trimmedMessage.length;
		if (matchRatio > 0.9) {
			return true;
		}
	}

	// 默认认为有意义
	return false;
}

/**
 * 判断 AI 回复是否包含实质性分析
 *
 * @param message AI 回复内容
 * @returns true 表示有实质性分析，false 表示只是重复或描述
 */
export function hasSubstantiveAnalysis(message: string): boolean {
	if (!message || message.trim() === '') {
		return false;
	}

	const lowerMessage = message.toLowerCase();

	// 包含分析性词汇的回复更可能有价值
	const analyticalKeywords = [
		'因为', '所以', '因此', '导致', '说明', '表明',
		'分析', '总结', '建议', '推荐', '应该', '可以',
		'意味着', '显示', '证明', '反映', '揭示',
		'首先', '其次', '另外', '此外', '同时',
		'优点', '缺点', '优势', '劣势', '问题', '解决',
		'不同', '相同', '比较', '对比', '区别'
	];

	const hasAnalysis = analyticalKeywords.some(keyword => lowerMessage.includes(keyword));

	// 包含结构化内容（列表、标题等）
	const hasStructure = /[-*]\s|\d+\.\s|#\s/.test(message);

	// 包含代码块或引用
	const hasCodeOrQuote = /```|>/.test(message);

	// 字数超过 50 且包含分析性内容
	const isLongEnough = message.trim().length > 50;

	return hasAnalysis || hasStructure || hasCodeOrQuote || (isLongEnough && !isNoiseResponse(message));
}
