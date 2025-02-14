"use client"
import React, { useCallback } from 'react';
import {
  ReactFlow,
  addEdge,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
 
import '@xyflow/react/dist/style.css';
 
 
import FloatingEdge from '~/components/FloatingEdge';
import FloatingConnectionLine from '~/components/FloatingConnectionLine';
import { initialElements } from '~/lib/initialElements';
 
const { nodes: initialNodes, edges: initialEdges } = initialElements();
 
const edgeTypes = {
  floating: FloatingEdge,
};
 
const NodeAsHandleFlow = () => {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'floating',
            markerEnd: { type: MarkerType.Arrow },
          },
          eds,
        ),
      ),
    [setEdges],
  );
 
  return (
    <div className="floating-edges">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        edgeTypes={edgeTypes}
        connectionLineComponent={FloatingConnectionLine}
        style={{ backgroundColor: "#F7F9FB" }}
      >
        <Background />
      </ReactFlow>
    </div>
  );
};
 
export default NodeAsHandleFlow;