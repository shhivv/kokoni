'use client'
import React, { useEffect, useRef, useState } from 'react';
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
}

interface Link {
  source: Node;
  target: Node;
}

interface RadialGraphProps {
  data: RecursiveObject;
  width?: number;
  height?: number;
  onToggleUpdate?: (toggledNodes: Record<string, boolean>) => void;
}

const RadialGraph: React.FC<RadialGraphProps> = ({
  data,
  width = 1200,
  height = 800,
  onToggleUpdate
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [toggledNodes, setToggledNodes] = useState<Record<string, boolean>>({});

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
    const radius = Math.min(width, height) / 3;
    
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
        y
      };
      nodes.push(childNode);
      
      links.push({
        source: rootNode,
        target: childNode
      });
      
      if (typeof inputData[rootKey][key] === 'object') {
        const grandchildKeys = Object.keys(inputData[rootKey][key]);
        const outerRadius = radius * 1.6; // Reduced from 1.8
        
        grandchildKeys.forEach((grandchildKey, grandchildIndex) => {
          const sectionalAngle = angle - (Math.PI / 6) + 
            ((grandchildIndex + 1) / (grandchildKeys.length + 1)) * (Math.PI / 3);
          const gx = centerX + outerRadius * Math.cos(sectionalAngle);
          const gy = centerY + outerRadius * Math.sin(sectionalAngle);
          
          const grandchildNode: Node = {
            id: grandchildKey,
            isRoot: false,
            isToggled: toggledNodes[grandchildKey] || false,
            depth: 2,
            index: grandchildIndex,
            x: gx,
            y: gy
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

    d3.select(svgRef.current).selectAll("*").remove();

    const { nodes, links } = processData(data);

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("class", "w-full h-full");

    // Create force simulation with reduced strength
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links)
        .id((d: any) => d.id)
        .distance(d => (d as any).source.depth === 0 ? 100 : 80)) // Reduced distances
      .force("charge", d3.forceManyBody().strength(-600)) // Reduced strength
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(50)) // Increased for larger nodes
      .alphaDecay(0.1); // Faster settling

    // Add links
    const linkElements = svg.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("class", "stroke-gray-200 stroke-[0.5px]");

    // Add nodes
    const nodeGroups = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g");

    // Create circles with larger radius
    const circleRadius = 40; // Increased from 35
    nodeGroups.append("circle")
      .attr("r", circleRadius)
      .attr("class", d => 
        d.isRoot 
          ? "fill-white stroke-[0.75px] stroke-gray-400 cursor-default"
          : `fill-white stroke-[0.75px] stroke-gray-400 cursor-pointer 
             transition-colors duration-200 ${d.isToggled ? "stroke-green-500" : ""}`)
      .on("click", (event, d) => {
        if (!d.isRoot) {
          const newToggledNodes = {
            ...toggledNodes,
            [d.id]: !toggledNodes[d.id]
          };
          setToggledNodes(newToggledNodes);
          onToggleUpdate?.(newToggledNodes);
        }
      });

    // Add labels inside circles
    nodeGroups.append("text")
      .text(d => d.id)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("class", "text-xs font-medium fill-gray-700 select-none");

    // Update positions on simulation tick
    simulation.on("tick", () => {
      linkElements
        .attr("x1", d => (d as any).source.x)
        .attr("y1", d => (d as any).source.y)
        .attr("x2", d => (d as any).target.x)
        .attr("y2", d => (d as any).target.y);

      nodeGroups
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // Add drag behavior with reduced movement
    nodeGroups.call(d3.drag()
      .on("start", (event) => {
        if (!event.active) simulation.alphaTarget(0.1).restart(); // Reduced target
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      })
      .on("drag", (event) => {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      })
      .on("end", (event) => {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }));

    return () => {
      simulation.stop();
    };
  }, [data, width, height, toggledNodes]);

  return (
    <svg
      ref={svgRef}
      className="w-full aspect-video"
    />
  );
};

export default RadialGraph;