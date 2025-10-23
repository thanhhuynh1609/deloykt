import React, { useState } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import AIChatTester from '../components/AIChatTester';
import AIChatbox from '../components/AIChatbox';

const AIChatTestPage = () => {
  const [showChatbox, setShowChatbox] = useState(false);

  return (
    <Container className="py-4">
      <Row>
        <Col>
          <h2>🤖 AI Chat Test Page</h2>
          <p>Use this page to test AI Chat functionality before using the main chatbox</p>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          <AIChatTester />
        </Col>
        <Col lg={4}>
          <div className="sticky-top" style={{top: '20px'}}>
            <h5>Live Chatbox Test</h5>
            <p className="small text-muted">
              Test the actual chatbox component here
            </p>
            <Button
              variant="primary"
              onClick={() => setShowChatbox(true)}
              className="mb-3"
            >
              Open AI Chatbox
            </Button>

            <AIChatbox
              show={showChatbox}
              onHide={() => setShowChatbox(false)}
              userInfo={{first_name: 'Test User'}}
            />

            <div className="mt-3">
              <h6>Quick Links:</h6>
              <div className="d-grid gap-2">
                <Button variant="outline-secondary" size="sm" href="/login">
                  Login Page
                </Button>
                <Button variant="outline-secondary" size="sm" href="/">
                  Home Page
                </Button>
                <Button variant="outline-secondary" size="sm" href="/admin">
                  Admin Panel
                </Button>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default AIChatTestPage;
