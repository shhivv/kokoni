export interface Node {
  id: number;
  parentId?: number | null;
  question: string;
  summary?: string | null;
  selected: boolean;
  includeStats: boolean;
  includeImage: boolean;
  includeVerbose: boolean;
  children?: Node[];
  searchId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  rootForSearchId?: string | null;
}
