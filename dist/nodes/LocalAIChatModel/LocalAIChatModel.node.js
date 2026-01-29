"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalAIChatModel = void 0;
const chat_models_1 = require("@langchain/core/language_models/chat_models");
const messages_1 = require("@langchain/core/messages");
/**
 * Internal LangChain-compatible Chat Model implementation
 * This class extends BaseChatModel from LangChain and implements
 * the actual communication with LocalAI
 */
class LocalAIChatModelLLM extends chat_models_1.BaseChatModel {
    constructor(fields) {
        var _a, _b;
        super({});
        this.baseUrl = fields.baseUrl.replace(/\/$/, '');
        this.apiKey = fields.apiKey || '';
        this.modelName = fields.model;
        this.temperature = (_a = fields.temperature) !== null && _a !== void 0 ? _a : 0.7;
        this.maxTokens = (_b = fields.maxTokens) !== null && _b !== void 0 ? _b : 2048;
    }
    /**
     * Identifies this LLM type for LangChain
     */
    _llmType() {
        return 'localai';
    }
    /**
     * Required by LangChain for output combination
     */
    _combineLLMOutput() {
        return {};
    }
    /**
     * Main method that communicates with LocalAI API
     * This is called by LangChain when the AI Agent needs a response
     */
    async _generate(messages, options, runManager) {
        // Convert LangChain messages to LocalAI format
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
        try {
            // Call LocalAI API (OpenAI-compatible endpoint)
            const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
                },
                body: JSON.stringify({
                    model: this.modelName,
                    messages: formattedMessages,
                    temperature: this.temperature,
                    max_tokens: this.maxTokens,
                }),
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
            // Return in LangChain format
            return {
                generations: [{
                        text,
                        message: new messages_1.AIMessage(text),
                    }],
            };
        }
        catch (error) {
            throw new Error(`Failed to call LocalAI: ${error.message}`);
        }
    }
}
/**
 * n8n Node Definition
 * This is what appears in the n8n UI and can be connected to AI Agent
 */
class LocalAIChatModel {
    constructor() {
        this.description = {
            displayName: 'LocalAI Chat Model',
            name: 'localAIChatModel',
            icon: 'file:localai.svg',
            group: ['transform'],
            version: 1,
            description: 'Chat Model for AI Agent using LocalAI',
            defaults: {
                name: 'LocalAI Chat Model',
            },
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
            // IMPORTANT: This makes it work with AI Agent
            inputs: [],
            outputs: [],
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
                            description: 'Controls randomness. Lower = more focused, Higher = more random.',
                        },
                        {
                            displayName: 'Max Tokens',
                            name: 'maxTokens',
                            type: 'number',
                            default: 2048,
                            description: 'Maximum number of tokens to generate',
                        },
                    ],
                },
            ],
        };
    }
    /**
     * CRITICAL: This method is what makes the node work with AI Agent
     * It returns a LangChain-compatible chat model instance
     * This is called when AI Agent needs to use the model
     */
    async supplyData(itemIndex) {
        // Get credentials configured in n8n
        const credentials = await this.getCredentials('localAIApi');
        // Get node parameters
        const model = this.getNodeParameter('model', itemIndex);
        const options = this.getNodeParameter('options', itemIndex, {});
        // Create and return the LangChain chat model instance
        const chatModel = new LocalAIChatModelLLM({
            baseUrl: credentials.baseUrl,
            apiKey: credentials.apiKey,
            model,
            temperature: options.temperature,
            maxTokens: options.maxTokens,
        });
        return {
            response: chatModel,
        };
    }
}
exports.LocalAIChatModel = LocalAIChatModel;
