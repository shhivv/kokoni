import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  addEdge,
  ConnectionLineType,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Connection,
} from '@xyflow/react';
import dagre from '@dagrejs/dagre';
 
import '@xyflow/react/dist/style.css';
import { generateFlowElements } from '~/lib/initialElements';
import { api } from '~/trpc/react';
import { useParams } from 'next/navigation';
import { KokoniNode } from './KokoniNode';
 
const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
 
const nodeWidth = 172;
const nodeHeight = 36;
 
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  dagreGraph.setGraph({ rankdir: direction });
 
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 400, height: 400 });
  });
 
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });
 
  dagre.layout(dagreGraph);
 
  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = {
      ...node,
      targetPosition:  'top',
      sourcePosition: 'bottom',
      // We are shifting the dagre node position (anchor=center center) to the top left
      // so it matches the React Flow node anchor point (top left).
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
 
    return newNode;
  });
 
  return { nodes: newNodes, edges };
};
const nodeTypes = {
  "kokoniNode": KokoniNode
}
export const Flow = () => {
  const params = useParams<{ slug: string }>();
  const { data: search } = api.search.getById.useQuery({
    id: params.slug,
  });

  
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  
  // Generate flow elements when search data is available
  useEffect(() => {
    if (search?.rootNode) {
      const { nodes: flowNodes, edges: flowEdges } = generateFlowElements(search.rootNode);
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(flowNodes, flowEdges);
      setNodes(layoutedNodes);
      console.log(search);
      setEdges(layoutedEdges);
    }
  }, [search, setNodes, setEdges]);
 
  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge({ ...params, type: ConnectionLineType.SmoothStep, animated: true }, eds),
      ),
    [setEdges],
  );
 
  return (
    <div className="floating-edges relative h-full w-full bg-card">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onConnect={onConnect}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        className="bg-background"
      >
        <MiniMap/>
      </ReactFlow>
    </div>
  );
};
