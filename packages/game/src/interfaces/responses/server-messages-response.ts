export interface ServerMessagesResponse {
  results: ServerMessage[];
  nextCursor?: number;
}

export interface ServerMessage {
  title: string;
  content: string;
  timestamp: number;
}
