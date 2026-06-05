FROM golang:1.23-alpine AS build
WORKDIR /src
COPY go.mod .
COPY main.go .
RUN CGO_ENABLED=0 go build -o /bff .

FROM alpine:3.21
COPY --from=build /bff /bff
EXPOSE 8080
ENTRYPOINT ["/bff"]
