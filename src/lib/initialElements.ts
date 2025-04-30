import { ConnectionLineType } from "@xyflow/react";
import { Node } from "~/types/NodeInterface";
const position = { x: 0, y: 0 };
const edgeType = ConnectionLineType.Bezier;
 
/**
 * Generates initialNodes and initialEdges for ReactFlow based on a root node and its children
 * @param rootNode The root node from the Prisma schema
 * @returns An object containing nodes and edges for ReactFlow
 */
export const generateFlowElements = (rootNode: Node) => {
  if (!rootNode) return { nodes: [], edges: [] };

  const nodes: any[] = [];
  const edges: any[] = [];
  
  // Create the root node
  const rootFlowNode = {
    id: `node-${rootNode.id}`,
    type: 'kokoniNode',
    data: rootNode,
    position,
  };
  
  nodes.push(rootFlowNode);
  
  // Recursively create nodes and edges for children
  const processNode = (node: Node, parentId: string) => {
    if (!node.children || node.children.length === 0) return;
    
    node.children.forEach((child, index) => {
      const childId = `node-${child.id}`;
      
      // Create child node
      const childNode = {
        id: childId,
        type: 'kokoniNode',
        data: child,
        position,
      };
      
      nodes.push(childNode);
      
      // Create edge from parent to child
      edges.push({
        id: `edge-${parentId}-${childId}`,
        source: parentId,
        target: childId,
        type: edgeType,
        animated: !child.selected,
      });
      
      // Process child's children
      processNode(child, childId);
    });
  };
  
  // Start processing from the root node
  processNode(rootNode, `node-${rootNode.id}`);
  
  return { nodes, edges };
};