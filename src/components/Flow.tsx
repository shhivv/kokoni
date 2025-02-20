"use client"
import React, { useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  type Node,
  SelectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import FloatingEdge from '~/components/floating-edge';
import FloatingConnectionLine from '~/components/floating-connection-line';
import { initialElements } from '~/lib/initialElements';
import { api } from "~/trpc/react";
import { useToast } from "~/hooks/use-toast";
import { useRouter, useParams } from "next/navigation";

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

// Custom node styles with selection indicator (without movement)
const nodeStyles = {
  background: '#262626',
  color: '#fafafa',
  border: '1px solid #525252',
  borderRadius: '0.5rem',
  padding: '0.5rem 1rem',
  transition: 'border 0.2s ease, box-shadow 0.2s ease',
};

const selectedNodeStyles = {
  ...nodeStyles,
  border: '2px solid #3b82f6', // Blue border
  boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5)', // Blue glow
};

// Custom edge styles with dotted line
const defaultEdgeOptions = {
  type: 'floating',
  markerEnd: {
    type: MarkerType.Arrow,
    color: '#525252',
  },
  style: {
    stroke: '#525252',
    strokeDasharray: '5,5',
    strokeWidth: 1.5,
  },
};

interface FlowNode extends Node {
  data: {
    label: string;
  };
}

export const Flow: React.FC = () => {
  const params = useParams<{ slug: string }>();
  const { data: search } = api.search.getById.useQuery({ 
    id: params.slug as string 
  });

  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodes, setSelectedNodes] = useState<FlowNode[]>([]);
  const [prompt, setPrompt] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  // Update nodes when search data changes
  useEffect(() => {
    if (search?.KnowledgeMap?.contents) {
      const { nodes: newNodes, edges: newEdges } = initialElements(
        search.KnowledgeMap.contents as Record<string, unknown>
      );
      setNodes(newNodes.map(node => ({
        ...node,
        style: nodeStyles,
      })));
      setEdges(newEdges);
    }
  }, [search, setNodes, setEdges]);

  // Restore node highlighting
  useEffect(() => {
    setNodes((nds) => 
      nds.map((node) => ({
        ...node,
        style: selectedNodes.find(n => n.id === node.id)
          ? selectedNodeStyles 
          : nodeStyles,
      }))
    );
  }, [selectedNodes, setNodes]);

  const generateReport = api.report.produceReport.useMutation({
    onSuccess: () => {
      router.push(`/${params.slug}?tab=response`);
      toast({
        title: "Success",
        description: "Report generated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle node selection
  const onSelectionChange = useCallback(({ nodes: selected }: { nodes: Node[] }) => {
    if (!selected.length) {
      return;
    }

    const newNode = selected[selected.length - 1] as FlowNode;
    if (!newNode) return;
    
    setSelectedNodes((prev) => {
      if (prev.find(n => n.id === newNode.id)) {
        return prev;
      }
      return [...prev, newNode];
    });
  }, []);

  // Clear selection handler
  const clearSelection = useCallback(() => {
    setSelectedNodes([]);
  }, []);

  return (
    <div className="w-full h-full bg-neutral-900 floating-edges relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onSelectionChange={onSelectionChange as any}
        proOptions={{ hideAttribution: true }}
        fitView
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineComponent={FloatingConnectionLine}
        className="bg-neutral-900"
        nodesDraggable={true}
        nodesConnectable={false}
        panOnDrag
        minZoom={0.2}
        maxZoom={4}
        selectionMode={"multi" as unknown as SelectionMode}
        selectNodesOnDrag={false}
        multiSelectionKeyCode="Shift"
      >
        <Background 
          color="#525252"
          gap={16}
          size={1}
          className="bg-neutral-900"
        />
      </ReactFlow>

      {/* Debug Panel */}
      {selectedNodes.length > 0 && (
        <div className="absolute top-4 right-4 bg-neutral-800 border border-neutral-700 rounded-lg p-4 max-w-xs shadow-lg">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-neutral-200">Selected Nodes:</h3>
            <button
              onClick={clearSelection}
              className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              Clear
            </button>
          </div>
          <ul className="space-y-1">
            {selectedNodes.map((node) => (
              <li key={node.id} className="text-sm text-neutral-400">
                {node.data.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Prompt Input */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[600px]">
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Add additional instructions for the report..."
            className="w-full h-32 px-4 py-3 pr-24 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 
                     rounded-lg placeholder:text-neutral-500 focus:outline-none focus:ring-2 
                     focus:ring-blue-500 focus:border-transparent resize-none"
          />
          <button
            onClick={() => {
              generateReport.mutate({
                originalPrompt: search?.name || "",
                keywords: selectedNodes.map(n => n.data.label),
                prompt: prompt,
                searchId: params.slug as string,
              });
            }}
            disabled={selectedNodes.length === 0 || generateReport.isPending}
            className="absolute right-2 bottom-4 px-4 py-2 text-sm font-medium text-white 
                     bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 
                     focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-neutral-800
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {generateReport.isPending ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Generating...</span>
              </div>
            ) : (
              "Generate Report"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
 