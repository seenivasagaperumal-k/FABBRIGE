# 🌐 FabBridge — Smart MSME Manufacturing Collaboration Platform

**FabBridge** is an enterprise-grade manufacturing collaboration platform designed to connect MSME manufacturers, precision machine shops, industrial service providers, and business clients across India.

---

## 🚀 Key Features

- **🌐 Interactive Marketplace**:
  - Filter requirements by specialized manufacturing categories (CNC Machining, Sheet Metal & Fabrication, Laser Cutting, Injection Moulding, 3D Printing, Electronics, and more).
  - High-resolution vector category graphics and dynamic requirement counts.
  - Subcategory pill filtering and real-time search.

- **🏭 End-to-End Manufacturing Tracking**:
  - 8-stage production milestone tracking:
    1. Order Confirmed
    2. Design / Drawing Review
    3. Raw Material Preparation
    4. Machining / Manufacturing
    5. Quality Inspection
    6. Packing
    7. Ready for Delivery
    8. Delivered
  - Live milestone progress calculation and status badges.

- **🛠️ Manufacturing Services Showcase**:
  - Capability showcase for verified manufacturers and machine shops.
  - Direct provider contact modal with real verified contact details (phone, email, company profile).
  - Role-aware tabs for company service management.

- **📨 Quotation & RFQ Management**:
  - Seamless requirement posting with technical specifications, budget, quantity, and deadlines.
  - Multi-company quotation submission and comparison for customers.

- **📊 Role-Based Dashboards**:
  - Dedicated portals for **Customers** and **Manufacturing Companies**.
  - Quick action navigation bar, activity feeds, and summary metric cards.

---

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript (ES Modules), HTML5, CSS3 (Enterprise Design System)
- **Database & Auth**: Google Firebase v12.16.0 (Firestore, Firebase Authentication)
- **Local Dev Server**: Node.js HTTP server (`server.js`) on port 5501
- **Backend / Python**: Python Flask (`backend/app.py`)

---

## 💻 Getting Started Locally

### Prerequisites
- Node.js (v18+)

### Installation & Run

1. Clone the repository:
   ```bash
   git clone https://github.com/seenivasagaperumal-k/FABBRIGE.git
   cd FABBRIGE
   ```

2. Start the local server:
   ```bash
   node server.js
   ```

3. Open your browser:
   ```text
   http://localhost:5501
   ```

---

## 📂 Project Structure

```text
FabBridge/
├── backend/                  # Backend stubs & configurations
│   ├── app.py
│   ├── firebase_config.py
│   └── requirements.txt
├── frontend/                 # Core client-side web application
│   ├── assets/               # High-resolution vector category graphics & technical illustrations
│   │   ├── categories/
│   │   └── graphics/
│   ├── css/                  # Modular stylesheets & design-system.css
│   ├── js/                   # ES Modules (auth, marketplace, tracking, services, etc.)
│   ├── index.html            # Public landing page
│   ├── marketplace.html      # Requirement exploration & discovery
│   ├── services.html         # Manufacturing capabilities showcase
│   ├── tracking.html         # 8-Stage manufacturing tracking
│   ├── customer-dashboard.html
│   ├── dashboard.html        # Company dashboard
│   ├── login.html
│   └── register.html
├── server.js                 # Local development server
└── README.md
```

---

## 📜 License & Copyright

© 2026 FabBridge. All Rights Reserved.
