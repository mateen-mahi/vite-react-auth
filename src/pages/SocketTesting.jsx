// pages/SocketTestPage.jsx
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const SocketTestPage = () => {
  const navigate = useNavigate();
  
  // ============================================
  // 1. GET SOCKET FUNCTIONS FROM CONTEXT
  // ============================================
  const { 
    isConnected,      // true/false - is socket connected?
    socketId,         // unique socket ID from server
    connectionError,  // any error message
    user,             // logged in user data
    loading,          // is auth loading?
    emitEvent,        // function to send events
    onEvent,          // function to listen to events
    refreshAuth       // function to refresh auth
  } = useAuth();

  // ============================================
  // 2. STATE VARIABLES
  // ============================================
  const [messages, setMessages] = useState([]);        // All chat messages
  const [newMessage, setNewMessage] = useState('');    // Current input text
  const [roomId, setRoomId] = useState('test-room-123'); // Current room
  const [isInRoom, setIsInRoom] = useState(false);     // Are we in a room?
  
  const messagesEndRef = useRef(null);                 // For auto-scroll
  const messageCounter = useRef(0);                    // Unique ID counter

  // ============================================
  // 3. AUTO-SCROLL TO LATEST MESSAGE
  // ============================================
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ============================================
  // 4. LISTEN FOR INCOMING MESSAGES
  // ============================================
  useEffect(() => {
    // onEvent() sets up a listener for 'receive-room-message'
    const cleanup = onEvent('receive-room-message', (messageData) => {
      console.log('📩 New message received:', messageData);
      
      // Check if message is from current user
      const isOwnMessage = messageData.userId === user?._id;
      
      // Add message to state
      setMessages(prev => [...prev, {
        ...messageData,
        isOwnMessage: isOwnMessage,
        received: true
      }]);
    });

    // Cleanup: remove listener when component unmounts
    return () => {
      if (cleanup) cleanup();
    };
  }, [onEvent, user?._id]);

  // ============================================
  // 5. SEND A MESSAGE
  // ============================================
  const sendMessage = () => {
    // Validation checks
    if (!isConnected) {
      alert('Socket not connected!');
      return;
    }

    if (!isInRoom) {
      alert('Please join a room first!');
      return;
    }

    if (!newMessage.trim()) {
      alert('Please enter a message');
      return;
    }

    // Create message object
    const messageData = {
      roomId: roomId,
      messageData: {
        id: `msg-${Date.now()}-${messageCounter.current++}`,
        text: newMessage.trim(),
        sender: user?.name || user?.email || 'Anonymous',
        userId: user?._id,
        timestamp: new Date().toISOString()
      }
    };

    // Send message via socket
    console.log('📤 Sending message:', messageData);
    emitEvent('room-message', messageData);

    // Add message to local state (optimistic update)
    setMessages(prev => [...prev, {
      ...messageData.messageData,
      isOwnMessage: true,
      sent: true
    }]);

    // Clear input
    setNewMessage('');
  };

  // ============================================
  // 6. JOIN A ROOM
  // ============================================
  const joinRoom = () => {
    if (!isConnected) {
      alert('Socket not connected!');
      return;
    }

    if (!roomId.trim()) {
      alert('Please enter a room ID');
      return;
    }

    console.log(`🟢 Joining room: ${roomId}`);
    emitEvent('join-room', roomId);
    setIsInRoom(true);
    setMessages([]); // Clear old messages
  };

  // ============================================
  // 7. LEAVE A ROOM
  // ============================================
  const leaveRoom = () => {
    if (!isInRoom) return;
    
    console.log(`🔴 Leaving room: ${roomId}`);
    emitEvent('leave-room', roomId);
    setIsInRoom(false);
  };

  // ============================================
  // 8. CLEAR MESSAGES
  // ============================================
  const clearMessages = () => {
    setMessages([]);
  };

  // ============================================
  // 9. LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div style={styles.container}>
        <h1>🔌 Socket Connection Test</h1>
        <p>Loading...</p>
      </div>
    );
  }

  // ============================================
  // 10. NOT AUTHENTICATED
  // ============================================
  if (!user) {
    return (
      <div style={styles.container}>
        <h1>🔌 Socket Connection Test</h1>
        <div style={styles.card}>
          <h2>⚠️ Not Authenticated</h2>
          <p>Please login to test socket connections.</p>
          <button onClick={() => navigate('/login')} style={styles.buttonPrimary}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // 11. MAIN UI
  // ============================================
  return (
    <div style={styles.container}>
      <h1>🔌 Socket Connection Test</h1>
      
      {/* Section 1: Connection Status */}
      <div style={styles.card}>
        <h2>📡 Connection Status</h2>
        <div>
          <p>
            <strong>Status:</strong> 
            <span style={{ color: isConnected ? 'green' : 'red' }}>
              {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </span>
          </p>
          {socketId && <p><strong>Socket ID:</strong> {socketId}</p>}
          <p><strong>User:</strong> {user?.email}</p>
        </div>
      </div>

      {/* Section 2: Room Controls */}
      <div style={styles.card}>
        <h2>🏠 Room Controls</h2>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Enter room ID"
            style={styles.input}
            disabled={isInRoom}
          />
          
          <button 
            onClick={joinRoom}
            style={isInRoom ? styles.buttonDisabled : styles.buttonSuccess}
            disabled={isInRoom}
          >
            🟢 Join Room
          </button>
          
          <button 
            onClick={leaveRoom}
            style={!isInRoom ? styles.buttonDisabled : styles.buttonDanger}
            disabled={!isInRoom}
          >
            🔴 Leave Room
          </button>
        </div>

        <p>
          <strong>Status:</strong> 
          {isInRoom ? ` ✅ In Room: ${roomId}` : ' ❌ Not in any room'}
        </p>
      </div>

      {/* Section 3: Chat */}
      <div style={styles.card}>
        <h2>💬 Chat</h2>
        
        {/* Messages Container */}
        <div style={styles.chatBox}>
          <div style={styles.messagesContainer}>
            {messages.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#999' }}>
                No messages yet. Send a test message!
              </p>
            ) : (
              messages.map((msg, index) => (
                <div 
                  key={msg.id || index}
                  style={{
                    ...styles.message,
                    backgroundColor: msg.isOwnMessage ? '#e3f2fd' : '#f3e5f5',
                    alignSelf: msg.isOwnMessage ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div style={styles.messageHeader}>
                    <strong>{msg.sender}</strong>
                    <span style={styles.messageTime}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                    {msg.isOwnMessage && <span>✅</span>}
                  </div>
                  <div>{msg.text}</div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={styles.chatInput}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              style={styles.input}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              disabled={!isConnected || !isInRoom}
            />
            <button 
              onClick={sendMessage}
              style={(!isConnected || !isInRoom) ? styles.buttonDisabled : styles.buttonPrimary}
              disabled={!isConnected || !isInRoom}
            >
              Send
            </button>
            <button onClick={clearMessages} style={styles.buttonSecondary}>
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// 12. STYLES
// ============================================
const styles = {
  container: {
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    border: '1px solid #ddd'
  },
  input: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px'
  },
  buttonPrimary: {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  buttonSecondary: {
    padding: '8px 16px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  buttonSuccess: {
    padding: '8px 16px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  buttonDanger: {
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  buttonDisabled: {
    padding: '8px 16px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'not-allowed',
    opacity: 0.65
  },
  chatBox: {
    border: '1px solid #ddd',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  messagesContainer: {
    height: '300px',
    overflow: 'auto',
    padding: '15px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    backgroundColor: '#fafafa'
  },
  message: {
    maxWidth: '70%',
    padding: '10px 15px',
    borderRadius: '8px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
    wordBreak: 'break-word'
  },
  messageHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '5px',
    fontSize: '12px',
    flexWrap: 'wrap'
  },
  messageTime: {
    color: '#666',
    fontSize: '11px'
  },
  chatInput: {
    display: 'flex',
    gap: '10px',
    padding: '10px',
    borderTop: '1px solid #ddd',
    backgroundColor: 'white'
  }
};

export default SocketTestPage;