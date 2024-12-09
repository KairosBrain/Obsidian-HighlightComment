import { CommentItem } from './CommentStore';

export interface HighlightInfo {
    text: string;
    position: number;
    paragraphOffset?: number;
    paragraphText?: string;
    comments?: CommentItem[];
    id?: string;
    createdAt?: number;
    updatedAt?: number;
    backgroundColor?: string;  // 新增：存储rgba颜色值
}

export type AIProvider = 'openai' | 'anthropic' | 'ollama';
export type OpenAIModel = 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4';
export type AnthropicModel = string;

export interface AISettings {
    provider: AIProvider;
    openai?: {
        apiKey: string;
        model: OpenAIModel;
        baseUrl?: string;
    };
    anthropic?: {
        apiKey: string;
        model: AnthropicModel;
        availableModels?: string[];
        baseUrl?: string;
    };
    ollama?: {
        host: string;
        model: string;
        availableModels?: string[];
    };
    prompts: {
        [key: string]: string;
    };
}

export interface PluginSettings {
    ai: AISettings;
    // ... 其他插件设置
}

export const DEFAULT_SETTINGS: PluginSettings = {
    ai: {
        provider: 'ollama',
        openai: {
            apiKey: '',
            model: 'gpt-4o',
        },
        ollama: {
            host: 'http://localhost:11434',
            model: 'qwen2.5:14b',
        },
        prompts: {
            '总结评论': '请分析以下内容：\n\n{{highlight}}\n\n已有的评论：\n{{comment}}\n\n请给出你的见解：',
        }
    }
};

// 添加自定义事件类型
export interface CommentUpdateEvent {
    fileId: string;
    highlightId: string;
    text: string;
    comments: CommentItem[];
}

declare global {
    interface WindowEventMap {
        'comment-updated': CustomEvent<CommentUpdateEvent>;
    }
} 