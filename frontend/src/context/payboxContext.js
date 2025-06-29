import React, { createContext, useState, useContext, useEffect } from "react";
import httpService from "../services/httpService";
import UserContext from "./userContext";

const PayboxContext = createContext();

export const PayboxProvider = ({ children }) => {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { userInfo, authTokens, loading: userLoading } = useContext(UserContext);

  // Lấy thông tin ví
  const fetchWallet = async (retryCount = 0) => {
    if (!userInfo || !authTokens) {
      console.log("No userInfo or authTokens, skipping wallet fetch");
      return;
    }

    try {
      setLoading(true);
      console.log("Fetching wallet for user:", userInfo.username);
      const { data } = await httpService.get("/api/paybox/wallet/");
      console.log("Wallet data received:", data);
      setWallet(data);
      setError("");
    } catch (ex) {
      console.error("Error fetching wallet:", ex);
      console.error("Error response:", ex.response?.data);
      console.error("Error status:", ex.response?.status);

      // Retry once if 401 (authentication issue)
      if (ex.response?.status === 401 && retryCount < 1) {
        console.log("Got 401, retrying in 500ms...");
        setTimeout(() => fetchWallet(retryCount + 1), 500);
        return;
      }

      if (ex.response?.status === 401) {
        setError("Vui lòng đăng nhập lại");
      } else if (ex.response?.status === 403) {
        setError("Không có quyền truy cập");
      } else {
        setError(`Không thể tải thông tin ví: ${ex.response?.data?.error || ex.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Lấy lịch sử giao dịch
  const fetchTransactions = async (retryCount = 0) => {
    if (!userInfo || !authTokens) {
      console.log("No userInfo or authTokens, skipping transactions fetch");
      return;
    }

    try {
      setLoading(true);
      console.log("Fetching transactions for user:", userInfo.username);
      const { data } = await httpService.get("/api/paybox/transactions/");
      console.log("Transactions data received:", data.length, "transactions");
      setTransactions(data);
      setError("");
    } catch (ex) {
      console.error("Error fetching transactions:", ex);

      // Retry once if 401 (authentication issue)
      if (ex.response?.status === 401 && retryCount < 1) {
        console.log("Got 401, retrying transactions in 500ms...");
        setTimeout(() => fetchTransactions(retryCount + 1), 500);
        return;
      }

      setError("Không thể tải lịch sử giao dịch");
    } finally {
      setLoading(false);
    }
  };

  // Tạo payment intent để nạp tiền
  const createDepositIntent = async (amount) => {
    try {
      console.log("=== PayboxContext: createDepositIntent ===");
      console.log("Amount:", amount);

      // Không set loading để tránh re-render component
      const { data } = await httpService.post("/api/paybox/deposit/", {
        amount: amount
      });

      console.log("API response data:", data);
      setError("");
      return data;
    } catch (ex) {
      console.error("Error creating deposit intent:", ex);
      console.error("Error response:", ex.response?.data);
      setError("Không thể tạo yêu cầu nạp tiền");
      throw ex;
    }
  };

  // Xác nhận nạp tiền thành công
  const confirmDeposit = async (paymentIntentId) => {
    try {
      setLoading(true);
      const { data } = await httpService.post("/api/paybox/deposit/confirm/", {
        payment_intent_id: paymentIntentId
      });
      
      // Cập nhật lại thông tin ví và giao dịch
      await fetchWallet();
      await fetchTransactions();
      
      setError("");
      return data;
    } catch (ex) {
      setError("Không thể xác nhận nạp tiền");
      console.error("Error confirming deposit:", ex);
      throw ex;
    } finally {
      setLoading(false);
    }
  };

  // Thanh toán đơn hàng bằng ví
  const payWithPaybox = async (orderId) => {
    try {
      setLoading(true);
      const { data } = await httpService.post("/api/paybox/payment/", {
        order_id: orderId
      });
      
      // Cập nhật lại thông tin ví và giao dịch
      await fetchWallet();
      await fetchTransactions();
      
      setError("");
      return data;
    } catch (ex) {
      const errorMessage = ex.response?.data?.error || "Không thể thanh toán bằng ví";
      setError(errorMessage);
      console.error("Error paying with paybox:", ex);
      throw ex;
    } finally {
      setLoading(false);
    }
  };

  // Format số tiền VND
  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' VND';
  };

  // Kiểm tra số dư có đủ không
  const hasSufficientBalance = (amount) => {
    return wallet && wallet.balance >= amount;
  };

  // Load dữ liệu khi user đăng nhập và authentication hoàn tất
  useEffect(() => {
    console.log("PayboxContext useEffect triggered");
    console.log("userInfo:", userInfo);
    console.log("authTokens:", authTokens ? "Present" : "Missing");
    console.log("userLoading:", userLoading);

    // Chỉ fetch khi user đã đăng nhập, có token, và không đang loading
    if (userInfo && authTokens && !userLoading) {
      console.log("All conditions met, fetching wallet and transactions");
      // Delay một chút để đảm bảo JWT token đã được set
      setTimeout(() => {
        fetchWallet();
        fetchTransactions();
      }, 100);
    } else {
      console.log("Conditions not met, clearing wallet and transactions");
      setWallet(null);
      setTransactions([]);
    }
  }, [userInfo, authTokens, userLoading]);

  const contextData = {
    wallet,
    transactions,
    loading,
    error,
    fetchWallet,
    fetchTransactions,
    createDepositIntent,
    confirmDeposit,
    payWithPaybox,
    formatVND,
    hasSufficientBalance,
    setError
  };

  return (
    <PayboxContext.Provider value={contextData}>
      {children}
    </PayboxContext.Provider>
  );
};

export default PayboxContext;
