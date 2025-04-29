import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Node } from '~/types/NodeInterface';

export const KokoniNode = memo(({ data, isConnectable }: { data: Node, isConnectable: boolean}) => {

  return (
    <div 
      className={`w-48 p-4 shadow-md rounded-md bg-card border-2 ${data.selected ? 'border-primary' : 'border-gray-300'}`}
    >
      <Handle type="target" position={Position.Left} className="w-2 h-2" />
      <div className="flex flex-col">
        <div className={`text-sm font-medium ${data.selected ? 'text-foreground' : 'text-muted-foreground'}`}>{data.question}</div>
        <div className="text-xs text-gray-500">{data.summary}</div>
      </div>
      <Handle type="source" position={Position.Right} isConnectable={false} className="w-2 h-2" />
    </div>
  );
});

