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
} from '@xyflow/react';
 
import '@xyflow/react/dist/style.css';
 
 
import FloatingEdge from '~/components/floating-edge';
import FloatingConnectionLine from '~/components/floating-connection-line';
import { initialElements } from '~/lib/initialElements';
 
interface PlantData {
  plants: (string | { flowers: string[] })[];
}

const data: PlantData = {
  plants: [
    { flowers: ["petals", "bud"] },
    "stem",
    "root"
  ]
};

const { nodes: initialNodes, edges: initialEdges } = initialElements(data as unknown as Record<string, unknown>);
 
const edgeTypes = {
  floating: FloatingEdge,
};
 
export const Flow: React.FC = () => {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'floating',
            markerEnd: { type: MarkerType.Arrow },
          },
          eds
        )
      ),
    [setEdges]
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
 