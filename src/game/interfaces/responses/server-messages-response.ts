export interface ServerMessagesResponse {
  results: ServerMessage[];
  nextCursor?: number;
  hasMore: boolean;
}

export interface ServerMessage {
  id: number;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}
