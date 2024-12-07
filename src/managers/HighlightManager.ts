import { TFile, MarkdownView, Notice, WorkspaceLeaf } from "obsidian";
import { HighlightInfo } from '../types';
import { escapeRegExp } from '../utils';

export class HighlightManager {
    constructor(
        private app: any,
        private currentFile: TFile | null,
        private highlights: HighlightInfo[]
    ) {}

    extractHighlights(content: string): HighlightInfo[] {
        const highlightRegex = /==\s*(.*?)\s*==|<mark>\s*(.*?)\s*<\/mark>|<span style="background:(rgba\(\d+,\s*\d+,\s*\d+,\s*[0-9.]+\)|#[0-9a-fA-F]{3,6})">\s*(.*?)\s*<\/span>/g;
        const highlights: HighlightInfo[] = [];
        const paragraphs = content.split(/\n\n+/);
        let offset = 0;

        paragraphs.forEach(paragraph => {
            let match;
            while ((match = highlightRegex.exec(paragraph)) !== null) {
                const text = (match[1] || match[2] || match[4])?.trim();
                const backgroundColor = match[3];
                if (text) {
                    const highlight: HighlightInfo = {
                        text: text,
                        position: offset + match.index,
                        paragraphOffset: offset,
                        paragraphText: paragraph,
                        backgroundColor: backgroundColor
                    };
                    highlights.push(highlight);
                }
            }
            offset += paragraph.length + 2;
        });

        return highlights;
    }

    generateHighlightId(highlight: HighlightInfo): string {
        return `highlight-${highlight.position}-${Date.now()}`;
    }

    async jumpToHighlight(highlight: HighlightInfo) {
        if (!this.currentFile) {
            new Notice("未找到当前文件");
            return;
        }

        const markdownLeaves = this.app.workspace.getLeavesOfType("markdown");
        
        if (markdownLeaves.length === 0) {
            new Notice("未找到文档视图");
            return;
        }

        const targetLeaf = markdownLeaves.find((leaf: WorkspaceLeaf) => {
            const view = leaf.view as MarkdownView;
            return view.file?.path === this.currentFile?.path;
        });

        if (!targetLeaf) {
            new Notice("未找到对应的编辑器视图");
            return;
        }

        const markdownView = targetLeaf.view as MarkdownView;

        try {
            await this.app.workspace.setActiveLeaf(targetLeaf, { focus: true });
            await new Promise(resolve => setTimeout(resolve, 50));

            const editor = markdownView.editor;
            const content = editor.getValue();
            let position = -1;

            const highlightFormats = [
                new RegExp(`==\\s*${escapeRegExp(highlight.text)}\\s*==`),
                new RegExp(`<mark>\\s*${escapeRegExp(highlight.text)}\\s*</mark>`),
                new RegExp(`<span style="background:rgba\\(\\d+,\\s*\\d+,\\s*\\d+,\\s*[0-9.]+\\)">\\s*${escapeRegExp(highlight.text)}\\s*</span>`),
                new RegExp(`<span style="background:#[0-9a-fA-F]{3,6}">\\s*${escapeRegExp(highlight.text)}\\s*</span>`)
            ];

            if (highlight.backgroundColor) {
                highlightFormats.unshift(
                    new RegExp(`<span style="background:${escapeRegExp(highlight.backgroundColor)}">\\s*${escapeRegExp(highlight.text)}\\s*</span>`)
                );
            }

            for (const format of highlightFormats) {
                const match = format.exec(content);
                if (match) {
                    position = match.index;
                    break;
                }
            }
            
            if (position !== -1) {
                const pos = editor.offsetToPos(position);
                await new Promise(resolve => setTimeout(resolve, 50));

                editor.scrollIntoView({
                    from: { line: pos.line, ch: 0 },
                    to: { line: pos.line + 1, ch: 0 }
                }, true);

                await new Promise(resolve => setTimeout(resolve, 50));

                editor.scrollIntoView({
                    from: { line: Math.max(0, pos.line - 3), ch: 0 },
                    to: { line: Math.min(editor.lineCount() - 1, pos.line + 3), ch: 0 }
                }, true);

                let nextLineNumber = pos.line;
                const totalLines = editor.lineCount();
                
                while (nextLineNumber < totalLines - 1) {
                    const currentLine = editor.getLine(nextLineNumber);
                    const nextLine = editor.getLine(nextLineNumber + 1);
                    
                    if (currentLine.trim() !== '' && nextLine.trim() === '') {
                        break;
                    }
                    nextLineNumber++;
                }

                editor.setCursor({
                    line: nextLineNumber + 1,
                    ch: 0
                });
            } else {
                new Notice("未找到高亮内容");
            }
        } catch (error) {
            console.error("定位失败:", error);
            new Notice("定位失败，请重试");
        }
    }
}
