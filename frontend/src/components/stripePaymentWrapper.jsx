import React, { useState, useEffect, useRef } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import PaymentForm from './paymentForm';
import httpService from '../services/httpService';
import Message from './message';

// Cập nhật publishable key
const stripePromise = loadStripe(
  "pk_test_51RPcK7CrdiAruMyrzDn1P7rG9cpU4oiEblmxvu8NaGqojPJim3266dMKKYlg6s6mZbCyrE5HyMkiBO0D7cygWJIg00ciOGJswd"
);

export default function StripePaymentWrapper({ id }) {
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestSentRef = useRef(false);

  useEffect(() => {
    const createPaymentIntent = async () => {
      // Nếu đã gửi request hoặc đã có clientSecret, không gửi lại
      if (requestSentRef.current || clientSecret) {
        return;
      }
      
      // Đánh dấu đã gửi request
      requestSentRef.current = true;
      
      try {
        setLoading(true);
        console.log("Creating payment intent for order:", id);
        
        const { data } = await httpService.post("/api/stripe-payment/", {order: id});
        
        if (data.clientSecret) {
          console.log("Received client secret successfully");
          setClientSecret(data.clientSecret);
        } else {
          console.error("No client secret in response:", data);
          setError("Failed to initialize payment form");
        }
      } catch (ex) {
        console.error("Error creating payment intent:", ex.response?.data || ex.message);
        setError("Could not initialize payment: " + (ex.response?.data?.error || ex.message));
        // Reset flag nếu có lỗi để có thể thử lại
        requestSentRef.current = false;
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      createPaymentIntent();
    }
  }, [id, clientSecret]);

  const appearance = {
    theme: "stripe",
    variables: {
      colorPrimary: '#0570de',
    }
  };

  const options = clientSecret ? {
    clientSecret,
    appearance,
  } : {};

  if (loading) return <div>Loading payment form...</div>;
  if (error) return <Message variant="danger">{error}</Message>;
  if (!clientSecret) return <Message variant="danger">Could not initialize payment form</Message>;

  return (
    <div className="payment">
      <Elements options={options} stripe={stripePromise}>
        <PaymentForm id={id} />
      </Elements>
    </div>
  );
}