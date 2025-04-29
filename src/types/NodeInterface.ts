export interface Node {
  id: number;
  question: string;
  summary?: string | null;
  selected: boolean;
  includeStats: boolean;
  includeImage: boolean;
  children: Node[];
}

