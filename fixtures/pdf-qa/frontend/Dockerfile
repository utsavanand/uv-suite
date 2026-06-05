# Build context is the pdf-qa root so the frontend can resolve the sibling SDK.
FROM node:20-alpine

WORKDIR /app
COPY sdk ./sdk
COPY frontend/package.json ./frontend/package.json
WORKDIR /app/frontend
RUN npm install
COPY frontend ./

EXPOSE 5173
CMD ["npm", "run", "dev"]
