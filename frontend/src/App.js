import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [nickname, setNickname] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const ws = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

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

    const socketUrl = `ws://${window.location.host}/ws?nickname=${encodeURIComponent(nickname)}`;
    ws.current = new WebSocket(socketUrl);

    ws.current.onopen = () => {
      setIsConnected(true);
    };

    ws.current.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setMessages(prev => [...prev, {
          nickname: data.nickname,
          text: data.text,
          time: data.time,
          imageUrl: data.imageUrl,
          type: data.type || 'text'
        }]);
      } catch (err) {
        console.error('Error parsing message:', err);
      }
    };

    ws.current.onclose = () => {
      setIsConnected(false);
    };
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Проверяем тип файла
      if (!file.type.startsWith('image/')) {
        alert('Пожалуйста, выберите изображение');
        return;
      }
      
      // Проверяем размер файла (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Размер файла не должен превышать 10MB');
        return;
      }
      
      setSelectedImage(file);
      
      // Создаем превью
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async () => {
    if (!selectedImage) return null;
    
    const formData = new FormData();
    formData.append('image', selectedImage);
    
    try {
      const response = await fetch('/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки изображения');
      }
      
      const result = await response.json();
      return result.imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Ошибка загрузки изображения');
      return null;
    }
  };

  const sendMessage = async () => {
    if ((!message.trim() && !selectedImage) || !ws.current) return;
    
    let imageUrl = null;
    let messageType = 'text';
    
    // Если есть изображение, загружаем его
    if (selectedImage) {
      imageUrl = await uploadImage();
      if (imageUrl) {
        messageType = 'image';
      } else {
        return; // Не отправляем сообщение, если загрузка не удалась
      }
    }
    
    const messageData = {
      text: message || (imageUrl ? 'Изображение' : ''),
      type: messageType
    };
    
    if (imageUrl) {
      messageData.imageUrl = imageUrl;
    }
    
    ws.current.send(JSON.stringify(messageData));
    
    setMessage('');
    removeImage();
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
                  <div className="message-text">
                    {msg.text}
                    {msg.type === 'image' && msg.imageUrl && (
                      <div className="message-image">
                        <img 
                          src={msg.imageUrl} 
                          alt="Uploaded content" 
                          style={{ maxWidth: '300px', maxHeight: '300px', borderRadius: '8px', marginTop: '8px' }}
                        />
                      </div>
                    )}
                  </div>
                  {msg.nickname === "System" && (
                    <div className="message-time">{formatTime(msg.time)}</div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="input-area">
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Preview" style={{ maxWidth: '100px', maxHeight: '100px', borderRadius: '4px' }} />
                <button onClick={removeImage} style={{ marginLeft: '8px', background: '#ff4444', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}>
                  ✕
                </button>
              </div>
            )}
            <div className="input-row">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                style={{ background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', padding: '8px 12px', cursor: 'pointer', marginRight: '8px' }}
              >
                📷
              </button>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="start typing message..."
                style={{ flex: 1, marginRight: '8px' }}
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;