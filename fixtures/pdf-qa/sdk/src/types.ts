export interface UploadResponse {
  id: string;
  filename: string;
  num_chunks: number;
}

export interface AnswerResponse {
  answer: string;
  score: number;
  chunk_index: number;
}
