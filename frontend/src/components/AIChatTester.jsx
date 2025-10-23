import React, { useState } from 'react';
import { Card, Button, Form, Alert, Badge, ListGroup } from 'react-bootstrap';

const AIChatTester = () => {
  const [testMessage, setTestMessage] = useState('');
  const [responses, setResponses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('unknown');

  const testMessages = [
    'xin chào',
    'tìm áo màu xanh',
    'tìm giày dưới 500k',
    'quần jean màu đen',
    'sản phẩm giá rẻ',
    'áo thun trắng',
    'size L có vừa không?',
    'có khuyến mãi nào không?',
    'hướng dẫn đặt hàng'
  ];

  const addResponse = (type, message, data = null, error = null) => {
    const response = {
      id: Date.now(),
      type,
      message,
      data,
      error,
      timestamp: new Date().toLocaleTimeString()
    };
    setResponses(prev => [response, ...prev]);
  };

  const testConnection = async () => {
    setIsLoading(true);
    try {
      // Test backend connection
      const response = await fetch('http://localhost:8000/ai/test/');
      if (response.ok) {
        const data = await response.json();
        setConnectionStatus('connected');
        addResponse('success', 'Backend connection successful', data);
      } else {
        setConnectionStatus('error');
        addResponse('error', `Backend connection failed: ${response.status}`);
      }
    } catch (error) {
      setConnectionStatus('error');
      addResponse('error', 'Cannot connect to backend', null, error.message);
    }
    setIsLoading(false);
  };

  const debugAIChat = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authTokens') ?
        JSON.parse(localStorage.getItem('authTokens')).access : null;

      const response = await fetch('http://localhost:8000/ai/debug/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `JWT ${token}` })
        },
        body: JSON.stringify({
          message: 'tìm áo màu xanh'
        })
      });

      if (response.ok) {
        const data = await response.json();
        addResponse('info', 'Debug AI Chat successful', data);
      } else {
        const errorText = await response.text();
        addResponse('error', `Debug AI Chat failed: ${response.status}`, null, errorText);
      }
    } catch (error) {
      addResponse('error', 'Debug AI Chat request failed', null, error.message);
    }
    setIsLoading(false);
  };

  const testAIChat = async (message) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authTokens') ? 
        JSON.parse(localStorage.getItem('authTokens')).access : null;

      if (!token) {
        addResponse('warning', 'No auth token found. Please login first.');
        setIsLoading(false);
        return;
      }

      const requestData = {
        message: message,
        context: {}
      };

      addResponse('info', `Sending: "${message}"`);

      const response = await fetch('http://localhost:8000/ai/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `JWT ${token}`
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const data = await response.json();
        addResponse('success', `AI Response: "${data.message}"`, data);
      } else {
        const errorText = await response.text();
        addResponse('error', `AI Chat failed: ${response.status}`, null, errorText);
      }
    } catch (error) {
      addResponse('error', 'AI Chat request failed', null, error.message);
    }
    setIsLoading(false);
  };

  const testAllMessages = async () => {
    for (const message of testMessages) {
      await testAIChat(message);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
    }
  };

  const clearResponses = () => {
    setResponses([]);
  };

  const getStatusColor = (type) => {
    switch (type) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'danger';
      case 'info': return 'info';
      default: return 'secondary';
    }
  };

  const getConnectionBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Badge bg="success">Connected</Badge>;
      case 'error':
        return <Badge bg="danger">Disconnected</Badge>;
      default:
        return <Badge bg="secondary">Unknown</Badge>;
    }
  };

  return (
    <Card>
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <h5>🧪 AI Chat Tester</h5>
          {getConnectionBadge()}
        </div>
      </Card.Header>
      <Card.Body>
        {/* Connection Test */}
        <div className="mb-3">
          <Button
            variant="outline-primary"
            onClick={testConnection}
            disabled={isLoading}
            className="me-2"
          >
            Test Connection
          </Button>
          <Button
            variant="outline-warning"
            onClick={debugAIChat}
            disabled={isLoading}
            className="me-2"
          >
            🔧 Debug AI
          </Button>
          <Button
            variant="outline-success"
            onClick={testAllMessages}
            disabled={isLoading}
            className="me-2"
          >
            Test All Messages
          </Button>
          <Button
            variant="outline-secondary"
            onClick={clearResponses}
            disabled={isLoading}
          >
            Clear
          </Button>
        </div>

        {/* Custom Message Test */}
        <Form className="mb-3">
          <div className="d-flex">
            <Form.Control
              type="text"
              placeholder="Enter test message..."
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && testAIChat(testMessage)}
            />
            <Button 
              variant="primary" 
              onClick={() => testAIChat(testMessage)}
              disabled={isLoading || !testMessage.trim()}
              className="ms-2"
            >
              Test
            </Button>
          </div>
        </Form>

        {/* Quick Test Buttons */}
        <div className="mb-3">
          <h6>Quick Tests:</h6>
          <div className="d-flex flex-wrap gap-2">
            {testMessages.map((msg, index) => (
              <Button
                key={index}
                variant="outline-info"
                size="sm"
                onClick={() => testAIChat(msg)}
                disabled={isLoading}
              >
                {msg}
              </Button>
            ))}
          </div>
        </div>

        {/* Auth Status */}
        <div className="mb-3">
          <h6>Authentication Status:</h6>
          {localStorage.getItem('authTokens') ? (
            <Alert variant="success" className="py-2">
              ✅ Auth token found in localStorage
            </Alert>
          ) : (
            <Alert variant="warning" className="py-2">
              ⚠️ No auth token found. Please <a href="/login">login</a> first.
            </Alert>
          )}
        </div>

        {/* Responses */}
        {responses.length > 0 && (
          <div>
            <h6>Test Results:</h6>
            <ListGroup style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {responses.map((response) => (
                <ListGroup.Item 
                  key={response.id}
                  variant={getStatusColor(response.type)}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <strong>{response.message}</strong>
                      {response.data && (
                        <details className="mt-2">
                          <summary>Response Data</summary>
                          <pre className="mt-1" style={{fontSize: '0.8rem', maxHeight: '200px', overflow: 'auto'}}>
                            {JSON.stringify(response.data, null, 2)}
                          </pre>
                        </details>
                      )}
                      {response.error && (
                        <div className="mt-1 text-danger" style={{fontSize: '0.9rem'}}>
                          Error: {response.error}
                        </div>
                      )}
                    </div>
                    <small className="text-muted ms-2">{response.timestamp}</small>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-3">
          <h6>Instructions:</h6>
          <ol className="small">
            <li>Make sure Django server is running on port 8000</li>
            <li>Login to get authentication token</li>
            <li>Click "Test Connection" to verify backend</li>
            <li>Use quick test buttons or enter custom messages</li>
            <li>Check responses for errors or success</li>
          </ol>
        </div>
      </Card.Body>
    </Card>
  );
};

export default AIChatTester;
