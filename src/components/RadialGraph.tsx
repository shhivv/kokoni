'use client'
import React, { useEffect, useRef, useState, memo } from 'react';
import * as d3 from 'd3';

type RecursiveObject = {
  [key: string]: RecursiveObject;
};

interface Node {
  id: string;
  isRoot: boolean;
  isToggled: boolean;
  depth: number;
  index: number;
  x: number;
  y: number;
  parent?: string;
}

interface Link {
  source: Node;
  target: Node;
}

interface RadialGraphProps {
  data: RecursiveObject;
  width?: number;
  height?: number;
  onToggleUpdate?: (toggledNodes: Record<string, boolean>, nodeHierarchy: Node[]) => void;
}

const RadialGraph = memo(({
  data,
  width = 1200,
  height = 800,
  onToggleUpdate
}: RadialGraphProps) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [toggledNodes, setToggledNodes] = useState<Record<string, boolean>>({});
  const [nodes, setNodes] = useState<Node[]>([]);
  const simulationRef = useRef<any>(null);

  const processData = (inputData: RecursiveObject) => {
    const nodes: Node[] = [];
    const links: Link[] = [];
    
    const rootKey = Object.keys(inputData)[0];
    const centerX = width / 2;
    const centerY = height / 2;
    
    const rootNode: Node = {
      id: rootKey,
      isRoot: true,
      isToggled: false,
      depth: 0,
      index: 0,
      x: centerX,
      y: centerY
    };
    nodes.push(rootNode);

    const childKeys = Object.keys(inputData[rootKey]);
    const radius = Math.min(width, height) / 2.5; // Adjusted for larger nodes
    
    childKeys.forEach((key, index) => {
      const angle = (index / childKeys.length) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      const childNode: Node = {
        id: key,
        isRoot: false,
        isToggled: toggledNodes[key] || false,
        depth: 1,
        index,
        x,
        y,
        parent: rootKey
      };
      nodes.push(childNode);
      
      links.push({
        source: rootNode,
        target: childNode
      });
      
      if (typeof inputData[rootKey][key] === 'object') {
        const grandchildKeys = Object.keys(inputData[rootKey][key]);
        const outerRadius = radius * 1.8; // Adjusted for larger nodes
        
        grandchildKeys.forEach((grandchildKey, grandchildIndex) => {
          const sectionalAngle = angle - (Math.PI / 4) + 
            ((grandchildIndex + 1) / (grandchildKeys.length + 1)) * (Math.PI / 2);
          const gx = centerX + outerRadius * Math.cos(sectionalAngle);
          const gy = centerY + outerRadius * Math.sin(sectionalAngle);
          
          const grandchildNode: Node = {
            id: grandchildKey,
            isRoot: false,
            isToggled: toggledNodes[grandchildKey] || false,
            depth: 2,
            index: grandchildIndex,
            x: gx,
            y: gy,
            parent: key
          };
          nodes.push(grandchildNode);
          
          links.push({
            source: childNode,
            target: grandchildNode
          });
        });
      }
    });

    return { nodes, links };
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !svgRef.current) return;

    const { nodes: newNodes, links } = processData(data);
    setNodes(newNodes);

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("class", "w-full h-full");

    simulationRef.current = d3.forceSimulation(newNodes)
      .force("link", d3.forceLink(links)
        .id((d: any) => d.id)
        .distance(d => (d as any).source.depth === 0 ? 100 : 80)) // Increased distances
      .force("charge", d3.forceManyBody().strength(-1000)) // Increased repulsion
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(70)) // Increased collision radius
      .alphaDecay(0.1);

    const linkElements = svg.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("class", "stroke-gray-200 stroke-[0.5px]");

    const nodeGroups = svg.append("g")
      .selectAll("g")
      .data(newNodes)
      .join("g");

    const circleRadius = 50; // Increased node radius
    nodeGroups.append("circle")
      .attr("r", circleRadius)
      .attr("class", d => 
        d.isRoot 
          ? "fill-white stroke-[0.75px] stroke-gray-400 cursor-default"
          : `fill-white stroke-[0.75px] stroke-gray-400 cursor-pointer 
             transition-colors duration-200 ${toggledNodes[d.id] ? "stroke-green-500" : ""}`)
      .on("click", (event, d: Node) => {
        if (!d.isRoot) {
          // Toggle the clicked node without affecting other selections
          const newToggledNodes = {
            ...toggledNodes,
            [d.id]: !toggledNodes[d.id]
          };
          setToggledNodes(newToggledNodes);
          onToggleUpdate?.(newToggledNodes, newNodes);
        }
      });

    nodeGroups.append("text")
      .text(d => d.id)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("class", "text-sm font-medium fill-gray-700 select-none"); // Increased text size

    simulationRef.current.on("tick", () => {
      linkElements
        .attr("x1", d => (d as any).source.x)
        .attr("y1", d => (d as any).source.y)
        .attr("x2", d => (d as any).target.x)
        .attr("y2", d => (d as any).target.y);

      nodeGroups
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    nodeGroups.call(d3.drag()
      .on("start", (event) => {
        if (!event.active) simulationRef.current.alphaTarget(0.1).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      })
      .on("drag", (event) => {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      })
      .on("end", (event) => {
        if (!event.active) simulationRef.current.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }));

    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [data, width, height]);

  useEffect(() => {
    if (!svgRef.current) return;

    d3.select(svgRef.current)
      .selectAll("circle")
      .attr("class", d => 
        (d as Node).isRoot 
          ? "fill-white stroke-[0.75px] stroke-gray-400 cursor-default"
          : `fill-white stroke-[0.75px] stroke-gray-400 cursor-pointer 
             transition-colors duration-200 ${toggledNodes[(d as Node).id] ? "stroke-green-500" : ""}`);
  }, [toggledNodes]);

  return (
    <svg
      ref={svgRef}
      className="w-full aspect-video"
    />
  );
});

RadialGraph.displayName = 'RadialGraph';

export default RadialGraph;