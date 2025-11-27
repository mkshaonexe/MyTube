import React from 'react'
import ReactDOM from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import App from './App'
import AppMobile from './App.mobile'
import './index.css'

// Use mobile app for Capacitor (Android/iOS), desktop app for Electron
const AppComponent = Capacitor.isNativePlatform() ? AppMobile : App

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppComponent />
  </React.StrictMode>,
)
