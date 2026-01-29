import {
    IAuthenticateGeneric,
    ICredentialType,
    INodeProperties,
} from 'n8n-workflow';

export class LocalAIApi implements ICredentialType {
    name = 'localAIApi';
    displayName = 'LocalAI API';
    documentationUrl = 'https://localai.io/basics/getting_started/';
    properties: INodeProperties[] = [
        {
            displayName: 'Base URL',
            name: 'baseUrl',
            type: 'string',
            default: 'http://localhost:8080',
            placeholder: 'http://localhost:8080',
            description: 'The base URL of your LocalAI instance',
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
            description: 'Optional API key if authentication is enabled',
        },
    ];

    authenticate: IAuthenticateGeneric = {
        type: 'generic',
        properties: {
            headers: {
                Authorization: '={{"Bearer " + $credentials.apiKey}}',
            },
        },
    };
}
