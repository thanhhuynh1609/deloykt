import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import AISearch from './AISearch';
import './FloatingAIButton.css';

const FloatingAIButton = () => {
  const [showAISearch, setShowAISearch] = useState(false);

  return (
    <>
      <Button 
        className="floating-ai-btn d-md-none"
        onClick={() => setShowAISearch(true)}
        title="Tìm kiếm bằng AI"
      >
        <i className="fas fa-camera"></i>
      </Button>
      
      <AISearch 
        show={showAISearch} 
        onHide={() => setShowAISearch(false)} 
      />
    </>
  );
};

export default FloatingAIButton;
