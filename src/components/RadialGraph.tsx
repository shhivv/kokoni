'use client'
// components/RadialGraph.tsx
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
  baseX: number;  // Base position for animation
  baseY: number;
  children?: Node[];
}

interface Link {
  source: { x: number; y: number };
  target: { x: number; y: number };
}

interface RadialGraphProps {
  data: RecursiveObject;
  width?: number;
  height?: number;
  onToggleUpdate?: (toggledNodes: Record<string, boolean>) => void;
}

const RadialGraph: React.FC<RadialGraphProps> = ({
  data,
  width = 600,
  height = 400,
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
    
    // Add root node
    nodes.push({
      id: rootKey,
      isRoot: true,
      isToggled: false,
      depth: 0,
      index: 0,
      x: centerX,
      y: centerY,
      baseX: centerX,
      baseY: centerY
    });

    const childKeys = Object.keys(inputData[rootKey]);
    const radius = Math.min(width, height) / 4;
    
    childKeys.forEach((key, index) => {
      const angle = (index / childKeys.length) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      nodes.push({
        id: key,
        isRoot: false,
        isToggled: toggledNodes[key] || false,
        depth: 1,
        index,
        x,
        y,
        baseX: x,
        baseY: y
      });
      
      links.push({
        source: { x: centerX, y: centerY },
        target: { x, y }
      });
      
      if (typeof inputData[rootKey][key] === 'object') {
        const grandchildKeys = Object.keys(inputData[rootKey][key]);
        const outerRadius = radius * 1.8;
        
        grandchildKeys.forEach((grandchildKey, grandchildIndex) => {
          const sectionalAngle = angle - (Math.PI / 8) + 
            ((grandchildIndex + 1) / (grandchildKeys.length + 1)) * (Math.PI / 4);
          const gx = centerX + outerRadius * Math.cos(sectionalAngle);
          const gy = centerY + outerRadius * Math.sin(sectionalAngle);
          
          nodes.push({
            id: grandchildKey,
            isRoot: false,
            isToggled: toggledNodes[grandchildKey] || false,
            depth: 2,
            index: grandchildIndex,
            x: gx,
            y: gy,
            baseX: gx,
            baseY: gy
          });
          
          links.push({
            source: { x, y },
            target: { x: gx, y: gy }
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

    // Add subtle continuous animation
    function animateNodes() {
      const t = Date.now() / 3000; // Slow cycle
      nodes.forEach(node => {
        if (!node.isRoot) {
          // Very small movement around base position
          const offsetX = Math.sin(t + node.index) * 3;
          const offsetY = Math.cos(t + node.index) * 3;
          node.x = node.baseX + offsetX;
          node.y = node.baseY + offsetY;
        }
      });

      // Update positions
      nodeGroups.attr("transform", d => `translate(${d.x},${d.y})`);
      linkElements
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      requestAnimationFrame(animateNodes);
    }

    // Add links
    const linkElements = svg.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("class", "stroke-gray-200 stroke-2");

    // Add nodes
    const nodeGroups = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("transform", d => `translate(${d.x},${d.y})`);

    // Add circles for nodes
    const circleRadius = 25; // Increased size for text
    nodeGroups.append("circle")
      .attr("r", circleRadius)
      .attr("class", d => 
        d.isRoot 
          ? "fill-white stroke-2 stroke-red-500 cursor-default" 
          : `fill-white stroke-2 stroke-blue-500 cursor-pointer hover:stroke-blue-600 
             transition-all duration-200 ${d.isToggled ? "stroke-green-500" : ""}`)
      .on("click", (event, d) => {
        if (!d.isRoot) {
          // Scale animation on click
          d3.select(event.currentTarget)
            .transition()
            .duration(200)
            .attr("r", circleRadius * 1.1)
            .transition()
            .duration(200)
            .attr("r", circleRadius);

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
      .attr("class", "text-sm font-medium fill-gray-700 select-none");

    // Start animation
    animateNodes();

    // Cleanup
    return () => {
      // The animation will stop when the component unmounts
      // because the requestAnimationFrame loop will end
    };
  }, [data, width, height, toggledNodes]);

  return (
    <svg
      ref={svgRef}
      className="w-full aspect-video text-sm"
    />
  );
};

export default RadialGraph;