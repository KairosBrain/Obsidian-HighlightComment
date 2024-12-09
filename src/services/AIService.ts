import { AIProvider, AISettings } from '../types';
import { OllamaService } from './OllamaService';
import { AnthropicService } from './AnthropicService';

export class AIService {
    private ollamaService: OllamaService;

    constructor(private settings: AISettings) {
        if (settings.ollama?.host) {
            this.ollamaService = new OllamaService(settings.ollama.host);
        }
    }

    async generateResponse(prompt: string, highlight: string, comment?: string): Promise<string> {
        let promptWithContext = prompt
            .replace('{{highlight}}', highlight);
        
        // If comment is provided, replace its placeholder
        if (comment) {
            promptWithContext = promptWithContext.replace('{{comment}}', comment);
        }
        
        switch (this.settings.provider) {
            case 'openai':
                return await this.callOpenAI(promptWithContext);
            case 'anthropic':
                return await this.callAnthropic(promptWithContext);
            case 'ollama':
                return await this.callOllama(promptWithContext);
            default:
                throw new Error('AI service not configured');
        }
    }

    private async callOpenAI(prompt: string): Promise<string> {
        if (!this.settings.openai?.apiKey) {
            throw new Error('OpenAI API Key not configured');
        }

        const response = await fetch(this.settings.openai.baseUrl || 'https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.settings.openai.apiKey}`
            },
            body: JSON.stringify({
                model: this.settings.openai.model,
                messages: [
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API request failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    private async callAnthropic(prompt: string): Promise<string> {
        const settings = this.settings.anthropic;
        if (!settings?.apiKey) {
            throw new Error('Anthropic API key not configured');
        }

        const anthropicService = new AnthropicService(settings.apiKey, settings.baseUrl);
        return await anthropicService.generateResponse(prompt);
    }

    private async callOllama(prompt: string): Promise<string> {
        if (!this.ollamaService) {
            throw new Error('Ollama service not configured. Please set the host in settings.');
        }

        if (!this.settings.ollama?.model) {
            throw new Error('Ollama model not configured. Please select a model in settings.');
        }

        return await this.ollamaService.generateCompletion(
            this.settings.ollama.model,
            prompt
        );
    }

    async listOllamaModels(): Promise<string[]> {
        if (!this.ollamaService) {
            throw new Error('Ollama service not configured. Please set the host in settings.');
        }
        return await this.ollamaService.listModels();
    }

    async testOllamaConnection(): Promise<boolean> {
        if (!this.ollamaService) {
            return false;
        }
        return await this.ollamaService.testConnection();
    }
}