import { ItemView, WorkspaceLeaf, TFile, Notice } from "obsidian";
import { CommentStore, CommentItem } from './CommentStore';
import { HighlightInfo } from './types';
import CommentPlugin from '../main';
import { HighlightManager } from './managers/HighlightManager';
import { CommentManager } from './managers/CommentManager';
import { AIManager } from './managers/AIManager';
import { UIRenderer } from './managers/UIRenderer';
import { ExportManager } from './managers/ExportManager';

export const VIEW_TYPE_COMMENT = "comment-view";

export class CommentView extends ItemView {
    private highlightContainer: HTMLElement;
    private searchContainer: HTMLElement;
    private currentFile: TFile | null = null;
    private highlights: HighlightInfo[] = [];
    private commentStore: CommentStore;
    private searchInput: HTMLInputElement;
    private plugin: CommentPlugin;

    // 管理器实例
    private highlightManager: HighlightManager;
    private commentManager: CommentManager;
    private aiManager: AIManager;
    private uiRenderer: UIRenderer;
    private exportManager: ExportManager;

    constructor(leaf: WorkspaceLeaf, commentStore: CommentStore) {
        super(leaf);
        this.commentStore = commentStore;
        this.plugin = (this.app as any).plugins.plugins['highlight-comment'] as CommentPlugin;

        // 初始化管理器
        this.highlightManager = new HighlightManager(this.app, this.currentFile, this.highlights);
        this.commentManager = new CommentManager(this.app, this.currentFile, this.commentStore, this.updateHighlights.bind(this));
        this.aiManager = new AIManager(this.plugin.settings.ai);
        this.exportManager = new ExportManager(this.app);
        
        // 初始化 UIRenderer 必须在其他管理器之后
        this.uiRenderer = new UIRenderer(
            this.containerEl,
            this.highlightManager,
            this.commentManager,
            this.aiManager,
            this.exportManager
        );

        // 监听文档切换
        this.registerEvent(
            this.app.workspace.on('file-open', (file) => {
                if (file) {
                    this.currentFile = file;
                    this.updateHighlights();
                }
            })
        );

        // 监听文档修改
        this.registerEvent(
            this.app.vault.on('modify', (file) => {
                if (file === this.currentFile) {
                    this.updateHighlights();
                }
            })
        );

        // 监听评论输入事件
        const handleCommentInput = (e: CustomEvent) => {
            this.commentManager.handleCommentInput(e, this.highlightContainer);
        };

        window.addEventListener("open-comment-input", handleCommentInput as EventListener);
        this.register(() => window.removeEventListener("open-comment-input", handleCommentInput as EventListener));
    }

    getViewType(): string {
        return VIEW_TYPE_COMMENT;
    }

    getDisplayText(): string {
        return "ObsidianComment";
    }

    getIcon(): string {
        return "message-square-quote";
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        
        // 使用 UIRenderer 创建搜索区域
        const { container: searchContainer, input: searchInput } = this.uiRenderer.createSearchContainer();
        this.searchContainer = searchContainer;
        this.searchInput = searchInput;

        // 添加搜索事件监听
        this.searchInput.addEventListener("input", this.debounce(() => {
            this.updateHighlightsList();
        }, 300));

        // 创建高亮列表容器
        this.highlightContainer = container.createEl("div", {
            cls: "highlight-container"
        });

        // 初始化当前文件
        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile) {
            this.currentFile = activeFile;
            await this.updateHighlights();
        }
    }

    private debounce(func: Function, wait: number) {
        let timeout: NodeJS.Timeout;
        return (...args: any[]) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    private async updateHighlights() {
        if (!this.currentFile) {
            this.uiRenderer.renderHighlights([], this.highlightContainer);
            return;
        }

        const content = await this.app.vault.read(this.currentFile);
        const highlights = this.highlightManager.extractHighlights(content);
        
        // 获取已存储的评论
        const storedComments = this.commentStore.getFileComments(this.currentFile);
        
        // 合并高亮和评论数据
        this.highlights = highlights.map(highlight => {
            const storedComment = storedComments.find(c => {
                const textMatch = c.text === highlight.text;
                if (textMatch && highlight.paragraphText) {
                    return Math.abs(c.position - highlight.position) < highlight.paragraphText.length;
                }
                return false;
            });

            if (storedComment) {
                return {
                    ...storedComment,
                    position: highlight.position,
                    paragraphOffset: highlight.paragraphOffset
                };
            }

            return {
                id: this.highlightManager.generateHighlightId(highlight),
                ...highlight,
                comments: [],
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
        });

        await this.updateHighlightsList();
    }

    private async updateHighlightsList() {
        const searchTerm = this.searchInput.value.toLowerCase().trim();
        const filteredHighlights = this.highlights.filter(highlight => {
            if (highlight.text.toLowerCase().includes(searchTerm)) {
                return true;
            }
            if (highlight.comments?.some(comment => 
                comment.content.toLowerCase().includes(searchTerm)
            )) {
                return true;
            }
            return false;
        });

        this.uiRenderer.renderHighlights(filteredHighlights, this.highlightContainer);
    }
}