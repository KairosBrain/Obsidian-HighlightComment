import { Notice, TFile, App } from "obsidian";
import { CommentStore, HighlightComment, CommentItem } from '../CommentStore';
import { HighlightInfo } from '../types';

export class CommentManager {
    constructor(
        private app: App,
        private currentFile: TFile | null,
        private commentStore: CommentStore,
        private updateHighlights: () => Promise<void>
    ) {}

    async addComment(highlight: HighlightInfo, content: string) {
        if (!this.currentFile || !highlight.id) return;

        const newComment: CommentItem = {
            id: `comment-${Date.now()}`,
            content,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        if (!highlight.comments) {
            highlight.comments = [];
        }
        highlight.comments.push(newComment);
        highlight.updatedAt = Date.now();

        await this.commentStore.addComment(this.currentFile, highlight as HighlightComment);

        window.dispatchEvent(new CustomEvent("comment-updated", {
            detail: {
                text: highlight.text,
                comments: highlight.comments
            }
        }));
    }

    async updateComment(highlight: HighlightInfo, commentId: string, content: string) {
        if (!this.currentFile || !highlight.comments) return;

        const comment = highlight.comments.find(c => c.id === commentId);
        if (comment) {
            comment.content = content;
            comment.updatedAt = Date.now();
            highlight.updatedAt = Date.now();
            await this.commentStore.addComment(this.currentFile, highlight as HighlightComment);

            window.dispatchEvent(new CustomEvent("comment-updated", {
                detail: {
                    text: highlight.text,
                    comments: highlight.comments
                }
            }));
        }
    }

    async deleteComment(highlight: HighlightInfo, commentId: string) {
        if (!this.currentFile || !highlight.comments) return;

        highlight.comments = highlight.comments.filter(c => c.id !== commentId);
        highlight.updatedAt = Date.now();
        await this.commentStore.addComment(this.currentFile, highlight as HighlightComment);

        window.dispatchEvent(new CustomEvent("comment-updated", {
            detail: {
                text: highlight.text,
                comments: highlight.comments
            }
        }));

        await this.updateHighlights();
    }

    handleCommentInput(e: CustomEvent, highlightContainer: HTMLElement) {
        const { highlightId, text } = e.detail;
        
        setTimeout(() => {
            const highlightCard = Array.from(highlightContainer.querySelectorAll('.highlight-card'))
                .find(card => {
                    const textContent = card.querySelector('.highlight-text-content')?.textContent;
                    return textContent === text;
                });

            if (highlightCard) {
                const addButton = highlightCard.querySelector('.highlight-add-comment-btn') as HTMLElement;
                if (addButton) {
                    addButton.click();
                }
                highlightCard.scrollIntoView({ behavior: "smooth" });
            }
        }, 100);
    }
}
