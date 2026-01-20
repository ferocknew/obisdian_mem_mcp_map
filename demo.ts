import { Plugin, WorkspaceLeaf, requestUrl, Notice } from 'obsidian';

interface MemoryNode {
    uuid: string;
    type: 'memory' | 'entity' | 'concept';
    content: string;
    timestamp: number;
    metadata?: any;
    relations?: { target: string; type: string }[];
}

export default class MCPClientPlugin extends Plugin {
    async onload() {
        // 注册侧边栏视图
        this.registerView('mcp-memory-view', (leaf) => new MCPView(leaf));

        // 添加 ribbon 图标打开侧边栏
        this.addRibbonIcon('brain', '打开 MCP 记忆图谱', () => {
            this.activateView();
        });

        // 命令面板快捷打开
        this.addCommand({
            id: 'open-mcp-view',
            name: '打开 MCP 记忆视图',
            callback: () => this.activateView()
        });
    }

    async activateView() {
        const { workspace } = this.app;
        let leaf: WorkspaceLeaf | null = null;
        for (const l of workspace.getLeavesOfType('mcp-memory-view')) {
            leaf = l;
            break;
        }
        if (!leaf) {
            leaf = workspace.getRightSideBarLeaf() || workspace.createLeafInParent(workspace.rootSplit, 0);
            await leaf.setViewState({ type: 'mcp-memory-view', active: true });
        }
        workspace.revealLeaf(leaf);
    }
}

class MCPView extends ItemView {
    private memories: MemoryNode[] = [];
    private filtered: MemoryNode[] = [];
    private searchInput: HTMLInputElement;
    private listDiv: HTMLDivElement;

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
        this.icon = 'brain';
    }

    getViewType() { return 'mcp-memory-view'; }
    getDisplayText() { return 'MCP 记忆图谱'; }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        container.createEl('h2', { text: '记忆内容列表' });

        // 搜索框
        this.searchInput = container.createEl('input', { type: 'text', placeholder: '搜索内容/UUID/实体...' });
        this.searchInput.style.width = '100%';
        this.searchInput.style.marginBottom = '10px';
        this.searchInput.addEventListener('input', () => this.filterMemories());

        // 刷新按钮
        const refreshBtn = container.createEl('button', { text: '刷新数据' });
        refreshBtn.onclick = () => this.loadMemories();

        // 列表容器（虚拟滚动后续可加）
        this.listDiv = container.createEl('div');
        this.listDiv.style.maxHeight = '80vh';
        this.listDiv.style.overflowY = 'auto';

        await this.loadMemories();
    }

    async loadMemories(page = 1, limit = 100) {
        try {
            const resp = await requestUrl({
                url: `https://your-mcp-server.com/api/memories?page=${page}&limit=${limit}`,
                method: 'GET',
                headers: { 'Authorization': 'Bearer YOUR_TOKEN' }  // 改成你的认证
            });
            this.memories = resp.json.data;  // 假设返回 {data: [...], total: N}
            this.filterMemories();
            new Notice('记忆加载完成');
        } catch (e) {
            new Notice('加载失败: ' + e.message);
        }
    }

    filterMemories() {
        const query = this.searchInput.value.toLowerCase();
        this.filtered = this.memories.filter(m =>
            m.content.toLowerCase().includes(query) ||
            m.uuid.toLowerCase().includes(query)
        );
        this.renderList();
    }

    renderList() {
        this.listDiv.empty();
        for (const mem of this.filtered) {
            const item = this.listDiv.createEl('div', { cls: 'mcp-item' });
            item.style.borderBottom = '1px solid gray';
            item.style.padding = '8px';

            item.createEl('strong', { text: mem.uuid.slice(0,8) + '...' });
            item.createEl('span', { text: ` [${mem.type}] ${new Date(mem.timestamp).toLocaleString()}` });

            const contentDiv = item.createEl('div', { text: mem.content.slice(0, 200) + (mem.content.length > 200 ? '...' : '') });
            contentDiv.style.marginTop = '5px';

            // 按钮组
            const btns = item.createEl('div');
            const detailBtn = btns.createEl('button', { text: '详情/编辑' });
            detailBtn.onclick = () => this.openEditModal(mem);

            const aiBtn = btns.createEl('button', { text: 'AI 优化' });
            aiBtn.onclick = () => this.aiOptimize(mem);
        }
    }

    openEditModal(mem: MemoryNode) {
        const modal = new EditModal(this.app, mem, async (updated) => {
            // 回写服务端
            try {
                await requestUrl({
                    url: `https://your-mcp-server.com/api/memory/${mem.uuid}`,
                    method: 'PUT',
                    body: JSON.stringify(updated),
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer TOKEN' }
                });
                new Notice('回写成功');
                this.loadMemories();  // 刷新
            } catch (e) {
                new Notice('回写失败');
            }
        });
        modal.open();
    }

    async aiOptimize(mem: MemoryNode) {
        // 这里调用你的 LLM 接口（假设你插件已有 LLM 调用函数）
        const prompt = `请优化以下记忆内容，使其更清晰、准确、无歧义：\n\n${mem.content}`;
        const optimized = await this.callLLM(prompt);  // 你自己实现 callLLM

        // 预览确认
        if (confirm(`AI 建议修改为：\n${optimized}\n\n是否应用？`)) {
            const updated = { ...mem, content: optimized };
            // 直接回写
            await this.saveUpdate(updated);
        }
    }

    async saveUpdate(updated: MemoryNode) {
        // 同 edit modal 的回写逻辑
    }
}

// 简单编辑 Modal
class EditModal extends Modal {
    constructor(app: App, private mem: MemoryNode, private onSave: (updated: MemoryNode) => void) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: '编辑记忆' });

        const textarea = contentEl.createEl('textarea', { text: this.mem.content });
        textarea.style.width = '100%';
        textarea.style.height = '300px';

        const saveBtn = contentEl.createEl('button', { text: '保存回写' });
        saveBtn.onclick = () => {
            const updated = { ...this.mem, content: textarea.value };
            this.onSave(updated);
            this.close();
        };
    }

    onClose() {
        this.contentEl.empty();
    }
}