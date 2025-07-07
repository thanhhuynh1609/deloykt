import React, { useEffect, useState } from "react";
import { Form } from "react-bootstrap";
import { useNavigate } from 'react-router-dom';

function SearchBox({ keyword, setKeyword }) {
  const [keywordText, setKeywordText] = useState(keyword);
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(window.location.search);
  const brandParam = queryParams.get("brand")
    ? Number(queryParams.get("brand"))
    : 0;
  const categoryParam = queryParams.get("category")
    ? Number(queryParams.get("category"))
    : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate(`/search?keyword=${keywordText}&brand=${brandParam}&category=${categoryParam}`);
    setKeyword(keywordText);
  };

  return (
    <Form onSubmit={handleSubmit} className="d-flex search-form position-relative">
      <Form.Control
        type="text"
        placeholder="Tìm sản phẩm..."
        value={keywordText}
        onChange={(e) => setKeywordText(e.currentTarget.value)}
        className="me-2 search-input-with-icon"
      />
      <button type="submit" className="search-icon-btn">
        <i className="fas fa-search"></i>
      </button>
    </Form>
  );
}

export default SearchBox;
