package handlers

import (
	"chat-room/backend/config"
	"chat-room/backend/models"
	"chat-room/backend/storage"
	"log"
	"time"

	"github.com/gorilla/websocket"
)

func sendInitialData(ws *websocket.Conn, nickname string) error {
	if err := sendHistory(ws); err != nil {
		return err
	}

	handleMessage("Система", nickname+" подключился к чату")

	return nil
}

func processMessages(ws *websocket.Conn, nickname string) {
	for {
		msg, err := readClientMessage(ws)
		if err != nil {
			log.Printf("Read error: %v", err)
			break
		}
		if err := handleMessage(nickname, msg.Text); err != nil {
			log.Printf("Message handling error: %v", err)
		}
	}
}

func readClientMessage(ws *websocket.Conn) (models.ClientMessage, error) {
	var msg models.ClientMessage
	err := ws.ReadJSON(&msg)
	return msg, err
}

func handleMessage(nickname, text string) error {
	if err := storage.StorageRepo.SaveMessage(nickname, text); err != nil {
		return err
	}

	config.Broadcast <- models.Message{
		Nickname: nickname,
		Text:     text,
		Time:     time.Now().Format(time.RFC3339),
	}
	return nil
}

func sendHistory(ws *websocket.Conn) error {
	messages, err := storage.StorageRepo.GetLastMessages(50)
	if err != nil {
		return err
	}

	for _, msg := range messages {
		if err := ws.WriteJSON(msg); err != nil {
			return err
		}
	}
	return nil
}

func MessagesHandler() {
	for msg := range config.Broadcast {
		config.ClientsMu.Lock()
		for client := range config.Clients {
			if err := client.WriteJSON(msg); err != nil {
				log.Printf("Write error: %v", err)
				client.Close()
				delete(config.Clients, client)
			}
		}
		config.ClientsMu.Unlock()
	}
}
