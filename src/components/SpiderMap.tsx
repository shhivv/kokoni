'use client'

import { motion } from 'framer-motion';
import React, { useState } from 'react';

type SpiderNodeProps = {
  id: number;
  x: number;
  y: number;
  text: string;
  onPositionUpdate: (id: number, x: number, y: number) => void;
};

export const SpiderNode = ({ id, x, y, text, onPositionUpdate }: SpiderNodeProps) => {
  return (
    <motion.div
      drag
      dragMomentum={false}
      onDrag={(_, info) => {
        onPositionUpdate(id, info.point.x, info.point.y);
      }}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)'
      }}
      className="cursor-move"
    >
      <div className="bg-white px-4 py-2 rounded-lg shadow-md border border-gray-200">
        {text}
      </div>
    </motion.div>
  );
};


type Node = {
  id: number;
  x: number;
  y: number;
  text: string;
};

type LinesProps = {
  nodes: Node[];
};

export const Lines = ({ nodes }: LinesProps) => {
  return (
    <svg className="absolute w-full h-full">
      {nodes.slice(1).map(node => (
        <line
          key={`line-${node.id}`}
          x1={nodes[0].x}
          y1={nodes[0].y}
          x2={node.x}
          y2={node.y}
          stroke="#CBD5E1"
          strokeWidth="2"
        />
      ))}
    </svg>
  );
};



type Node = {
  id: number;
  x: number;
  y: number;
  text: string;
};

export const SpiderMapClient = () => {
  const [nodes, setNodes] = useState<Node[]>([
    { id: 1, x: 300, y: 200, text: 'Main Topic' },
    { id: 2, x: 450, y: 150, text: 'Subtopic 1' },
    { id: 3, x: 450, y: 250, text: 'Subtopic 2' },
    { id: 4, x: 150, y: 150, text: 'Subtopic 3' },
    { id: 5, x: 150, y: 250, text: 'Subtopic 4' },
  ]);

  const updateNodePosition = (id: number, x: number, y: number) => {
    setNodes(nodes.map(node => 
      node.id === id ? { ...node, x, y } : node
    ));
  };

  return (
    <div className="relative w-full h-screen bg-gray-50">
      <Lines nodes={nodes} />
      {nodes.map(node => (
        <SpiderNode
          key={node.id}
          {...node}
          onPositionUpdate={updateNodePosition}
        />
      ))}
    </div>
  );
};
