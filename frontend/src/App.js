import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [nickname, setNickname] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connect = () => {
    if (!nickname.trim()) {
      alert('Enter nickname');
      return;
    }

    ws.current = new WebSocket(`ws://localhost:8080/ws?nickname=${encodeURIComponent(nickname)}`);

    ws.current.onopen = () => {
      setIsConnected(true);
    };

    ws.current.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setMessages(prev => [...prev, {
          nickname: data.nickname,
          text: data.text,
          time: data.time
        }]);
      } catch (err) {
        console.error('Error parsing message:', err);
      }
    };

    ws.current.onclose = () => {
      setIsConnected(false);
    };
  };

  const sendMessage = () => {
    if (!message.trim() || !ws.current) return;
    
    ws.current.send(JSON.stringify({
      text: message
    }));
    
    setMessage('');
  };

  const formatTime = (timeString) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return timeString;
    }
  };

  useEffect(() => {
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  return (
    <div className="app-container">
      <h1>Chat-Room</h1>
      
      {!isConnected ? (
        <div className="login-box">
          <h2>Enter chat</h2>
          <input
            type="text"
            placeholder="Your nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && connect()}
          />
          <button onClick={connect}>connect</button>
        </div>
      ) : (
        <div className="chat-container">
          <div className="messages">
            {messages.map((msg, index) => (
              <div 
                key={index}
                className={`message-wrapper ${
                  msg.nickname === "System" ? 'system' :
                  msg.nickname === nickname ? 'own' : 'other'
                }`}
              >
                <div className="message">
                  {msg.nickname !== "System" && (
                    <div className="message-header">
                      <span className="nickname">{msg.nickname}</span>
                      <span className="time">{formatTime(msg.time)}</span>
                    </div>
                  )}
                  <div className="message-text">{msg.text}</div>
                  {msg.nickname === "System" && (
                    <div className="message-time">{formatTime(msg.time)}</div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="input-area">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="start typing message..."
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;