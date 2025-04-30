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
  Position,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import dagre from '@dagrejs/dagre';
 
import '@xyflow/react/dist/style.css';
import { generateFlowElements } from '~/lib/initialElements';
import { api } from '~/trpc/react';
import { useParams } from 'next/navigation';
import { KokoniNode } from './KokoniNode';
import { getNodeWithChildren } from '~/lib/generateHierarchy';
import { Skeleton } from '~/components/ui/skeleton';
 
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
      targetPosition: Position.Right,
      sourcePosition: Position.Left,
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

// Skeleton loader component for the flow
const FlowSkeleton = () => {
  return (
    <div className="floating-edges relative h-full w-full bg-card flex items-center justify-center">
      <div className="flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </div>
        
        <div className="grid grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="h-[172px] w-[320px] rounded-lg" />
              <Skeleton className="h-4 w-[100px]" />
            </div>
          ))}
        </div>
        
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export const Flow = () => {
  const params = useParams<{ slug: string }>();
  const { data: search, isLoading: isSearchLoading } = api.search.getById.useQuery({
    id: params.slug,
  });

  const { data: fetchedNodes, isLoading: isNodesLoading } = api.search.getAllNodes.useQuery({ searchId: params.slug });

  const isLoading = isSearchLoading || isNodesLoading;
  
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);


  // Generate flow elements when search data is available
  useEffect(() => {
    if (search?.rootNode && fetchedNodes) {
      // We've already checked that rootNode exists
      const rootNode = search.rootNode as NonNullable<typeof search.rootNode>;
      // Use type assertion to tell TypeScript this is compatible
      const nodeWithChildren = getNodeWithChildren(rootNode.id, fetchedNodes);
      if (nodeWithChildren) {
        const { nodes: flowNodes, edges: flowEdges } = generateFlowElements(nodeWithChildren);
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(flowNodes, flowEdges);
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
      }
    }
  }, [search, fetchedNodes, setNodes, setEdges]);
 
  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge({ ...params, type: ConnectionLineType.SmoothStep, animated: true }, eds),
      ),
    [setEdges],
  );
 
  if (isLoading) {
    return <FlowSkeleton />;
  }
 
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
        fitView
        fitViewOptions={{
          maxZoom: 1.2,
          duration: 1200,
          nodes: [{
            id: `node-${search?.rootNode?.id}`
          }]
        }}
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

