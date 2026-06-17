# ⚡ IoT-Enabled Electricity Monitoring Module

> Real-time home energy monitoring system with mobile app — Lahore Garrison University Final Year Project 2026

![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS-blue)
![Framework](https://img.shields.io/badge/Framework-React%20Native%20%2F%20Flutter-61DAFB)
![Cloud](https://img.shields.io/badge/Cloud-Firebase-orange)
![Hardware](https://img.shields.io/badge/Hardware-ESP32-red)
![Status](https://img.shields.io/badge/Status-Completed-brightgreen)

---

## 🏆 Achievement

> **Top 5 Final Year Projects** at Lahore Garrison University — Showcased at **Lahore Chamber of Commerce and Industry (LCCI) 2026**

---

## 📌 Overview

Pakistan mein bijli ke meter manually read hote hain — jis ki wajah se users ko real-time usage ka pata nahi chalta aur unexpected high bills aate hain.

Yeh system ek IoT-based solution hai jo ghar ki bijli ka **real-time data measure** karta hai aur ek **mobile app** par live dikhata hai — jisme estimated bill, usage history, aur alerts sab kuch included hain.

---

## ✨ Features

- ⚡ **Real-time Monitoring** — Live Watts, Voltage, Current, kWh
- 💰 **WAPDA Bill Estimation** — Full tariff breakdown (FPA, FC Surcharge, GST 18%, QTA, Electricity Duty)
- 🔔 **Custom Alerts** — User-defined kWh threshold notifications
- 📊 **Usage History** — Graphs, stats, CSV export
- 🔐 **Secure Auth** — Firebase email/password login
- 🔄 **Billing Cycle Reset** — Monthly record saving
- 📱 **Cross-platform** — Android + iOS both supported

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile App | React Native / Flutter |
| Cloud Database | Firebase Firestore |
| Authentication | Firebase Auth |
| Embedded Firmware | C/C++ (Arduino framework) |
| Microcontroller | ESP32 |
| Communication | Wi-Fi 802.11, MQTT / HTTP |
| Security | TLS/SSL + AES encryption |

---

## 🔧 Hardware Components

- **ESP32 Microcontroller** — Brain of the system, processes sensor data & sends via Wi-Fi
- **CT Sensor (Current Transformer)** — Non-invasive current measurement (clamps around wire)
- **Voltage Sensor** — Measures ~220V Pakistan household voltage
- **Power Supply** — Stable power for the circuit

---

## 📱 App Screens

### Dashboard
Live electricity data — Watts, Voltage, Current, kWh, estimated bill with full WAPDA tariff breakdown, and billing cycle reset.

### History
Usage graphs (Power, Voltage, Current, kWh), Today / This Week / All tabs, stats cards, hourly readings, and CSV export.

### Alerts
Set custom kWh thresholds — get push notifications when consumption exceeds the limit.

### Login
Secure Firebase authentication with email/password.

---

## 🔄 Data Flow

```
CT Sensor + Voltage Sensor
        ↓
    ESP32 (reads every 1 second)
        ↓ P = V × I
    kWh accumulation
        ↓ Wi-Fi
  Firebase Firestore
        ↓ Real-time listener
    Mobile App UI
        ↓ (if threshold crossed)
   Push Notification
```

---

## ⚙️ Firebase Structure

```
users/
  └── {userId}/
        ├── readings/        → voltage, current, power, kWh, timestamp
        ├── billingHistory/  → monthly saved records
        └── alertRules/      → label, threshold, enabled
```

---

## 📊 Performance

| Metric | Target |
|--------|--------|
| Data refresh | ≤ 5 seconds |
| Cloud response | < 2 seconds |
| System uptime | > 95% |
| Data loss | < 1% |

---

## ⚠️ Limitations

- Single-phase household only (not 3-phase)
- Wi-Fi connection required
- Tariff rates need manual update
- No appliance-level monitoring (planned for future)

---

## 🚀 Future Extensions

- Appliance-level individual monitoring
- Google Home / Amazon Alexa integration
- Web dashboard (browser support)
- Auto WAPDA tariff rate updates
- Solar energy monitoring
- Multi-household support

---

## 👥 Team

| Name | Roll No |
|------|---------|
| Muhammad Hassan | FA-2022-BSCS-484 |

**Supervisor:** Sir Hassan Sultan
**University:** Lahore Garrison University (LGU)
**Department:** BS Computer Science — Section E
**Year:** 2026

---

## 📄 License

This project was developed as a Final Year Project at Lahore Garrison University. All rights reserved.