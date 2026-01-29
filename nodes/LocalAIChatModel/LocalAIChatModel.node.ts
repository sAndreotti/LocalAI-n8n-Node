import {
    IExecuteFunctions,
    INodeType,
    INodeTypeDescription,
    ISupplyDataFunctions,
    SupplyData,
} from 'n8n-workflow';

import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { CallbackManagerForLLMRun } from '@langchain/core/callbacks/manager';
import {
    BaseMessage,
    AIMessage,
    HumanMessage,
    SystemMessage,
    AIMessageChunk,
} from '@langchain/core/messages';
import { ChatResult, ChatGeneration } from '@langchain/core/outputs';
import { ChatGenerationChunk } from '@langchain/core/outputs';

interface LocalAIChatModelFields {
    baseUrl: string;
    apiKey?: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
}

class LocalAIChatModelLc extends BaseChatModel {
    baseUrl: string;
    apiKey: string;
    modelName: string;
    temperature: number;
    maxTokens: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;

    constructor(fields: LocalAIChatModelFields) {
        super({});
        this.baseUrl = fields.baseUrl.replace(/\/$/, '');
        this.apiKey = fields.apiKey || '';
        this.modelName = fields.model;
        this.temperature = fields.temperature ?? 0.7;
        this.maxTokens = fields.maxTokens ?? 2048;
        this.topP = fields.topP ?? 1;
        this.frequencyPenalty = fields.frequencyPenalty ?? 0;
        this.presencePenalty = fields.presencePenalty ?? 0;
    }

    _llmType(): string {
        return 'localai';
    }

    _combineLLMOutput() {
        return {};
    }

    async _generate(
        messages: BaseMessage[],
        options: this['ParsedCallOptions'],
        runManager?: CallbackManagerForLLMRun,
    ): Promise<ChatResult> {
        const formattedMessages = messages.map((msg) => {
            let role: string;
            if (msg instanceof HumanMessage) {
                role = 'user';
            } else if (msg instanceof AIMessage) {
                role = 'assistant';
            } else if (msg instanceof SystemMessage) {
                role = 'system';
            } else {
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

            const data = await response.json() as any;

            if (!data.choices || data.choices.length === 0) {
                throw new Error('No response from LocalAI');
            }

            const text = data.choices[0].message.content;
            const generation: ChatGeneration = {
                text,
                message: new AIMessage(text),
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
        } catch (error) {
            throw new Error(`Failed to call LocalAI: ${(error as Error).message}`);
        }
    }
}

export class LocalAIChatModel implements INodeType {
    description: INodeTypeDescription = {
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

    async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
        const credentials = await this.getCredentials('localAIApi');
        const model = this.getNodeParameter('model', itemIndex) as string;
        const options = this.getNodeParameter('options', itemIndex, {}) as {
            temperature?: number;
            maxTokens?: number;
            topP?: number;
            frequencyPenalty?: number;
            presencePenalty?: number;
        };

        const chatModel = new LocalAIChatModelLc({
            baseUrl: credentials.baseUrl as string,
            apiKey: credentials.apiKey as string,
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
