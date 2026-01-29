import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    NodeOperationError,
} from 'n8n-workflow';

export class LocalAI implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'LocalAI',
        name: 'localAI',
        icon: 'file:localai.svg',
        group: ['transform'],
        version: 1,
        subtitle: '={{$parameter["operation"]}}',
        description: 'Execute various AI operations using LocalAI',
        defaults: {
            name: 'LocalAI',
        },
        inputs: ['main'],
        outputs: ['main'],
        credentials: [
            {
                name: 'localAIApi',
                required: true,
            },
        ],
        properties: [
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                options: [
                    {
                        name: 'Chat Completion',
                        value: 'chatCompletion',
                        description: 'Generate chat completions',
                        action: 'Generate chat completion',
                    },
                    {
                        name: 'Image Generation',
                        value: 'imageGeneration',
                        description: 'Generate images from text',
                        action: 'Generate image',
                    },
                    {
                        name: 'Embeddings',
                        value: 'embeddings',
                        description: 'Create text embeddings',
                        action: 'Create embeddings',
                    },
                ],
                default: 'chatCompletion',
            },

            // Chat Completion
            {
                displayName: 'Model',
                name: 'model',
                type: 'string',
                default: 'llama-3-8b',
                required: true,
                displayOptions: {
                    show: {
                        operation: ['chatCompletion'],
                    },
                },
                description: 'The model to use',
            },
            {
                displayName: 'Prompt',
                name: 'prompt',
                type: 'string',
                typeOptions: {
                    rows: 4,
                },
                default: '',
                required: true,
                displayOptions: {
                    show: {
                        operation: ['chatCompletion'],
                    },
                },
                description: 'The prompt to send',
            },

            // Image Generation
            {
                displayName: 'Model',
                name: 'imageModel',
                type: 'string',
                default: 'stablediffusion',
                required: true,
                displayOptions: {
                    show: {
                        operation: ['imageGeneration'],
                    },
                },
                description: 'The image model to use',
            },
            {
                displayName: 'Prompt',
                name: 'imagePrompt',
                type: 'string',
                typeOptions: {
                    rows: 3,
                },
                default: '',
                required: true,
                displayOptions: {
                    show: {
                        operation: ['imageGeneration'],
                    },
                },
                description: 'Description of the image',
            },

            // Embeddings
            {
                displayName: 'Model',
                name: 'embeddingModel',
                type: 'string',
                default: 'text-embedding-ada-002',
                required: true,
                displayOptions: {
                    show: {
                        operation: ['embeddings'],
                    },
                },
                description: 'The embedding model to use',
            },
            {
                displayName: 'Text',
                name: 'embeddingInput',
                type: 'string',
                typeOptions: {
                    rows: 3,
                },
                default: '',
                required: true,
                displayOptions: {
                    show: {
                        operation: ['embeddings'],
                    },
                },
                description: 'Text to create embeddings from',
            },
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];
        const operation = this.getNodeParameter('operation', 0) as string;

        const credentials = await this.getCredentials('localAIApi');
        const baseUrl = (credentials.baseUrl as string).replace(/\/$/, '');
        const apiKey = credentials.apiKey as string;

        for (let i = 0; i < items.length; i++) {
            try {
                let responseData: any;

                if (operation === 'chatCompletion') {
                    const model = this.getNodeParameter('model', i) as string;
                    const prompt = this.getNodeParameter('prompt', i) as string;

                    responseData = await this.helpers.request({
                        method: 'POST',
                        url: `${baseUrl}/v1/chat/completions`,
                        headers: {
                            'Content-Type': 'application/json',
                            ...(apiKey && { 'Authorization': `Bearer ${apiKey}` }),
                        },
                        body: {
                            model,
                            messages: [{ role: 'user', content: prompt }],
                        },
                        json: true,
                    });

                    returnData.push({
                        json: {
                            response: responseData.choices[0].message.content,
                            model: responseData.model,
                            usage: responseData.usage,
                        },
                    });
                } else if (operation === 'imageGeneration') {
                    const model = this.getNodeParameter('imageModel', i) as string;
                    const prompt = this.getNodeParameter('imagePrompt', i) as string;

                    responseData = await this.helpers.request({
                        method: 'POST',
                        url: `${baseUrl}/v1/images/generations`,
                        headers: {
                            'Content-Type': 'application/json',
                            ...(apiKey && { 'Authorization': `Bearer ${apiKey}` }),
                        },
                        body: {
                            model,
                            prompt,
                        },
                        json: true,
                    });

                    returnData.push({
                        json: {
                            images: responseData.data,
                        },
                    });
                } else if (operation === 'embeddings') {
                    const model = this.getNodeParameter('embeddingModel', i) as string;
                    const input = this.getNodeParameter('embeddingInput', i) as string;

                    responseData = await this.helpers.request({
                        method: 'POST',
                        url: `${baseUrl}/v1/embeddings`,
                        headers: {
                            'Content-Type': 'application/json',
                            ...(apiKey && { 'Authorization': `Bearer ${apiKey}` }),
                        },
                        body: {
                            model,
                            input,
                        },
                        json: true,
                    });

                    returnData.push({
                        json: {
                            embeddings: responseData.data[0].embedding,
                            usage: responseData.usage,
                        },
                    });
                }
            } catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: {
                            error: (error as Error).message,
                        },
                        pairedItem: {
                            item: i,
                        },
                    });
                    continue;
                }
                throw new NodeOperationError(this.getNode(), (error as Error).message, {
                    itemIndex: i,
                });
            }
        }

        return [returnData];
    }
}
