import sys
import json
import time
try:
    import urllib.request as urllib2
except ImportError:
    import urllib2

SERVER_URL = "https://mm2-server.onrender.com"  # Replace with your actual Render URL if different

def register_room(room_name="My Match", host_ip="auto", port=4267, max_players=6):
    url = f"{SERVER_URL}/api/rooms"
    payload = {
        "name": room_name,
        "hostPort": port,
        "maxPlayers": max_players
    }
    if host_ip != "auto":
        payload["hostIp"] = host_ip

    data = json.dumps(payload).encode("utf-8")
    req = urllib2.Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        res = urllib2.urlopen(req)
        room_info = json.loads(res.read().decode("utf-8"))
        print("Successfully registered room with master server!")
        print(f"Room: {room_info}")
        room_id = room_info["room"]["id"]
        
        print("\nSending heartbeat to keep room alive (Press Ctrl+C to stop)...")
        while True:
            time.sleep(30)
            hb_req = urllib2.Request(f"{SERVER_URL}/api/rooms/{room_id}/heartbeat", data=b"{}", headers={"Content-Type": "application/json"})
            urllib2.urlopen(hb_req)
            print("Heartbeat sent...")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    name = sys.argv[1] if len(sys.argv) > 1 else "Warzone LOBBY"
    register_room(room_name=name)
