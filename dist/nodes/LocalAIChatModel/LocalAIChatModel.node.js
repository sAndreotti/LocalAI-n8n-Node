"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalAIChatModel = void 0;
const chat_models_1 = require("@langchain/core/language_models/chat_models");
const messages_1 = require("@langchain/core/messages");
class LocalAIChatModelLc extends chat_models_1.BaseChatModel {
    constructor(fields) {
        var _a, _b, _c, _d, _e;
        super({});
        this.baseUrl = fields.baseUrl.replace(/\/$/, '');
        this.apiKey = fields.apiKey || '';
        this.modelName = fields.model;
        this.temperature = (_a = fields.temperature) !== null && _a !== void 0 ? _a : 0.7;
        this.maxTokens = (_b = fields.maxTokens) !== null && _b !== void 0 ? _b : 2048;
        this.topP = (_c = fields.topP) !== null && _c !== void 0 ? _c : 1;
        this.frequencyPenalty = (_d = fields.frequencyPenalty) !== null && _d !== void 0 ? _d : 0;
        this.presencePenalty = (_e = fields.presencePenalty) !== null && _e !== void 0 ? _e : 0;
    }
    _llmType() {
        return 'localai';
    }
    _combineLLMOutput() {
        return {};
    }
    async _generate(messages, options, runManager) {
        const formattedMessages = messages.map((msg) => {
            let role;
            if (msg instanceof messages_1.HumanMessage) {
                role = 'user';
            }
            else if (msg instanceof messages_1.AIMessage) {
                role = 'assistant';
            }
            else if (msg instanceof messages_1.SystemMessage) {
                role = 'system';
            }
            else {
                role = 'user';
            }
            return {
                role,
                content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
            };
        });
        const requestBody = {
            model: this.modelName,
            messages: formattedMessages,
            temperature: this.temperature,
            max_tokens: this.maxTokens,
            top_p: this.topP,
            frequency_penalty: this.frequencyPenalty,
            presence_penalty: this.presencePenalty,
            stream: false,
        };
        try {
            const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
                },
                body: JSON.stringify(requestBody),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`LocalAI API error (${response.status}): ${errorText}`);
            }
            const data = await response.json();
            if (!data.choices || data.choices.length === 0) {
                throw new Error('No response from LocalAI');
            }
            const text = data.choices[0].message.content;
            const generation = {
                text,
                message: new messages_1.AIMessage(text),
                generationInfo: {
                    finishReason: data.choices[0].finish_reason,
                },
            };
            return {
                generations: [generation],
                llmOutput: {
                    tokenUsage: data.usage,
                    model: data.model,
                },
            };
        }
        catch (error) {
            throw new Error(`Failed to call LocalAI: ${error.message}`);
        }
    }
}
class LocalAIChatModel {
    constructor() {
        this.description = {
            displayName: 'LocalAI Chat Model',
            name: 'localAIChatModel',
            icon: 'file:localai.svg',
            group: ['transform'],
            version: 1,
            description: 'Language Model for AI Agent nodes using LocalAI',
            defaults: {
                name: 'LocalAI Chat Model',
            },
            inputs: [],
            outputs: [],
            codex: {
                categories: ['AI'],
                subcategories: {
                    AI: ['Language Models', 'Chat Models'],
                },
                resources: {
                    primaryDocumentation: [
                        {
                            url: 'https://localai.io/basics/getting_started/',
                        },
                    ],
                },
            },
            credentials: [
                {
                    name: 'localAIApi',
                    required: true,
                },
            ],
            properties: [
                {
                    displayName: 'Model',
                    name: 'model',
                    type: 'string',
                    default: 'llama-3-8b',
                    required: true,
                    description: 'Name of the LocalAI model to use (e.g., llama-3-8b, mistral-7b, phi-3)',
                    placeholder: 'llama-3-8b',
                },
                {
                    displayName: 'Options',
                    name: 'options',
                    type: 'collection',
                    placeholder: 'Add Option',
                    default: {},
                    options: [
                        {
                            displayName: 'Temperature',
                            name: 'temperature',
                            type: 'number',
                            typeOptions: {
                                minValue: 0,
                                maxValue: 2,
                                numberStepSize: 0.1,
                            },
                            default: 0.7,
                            description: 'Controls randomness. Lower values make output more focused and deterministic. Higher values make it more random.',
                        },
                        {
                            displayName: 'Max Tokens',
                            name: 'maxTokens',
                            type: 'number',
                            default: 2048,
                            description: 'Maximum number of tokens to generate in the response',
                        },
                        {
                            displayName: 'Top P',
                            name: 'topP',
                            type: 'number',
                            typeOptions: {
                                minValue: 0,
                                maxValue: 1,
                                numberStepSize: 0.1,
                            },
                            default: 1,
                            description: 'Nucleus sampling parameter. Alternative to temperature for controlling randomness.',
                        },
                        {
                            displayName: 'Frequency Penalty',
                            name: 'frequencyPenalty',
                            type: 'number',
                            typeOptions: {
                                minValue: -2,
                                maxValue: 2,
                                numberStepSize: 0.1,
                            },
                            default: 0,
                            description: 'Penalizes tokens based on their frequency in the text so far. Reduces repetition.',
                        },
                        {
                            displayName: 'Presence Penalty',
                            name: 'presencePenalty',
                            type: 'number',
                            typeOptions: {
                                minValue: -2,
                                maxValue: 2,
                                numberStepSize: 0.1,
                            },
                            default: 0,
                            description: 'Penalizes tokens based on whether they appear in the text so far. Encourages new topics.',
                        },
                    ],
                },
            ],
        };
    }
    async supplyData(itemIndex) {
        const credentials = await this.getCredentials('localAIApi');
        const model = this.getNodeParameter('model', itemIndex);
        const options = this.getNodeParameter('options', itemIndex, {});
        const chatModel = new LocalAIChatModelLc({
            baseUrl: credentials.baseUrl,
            apiKey: credentials.apiKey,
            model,
            temperature: options.temperature,
            maxTokens: options.maxTokens,
            topP: options.topP,
            frequencyPenalty: options.frequencyPenalty,
            presencePenalty: options.presencePenalty,
        });
        return {
            response: chatModel,
        };
    }
}
exports.LocalAIChatModel = LocalAIChatModel;
