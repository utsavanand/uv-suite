package main

import (
	"io"
	"log"
	"net/http"
	"os"
	"strings"
)

// backendURL is where the Python QA service lives. In docker-compose this
// resolves to the "backend" service; locally, override with BACKEND_URL.
var backendURL = env("BACKEND_URL", "http://localhost:8000")

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/health", health)
	mux.HandleFunc("/api/documents", proxy("/documents"))
	mux.HandleFunc("/api/documents/", proxyAsk)

	addr := ":" + env("PORT", "8080")
	log.Printf("bff listening on %s, backend=%s", addr, backendURL)
	log.Fatal(http.ListenAndServe(addr, cors(mux)))
}

func health(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	io.WriteString(w, `{"status":"ok"}`)
}

// proxy forwards a request to a fixed backend path, preserving method, body,
// and Content-Type (needed for multipart uploads).
func proxy(backendPath string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		forward(w, r, backendPath)
	}
}

// proxyAsk handles /api/documents/{id}/ask by rewriting the /api prefix away.
func proxyAsk(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api")
	if !strings.HasSuffix(path, "/ask") {
		http.NotFound(w, r)
		return
	}
	forward(w, r, path)
}

func forward(w http.ResponseWriter, r *http.Request, backendPath string) {
	req, err := http.NewRequest(r.Method, backendURL+backendPath, r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadGateway)
		return
	}
	req.Header.Set("Content-Type", r.Header.Get("Content-Type"))
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		http.Error(w, "backend unreachable: "+err.Error(), http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()
	w.Header().Set("Content-Type", resp.Header.Get("Content-Type"))
	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
}

func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
