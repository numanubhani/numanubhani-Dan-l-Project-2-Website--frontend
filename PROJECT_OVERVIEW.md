# VPULSE: Project Architecture & Technical Overview

Welcome to the comprehensive overview of the VPULSE platform. This document outlines the complete depth of the project, including the system architecture, core flow, business logic, and the "algorithms" that drive user engagement and platform economics.

---

## 1. High-Level Architecture

VPULSE is a modern, full-stack video streaming and interactive social prediction platform. 

*   **Frontend**: Built with **React (TypeScript)** and **Vite**, utilizing TailwindCSS for a "neon-cyberpunk" dark mode aesthetic. State management is handled through React Context (AuthContext, CartContext), and routing via `react-router-dom`. The UI is heavily inspired by TikTok and YouTube, featuring vertical snap-scroll feeds, floating sidebars, and interactive modals.
*   **Backend**: Built with **Django** and **Django Rest Framework (DRF)**. It utilizes a relational database (SQLite/PostgreSQL) with `UUID` primary keys for scalability and security. WebSockets (Django Channels) handle real-time chat and live bet updates.
*   **Authentication**: Token-based REST authentication (via DRF Authtoken) utilizing UUIDs for users.

---

## 2. Core Business Logic & Data Models

The platform's business logic revolves around **Content** and **Economy**. Users are given a virtual "Wallet" (Coins) which they use to interact with content in meaningful, financialized ways.

### A. The User & Economy
*   **User Model**: Extends Django's `AbstractUser`. Crucially, it contains a `balance` field (Decimal). Users can be `VIEWER`, `CREATOR`, or `ADMIN`.
*   **Wallet Flow**: Users purchase virtual currency. This balance is decremented when they place bets, sponsor challenges, or purchase items in the shop, and incremented when they win predictions.

### B. Content & Feeds (The "Algorithm")
Content is served through various feeds. Unlike traditional platforms that use complex black-box recommendation ML, VPULSE's initial feed logic focuses on **chronological delivery, categorization, and engagement tracking**:
*   **Video Feed (`/feed`)**: Fetches `Video` models (Shorts/Longs). The React frontend renders these using an IntersectionObserver to auto-play videos as they snap into view.
*   **Event Feed (`/events`)**: Integrates `ChallengeEvent` and `PredictionMarket` content directly into a TikTok-style vertical feed. Users swipe between live challenges and prediction markets.
*   **Engagement Tracking**: Views, likes, and comments are tracked in real-time using `VideoLike` and `VideoComment` models.

### C. Interactive Prediction Mechanics (The Core Differentiator)
VPULSE financializes user engagement. The core logic allows users to "bet" on outcomes.

1.  **Video Bet Markers (`BetMarker`)**: 
    *   **Logic**: A creator attaches a question to a specific timestamp of a pre-recorded video (e.g., at 0:15 "Will I make this trick shot?"). 
    *   **Flow**: As the viewer watches, a modal pops up at the exact timestamp. The viewer uses their wallet balance to place a `PlacedMarkerBet` on predefined options. 
    *   **Resolution**: The backend resolves the bet later, adjusting the user's wallet balance based on the fixed or dynamic odds.
2.  **Live Bet Events (`BetEvent`)**: 
    *   **Logic**: Occurs during a live stream (`Stream` model). The creator spawns a real-time question. Viewers place `PlacedEventBet`s.
3.  **Community Prediction Markets (`PredictionMarket`)**:
    *   **Logic**: Similar to Polymarket. A user creates a market (e.g., "Will Candidate X win?"). Users vote YES or NO. 
    *   **Algorithm**: The market tracks `volume`, `votes_yes`, and `votes_no`. The UI calculates real-time probabilities (e.g., 65% Yes / 35% No) based on the total pool distribution.
4.  **Challenges (`ChallengeEvent`)**:
    *   **Logic**: A creator states they will perform a stunt. Users can "Sponsor" the creator, adding to the `pool_amount`. They can also vote YES or NO on success. 

---

## 3. Detailed Component Workflows

### 1. Authentication Flow
1.  **Signup/Login**: User submits credentials to `/api/auth/register` or `/api/auth/login`.
2.  **Token Generation**: Django validates and returns a DRF Token and user profile data.
3.  **Client State**: The React `AuthContext` stores the token in `localStorage`, attaches it to an Axios interceptor, and maintains the global `user` state (including their live coin balance).

### 2. Video Upload & Processing Flow
1.  **Upload Studio**: Creator navigates to `/studio`. They input title, description, and upload a file.
2.  **API Submission**: A multipart form-data request is sent to `/api/videos/`. 
3.  **Storage**: Django saves the `video_file` to the `media/videos/` directory and creates a `Video` record.
4.  **Distribution**: The video immediately becomes available in the `/feed` endpoint.

### 3. The "Reels" Vertical Scroll Flow
1.  **Data Fetching**: The `VerticalFeed` component hits `/api/videos/?type=short`.
2.  **UI Virtualization**: Videos are rendered full-screen. 
3.  **Intersection Observer Algorithm**: A custom hook monitors which video `div` is currently 100% visible. It triggers `.play()` on the active `<video>` element and `.pause()` on all others, ensuring sound and video do not overlap.
4.  **Interactive Overlays**: The UI checks the `bet_markers` array attached to the video JSON. If the video's current playback time matches a marker's `timestamp`, the betting modal is injected into the DOM.

### 4. Economy & Shop Flow
1.  **Shop Interface (`/shop`)**: Fetches `ShopItem` records.
2.  **Cart Context**: Users add items to a local React Context cart.
3.  **Checkout Algorithm**:
    *   The user initiates checkout.
    *   The frontend sums the cart total.
    *   It hits `/api/shop/checkout/`.
    *   **Transaction Logic**: The Django backend verifies stock. In an atomic database transaction, it deducts the `total` from the `user.balance`, creates `ShopPurchase` records, and decrements `ShopItem.stock`. If `user.balance < total`, the transaction rolls back and returns a 400 error.

---

## 4. Technical Stack Summary

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend Framework** | React 18, Vite, TypeScript |
| **Styling** | TailwindCSS, Lucide React (Icons), Framer Motion (Animations) |
| **State Management** | React Context API |
| **HTTP Client** | Axios (with token interceptors) |
| **Backend Framework** | Django 5.x, Django Rest Framework (DRF) |
| **Database** | SQLite (dev) / PostgreSQL (prod ready), UUID Primary Keys |
| **Media Handling** | Django `FileField` / `ImageField` with `Pillow` |

---

## 5. Future Algorithmic Enhancements
Currently, feeds are largely chronological or category-based. The architecture is designed to support future implementations of:
*   **Recommendation Algorithms**: Machine learning models that sort `/api/videos/` based on a user's past `VideoLike` and `VideoComment` history.
*   **Dynamic Odds Calculation**: Parimutuel betting algorithms where the payout odds dynamically shift in real-time as more money is poured into one side of a `PredictionMarket` or `BetMarker`.
