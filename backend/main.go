package main

import (
	"chat-room/backend/config"
	"chat-room/backend/handlers"
	"chat-room/backend/storage"
	"log"
	"net/http"
)

func main() {
	store, err := storage.New(config.DbUrl)
	if err != nil {
		log.Fatal("Failed to initialize storage: ", err)
	}
	defer func() {
		if err := store.Close(); err != nil {
			log.Printf("Error closing storage: %v", err)
		}
	}()

	storage.InitStorage(store)

	go handlers.MessagesHandler()

	http.HandleFunc("/ws", handlers.HandleConnections)

	config.ServeFrontend()

	port := config.GetPort()
	log.Printf("Server starting on http://localhost:%s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
