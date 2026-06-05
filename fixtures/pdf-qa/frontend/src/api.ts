import { PdfQaClient } from "@pdf-qa/sdk";

const baseUrl = import.meta.env.VITE_BFF_URL ?? "http://localhost:8080";

export const client = new PdfQaClient(baseUrl);
