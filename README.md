# n8n-nodes-localai

This is an n8n community node that integrates [LocalAI](https://localai.io) into n8n. It allows you to use your local LLMs with n8n's AI Agents or as standalone nodes for various AI tasks.

## Features

- **LocalAI Chat Model**: A chat model node fully compatible with n8n's **AI Agent** nodes.
- **LocalAI Node**: A standalone node for performing:
  - Chat Completions
  - Image Generation
  - Embeddings

## Installation

1. Go to your **n8n** instance.
2. Navigate to **Settings** > **Community Nodes**.
3. Select **Install**.
4. Enter the package name:
   ```
   n8n-nodes-localai
   ```

## Setup

You will need to create a **LocalAI API** credential in n8n to connect to your instance.

- **Base URL**: The URL where your LocalAI is running (e.g., `http://localhost:8080` or `http://host.docker.internal:8080`).
- **API Key**: Optional. Only required if you have secured your LocalAI instance.

## Usage

### Using with AI Agents
1. Add an **AI Agent** node to your canvas.
2. Connect the **LocalAI Chat Model** node to the **Model** input of the agent.
3. In the LocalAI node, specify the **Model Name** (e.g., `llama-3-8b`, `gpt-4`, etc.) that matches your LocalAI configuration.

### Standalone Operations
Use the **LocalAI** node to directly generate text, images, or embeddings without an agent.

## License

MIT