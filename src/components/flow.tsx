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
} from '@xyflow/react';
import dagre from '@dagrejs/dagre';
 
import '@xyflow/react/dist/style.css';
import { generateFlowElements } from '~/lib/initialElements';
import { api } from '~/trpc/react';
import { useParams } from 'next/navigation';
import { KokoniNode } from './KokoniNode';
import { getNodeWithChildren } from '~/lib/generateHierarchy';
import { Skeleton } from '~/components/ui/skeleton';

const nodeWidth = 320;
const nodeHeight = 172;

// This is our layouting function using dagre
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  // Create a new directed graph
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });

  // Add nodes to the graph with their dimensions
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  // Add edges to the graph
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Apply the layout
  dagre.layout(dagreGraph);

  // Get the positioned nodes from dagre
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
      // We are shifting the dagre node position (anchor=center center) to the top left
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
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
  const selectNode = api.search.selectNode.useMutation();

  const isLoading = isSearchLoading || isNodesLoading;
  
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Handle node selection
  const onNodeClick = useCallback(async (event: React.MouseEvent, node: Node) => {
    try {
      // Immediately add two skeleton nodes
      const nodeId = Number(node.id.split("-")[1]);
      const skeletonNodes = [
        {
          id: `skeleton-1-${nodeId}`,
          type: 'kokoniNode',
          data: { 
            isLoading: true,
            question: '',
            summary: null,
            selected: false,
            includeStats: false,
            includeImage: false,
          },
          position: { x: 0, y: 0 }, // Position will be set by layout
        },
        {
          id: `skeleton-2-${nodeId}`,
          type: 'kokoniNode',
          data: { 
            isLoading: true,
            question: '',
            summary: null,
            selected: false,
            includeStats: false,
            includeImage: false,
          },
          position: { x: 0, y: 0 }, // Position will be set by layout
        },
      ];

      const skeletonEdges = [
        {
          id: `edge-${node.id}-skeleton-1-${nodeId}`,
          source: node.id,
          target: `skeleton-1-${nodeId}`,
          type: ConnectionLineType.Bezier,
          animated: true,
        },
        {
          id: `edge-${node.id}-skeleton-2-${nodeId}`,
          source: node.id,
          target: `skeleton-2-${nodeId}`,
          type: ConnectionLineType.Bezier,
          animated: true,
        }
      ];
      
      // Update the clicked node to show summary loading state
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        [...nodes, ...skeletonNodes],
        [...edges, ...skeletonEdges]
      );

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);

      setNodes((currentNodes) =>
        currentNodes.map((n) =>
          n.id === `node-${nodeId}`
            ? {
                ...n,
                data: {
                  ...n.data,
                  summaryLoading: true
                }
              }
            : n
        )
      );
      // Call the API to get real nodes
      // what is subNodes?
      const { subNodes, summary } = await selectNode.mutateAsync({ nodeId });
    
      // Update the nodes with the real data
      setNodes((currentNodes) => {
        return currentNodes.map((node) => {
          // Update the parent node with the summary
          if (node.id === `node-${nodeId}`) {
            return {
              ...node,
              data: {
                ...node.data,
                summary,
                isLoading: false,
                summaryLoading: false,
                selected: true
              }
            };
          }
          // Update the skeleton nodes with the subNodes data
          if (node.id === `skeleton-1-${nodeId}`) {
            return {
              ...node,
              id: `node-${subNodes[0]?.id}`,
              data: {
                ...subNodes[0],
                isLoading: false
              }
            };
          }
          if (node.id === `skeleton-2-${nodeId}`) {
            return {
              ...node,
              id: `node-${subNodes[1]?.id}`,
              data: {
                ...subNodes[1],
                isLoading: false
              }
            };
          }
          return node;
        });
      });
      
      // Update the edges to match the new node IDs
      setEdges((currentEdges) => {
        return currentEdges.map((edge) => {
          // Update edges connected to skeleton nodes
          if (edge.target === `skeleton-1-${nodeId}`) {
            return {
              ...edge,
              id: `edge-${edge.source}-node-${subNodes[0]?.id}`,
              target: `node-${subNodes[0]?.id}`
            };
          }
          if (edge.target === `skeleton-2-${nodeId}`) {
            return {
              ...edge,
              id: `edge-${edge.source}-node-${subNodes[1]?.id}`,
              target: `node-${subNodes[1]?.id}`
            };
          }
          return edge;
        });
      });
      
    } catch (error) {
      console.error('Failed to select node:', error);
    }
  }, [nodes, edges, setNodes, setEdges, selectNode]);
  
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
        onNodeClick={onNodeClick}
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

