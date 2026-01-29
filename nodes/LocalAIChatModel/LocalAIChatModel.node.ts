import {
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
} from '@langchain/core/messages';
import { ChatResult } from '@langchain/core/outputs';

/**
 * Internal LangChain-compatible Chat Model implementation
 * This class extends BaseChatModel from LangChain and implements
 * the actual communication with LocalAI
 */
class LocalAIChatModelLLM extends BaseChatModel {
    baseUrl: string;
    apiKey: string;
    modelName: string;
    temperature: number;
    maxTokens: number;

    constructor(fields: {
        baseUrl: string;
        apiKey?: string;
        model: string;
        temperature?: number;
        maxTokens?: number;
    }) {
        super({});
        this.baseUrl = fields.baseUrl.replace(/\/$/, '');
        this.apiKey = fields.apiKey || '';
        this.modelName = fields.model;
        this.temperature = fields.temperature ?? 0.7;
        this.maxTokens = fields.maxTokens ?? 2048;
    }

    /**
     * Identifies this LLM type for LangChain
     */
    _llmType(): string {
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
    async _generate(
        messages: BaseMessage[],
        options: this['ParsedCallOptions'],
        runManager?: CallbackManagerForLLMRun,
    ): Promise<ChatResult> {
        // Convert LangChain messages to LocalAI format
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

            const data = await response.json() as any;

            if (!data.choices || data.choices.length === 0) {
                throw new Error('No response from LocalAI');
            }

            const text = data.choices[0].message.content;

            // Return in LangChain format
            return {
                generations: [{
                    text,
                    message: new AIMessage(text),
                }],
            };
        } catch (error: any) {
            throw new Error(`Failed to call LocalAI: ${error.message}`);
        }
    }
}

/**
 * n8n Node Definition
 * This is what appears in the n8n UI and can be connected to AI Agent
 */
export class LocalAIChatModel implements INodeType {
    description: INodeTypeDescription = {
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

    /**
     * CRITICAL: This method is what makes the node work with AI Agent
     * It returns a LangChain-compatible chat model instance
     * This is called when AI Agent needs to use the model
     */
    async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
        // Get credentials configured in n8n
        const credentials = await this.getCredentials('localAIApi');

        // Get node parameters
        const model = this.getNodeParameter('model', itemIndex) as string;
        const options = this.getNodeParameter('options', itemIndex, {}) as {
            temperature?: number;
            maxTokens?: number;
        };

        // Create and return the LangChain chat model instance
        const chatModel = new LocalAIChatModelLLM({
            baseUrl: credentials.baseUrl as string,
            apiKey: credentials.apiKey as string,
            model,
            temperature: options.temperature,
            maxTokens: options.maxTokens,
        });

        return {
            response: chatModel,
        };
    }
}
