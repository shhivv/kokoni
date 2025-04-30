import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Node } from '~/types/NodeInterface';
import { Skeleton } from './ui/skeleton';

interface KokoniNodeData extends Node {
  isLoading?: boolean;
}

export const KokoniNode = memo(({ data }: { data: KokoniNodeData}) => {
  if (data.isLoading) {
    return (
      <div className="w-72 py-4 bg-muted/50 px-4 shadow-md rounded-md border border-neutralborder">
        <Handle type="target" position={Position.Left} isConnectable={false} className="w-2 h-2" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-4 w-full" />
          <div className='flex flex-col gap-1'>
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-2 w-full" />
          </div>
        </div>
        <Handle type="source" position={Position.Right} isConnectable={false} className="w-2 h-2" />
      </div>
    );
  }

  return (
    <div 
      className={`w-72 ${data.selected ? 'py-8 bg-muted': 'py-4 bg-muted/50'} px-4 shadow-md rounded-md  border border-neutralborder`}
    >
      { data.parentId ? <Handle type="target" position={Position.Left} isConnectable={false} className="w-2 h-2" />: null }
      <div className="flex flex-col">
        <div className={`text-sm font-medium ${data.selected ? 'text-foreground' : 'text-muted-foreground/60'}`}>{data.question}</div>
        { data.summary &&  <div className="text-xs text-neutral-500 pt-4">{data.summary}</div> }
      </div>
      <Handle type="source" position={Position.Right} isConnectable={false} className="w-2 h-2" />
    </div>
  );
});

