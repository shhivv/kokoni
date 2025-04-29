"use client";
import React, { useCallback, useState, useEffect, useMemo, useRef } from "react";
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
    nodeId?: number;  // Changed from string to number since Node.id is still Int
    selected?: boolean;
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
  minWidth: "200px",
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

// Custom node component
const CustomNode: React.FC<{
  data: { label: string; originalLabel: string };
  selected: boolean;
  id: string;
}> = ({ data, selected, id }) => {
  const [label, summary] = data.label.split('\n\n');
  
  return (
    <div className="relative group">
      <div className="absolute -top-8 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          className="p-1.5 bg-muted rounded-full hover:bg-accent transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            // TODO: Add graph functionality
            console.log('Graph clicked for node:', id);
          }}
        >
          <BarChart3 className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
      <div>
        <div className="font-medium text-sm">{label}</div>
        {summary && (
          <div className="mt-1 text-xs font-normal text-muted-foreground border-t border-border pt-1">
            {summary}
          </div>
        )}
      </div>
    </div>
  );
};

export const Flow: React.FC = () => {
  const params = useParams<{ slug: string }>();
  const { data: search } = api.search.getById.useQuery({
    id: params.slug,
  });
  const selectNode = api.search.selectNode.useMutation();
 

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

  // Add refs to track previous values
  const prevNodeSummariesRef = useRef<Record<string, string>>({});
  const prevSelectedNodesRef = useRef<FlowNode[]>([]);
  const prevNodesRef = useRef<FlowNode[]>([]);
  const prevProcessedNodesRef = useRef<Set<string>>(new Set());

  // Memoize the initial nodes setup
  const initialNodes = useMemo(() => {
    if (!search?.rootNode) return [];

    const mainTopic = search.query; // Changed from search.name to search.query
    
    const centralNode = {
      id: 'central',
      type: 'default',
      position: { x: 300, y: 200 },
      data: { 
        label: mainTopic,
        originalLabel: mainTopic,
        nodeId: search.rootNode.id,
        selected: search.rootNode.selected,
      },
      style: {
        ...nodeStyles,
        background: "hsl(var(--primary))",
        color: "hsl(var(--primary-foreground))",
        border: "2px solid hsl(var(--primary))",
      },
    };

    // Create nodes for all children recursively
    const createNodesForChildren = (parentNode: any, level: number, startAngle: number, endAngle: number) => {
      if (!parentNode.children || parentNode.children.length === 0) return [];

      const nodes: FlowNode[] = [];
      const angleStep = (endAngle - startAngle) / parentNode.children.length;
      const radius = 200 + (level * 150); // Increase radius for each level

      parentNode.children.forEach((child: any, index: number) => {
        const angle = startAngle + (index * angleStep) + (angleStep / 2);
        const x = 300 + radius * Math.cos(angle);
        const y = 200 + radius * Math.sin(angle);
        
        const node: FlowNode = {
          id: `node-${child.id}`,
          type: 'default',
          position: { x, y },
          data: { 
            label: child.question,
            originalLabel: child.question,
            nodeId: child.id,
            selected: child.selected,
          },
          style: child.selected ? selectedNodeStyles : nodeStyles,
        };

        nodes.push(node);

        // Recursively create nodes for children
        const childStartAngle = startAngle + (index * angleStep);
        const childEndAngle = startAngle + ((index + 1) * angleStep);
        const childNodes = createNodesForChildren(child, level + 1, childStartAngle, childEndAngle);
        nodes.push(...childNodes);
      });

      return nodes;
    };

    const childNodes = createNodesForChildren(search.rootNode, 0, 0, 2 * Math.PI);
    return [centralNode, ...childNodes];
  }, [search]);

  // Memoize the edges
  const initialEdges = useMemo(() => {
    if (!search?.rootNode) return [];
    
    const edges: Edge[] = [];
    
    // Create edges recursively
    const createEdgesForChildren = (parentNode: any) => {
      if (!parentNode.children || parentNode.children.length === 0) return;

      parentNode.children.forEach((child: any) => {
        const sourceId = parentNode.id === search.rootNode?.id ? 'central' : `node-${parentNode.id}`;
        edges.push({
          id: `edge-${parentNode.id}-${child.id}`,
          source: sourceId,
          target: `node-${child.id}`,
          type: 'floating',
        });

        // Recursively create edges for children
        createEdgesForChildren(child);
      });
    };

    createEdgesForChildren(search.rootNode);
    return edges;
  }, [search]);

  // Set initial nodes and edges only once when search data changes
  useEffect(() => {
    if (initialNodes.length > 0) {
      // Check if we need to update based on changes in initialNodes
      const nodesChanged = JSON.stringify(initialNodes.map(n => n.id)) !== 
                          JSON.stringify(prevNodesRef.current.map(n => n.id));
      
      if (nodesChanged) {
        setNodes(initialNodes as FlowNode[]);
        prevNodesRef.current = [...initialNodes];
      }
      
      // Check if we need to update based on changes in initialEdges
      const edgesChanged = JSON.stringify(initialEdges.map(e => e.id)) !== 
                          JSON.stringify(edges.map(e => e.id));
      
      if (edgesChanged) {
        setEdges(initialEdges);
      }
    }
  }, [initialNodes, initialEdges, setNodes, setEdges, edges]);

  // Generate summaries for selected nodes
  useEffect(() => {
    if (isProcessing) return;

    const generateSummaries = async () => {
      const nodesToProcess = debouncedSelectedNodes.filter(
        node => !processedNodes.has(node.id) && node.id !== 'central' && node.data.selected
      );

      if (nodesToProcess.length === 0) return;

      setIsProcessing(true);
      const newSummaries = { ...nodeSummaries };
      const newProcessedNodes = new Set(processedNodes);

      try {
        for (const node of nodesToProcess) {
          if (!newProcessedNodes.has(node.id)) {
            const summary = await generateSummary.mutateAsync({
              nodeId: node.data.nodeId!,
            });
            newSummaries[node.id] = summary;
            newProcessedNodes.add(node.id);
          }
        }

        // Only update state if there are actual changes
        const hasSummaryChanges = Object.keys(newSummaries).some(
          key => newSummaries[key] !== nodeSummaries[key]
        );
        
        const hasProcessedChanges = 
          newProcessedNodes.size !== processedNodes.size ||
          Array.from(newProcessedNodes).some(nodeId => !processedNodes.has(nodeId));
        
        if (hasSummaryChanges) {
          setNodeSummaries(newSummaries);
          prevNodeSummariesRef.current = { ...newSummaries };
        }
        
        if (hasProcessedChanges) {
          setProcessedNodes(newProcessedNodes);
          prevProcessedNodesRef.current = new Set(newProcessedNodes);
        }
      } catch (error) {
        console.error('Failed to generate summaries:', error);
      } finally {
        setIsProcessing(false);
      }
    };

    // Check if we need to process nodes
    const selectedNodesChanged = JSON.stringify(debouncedSelectedNodes.map(n => n.id)) !== 
                                JSON.stringify(prevSelectedNodesRef.current.map(n => n.id));
    
    if (selectedNodesChanged) {
      prevSelectedNodesRef.current = [...debouncedSelectedNodes];
      void generateSummaries();
    }
  }, [debouncedSelectedNodes, processedNodes, isProcessing, generateSummary]);

  // Update nodes with summaries and styles
  useEffect(() => {
    if (nodes.length === 0) return;
    
    // Check if we need to update based on changes in dependencies
    const nodeSummariesChanged = JSON.stringify(nodeSummaries) !== JSON.stringify(prevNodeSummariesRef.current);
    const selectedNodesChanged = JSON.stringify(selectedNodes.map(n => n.id)) !== JSON.stringify(prevSelectedNodesRef.current.map(n => n.id));
    
    // If nothing changed, don't update
    if (!nodeSummariesChanged && !selectedNodesChanged) return;
    
    // Create a new array of nodes with updated data
    const updatedNodes = nodes.map((node) => {
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
    });
    
    // Update refs with current values
    prevNodeSummariesRef.current = { ...nodeSummaries };
    prevSelectedNodesRef.current = [...selectedNodes];
    prevNodesRef.current = [...nodes];
    
    // Update nodes
    setNodes(updatedNodes);
  }, [nodeSummaries, selectedNodes, setNodes]);

  // Handle node selection
  const onSelectionChange = useCallback(async (params: OnSelectionChangeParams) => {
    if (!params.nodes.length) {
      setSelectedNodes([]);
      return;
    }

    const newNode = params.nodes[params.nodes.length - 1] as FlowNode;
    if (!newNode || newNode.id === 'central') return;

    // Toggle selection in the database
    try {
      await selectNode.mutateAsync({
        nodeId: newNode.data.nodeId!,
      });
      
      // Update local state
      setSelectedNodes((prev) => {
        if (prev.find((n) => n.id === newNode.id)) {
          return prev.filter((n) => n.id !== newNode.id);
        }
        return [...prev, newNode];
      });

      // Update node style directly without triggering a re-render
      const updatedNode = {
        ...newNode,
        style: newNode.style === selectedNodeStyles ? nodeStyles : selectedNodeStyles,
        data: {
          ...newNode.data,
          selected: !newNode.data.selected,
        },
      };
      
      // Update the node directly in the nodes array
      setNodes((nds) => 
        nds.map((node) => node.id === newNode.id ? updatedNode : node)
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update node selection",
        variant: "destructive",
      });
    }
  }, [selectNode, setNodes, toast]);

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

  // Update nodes when search data changes
  useEffect(() => {
    if (!search?.rootNode) return;
    
    const mainTopic = search.query;
    
    // Check if we need to update based on changes in search data
    const searchDataChanged = 
      !prevNodesRef.current.length || 
      prevNodesRef.current[0]?.data?.label !== mainTopic ||
      prevNodesRef.current[0]?.data?.nodeId !== search.rootNode.id;
    
    if (!searchDataChanged) return;
    
    const centralNode = {
      id: 'central',
      type: 'default',
      position: { x: 300, y: 200 },
      data: { 
        label: mainTopic,
        originalLabel: mainTopic,
        nodeId: search.rootNode.id,
        selected: search.rootNode.selected,
      },
      style: {
        ...nodeStyles,
        background: "hsl(var(--primary))",
        color: "hsl(var(--primary-foreground))",
        border: "2px solid hsl(var(--primary))",
      },
    };
    
    const newNodes = [centralNode].map((node) => ({
      ...node,
      style: node.id === 'central' ? centralNode.style : nodeStyles,
    })) as FlowNode[];
    
    setNodes(newNodes);
    prevNodesRef.current = newNodes;
    
    // Only update edges if they've changed
    if (edges.length === 0 || initialEdges.length !== edges.length) {
      setEdges(initialEdges);
    }
  }, [search, setNodes, setEdges, initialEdges]);

  return (
    <div className="floating-edges relative h-full w-full bg-card">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onSelectionChange={onSelectionChange}
        proOptions={{ hideAttribution: true }}
        nodeTypes={{ default: CustomNode }}
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
                    originalPrompt: search?.query ?? "",
                    keywords: selectedNodes.map((n) => n.data.label),
                    prompt,
                    searchId: parseInt(params.slug, 10),
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
