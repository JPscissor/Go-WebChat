package models

type Message struct {
	Nickname string `json:"nickname"`
	Text     string `json:"text"`
	Time     string `json:"time"`
}

type ClientMessage struct {
	Text string `json:"text"`
}
