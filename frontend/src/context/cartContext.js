import { createContext, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import httpService from "../services/httpService";
import UserContext from './userContext';
import { CURRENCY } from "../utils/currency";

const CartContext = createContext();

export default CartContext;

export const CartProvider = ({ children }) => {
  const [error, setError] = useState("");
  let [productsInCart, setProductsInCart] = useState(
    localStorage.getItem("cartItems")
      ? JSON.parse(localStorage.getItem("cartItems"))
      : []
  );
  const [shippingAddress, setShippingAddress] = useState(
    localStorage.getItem("shippingAddress")
      ? JSON.parse(localStorage.getItem("shippingAddress"))
      : {}
  );
  const [paymentMethod, setPaymentMethod] = useState(
    localStorage.getItem("paymentMethod")
      ? localStorage.getItem("paymentMethod")
      : "Stripe"
  );
  const [couponCode, setCouponCode] = useState(
    localStorage.getItem("couponCode") || ""
  );
  const [couponMessage, setCouponMessage] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const navigate = useNavigate();
  const { logout } = useContext(UserContext);

  const addItemToCart = async (id, qty) => {
    const item = productsInCart.find((prod) => prod.id === Number(id));

    if (item) {
      updateItemQty(id, qty);
      return;
    }

    try {
      const { data } = await httpService.get(`/api/products/${id}/`);
      const product = {
        id: data.id,
        name: data.name,
        qty: qty,
        image: data.image,
        price: data.price,
        countInStock: data.countInStock,
      };

      localStorage.setItem(
        "cartItems",
        JSON.stringify([...productsInCart, product])
      );
      setProductsInCart([...productsInCart, product]);
    } catch (ex) {
      setError(ex.message);
    }
  };

  const updateItemQty = (id, qty) => {
    const item = productsInCart.find((prod) => prod.id === Number(id));

    if (item.qty == Number(qty)) return;

    const product = { ...item };
    product.qty = Number(qty);

    const updatedProductsInCart = productsInCart.map((prod) =>
      prod.id == product.id ? product : prod
    );
    localStorage.setItem("cartItems", JSON.stringify(updatedProductsInCart));
    setProductsInCart(updatedProductsInCart);
  };

  const removeFromCart = (id) => {
    const updatedProductsInCart = productsInCart.filter(
      (prod) => prod.id !== Number(id)
    );

    localStorage.setItem("cartItems", JSON.stringify(updatedProductsInCart));
    setProductsInCart(updatedProductsInCart);
  };

  const updateShippingAddress = (address, city, postalCode, country) => {
    const newShippingAddress = {
      address,
      city,
      postalCode,
      country,
    };

    setShippingAddress(newShippingAddress);
    localStorage.setItem("shippingAddress", JSON.stringify(newShippingAddress));
  };

  const updatePaymentMethod = (method) => {
    setPaymentMethod(method);
    localStorage.setItem("paymentMethod", method);
  };

  const applyCoupon = async (code) => {
    try {
      setCouponMessage("Đang kiểm tra mã...");
      const { data } = await httpService.post("/api/coupons/check/", {
        code,
        total_price: totalPrice,
      });
      setCouponMessage(data.message);
      setDiscountAmount(data.discount_amount);
      setCouponCode(code);
      localStorage.setItem("couponCode", code);
    } catch (ex) {
      setCouponMessage(ex.response?.data?.error || "Mã giảm giá không hợp lệ hoặc đã hết hạn.");
      setDiscountAmount(0);
      setCouponCode("");
      localStorage.removeItem("couponCode");
    }
  };

  const totalItemsPrice = Math.round(
    productsInCart
      .reduce((acc, prod) => acc + prod.qty * prod.price, 0)
  );
  const shippingPrice = totalItemsPrice > CURRENCY.REDUCED_SHIPPING_THRESHOLD ?
    (totalItemsPrice >= CURRENCY.FREE_SHIPPING_THRESHOLD ? CURRENCY.FREE_SHIPPING : CURRENCY.REDUCED_SHIPPING) :
    CURRENCY.STANDARD_SHIPPING;
  const taxPrice = Math.round(0.05 * totalItemsPrice);
  const totalPrice = totalItemsPrice + shippingPrice + taxPrice ;

  const placeOrder = async () => {
    try {
      setError(""); // Reset lỗi trước khi gửi
      const { data } = await httpService.post("/api/placeorder/", {
        orderItems: productsInCart,
        shippingAddress,
        paymentMethod,
        itemsPrice: totalItemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        coupon_code: couponCode,
      });
      setProductsInCart([]);
      localStorage.removeItem("cartItems");
      localStorage.removeItem("couponCode");
      setCouponCode("");
      setDiscountAmount(0);
      setCouponMessage("");
      navigate(`/orders/${data.id}`);
    } catch (ex) {
      if (ex.response && ex.response.status === 403) {
        logout();
      } else {
        setError(ex.response?.data?.error || "Đã xảy ra lỗi khi đặt hàng");
      }
    }
  };

  const contextData = {
    error,
    productsInCart,
    addItemToCart,
    updateItemQty,
    removeFromCart,
    shippingAddress,
    updateShippingAddress,
    paymentMethod,
    updatePaymentMethod,
    totalItemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
    placeOrder,
    couponCode,
    setCouponCode,
    couponMessage,
    discountAmount,
    applyCoupon,
  };

  return (
    <CartContext.Provider value={contextData}>{children}</CartContext.Provider>
  );
};