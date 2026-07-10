// pages/SocketTestPage.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const SocketTestPage = () => {
  const navigate = useNavigate();
  const { 
    isConnected, 
    socketId, 
    connectionError,
    user,
    loading,
    emitEvent,
    onEvent,
    refreshAuth
  } = useAuth();

  const [testMessages, setTestMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [roomId, setRoomId] = useState('test-room-123');
  const [isInRoom, setIsInRoom] = useState(false);
  const [socketEvents, setSocketEvents] = useState([]);

  // Add event listener for receiving messages
  useEffect(() => {
    // Listen for room messages
    const cleanup = onEvent('receive-room-message', (messageData) => {
      console.log('📩 Received message:', messageData);
      setTestMessages(prev => [...prev, {
        ...messageData,
        received: true,
        timestamp: new Date().toISOString()
      }]);
      addSocketEvent('📩 Message Received', messageData);
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [onEvent]);

  // Log connection status changes
  useEffect(() => {
    if (isConnected) {
      addSocketEvent('✅ Connected', { socketId });
    } else {
      addSocketEvent('❌ Disconnected', {});
    }
  }, [isConnected, socketId]);

  const addSocketEvent = (event, data) => {
    setSocketEvents(prev => [...prev, {
      event,
      data,
      timestamp: new Date().toISOString()
    }]);
  };

  // Join Room
  const joinRoom = () => {
    if (!isConnected) {
      alert('Socket not connected! Please wait or refresh.');
      return;
    }

    if (!roomId.trim()) {
      alert('Please enter a room ID');
      return;
    }

    console.log(`🟢 Joining room: ${roomId}`);
    emitEvent('join-room', roomId);
    setIsInRoom(true);
    addSocketEvent(`🟢 Joined Room: ${roomId}`, { roomId });
    setTestMessages([]); // Clear previous messages
  };

  // Leave Room
  const leaveRoom = () => {
    if (!isInRoom) return;
    
    console.log(`🔴 Leaving room: ${roomId}`);
    emitEvent('leave-room', roomId);
    setIsInRoom(false);
    addSocketEvent(`🔴 Left Room: ${roomId}`, { roomId });
  };

  // Send Message
  const sendMessage = () => {
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

    const messageData = {
      roomId: roomId,
      messageData: {
        text: newMessage,
        sender: user?.name || user?.email || 'Anonymous',
        userId: user?._id || 'unknown',
        timestamp: new Date().toISOString()
      }
    };

    console.log('📤 Sending message:', messageData);
    const success = emitEvent('room-message', messageData);
    
    if (success) {
      // Add to local messages (optimistic update)
      setTestMessages(prev => [...prev, {
        ...messageData.messageData,
        sent: true,
        timestamp: new Date().toISOString()
      }]);
      setNewMessage('');
      addSocketEvent('📤 Message Sent', messageData.messageData);
    } else {
      alert('Failed to send message. Socket may not be ready.');
    }
  };

  // Manual refresh
  const handleRefresh = async () => {
    addSocketEvent('🔄 Refreshing Auth', {});
    await refreshAuth();
  };

  // If still loading
  if (loading) {
    return (
      <div style={styles.container}>
        <h1>🔌 Socket Connection Test</h1>
        <div style={styles.loading}>
          <div className="spinner"></div>
          <p>Loading authentication...</p>
        </div>
      </div>
    );
  }

  // If not authenticated
  if (!user) {
    return (
      <div style={styles.container}>
        <h1>🔌 Socket Connection Test</h1>
        <div style={styles.card}>
          <h2>⚠️ Not Authenticated</h2>
          <p>You need to be logged in to test socket connections.</p>
          <button 
            onClick={() => navigate('/login')}
            style={styles.buttonPrimary}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1>🔌 Socket Connection Test</h1>
      
      {/* Connection Status Card */}
      <div style={styles.card}>
        <h2>📡 Connection Status</h2>
        <div style={styles.statusGrid}>
          <div>
            <strong>Socket Status:</strong>
            <span style={{ 
              marginLeft: '10px',
              color: isConnected ? '#28a745' : '#dc3545',
              fontWeight: 'bold'
            }}>
              {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </span>
          </div>
          {socketId && (
            <div>
              <strong>Socket ID:</strong>
              <span style={{ marginLeft: '10px', fontSize: '12px', wordBreak: 'break-all' }}>
                {socketId}
              </span>
            </div>
          )}
          <div>
            <strong>User:</strong>
            <span style={{ marginLeft: '10px' }}>
              {user?.name || user?.email || user?._id}
            </span>
          </div>
          <div>
            <strong>User ID:</strong>
            <span style={{ marginLeft: '10px', fontSize: '12px', wordBreak: 'break-all' }}>
              {user?._id}
            </span>
          </div>
        </div>
        {connectionError && (
          <div style={styles.errorBox}>
            <strong>⚠️ Error:</strong> {connectionError}
          </div>
        )}
        <div style={styles.buttonGroup}>
          <button 
            onClick={handleRefresh}
            style={styles.buttonSecondary}
          >
            🔄 Refresh Auth
          </button>
        </div>
      </div>

      {/* Room Controls */}
      <div style={styles.card}>
        <h2>🏠 Room Controls</h2>
        <div style={styles.roomControls}>
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Enter room ID"
            style={styles.input}
            disabled={isInRoom}
          />
          <div style={styles.buttonGroup}>
            <button 
              onClick={joinRoom}
              style={isInRoom ? styles.buttonDisabled : styles.buttonSuccess}
              disabled={isInRoom || !isConnected}
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
        </div>
        <div style={styles.roomStatus}>
          <strong>Status:</strong> 
          <span style={{ 
            marginLeft: '10px',
            color: isInRoom ? '#28a745' : '#6c757d'
          }}>
            {isInRoom ? `✅ In Room: ${roomId}` : '❌ Not in any room'}
          </span>
        </div>
      </div>

      {/* Chat Section */}
      <div style={styles.card}>
        <h2>💬 Chat Test</h2>
        <div style={styles.chatBox}>
          <div style={styles.messagesContainer}>
            {testMessages.length === 0 ? (
              <p style={styles.emptyMessage}>No messages yet. Send a test message!</p>
            ) : (
              testMessages.map((msg, idx) => (
                <div 
                  key={idx} 
                  style={{
                    ...styles.message,
                    backgroundColor: msg.sent ? '#e3f2fd' : '#f3e5f5',
                    alignSelf: msg.sent ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={styles.messageHeader}>
                    <strong>{msg.sender}</strong>
                    <span style={styles.messageTime}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                    {msg.sent && <span style={styles.sentBadge}>✅ Sent</span>}
                    {msg.received && <span style={styles.receivedBadge}>📩 Received</span>}
                  </div>
                  <div style={styles.messageText}>{msg.text}</div>
                </div>
              ))
            )}
          </div>
          <div style={styles.chatInput}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a test message..."
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
          </div>
        </div>
      </div>

      {/* Event Log */}
      <div style={styles.card}>
        <h2>📋 Event Log</h2>
        <div style={styles.eventLog}>
          {socketEvents.length === 0 ? (
            <p style={styles.emptyMessage}>No events logged yet.</p>
          ) : (
            socketEvents.slice().reverse().map((event, idx) => (
              <div key={idx} style={styles.eventItem}>
                <span style={styles.eventTime}>
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
                <span style={styles.eventName}>{event.event}</span>
                <span style={styles.eventData}>
                  {JSON.stringify(event.data).slice(0, 50)}
                </span>
              </div>
            ))
          )}
        </div>
        <button 
          onClick={() => setSocketEvents([])}
          style={styles.buttonSecondary}
        >
          🗑️ Clear Log
        </button>
      </div>

      <style jsx>{`
        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #007bff;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// Styles
const styles = {
  container: {
    padding: '20px',
    maxWidth: '900px',
    margin: '0 auto'
  },
  loading: {
    textAlign: 'center',
    padding: '40px'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    border: '1px solid #e0e0e0'
  },
  statusGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    marginBottom: '15px'
  },
  errorBox: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '15px'
  },
  roomControls: {
    display: 'flex',
    gap: '10px',
    marginBottom: '10px',
    flexWrap: 'wrap'
  },
  roomStatus: {
    marginTop: '10px',
    padding: '10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  buttonPrimary: {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  buttonSecondary: {
    padding: '8px 16px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  buttonSuccess: {
    padding: '8px 16px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  buttonDanger: {
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  buttonDisabled: {
    padding: '8px 16px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'not-allowed',
    fontSize: '14px',
    opacity: 0.65
  },
  input: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px',
    minWidth: '150px'
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
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
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
  messageText: {
    fontSize: '14px',
    wordBreak: 'break-word'
  },
  sentBadge: {
    color: '#28a745',
    fontSize: '11px',
    fontWeight: 'bold'
  },
  receivedBadge: {
    color: '#6f42c1',
    fontSize: '11px',
    fontWeight: 'bold'
  },
  chatInput: {
    display: 'flex',
    gap: '10px',
    padding: '10px',
    borderTop: '1px solid #ddd',
    backgroundColor: 'white'
  },
  emptyMessage: {
    color: '#999',
    textAlign: 'center',
    margin: 'auto'
  },
  eventLog: {
    height: '200px',
    overflow: 'auto',
    backgroundColor: '#1e1e1e',
    color: '#d4d4d4',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '10px',
    fontFamily: 'monospace',
    fontSize: '12px'
  },
  eventItem: {
    padding: '4px 0',
    borderBottom: '1px solid #333',
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  eventTime: {
    color: '#858585',
    minWidth: '80px'
  },
  eventName: {
    color: '#4ec9b0',
    fontWeight: 'bold'
  },
  eventData: {
    color: '#ce9178',
    fontSize: '11px',
    wordBreak: 'break-all'
  }
};

export default SocketTestPage;