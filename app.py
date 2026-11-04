"""Zelar experimental local API. Python 3.10+, standard library only."""
import hmac
import json
import os
import sqlite3
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse, parse_qs

DB = os.getenv("ZELAR_DB", "zelar.db")
HOST = os.getenv("ZELAR_HOST", "127.0.0.1")
PORT = int(os.getenv("ZELAR_PORT", "8765"))
ADMIN_KEY = os.getenv("ZELAR_ADMIN_KEY", "")
INGEST_KEY = os.getenv("ZELAR_INGEST_KEY", "")

def connect():
    db = sqlite3.connect(DB, timeout=10)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys=ON")
    return db

def setup():
    with connect() as db:
        db.executescript("""
        CREATE TABLE IF NOT EXISTS homes(
            id INTEGER PRIMARY KEY, label TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS rooms(
            id INTEGER PRIMARY KEY, home_id INTEGER NOT NULL REFERENCES homes(id),
            label TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS devices(
            id INTEGER PRIMARY KEY, room_id INTEGER NOT NULL REFERENCES rooms(id),
            label TEXT NOT NULL, model TEXT NOT NULL, external_id TEXT NOT NULL UNIQUE,
            state TEXT NOT NULL DEFAULT 'unknown', updated_at INTEGER);
        CREATE TABLE IF NOT EXISTS events(
            id INTEGER PRIMARY KEY, device_id INTEGER NOT NULL REFERENCES devices(id),
            kind TEXT NOT NULL, value TEXT NOT NULL, created_at INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS alerts(
            id INTEGER PRIMARY KEY, device_id INTEGER NOT NULL REFERENCES devices(id),
            kind TEXT NOT NULL, message TEXT NOT NULL,
            created_at INTEGER NOT NULL, acknowledged_at INTEGER);
        """)

def add_home(label):
    with connect() as db:
        return db.execute("INSERT INTO homes(label) VALUES(?)", (label,)).lastrowid

def add_room(home_id, label):
    with connect() as db:
        return db.execute("INSERT INTO rooms(home_id,label) VALUES(?,?)", (home_id,label)).lastrowid

def add_device(room_id, label, model, external_id):
    with connect() as db:
        return db.execute("INSERT INTO devices(room_id,label,model,external_id) VALUES(?,?,?,?)",
                          (room_id,label,model,external_id)).lastrowid

def ingest(external_id, kind, value):
    allowed = {"presence", "motion", "contact", "fall_candidate", "battery_low", "offline"}
    if kind not in allowed:
        raise ValueError("Unsupported event type")
    if not isinstance(value, (bool, int, float, str)) or len(str(value)) > 128:
        raise ValueError("Invalid value")
    now = int(time.time())
    with connect() as db:
        row = db.execute("SELECT id FROM devices WHERE external_id=?", (external_id,)).fetchone()
        if row is None:
            raise LookupError("Device not registered")
        device_id = row["id"]
        db.execute("UPDATE devices SET state=?,updated_at=? WHERE id=?",
                   (json.dumps({kind:value}), now, device_id))
        db.execute("INSERT INTO events(device_id,kind,value,created_at) VALUES(?,?,?,?)",
                   (device_id,kind,json.dumps(value),now))
        if kind in ("fall_candidate", "battery_low", "offline") and bool(value):
            db.execute("INSERT INTO alerts(device_id,kind,message,created_at) VALUES(?,?,?,?)",
                       (device_id,kind,"Sensor reported: " + kind,now))
    return {"accepted": True}

def snapshot():
    with connect() as db:
        return {
          "homes": [dict(x) for x in db.execute("SELECT * FROM homes ORDER BY id")],
          "rooms": [dict(x) for x in db.execute("SELECT * FROM rooms ORDER BY id")],
          "devices": [dict(x) for x in db.execute("SELECT * FROM devices ORDER BY id")],
          "events": [dict(x) for x in db.execute("SELECT * FROM events ORDER BY id DESC LIMIT 100")],
          "alerts": [dict(x) for x in db.execute("SELECT * FROM alerts ORDER BY id DESC LIMIT 100")]
        }

class Handler(BaseHTTPRequestHandler):
    def reply(self, code, data):
        raw = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("Content-Type","application/json; charset=utf-8")
        self.send_header("Cache-Control","no-store")
        self.send_header("Content-Length",str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def allowed(self, key):
        return bool(key) and hmac.compare_digest(self.headers.get("X-Zelar-Key",""),key)

    def body(self):
        n = int(self.headers.get("Content-Length","0"))
        if n < 1 or n > 8192:
            raise ValueError("Invalid body size")
        obj = json.loads(self.rfile.read(n))
        if not isinstance(obj,dict):
            raise ValueError("Expected object")
        return obj

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/health":
            return self.reply(200,{"status":"ok","hardware_connected":False})
        if path == "/" or path == "/dashboard":
            if not self.allowed(ADMIN_KEY):
                return self.reply(401,{"error":"Use API key header to access /api/state"})
            return self.reply(200,{"message":"Zelar API ready","dashboard":"/api/state"})
        if path == "/api/state":
            return self.reply(200,snapshot()) if self.allowed(ADMIN_KEY) else self.reply(401,{"error":"Unauthorized"})
        return self.reply(404,{"error":"Not found"})

    def do_POST(self):
        path = urlparse(self.path).path
        needed = INGEST_KEY if path == "/api/events" else ADMIN_KEY
        if not self.allowed(needed):
            return self.reply(401,{"error":"Unauthorized"})
        try:
            b = self.body()
            if path == "/api/homes":
                result = {"id":add_home(str(b["label"])[:120])}
            elif path == "/api/rooms":
                result = {"id":add_room(int(b["home_id"]),str(b["label"])[:120])}
            elif path == "/api/devices":
                result = {"id":add_device(int(b["room_id"]),str(b["label"])[:120],
                                          str(b["model"])[:80],str(b["external_id"])[:120])}
            elif path == "/api/events":
                result = ingest(str(b["external_id"]),str(b["kind"]),b["value"])
            elif path == "/api/alerts/ack":
                with connect() as db:
                    cur = db.execute("UPDATE alerts SET acknowledged_at=? WHERE id=? AND acknowledged_at IS NULL",
                                     (int(time.time()),int(b["id"])))
                result = {"updated":cur.rowcount}
            else:
                return self.reply(404,{"error":"Not found"})
            return self.reply(200,result)
        except (KeyError,ValueError,TypeError,LookupError,sqlite3.IntegrityError,json.JSONDecodeError) as e:
            return self.reply(400,{"error":str(e)})

if __name__ == "__main__":
    if not ADMIN_KEY or not INGEST_KEY or ADMIN_KEY == INGEST_KEY:
        raise SystemExit("Set different ZELAR_ADMIN_KEY and ZELAR_INGEST_KEY values")
    setup()
    print(f"Zelar local API on http://{HOST}:{PORT} (simulation only)")
    ThreadingHTTPServer((HOST,PORT),Handler).serve_forever()
