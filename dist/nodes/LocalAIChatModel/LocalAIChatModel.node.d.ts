import { INodeType, INodeTypeDescription, ISupplyDataFunctions, SupplyData } from 'n8n-workflow';
/**
 * n8n Node Definition
 * This is what appears in the n8n UI and can be connected to AI Agent
 */
export declare class LocalAIChatModel implements INodeType {
    description: INodeTypeDescription;
    /**
     * CRITICAL: This method is what makes the node work with AI Agent
     * It returns a LangChain-compatible chat model instance
     * This is called when AI Agent needs to use the model
     */
    supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData>;
}
