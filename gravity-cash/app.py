from flask import Flask, request, jsonify, abort, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
import os

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os

app = Flask(__name__, static_folder='static', template_folder='templates')
# Enable CORS for credentials (cookies)
CORS(app, supports_credentials=True)
# SQLite DB stored in the same folder – easy for a demo
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///gravity.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# JWT config - Read tokens from cookies
app.config['JWT_TOKEN_LOCATION'] = ['cookies']
app.config['JWT_ACCESS_COOKIE_NAME'] = 'access_token'
app.config['JWT_REFRESH_COOKIE_NAME'] = 'refresh_token'
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'dev-secret-key')
app.config['JWT_COOKIE_CSRF_PROTECT'] = False # Disable CSRF check for simpler cross-origin demo
jwt = JWTManager(app)

db = SQLAlchemy(app)

class Record(db.Model):
    __tablename__ = "records"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String, nullable=False)
    data = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.String, primary_key=True)  # store email as PK for simplicity
    password_hash = db.Column(db.String, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# ---------------------------------------------------------------------------
# Helper – retrieve current user id from JWT
def get_current_user_id():
    identity = get_jwt_identity()
    if not identity:
        abort(401, description="Missing JWT identity")
    return identity

# ------------------------------- GET --------------------------------------
@app.route('/api/data', methods=['GET'])
@jwt_required()
def get_data():
    user_id = get_current_user_id()
    records = Record.query.filter_by(user_id=user_id).all()
    result = [
        {
            "id": r.id,
            "data": r.data,
            "created_at": r.created_at.isoformat()
        }
        for r in records
    ]
    return jsonify(result), 200

# ------------------------------- POST -------------------------------------
@app.route('/api/data', methods=['POST'])
@jwt_required()
def create_data():
    user_id = get_current_user_id()
    payload = request.get_json()
    if not payload or "data" not in payload:
        return jsonify({"error": "'data' field is required"}), 400
    new_rec = Record(user_id=user_id, data=payload["data"])
    db.session.add(new_rec)
    db.session.commit()
    return jsonify({
        "id": new_rec.id,
        "data": new_rec.data,
        "created_at": new_rec.created_at.isoformat()
    }), 201

# ------------------------------- DELETE -----------------------------------
@app.route('/api/data/<int:record_id>', methods=['DELETE'])
@jwt_required()
def delete_data(record_id):
    user_id = get_current_user_id()
    rec = Record.query.filter_by(id=record_id, user_id=user_id).first()
    if not rec:
        return jsonify({"error": "Record not found"}), 404
    db.session.delete(rec)
    db.session.commit()
    return jsonify({"message": "Record deleted"}), 200

# ------------------------------- Auth Endpoints --------------------------------
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    if not email or not password:
        return jsonify({"error": "email and password required"}), 400
    if User.query.filter_by(id=email).first():
        return jsonify({"error": "User already exists"}), 400
    user = User(id=email, password_hash=generate_password_hash(password))
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "User registered"}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    user = User.query.filter_by(id=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid credentials"}), 401
    access = create_access_token(identity=email, additional_claims={"type": "access"})
    refresh = create_refresh_token(identity=email, additional_claims={"type": "refresh"})
    resp = jsonify({"access_token": access, "refresh_token": refresh})
    # Set HttpOnly cookie for access token
    resp.set_cookie('access_token', access, httponly=True, secure=False, samesite='Lax')
    resp.set_cookie('refresh_token', refresh, httponly=True, secure=False, samesite='Lax')
    return resp, 200

@app.route('/api/auth/refresh', methods=['POST'])
def refresh():
    # The refresh token is sent via HttpOnly cookie
    refresh_token = request.cookies.get('refresh_token')
    if not refresh_token:
        return jsonify({"error": "Missing refresh token"}), 401
    # Verify refresh token manually
    from flask_jwt_extended import decode_token
    try:
        decoded = decode_token(refresh_token)
        if decoded.get('type') != 'refresh':
            raise Exception('Not a refresh token')
        new_access = create_access_token(identity=decoded['sub'], additional_claims={"type": "access"})
        resp = jsonify({"access_token": new_access})
        resp.set_cookie('access_token', new_access, httponly=True, secure=False, samesite='Lax')
        return resp, 200
    except Exception as e:
        return jsonify({"error": str(e)}), 401

# ------------------------------- Frontend --------------------------------
@app.route('/')
def index():
    return render_template('index.html')

# ---------------------------------------------------------------------------
if __name__ == '__main__':
    # Create DB tables on first run within application context
    with app.app_context():
        if not os.path.exists('gravity.db'):
            db.create_all()
    app.run(host='0.0.0.0', port=5000, debug=True)
