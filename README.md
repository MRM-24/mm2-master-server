# Mini Militia 4.3.5 Custom Master & Matchmaking Server

This server acts as the replacement for the shut down Miniclip Goliath backend for **Mini Militia (Doodle Army 2) v4.3.5**.

## What this server does:
1. **Handles Client Auth & Config**: Responds to `/games/doodlearmy2/api/...` so the client does not hang on startup or login.
2. **Custom Server & Room Discovery**: Provides `/v1/custom-servers` and `/v1/custom-servers/:id/rooms` so players can see active rooms when clicking "Custom Game / Online".
3. **Web Dashboard**: Visit the root URL (`https://your-service.onrender.com/`) in any browser to see live active rooms and players.

---

## 🚀 How to Deploy on Render (Step-by-Step)

1. **Push to GitHub**:
   - Create a new repository on your GitHub account (e.g. `mm2-server`).
   - Push the contents of this `server` folder to that repository.
2. **Deploy on Render**:
   - Log in to your [Render Dashboard](https://dashboard.render.com/).
   - Click **New +** -> **Web Service**.
   - Select your GitHub repository.
   - Choose:
     - **Name**: `mm2-master-server` (or any custom name)
     - **Runtime**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `node server.js`
     - **Instance Type**: `Free`
   - Click **Create Web Service**.
3. **Your Server URL**:
   - Once deployed, Render will give you a public URL like:
     `https://mm2-master-server.onrender.com`
   - Test it by opening that URL in your browser — you should see the Mini Militia Server Dashboard!

---

## 🎮 How Real-Time Gameplay Works (Important Note on Render & UDP):

* Render routes HTTP/HTTPS (port 80/443).
* Mini Militia's **real-time shooting & movement** uses **UDP packets (port 4267)**.
* When playing with friends across the internet:
  1. **Option A (ZeroTier / Tailscale Virtual LAN — Recommended)**:
     - All players install the free **ZeroTier One** or **Tailscale** app on their phones.
     - Join the same network ID.
     - In the game, go to **Multiplayer -> Deathmatch -> Wi-Fi (LAN)**. One hosts, everyone joins!
  2. **Option B (Room Registration with Render)**:
     - When someone hosts on their PC or port-forwarded network, they register their IP with:
       `POST https://your-server.onrender.com/api/rooms` with `{ "name": "Room 1", "hostIp": "<public_ip>", "hostPort": 4267 }`.
     - The mobile game will list that room in the custom server list!
