// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

const repoBase = "/hayya-alalfalah"; // path repo GitHub Pages

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter basename={repoBase}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
