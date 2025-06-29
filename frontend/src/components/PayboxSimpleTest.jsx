import React, { useState, useContext } from "react";
import { Card, Button, Alert } from "react-bootstrap";
import UserContext from "../context/userContext";
import httpService from "../services/httpService";

function PayboxSimpleTest() {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const { userInfo, authTokens } = useContext(UserContext);

  const testWalletAPI = async () => {
    setLoading(true);
    setResult("");
    
    try {
      console.log("=== SIMPLE WALLET TEST ===");
      console.log("User:", userInfo);
      console.log("Auth tokens present:", !!authTokens);
      
      const response = await fetch("http://localhost:8000/api/paybox/wallet/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `JWT ${authTokens?.access}`
        }
      });
      
      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);
      
      const data = await response.json();
      console.log("Response data:", data);
      
      if (response.ok) {
        setResult(`✅ Success: ${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`❌ Error ${response.status}: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setResult(`❌ Network Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testTransactionsAPI = async () => {
    setLoading(true);
    setResult("");
    
    try {
      console.log("=== SIMPLE TRANSACTIONS TEST ===");
      
      const response = await fetch("http://localhost:8000/api/paybox/transactions/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `JWT ${authTokens?.access}`
        }
      });
      
      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);
      
      if (response.ok) {
        setResult(`✅ Transactions Success: ${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`❌ Transactions Error ${response.status}: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setResult(`❌ Network Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-3">
      <Card.Header>
        <h6 className="mb-0">🧪 Simple API Test</h6>
      </Card.Header>
      <Card.Body>
        <div className="mb-3">
          <strong>User:</strong> {userInfo?.username || "Not logged in"}
        </div>
        
        <div className="mb-3">
          <strong>Auth Token:</strong> {authTokens?.access ? "Present" : "Missing"}
        </div>
        
        <div className="mb-3">
          <Button
            variant="primary"
            onClick={testWalletAPI}
            disabled={loading}
            className="me-2"
          >
            {loading ? "Testing..." : "Test Wallet API"}
          </Button>

          <Button
            variant="secondary"
            onClick={testTransactionsAPI}
            disabled={loading}
            className="me-2"
          >
            {loading ? "Testing..." : "Test Transactions API"}
          </Button>

          <Button
            variant="info"
            onClick={() => window.location.reload()}
            size="sm"
          >
            Refresh Page
          </Button>
        </div>
        
        {result && (
          <Alert variant={result.includes("✅") ? "success" : "danger"}>
            <pre className="small mb-0" style={{whiteSpace: "pre-wrap"}}>
              {result}
            </pre>
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
}

export default PayboxSimpleTest;
