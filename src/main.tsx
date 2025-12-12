import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

import "./i18n/config";

import "simplebar-react/dist/simplebar.min.css";

import "./styles/index.css";

// Suprimir warnings de cookies en la consola
import { suppressCookieWarnings } from "./utils/suppressCookieWarnings";
suppressCookieWarnings();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
