from flask import Flask, request, jsonify
from datetime import datetime
import sqlite3
import bcrypt

app = Flask(__name__)

def init_db():
    try:
        conn = sqlite3.connect('users.db')
        c = conn.cursor()
        c.execute('''CREATE TABLE IF NOT EXISTS users (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        username TEXT UNIQUE NOT NULL,
                        password TEXT NOT NULL
                    )''')
        c.execute('''CREATE TABLE IF NOT EXISTS locations (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        latitude REAL NOT NULL,
                        longitude REAL NOT NULL,
                        timestamp TEXT NOT NULL,
                        FOREIGN KEY(user_id) REFERENCES users(id)
                    )''')
        conn.commit()
        conn.close()
    except Exception as err:
        print('Error:', err)
    finally:
        conn.close()

init_db()

@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        confirm_password = data.get('confirm_password')

        if not username or not password or not confirm_password:
            return jsonify({"error": "All fields are required"}), 400
        
        if len(username) < 6 or len(username) > 20:
            return jsonify({"error": "Username must be between 6 and 20 characters"}), 400
        
        if len(password) < 6:
            return jsonify({"error": "Password must be at least 6 characters long"}), 400
        
        if password != confirm_password:
            return jsonify({"error": "Passwords do not match"}), 400
        
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        conn = sqlite3.connect('users.db')
        c = conn.cursor()
        c.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, hashed_password))
        conn.commit()
        conn.close()

        return jsonify({"message": "User registered successfully!"}), 201
    except sqlite3.IntegrityError:
        return jsonify({"error": "Username already exists"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return jsonify({"error": "All fields are required"}), 400

        conn = sqlite3.connect('users.db')
        c = conn.cursor()
        c.execute("SELECT id, password FROM users WHERE username = ?", (username,))
        user = c.fetchone()
        conn.close()

        if user and bcrypt.checkpw(password.encode('utf-8'), user[1]):
            return jsonify({"message": "Login successful!", "user_id": user[0]}), 200
        else:
            return jsonify({"error": "Invalid username or password"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/update-location', methods=['POST'])
def update_location():
    try:
        data = request.json
        user_id = data.get('user_id')
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        timestamp = data.get('timestamp')

        if not user_id or not latitude or not longitude:
            return jsonify({"error": "Missing user_id, latitude, or longitude"}), 400

        timestamp = datetime.fromtimestamp(timestamp / 1000) if timestamp else datetime.utcnow()
        formatted_time = timestamp.strftime('%Y-%m-%d %I:%M:%S %p')

        conn = sqlite3.connect('users.db')
        c = conn.cursor()
        c.execute("INSERT INTO locations (user_id, latitude, longitude, timestamp) VALUES (?, ?, ?, ?)",
                  (user_id, latitude, longitude, formatted_time))
        conn.commit()
        conn.close()

        return jsonify({"message": "Location updated successfully!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/my-location', methods=['GET'])
def get_location():
    try:
        user_id = request.args.get('user_id')

        if not user_id:
            return jsonify({"error": "Missing user_id"}), 400

        conn = sqlite3.connect('users.db')
        c = conn.cursor()
        c.execute(f"SELECT * FROM locations WHERE user_id={user_id} ORDER BY timestamp DESC LIMIT 10")
        location_data = c.fetchall()
        conn.close()
        location_data = [[data[2], data[3], data[4]] for data in location_data]

        return jsonify({"data": location_data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)
