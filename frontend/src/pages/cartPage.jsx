import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Row,
  Col,
  ListGroup,
  Image,
  Button,
  Card,
} from "react-bootstrap";
import Message from "../components/message";
import CartContext from "../context/cartContext";
import { formatVND } from "../utils/currency";

function CartPage() {
  const { error, productsInCart, updateItemQty, removeFromCart } =
    useContext(CartContext);

  const navigate = useNavigate();

  const handleCheckOut = () => {
    navigate("/login?redirect=shipping");
  };

  if (error !== "")
    return (
      <Message variant="danger">
        <h4>{error}</h4>
      </Message>
    );

  return (
    <Row>
      <Col md={8}>
        <h2 className="mb-4">🛒 Giỏ hàng</h2>
        {productsInCart.length === 0 ? (
          <Message variant="info">
            Giỏ hàng của bạn đang trống. <Link to="/">Tiếp tục mua sắm</Link>
          </Message>
        ) : (
          <ListGroup variant="flush">
            {productsInCart.map((product) => (
              <ListGroup.Item key={product.uniqueKey || product.id} className="d-flex align-items-center">
                <Image
                  src={product.image}
                  alt={product.name}
                  fluid
                  roundedCircle
                  style={{ width: "60px", height: "60px", objectFit: "cover", marginRight: "12px" }}
                />
                <div className="flex-grow-1">
                  <Link
                    to={`/products/${product.id}`}
                    className="text-decoration-none fw-semibold"
                  >
                    {product.name}
                  </Link>
                  {(product.color || product.size) && (
                    <div className="text-muted small">
                      {product.color && <span>Màu: {product.color}</span>}
                      {product.color && product.size && <span> | </span>}
                      {product.size && <span>Size: {product.size}</span>}
                    </div>
                  )}
                  <div className="text-muted">{formatVND(product.price)}</div>
                </div>
                <div className="d-flex align-items-center">
                  <Button
                    variant="light"
                    size="sm"
                    disabled={product.qty <= 1}
                    onClick={() => updateItemQty(product.uniqueKey || product.id, product.qty - 1)}
                    className="border rounded-circle me-2"
                  >
                    <i className="fas fa-minus"></i>
                  </Button>

                  <span className="fw-bold">{product.qty}</span>

                  <Button
                    variant="light"
                    size="sm"
                    disabled={product.qty >= product.countInStock}
                    onClick={() => updateItemQty(product.uniqueKey || product.id, product.qty + 1)}
                    className="border rounded-circle ms-2"
                  >
                    <i className="fas fa-plus"></i>
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="light"
                  size="sm"
                  className="ms-3"
                  onClick={() => removeFromCart(product.uniqueKey || product.id)}
                >
                  <i className="fas fa-trash"></i>
                </Button>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Col>

      <Col md={4}>
        <Card className="shadow-sm">
          <ListGroup variant="flush">
            <ListGroup.Item>
              <h5 className="fw-bold mb-3">
                Tạm tính: {productsInCart.reduce((acc, product) => acc + product.qty, 0)} sản phẩm
              </h5>
              <h4 className="text-primary">
                {formatVND(
                  productsInCart.reduce(
                    (acc, product) => acc + product.qty * product.price,
                    0
                  )
                )}
              </h4>
            </ListGroup.Item>
            <ListGroup.Item>
              <Button
                type="button"
                className="w-100"
                disabled={productsInCart.length === 0}
                onClick={handleCheckOut}
                style={{ textTransform: "none" }}
                variant="success"
              >
                Tiến hành thanh toán
              </Button>
            </ListGroup.Item>
          </ListGroup>
        </Card>
      </Col>
    </Row>
  );
}

export default CartPage;
