import { Notice, App } from "obsidian";
import { HighlightInfo, CommentItem } from '../types';
import { ExportPreviewModal } from '../ExportModal';
import type { default as Html2Canvas } from 'html2canvas';

export class ExportManager {
    constructor(private app: App) {}

    async exportHighlightAsImage(highlight: HighlightInfo & { comments?: CommentItem[] }) {
        try {
            const html2canvas = (await import('html2canvas')).default as typeof Html2Canvas;
            new ExportPreviewModal(this.app, highlight, html2canvas).open();
        } catch (error) {
            console.error("Failed to load html2canvas:", error);
            new Notice("导出失败：无法加载必要的组件");
        }
    }
}
