"use client"
import React, { useCallback } from 'react';
import {
  ReactFlow,
  addEdge,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  type Connection,
  Panel,
  Controls,
} from '@xyflow/react';
 
import '@xyflow/react/dist/style.css';
 
import FloatingEdge from '~/components/floating-edge';
import FloatingConnectionLine from '~/components/floating-connection-line';
import { initialElements } from '~/lib/initialElements';
 
const data = {
  "American Revolution": {
    "Colonial Period (1763-1775)": {
      "British Colonial Policy": {
        "Navigation Acts": {
          "Trade Restrictions": [
            "Mercantilism",
            "Port Regulations",
            "Colonial Manufacturing Limits"
          ],
          "Enforcement": [
            "Customs Officers",
            "Writs of Assistance",
            "Vice-Admiralty Courts"
          ]
        },
        "Taxation": [
          "Sugar Act",
          "Stamp Act",
          "Townshend Acts",
          "Tea Act"
        ],
        "Coercive Acts": [
          "Boston Port Act",
          "Massachusetts Government Act",
          "Administration of Justice Act",
          "Quartering Act"
        ]
      }
    }
  }
}

const { nodes: initialNodes, edges: initialEdges } = initialElements(data as unknown as Record<string, unknown>);
 
const edgeTypes = {
  floating: FloatingEdge,
};

// Custom node styles
const nodeStyles = {
  background: '#262626', // Neutral-800
  color: '#fafafa', // Neutral-50
  border: '1px solid #525252', // Neutral-600
  borderRadius: '0.5rem',
  padding: '0.5rem 1rem',
};

// Custom edge styles
const defaultEdgeOptions = {
  type: 'floating',
  markerEnd: {
    type: MarkerType.Arrow,
    color: '#525252', // Neutral-600
  },
  style: {
    stroke: '#525252', // Neutral-600
  },
};
 
export const Flow: React.FC = () => {
  const [nodes, , onNodesChange] = useNodesState(
    initialNodes.map(node => ({
      ...node,
      style: nodeStyles,
    }))
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) =>{
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            ...defaultEdgeOptions,
          },
          eds
        )
      )} ,
    [setEdges]
  );
 
  return (
    <div className="w-full h-full bg-neutral-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        proOptions={{ hideAttribution: true }}
        onConnect={onConnect}
        fitView
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineComponent={FloatingConnectionLine}
        className="bg-neutral-900"
        nodesDraggable
        panOnDrag
        minZoom={0.2}
        maxZoom={4}
      >
        <Background 
          color="#525252" // Neutral-600
          gap={16}
          size={1}
          className="bg-neutral-900"
        />
      </ReactFlow>
    </div>
  );
};
 