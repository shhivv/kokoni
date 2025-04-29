export interface Node {
  id: number;
  parentId?: number;
  question: string;
  summary?: string | null;
  selected: boolean;
  includeStats: boolean;
  includeImage: boolean;
  children: Node[];
}

