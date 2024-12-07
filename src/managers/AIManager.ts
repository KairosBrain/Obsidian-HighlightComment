import { setIcon } from "obsidian";
import { AISettings } from "../types";
import { HighlightInfo } from "../types";

export class AIManager {
    constructor(private settings: AISettings) {}

    initAIButton(container: HTMLElement, highlight: HighlightInfo): HTMLElement {
        // AI 按钮和下拉菜单容器
        const aiContainer = container.createEl("div", {
            cls: "highlight-ai-container"
        });

        // AI 按钮
        const aiButton = aiContainer.createEl("button", {
            cls: "highlight-action-btn highlight-ai-btn",
            attr: { 'aria-label': '使用 AI 分析' }
        });

        // 创建一个包含正常图标和加载图标的容器
        const aiButtonContent = aiButton.createEl("div", {
            cls: "highlight-ai-btn-content"
        });

        // 正常状态的图标
        const normalIcon = aiButtonContent.createEl("div", {
            cls: "highlight-ai-icon"
        });
        setIcon(normalIcon, "bot-message-square");

        // 加载状态的图标
        const loadingIcon = aiButtonContent.createEl("div", {
            cls: "highlight-ai-icon-loading hidden"
        });
        loadingIcon.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="2" x2="12" y2="6"/>
                <line x1="12" y1="18" x2="12" y2="22"/>
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
                <line x1="2" y1="12" x2="6" y2="12"/>
                <line x1="18" y1="12" x2="22" y2="12"/>
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
            </svg>
        `;

        // 创建下拉菜单
        const aiDropdown = aiContainer.createEl("div", {
            cls: "highlight-ai-dropdown hidden"
        });

        // 防止下拉菜单的点击事件冒泡
        aiDropdown.addEventListener("click", (e) => {
            e.stopPropagation();
        });

        // 初始化下拉菜单内容
        this.updateDropdownContent(aiDropdown, highlight);

        // 添加按钮点击事件
        aiButton.addEventListener("click", (e) => {
            e.stopPropagation();
            if (aiDropdown.hasClass("hidden")) {
                // 关闭其他所有下拉菜单
                container.querySelectorAll('.highlight-ai-dropdown').forEach((dropdown) => {
                    if (dropdown !== aiDropdown) {
                        dropdown.addClass("hidden");
                    }
                });
                aiDropdown.removeClass("hidden");
            } else {
                aiDropdown.addClass("hidden");
            }
        });

        return aiContainer;
    }

    private updateDropdownContent(dropdown: HTMLElement, highlight: HighlightInfo) {
        // 清空现有内容
        dropdown.empty();

        // 获取所有可用的 prompts
        const prompts = Object.entries(this.settings.prompts || {});
        if (prompts.length > 0) {
            prompts.forEach(([promptName, promptContent]) => {
                const promptItem = dropdown.createEl("div", {
                    cls: "highlight-ai-dropdown-item",
                    text: promptName
                });
                promptItem.addEventListener("click", async () => {
                    dropdown.addClass("hidden");
                    await this.handleAIAnalysis(highlight, promptName);
                });
            });
        } else {
            // 如果没有可用的 prompts，显示提示信息
            dropdown.createEl("div", {
                cls: "highlight-ai-dropdown-item",
                text: "请先在设置中添加 Prompt"
            });
        }
    }

    private async handleAIAnalysis(highlight: HighlightInfo, promptName: string) {
        // 这个方法将在后续实现
        console.log('AI analysis requested for:', highlight.text, 'with prompt:', promptName);
    }
}
