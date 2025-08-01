package config

import (
	"log"
	"net/http"
	"os"
)

func ServeFrontend() {
	if _, err := os.Stat("./frontend/build"); os.IsNotExist(err) {
		log.Fatal("React build directory not found. Please run 'npm run build' in frontend directory first.")
	}

	fs := http.FileServer(http.Dir("./frontend/build"))
	http.Handle("/", fs)

	http.HandleFunc("/chat", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "./frontend/build/index.html")
	})
}

func GetPort() string {
	if port := os.Getenv("PORT"); port != "" {
		return port
	}
	return "8080"
}
