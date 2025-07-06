import React from "react";
import { Card, Badge } from "react-bootstrap";
import { Link } from "react-router-dom";
import Rating from "./rating";
import { formatVND } from "../utils/currency";

function Product({ product, showSoldCount = false }) {
  return (
    <Card className="my-3 p-3 rounded">
      <Link
        to={`/products/${product.id}`}
        onClick={() => {
          window.scrollTo(0, 0);
        }}
      >
        <Card.Img src={product.image} />
      </Link>
      <Card.Body>
        <Link
          to={`/products/${product.id}`}
          className="text-decoration-none"
          onClick={() => {
            window.scrollTo(0, 0);
          }}
        >
          <Card.Title as="div">
            <strong>{product.name}</strong>
          </Card.Title>
        </Link>
        <Card.Text as="div">
          <div className="my-2">
            <Rating
              value={product.rating}
              text={`${product.numReviews} reviews`}
              color={"#f8e825"}
            />
          </div>
        </Card.Text>
        
        {showSoldCount && product.total_sold > 0 && (
          <Card.Text as="div" className="mb-2">
            <Badge bg="success">
              <i className="fas fa-shopping-cart me-1"></i>
              Đã bán {product.total_sold}
            </Badge>
          </Card.Text>
        )}
        
        <Card.Text as="h3">{formatVND(product.price)}</Card.Text>
      </Card.Body>
    </Card>
  );
}

export default Product;
