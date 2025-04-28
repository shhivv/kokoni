"use client";
import React, { useCallback, useState, useEffect, useMemo } from "react";
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
import { useDebounce } from "~/hooks/use-debounce";

// Define the node type
interface FlowNode extends Node {
  data: {
    label: string;
    originalLabel?: string;
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
  const generateSummary = api.search.summary.useMutation();

  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNodes, setSelectedNodes] = useState<FlowNode[]>([]);
  const [nodeSummaries, setNodeSummaries] = useState<Record<string, string>>({});
  const [processedNodes, setProcessedNodes] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [prompt, setPrompt] = useState("");
  const { toast } = useToast();
  const router = useRouter();
  const utils = api.useUtils();
  const [includeStats, setIncludeStats] = useState(false);
  const [includeWeb, setIncludeWeb] = useState(false);

  const debouncedSelectedNodes = useDebounce(selectedNodes, 500);

  // Memoize the initial nodes setup
  const initialNodes = useMemo(() => {
    if (!search?.KnowledgeMap?.contents) return [];

    const questions = search.KnowledgeMap.contents as string[];
    const mainTopic = search.name;
    
    const centralNode = {
      id: 'central',
      type: 'default',
      position: { x: 300, y: 200 },
      data: { 
        label: mainTopic,
        originalLabel: mainTopic,
      },
      style: {
        ...nodeStyles,
        background: "hsl(var(--primary))",
        color: "hsl(var(--primary-foreground))",
        border: "2px solid hsl(var(--primary))",
      },
    };

    const questionNodes = questions.map((question, index) => {
      const angle = (index * (2 * Math.PI)) / questions.length;
      const radius = 200;
      const x = 300 + radius * Math.cos(angle);
      const y = 200 + radius * Math.sin(angle);
      
      return {
        id: `question-${index}`,
        type: 'default',
        position: { x, y },
        data: { 
          label: question,
          originalLabel: question,
        },
        style: nodeStyles,
      };
    });

    return [centralNode, ...questionNodes];
  }, [search]);

  // Memoize the edges
  const initialEdges = useMemo(() => {
    if (!search?.KnowledgeMap?.contents) return [];
    
    const questions = search.KnowledgeMap.contents as string[];
    return questions.map((_, index) => ({
      id: `edge-${index}`,
      source: 'central',
      target: `question-${index}`,
      type: 'floating',
    }));
  }, [search]);

  // Set initial nodes and edges only once when search data changes
  useEffect(() => {
    if (initialNodes.length > 0) {
      setNodes(initialNodes);
      setEdges(initialEdges);
    }
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Generate summaries for selected nodes
  useEffect(() => {
    if (isProcessing) return;

    const generateSummaries = async () => {
      const nodesToProcess = debouncedSelectedNodes.filter(
        node => !processedNodes.has(node.id) && node.id !== 'central'
      );

      if (nodesToProcess.length === 0) return;

      setIsProcessing(true);
      const newSummaries = { ...nodeSummaries };
      const newProcessedNodes = new Set(processedNodes);

      try {
        for (const node of nodesToProcess) {
          if (!newProcessedNodes.has(node.id)) {
            const summary = await generateSummary.mutateAsync({
              question: node.data.originalLabel,
            });
            newSummaries[node.id] = summary;
            newProcessedNodes.add(node.id);
          }
        }

        setNodeSummaries(newSummaries);
        setProcessedNodes(newProcessedNodes);
      } catch (error) {
        console.error('Failed to generate summaries:', error);
      } finally {
        setIsProcessing(false);
      }
    };

    void generateSummaries();
  }, [debouncedSelectedNodes, processedNodes, isProcessing, generateSummary]);

  // Update nodes with summaries and styles
  useEffect(() => {
    if (nodes.length === 0) return;

    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        if (node.id === 'central') return node;
        
        const summary = nodeSummaries[node.id];
        const originalLabel = node.data.originalLabel ?? node.data.label;
        const isSelected = selectedNodes.some((n) => n.id === node.id);
        
        return {
          ...node,
          data: {
            ...node.data,
            label: summary ? `${originalLabel}\n\n${summary}` : originalLabel,
          },
          style: isSelected
            ? selectedNodeStyles
            : node.id === 'central'
              ? { ...nodeStyles, background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", border: "2px solid hsl(var(--primary))" }
              : nodeStyles,
        };
      }),
    );
  }, [nodeSummaries, selectedNodes, setNodes]);

  // Handle node selection
  const onSelectionChange = useCallback((params: OnSelectionChangeParams) => {
    if (!params.nodes.length) {
      setSelectedNodes([]);
      return;
    }

    const newNode = params.nodes[params.nodes.length - 1] as FlowNode;
    if (!newNode || newNode.id === 'central') return;

    setSelectedNodes((prev) => {
      if (prev.find((n) => n.id === newNode.id)) {
        return prev.filter((n) => n.id !== newNode.id);
      }
      return [...prev, newNode];
    });
  }, []);

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
          padding: 0.5,
          maxZoom: 1.5,
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
        maxZoom={1.5}
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
