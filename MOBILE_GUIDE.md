# Mobile & Tablet Usage Guide

This guide explains how to use your **Personal Accounts Manager** on your mobile (Android/iOS) and tablet devices.

## 1. How it works
Your application is now a **Progressive Web App (PWA)**. This means it can be "installed" on your phone just like a real app, without needing to go to the Play Store.

## 2. Using it on your Mobile/Tablet

To use the app on your mobile device, the device needs to "see" your computer where the app is running.

### Option A: Using "Live Server" (Recommended)
If you use VS Code:
1.  Right-click `index.html` and choose "Open with Live Server".
2.  Note the port number (usually `5500`).
3.  Find your computer's **Local IP Address**:
    *   Open Command Prompt (`cmd`) and type `ipconfig`.
    *   Look for "IPv4 Address" (e.g., `192.168.1.5`).
4.  On your mobile phone, ensure you are connected to the **same WiFi**.
5.  Open Chrome on your phone and type: `http://192.168.1.5:5500` (Replace the IP with yours).

### Option B: Using Python (Built-in)
If you have Python installed:
1.  Open Command Prompt in the project folder.
2.  Run: `python -m http.server 8000`
3.  On your phone, go to `http://<YOUR_IP_ADDRESS>:8000`.

## 3. Troubleshooting Connection (If it won't open)
If you see "Site cannot be reached" or a blank page on your phone:

### Check 1: Windows Firewall
Windows often blocks other devices from connecting to your PC.
1.  Search for **"Windows Defender Firewall"** in your Start menu.
2.  Click **"Allow an app or feature through Windows Defender Firewall"**.
3.  Click **"Change settings"** (Admin).
4.  Find **"Node.js JavaScript Runtime"** or your code editor and ensure **"Private"** is checked.
5.  **Alternative**: Temporarily turn off Firewall for Private networks to test if it's the cause.

### Check 2: Network Type
Ensure your WiFi is set to **"Private"** on your PC, not "Public". Windows blocks incoming connections on Public networks.

### Check 3: Browser Cache
If it worked before but isn't now, try clearing Chrome's cache on your mobile or use **Incognito mode**.

## 4. Installing the App (Android)
Once you have the page open on Chrome for Android:
1.  Tap the **three dots** menu (⋮) in the top-right corner.
2.  Tap **"Add to Home screen"** or **"Install App"**.
3.  You will now see the **PAM** icon on your home screen!
4.  Opening it will launch the app in full-screen mode, looking exactly like a native Android app.

## 5. Syncing Data
**IMPORTANT**: Your mobile app and PC app are separate. Data you enter on PC does not automatically appear on mobile, and vice-versa.

To sync data:
1.  **On Source Device (e.g., PC)**: Go to **Settings** -> **Download Data**. This saves a `.json` file.
2.  **Transfer**: Send this file to your other device (via WhatsApp, Email, or USB).
3.  **On Target Device (e.g., Mobile)**: Go to **Settings** -> **Upload Data** and select the file.
