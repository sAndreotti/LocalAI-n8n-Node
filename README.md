# n8n-nodes-localai

This is an n8n community node that integrates [LocalAI](https://localai.io) into n8n. It provides a **Chat Model** node compatible with n8n's **AI Agent** nodes.

## Features

- **LocalAI Chat Model**: A node fully compatible with n8n's **AI Agent** ecosystem.
- Connect your local LLMs (Llama, Mistral, Phi, etc.) directly to n8n AI Agents.
- Supports configuration of Model Name, Temperature, and Max Tokens.

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

1. Add an **AI Agent** node to your canvas.
2. Add the **LocalAI Chat Model** node to your canvas.
3. Connect the output of the **LocalAI Chat Model** node to the **Model** input of the **AI Agent** node.
4. In the LocalAI node, specify the **Model Name** (e.g., `llama-3-8b`, `gpt-4`, etc.) that matches your LocalAI configuration.

## License

MIT