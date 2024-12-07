import { setIcon } from "obsidian";
import { HighlightInfo } from '../types';
import { CommentItem } from '../CommentStore';
import { AIManager } from './AIManager';
import { HighlightManager } from './HighlightManager';
import { CommentManager } from './CommentManager';
import { ExportManager } from './ExportManager';

export class UIRenderer {
    constructor(
        private containerEl: HTMLElement,
        private highlightManager: HighlightManager,
        private commentManager: CommentManager,
        private aiManager: AIManager,
        private exportManager: ExportManager
    ) {}

    createSearchContainer(): { container: HTMLElement; input: HTMLInputElement } {
        const searchContainer = this.containerEl.createEl("div", {
            cls: "highlight-search-container"
        });

        const searchInput = searchContainer.createEl("input", {
            cls: "highlight-search-input",
            attr: {
                type: "text",
                placeholder: "搜索高亮内容或评论...",
            }
        });

        return { container: searchContainer, input: searchInput };
    }

    renderHighlights(highlightsToRender: HighlightInfo[], highlightContainer: HTMLElement) {
        highlightContainer.empty();

        if (highlightsToRender.length === 0) {
            highlightContainer.createEl("div", {
                cls: "highlight-empty-state",
                text: (this.containerEl.querySelector('.highlight-search-input') as HTMLInputElement)?.value.trim()
                    ? "没有找到匹配的内容"
                    : "当前文档没有高亮内容"
            });
            return;
        }

        const highlightList = highlightContainer.createEl("div", {
            cls: "highlight-list"
        });

        highlightsToRender.forEach((highlight) => {
            const card = this.createHighlightCard(highlight, highlightList);
            this.createCommentSection(highlight, card);
        });
    }

    private createHighlightCard(highlight: HighlightInfo, parent: HTMLElement): HTMLElement {
        const card = parent.createEl("div", {
            cls: "highlight-card",
            attr: {
                'data-highlight': JSON.stringify(highlight)
            }
        });

        const contentEl = card.createEl("div", {
            cls: "highlight-content"
        });

        const textContainer = contentEl.createEl("div", {
            cls: "highlight-text-container"
        });

        const decorator = textContainer.createEl("div", {
            cls: "highlight-text-decorator"
        });

        if (highlight.backgroundColor) {
            decorator.style.backgroundColor = highlight.backgroundColor;
        }

        const textEl = textContainer.createEl("div", {
            cls: "highlight-text",
            attr: { 'aria-label': '点击定位到文档位置' }
        });

        const textContent = textEl.createEl("div", {
            text: highlight.text,
            cls: "highlight-text-content"
        });

        textContent.addEventListener("mousedown", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await this.highlightManager.jumpToHighlight(highlight);
        });

        const actionButtons = contentEl.createEl("div", {
            cls: "highlight-action-buttons"
        });

        const leftButtons = actionButtons.createEl("div", {
            cls: "highlight-action-buttons-left"
        });

        this.aiManager.initAIButton(leftButtons, highlight);

        const rightButtons = actionButtons.createEl("div", {
            cls: "highlight-action-buttons-right"
        });

        const addCommentBtn = rightButtons.createEl("button", {
            cls: "highlight-action-btn highlight-add-comment-btn",
            attr: { 'aria-label': '添加评论' }
        });
        setIcon(addCommentBtn, "square-plus");
        addCommentBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            this.showCommentInput(card, highlight);
        });

        const shareBtn = rightButtons.createEl("button", {
            cls: "highlight-action-btn highlight-share-btn",
            attr: { 'aria-label': '导出为图片' }
        });
        setIcon(shareBtn, "image-down");
        shareBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            this.exportManager.exportHighlightAsImage(highlight);
        });

        return card;
    }

    private createCommentSection(highlight: HighlightInfo, card: HTMLElement) {
        const comments = highlight.comments || [];
        if (comments.length === 0) return;

        const commentsSection = card.createEl("div", {
            cls: "highlight-comments-section"
        });

        const commentsList = commentsSection.createEl("div", {
            cls: "highlight-comments-list"
        });

        comments.forEach(comment => {
            const commentEl = commentsList.createEl("div", {
                cls: "highlight-comment",
                attr: { 'data-comment-id': comment.id }
            });

            const contentEl = commentEl.createEl("div", {
                text: comment.content,
                cls: "highlight-comment-content"
            });

            contentEl.addEventListener("dblclick", (e) => {
                e.stopPropagation();
                this.showCommentInput(card, highlight, comment);
            });

            const footer = commentEl.createEl("div", {
                cls: "highlight-comment-footer"
            });

            footer.createEl("div", {
                text: new Date(comment.createdAt).toLocaleString(),
                cls: "highlight-comment-time"
            });

            footer.createEl("div", {
                cls: "highlight-comment-actions"
            });
        });
    }

    private showCommentInput(card: HTMLElement, highlight: HighlightInfo, existingComment?: CommentItem) {
        // 这个方法的具体实现会保留在 CommentView.ts 中
        // 因为它涉及到多个管理器的交互，更适合放在主视图类中
    }
}
