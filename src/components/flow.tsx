"use client";
import React, { useCallback, useState, useEffect } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  MarkerType,
  type Node,
  type SelectionMode,
  type Edge,
  type OnSelectionChangeParams,
  type ConnectionLineComponent,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import FloatingEdge from "~/components/floating-edge";
import FloatingConnectionLine from "~/components/floating-connection-line";
import { initialElements } from "~/lib/initialElements";
import { api } from "~/trpc/react";
import { useToast } from "~/hooks/use-toast";
import { useRouter, useParams } from "next/navigation";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { BarChart3, Globe } from "lucide-react";

// Define the node type
interface FlowNode extends Node {
  data: {
    label: string;
  };
  style?: React.CSSProperties;
}

const edgeTypes = {
  floating: FloatingEdge,
};

// Custom node styles
const nodeStyles = {
  background: "hsl(var(--muted))",
  color: "hsl(var(--muted-foreground))",
  border: "1px solid hsl(var(--neutral-border))",
  borderRadius: "0.5rem",
  padding: "0.5rem 1rem",
  transition: "border 0.2s ease, box-shadow 0.2s ease",
};

const selectedNodeStyles = {
  ...nodeStyles,
  border: "1px solid hsl(var(--primary))",
  boxShadow: "0 0 0 2px hsla(var(--primary), 0.5)",
};

const defaultEdgeOptions = {
  type: "floating",
  markerEnd: {
    type: MarkerType.Arrow,
    color: "hsl(var(--border))",
  },
  style: {
    stroke: "hsl(var(--border))",
    strokeDasharray: "4,4",
    strokeWidth: 1,
  },
};

export const Flow: React.FC = () => {
  const params = useParams<{ slug: string }>();
  const { data: search } = api.search.getById.useQuery({
    id: params.slug,
  });

  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNodes, setSelectedNodes] = useState<FlowNode[]>([]);
  const [prompt, setPrompt] = useState("");
  const { toast } = useToast();
  const router = useRouter();
  const utils = api.useUtils();
  const [includeStats, setIncludeStats] = useState(false);
  const [includeWeb, setIncludeWeb] = useState(false);

  // Update nodes when search data changes
  useEffect(() => {
    if (search?.KnowledgeMap?.contents) {
      const { nodes: newNodes, edges: newEdges } = initialElements(
        search.KnowledgeMap.contents as Record<string, unknown>,
      );
      setNodes(
        newNodes.map((node) => ({
          ...node,
          style: nodeStyles,
        })) as FlowNode[],
      );
      setEdges(newEdges);
    }
  }, [search, setNodes, setEdges]);

  // Restore node highlighting
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        style: selectedNodes.find((n) => n.id === node.id)
          ? selectedNodeStyles
          : nodeStyles,
      })),
    );
  }, [selectedNodes, setNodes]);

  const generateReport = api.report.produceReport.useMutation({
    onSuccess: async () => {
      // Invalidate the search query to refetch the report
      await utils.search.getById.invalidate({ id: params.slug });
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
  const onSelectionChange = useCallback((params: OnSelectionChangeParams) => {
    if (!params.nodes.length) {
      return;
    }

    const newNode = params.nodes[params.nodes.length - 1] as FlowNode;
    if (!newNode) return;

    setSelectedNodes((prev) => {
      // If node is already selected, remove it
      if (prev.find((n) => n.id === newNode.id)) {
        return prev.filter((n) => n.id !== newNode.id);
      }
      // Otherwise add it
      return [...prev, newNode];
    });
  }, []);

  // Clear selection handler
  const clearSelection = useCallback(() => {
    setSelectedNodes([]);
  }, []);

  return (
    <div className="floating-edges relative h-full w-full bg-card">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onSelectionChange={onSelectionChange}
        proOptions={{ hideAttribution: true }}
        fitView
        fitViewOptions={{
          padding: 0.5, // Reduced from default
          maxZoom: 1.5, // Reduced max zoom
        }}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineComponent={
          FloatingConnectionLine as unknown as ConnectionLineComponent<FlowNode>
        }
        className="bg-background"
        nodesDraggable={true}
        nodesConnectable={false}
        panOnDrag
        minZoom={0.2}
        maxZoom={1.5} // Reduced from 4 to 1.5
        selectionMode={"multi" as unknown as SelectionMode}
        selectNodesOnDrag={false}
        multiSelectionKeyCode="Shift"
      ></ReactFlow>

      {/* Debug Panel */}
      {selectedNodes.length > 0 && (
        <div className="absolute right-4 top-4 max-w-xs rounded-lg bg-muted p-4 shadow-lg">
          <h3 className="text-sm font-medium text-foreground">
            Selected Nodes:
          </h3>
          <button
            onClick={clearSelection}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Clear
          </button>
          <ul className="space-y-1">
            {selectedNodes.map((node) => (
              <li key={node.id} className="text-sm text-muted-foreground">
                {node.data.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Prompt Input */}
      <div className="absolute bottom-8 left-1/2 w-[600px] -translate-x-1/2">
        <div className="relative">
          <div className="relative">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Add additional instructions for the report..."
              className="h-12 w-full rounded-lg border border-border bg-card px-4 pr-[220px] text-sm text-foreground placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8",
                  prompt.includes("[STATS]") && "bg-accent text-primary",
                )}
                onClick={() =>
                  setPrompt((prev) =>
                    prev.includes("[STATS]")
                      ? prev.replace("[STATS]", "").trim()
                      : "[STATS] " + prev,
                  )
                }
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8",
                  prompt.includes("[WEB]") && "bg-accent text-primary",
                )}
                onClick={() =>
                  setPrompt((prev) =>
                    prev.includes("[WEB]")
                      ? prev.replace("[WEB]", "").trim()
                      : "[WEB] " + prev,
                  )
                }
              >
                <Globe className="h-4 w-4" />
              </Button>
              <div className="mx-2 h-8 w-px bg-border" />
              <Button
                onClick={() => {
                  generateReport.mutate({
                    originalPrompt: search?.name ?? "",
                    keywords: selectedNodes.map((n) => n.data.label),
                    prompt,
                    searchId: params.slug,
                  });
                }}
                disabled={
                  selectedNodes.length === 0 || generateReport.isPending
                }
                className="h-8 rounded-md bg-primary px-4 text-sm font-medium text-card-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generateReport.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background/20 border-t-background" />
                    <span>Generating...</span>
                  </div>
                ) : (
                  "Generate Report"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
