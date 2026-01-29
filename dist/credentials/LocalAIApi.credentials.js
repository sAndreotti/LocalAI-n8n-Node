"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalAIApi = void 0;
class LocalAIApi {
    constructor() {
        this.name = 'localAIApi';
        this.displayName = 'LocalAI API';
        this.documentationUrl = 'https://localai.io/basics/getting_started/';
        this.properties = [
            {
                displayName: 'Base URL',
                name: 'baseUrl',
                type: 'string',
                default: 'http://localhost:8080',
                placeholder: 'http://localhost:8080',
                description: 'The base URL of your LocalAI instance (e.g., http://localhost:8080 or http://localai:8080 in Docker)',
                required: true,
            },
            {
                displayName: 'API Key',
                name: 'apiKey',
                type: 'string',
                typeOptions: {
                    password: true,
                },
                default: '',
                description: 'Optional API key if authentication is enabled in LocalAI',
            },
        ];
        this.authenticate = {
            type: 'generic',
            properties: {
                headers: {
                    Authorization: '={{"Bearer " + $credentials.apiKey}}',
                },
            },
        };
    }
}
exports.LocalAIApi = LocalAIApi;
