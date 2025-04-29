import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Node } from '~/types/NodeInterface';

export const KokoniNode = memo(({ data }: { data: Node}) => {

  return (
    <div 
      className={`w-72 ${data.selected ? 'py-8': 'py-4'} px-4 shadow-md rounded-md bg-muted border border-neutralborder`}
    >
      { data.parentId ? <Handle type="target" position={Position.Left} className="w-2 h-2" />: null }
      <div className="flex flex-col">
        <div className={`text-sm font-medium ${data.selected ? 'text-foreground' : 'text-muted-foreground'}`}>{data.question}</div>
        { data.summary &&  <div className="text-xs text-neutral-500 pt-4">{data.summary}</div> }
      </div>
      <Handle type="source" position={Position.Right} isConnectable={false} className="w-2 h-2" />
    </div>
  );
});

