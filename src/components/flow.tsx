"use client";
import React, { useState } from "react";
import {
  ReactFlow,
  type SelectionMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

export const Flow: React.FC = () => {
 
  return (
    <div className="floating-edges relative h-full w-full bg-card">
      <ReactFlow
        proOptions={{ hideAttribution: true }}
        className="bg-background"
      ></ReactFlow>

  
      </div>
  );
};
