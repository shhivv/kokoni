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
  Controls,
} from '@xyflow/react';
import dagre from '@dagrejs/dagre';
 
import '@xyflow/react/dist/style.css';
import { generateFlowElements } from '~/lib/initialElements';
import { api } from '~/trpc/react';
import { useParams } from 'next/navigation';
import { KokoniNode } from './KokoniNode';
import { getNodeWithChildren } from '~/lib/generateHierarchy';
 
const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
 
const nodeWidth = 320
const nodeHeight = 172 
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  dagreGraph.setGraph({ rankdir: direction });
 
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });
 
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });
 
  dagre.layout(dagreGraph);
 
  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = {
      ...node,
      targetPosition:  'right',
      sourcePosition: 'left',
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

  const fetchedNodes = api.search.getAllNodes.useQuery({ searchId: params.slug });

  
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  
  // Generate flow elements when search data is available
  useEffect(() => {
    if (search?.rootNode && fetchedNodes?.data) {
      const { nodes: flowNodes, edges: flowEdges } = generateFlowElements(getNodeWithChildren(search.rootNode.id, fetchedNodes.data));
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(flowNodes, flowEdges);
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    }
  }, [search, fetchedNodes.data, setNodes, setEdges]);
 
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
        className="bg-background dark"
        proOptions={{
          hideAttribution: true
        }}
      >
        <Controls/>
        <MiniMap/>
      </ReactFlow>
    </div>
  );
};
