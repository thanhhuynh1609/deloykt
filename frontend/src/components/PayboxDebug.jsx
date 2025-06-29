import React, { useContext, useEffect, useState } from "react";
import { Card, Button, Alert } from "react-bootstrap";
import UserContext from "../context/userContext";
import PayboxContext from "../context/payboxContext";
import httpService from "../services/httpService";

function PayboxDebug() {
  const { userInfo, authTokens } = useContext(UserContext);
  const { wallet, error: payboxError } = useContext(PayboxContext);
  const [testResult, setTestResult] = useState("");
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    setTestResult("");
    
    try {
      console.log("=== PAYBOX DEBUG TEST ===");
      console.log("UserInfo:", userInfo);
      console.log("AuthTokens:", authTokens ? "Present" : "Missing");
      
      // Test direct API call
      const response = await httpService.get("/api/paybox/wallet/");
      console.log("API Response:", response.data);
      setTestResult(`✅ API Success: ${JSON.stringify(response.data, null, 2)}`);
    } catch (ex) {
      console.error("API Error:", ex);
      setTestResult(`❌ API Error: ${ex.response?.status} - ${ex.response?.data?.error || ex.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-3">
      <Card.Header>
        <h6 className="mb-0">🔧 Paybox Debug Info</h6>
      </Card.Header>
      <Card.Body>
        <div className="mb-3">
          <strong>User Info:</strong>
          <pre className="small">{JSON.stringify(userInfo, null, 2)}</pre>
        </div>
        
        <div className="mb-3">
          <strong>Auth Tokens:</strong>
          <pre className="small">{authTokens ? "Present" : "Missing"}</pre>
        </div>
        
        <div className="mb-3">
          <strong>Wallet Data:</strong>
          <pre className="small">{JSON.stringify(wallet, null, 2)}</pre>
        </div>
        
        {payboxError && (
          <Alert variant="danger">
            <strong>Paybox Error:</strong> {payboxError}
          </Alert>
        )}
        
        <Button 
          variant="primary" 
          onClick={testAPI}
          disabled={loading}
          className="mb-3"
        >
          {loading ? "Testing..." : "Test API Direct"}
        </Button>
        
        {testResult && (
          <Alert variant={testResult.includes("✅") ? "success" : "danger"}>
            <pre className="small mb-0">{testResult}</pre>
          </Alert>
        )}
        
        <div className="mt-3">
          <small className="text-muted">
            Check browser console for detailed logs
          </small>
        </div>
      </Card.Body>
    </Card>
  );
}

export default PayboxDebug;
