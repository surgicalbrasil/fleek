# Wallet Connect Testing Guide

## Overview
This guide provides step-by-step instructions for testing the WalletConnect functionality in the Fleek application.

## Prerequisites
- Web browser (Chrome/Firefox/Edge recommended)
- MetaMask extension installed (optional)
- Mobile wallet with WalletConnect support (optional)
- Test ETH (for any transactions)

## Test Environment Setup
1. Host the application on a local or live server
2. Open the application in your browser
3. Make sure you have the debug tools visible (debug button in bottom right)

## Test Cases

### 1. Basic Library Availability

**Test:** Verify all required libraries are loaded
**Steps:**
1. Open the browser console (F12 or right-click > Inspect > Console)
2. Click the "Debug Wallet" button in the bottom right
3. Check the "Verificando bibliotecas" section
**Expected Results:** All libraries should show as available with ✅ marks

### 2. MetaMask Connection

**Test:** Connect using MetaMask
**Steps:**
1. Click "Login with Wallet" option
2. Click "Connect Wallet" button
3. Select MetaMask from the provider options
4. Complete the MetaMask connection process
**Expected Results:**
- MetaMask popup should appear asking for connection permission
- After approval, wallet address should appear in the UI
- Session should be established and wallet info displayed

### 3. WalletConnect Connection

**Test:** Connect using WalletConnect
**Steps:**
1. Click "Login with Wallet" option
2. Click "Connect Wallet" button
3. Select WalletConnect from the provider options
4. Scan QR code with mobile wallet app
**Expected Results:**
- QR code should be displayed
- After scanning, connection should be established
- Wallet address should appear in the UI

### 4. Coinbase Wallet Connection

**Test:** Connect using Coinbase Wallet
**Steps:**
1. Click "Login with Wallet" option
2. Click "Connect Wallet" button
3. Select Coinbase Wallet from the provider options
4. Complete connection process
**Expected Results:**
- Coinbase Wallet connection option should work
- After approval, wallet address should appear in the UI

### 5. Session Persistence

**Test:** Verify session persists after page refresh
**Steps:**
1. Connect wallet successfully
2. Refresh the page
3. Observe if connection is restored
**Expected Results:** Wallet connection should be automatically restored

### 6. Wallet Disconnection

**Test:** Test wallet disconnect functionality
**Steps:**
1. Connect wallet successfully
2. Click "Logout" button
3. Verify wallet is disconnected
**Expected Results:**
- Wallet should disconnect
- UI should reset to initial state
- Session data should be cleared

### 7. Document Access

**Test:** Access document with wallet authentication
**Steps:**
1. Connect wallet successfully (use an authorized wallet address)
2. Click "Acessar Documento" button
**Expected Results:** PDF document should load and display

### 8. Integration Test

**Test:** Full workflow test
**Steps:**
1. Open application
2. Connect wallet
3. Access document
4. Disconnect wallet
5. Try to access document again
**Expected Results:** Each step should work as expected, and after disconnecting, document access should be denied

## Reporting Issues
If you encounter any issues during testing, please document:
- Browser and version
- Wallet type and version
- Exact steps to reproduce
- Any error messages from the console
- Screenshots if applicable
