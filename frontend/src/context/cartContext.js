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

  const addItemToCart = async (cartItem, qtyParam = 1) => {
    // cartItem có thể là object {id, qty, variant_id, color, size} hoặc chỉ là id (backward compatibility)
    let id, qty, variant_id, color, size;

    if (typeof cartItem === 'object') {
      ({ id, qty, variant_id, color, size } = cartItem);
    } else {
      id = cartItem;
      qty = qtyParam;
    }

    // Tạo unique key cho sản phẩm (bao gồm cả biến thể)
    const uniqueKey = variant_id ? `${id}-${variant_id}` : `${id}`;
    const existingItem = productsInCart.find((prod) => prod.uniqueKey === uniqueKey);

    if (existingItem) {
      updateItemQty(uniqueKey, existingItem.qty + qty);
      return;
    }

    try {
      const { data } = await httpService.get(`/api/products/${id}/`);

      let productPrice = data.price;
      let productStock = data.countInStock;

      // Nếu có biến thể, lấy thông tin từ biến thể
      if (variant_id) {
        const variant = data.variants?.find(v => v.id === variant_id);
        if (variant) {
          productPrice = variant.price;
          productStock = variant.stock_quantity;
        }
      }

      const product = {
        id: data.id,
        uniqueKey: uniqueKey,
        name: data.name,
        qty: qty,
        image: data.image,
        price: productPrice,
        countInStock: productStock,
        variant_id: variant_id || null,
        color: color || null,
        size: size || null,
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

  const updateItemQty = (uniqueKey, qty) => {
    const item = productsInCart.find((prod) => prod.uniqueKey === uniqueKey);

    if (!item || item.qty == Number(qty)) return;

    const product = { ...item };
    product.qty = Number(qty);

    const updatedProductsInCart = productsInCart.map((prod) =>
      prod.uniqueKey === product.uniqueKey ? product : prod
    );
    localStorage.setItem("cartItems", JSON.stringify(updatedProductsInCart));
    setProductsInCart(updatedProductsInCart);
  };

  const removeFromCart = (uniqueKey) => {
    const updatedProductsInCart = productsInCart.filter(
      (prod) => prod.uniqueKey !== uniqueKey
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
  const totalPrice = totalItemsPrice + shippingPrice + taxPrice;

  const placeOrder = async () => {
    try {
      setError(""); // Reset lỗi trước khi gửi

      // Chuẩn bị dữ liệu order items với thông tin biến thể
      const orderItems = productsInCart.map(item => ({
        id: item.id,
        qty: item.qty,
        variant_id: item.variant_id,
        color: item.color,
        size: item.size
      }));

      const { data } = await httpService.post("/api/placeorder/", {
        orderItems: orderItems,
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