import sys
from pathlib import Path
import unittest

backend_path = Path(__file__).resolve().parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.user import User
from app.models.project import Project
from app.services.auth import create_access_token, hash_password, verify_password

client = TestClient(app)

class AuthIntegrationTests(unittest.TestCase):

    def test_health_endpoint(self):
        res = client.get("/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json(), {"status": "ok"})

    def test_unauthenticated_request_rejected(self):
        res = client.get("/projects")
        self.assertEqual(res.status_code, 401)
        self.assertIn("Authentication required", res.text)

    def test_invalid_token_rejected(self):
        headers = {"Authorization": "Bearer invalid.jwt.token"}
        res = client.get("/projects", headers=headers)
        self.assertEqual(res.status_code, 401)

    def test_dev_login_endpoint_removed(self):
        res = client.post("/auth/dev-login")
        self.assertEqual(res.status_code, 404)

    def test_password_hashing_and_verification(self):
        pwd = "SecurePassword123!"
        hashed = hash_password(pwd)
        self.assertTrue(verify_password(pwd, hashed))
        self.assertFalse(verify_password("WrongPassword!", hashed))

    def test_user_ownership_isolation(self):
        db = SessionLocal()
        try:
            # Query existing test users
            users = db.query(User).limit(2).all()
            if len(users) >= 2:
                u1, u2 = users[0], users[1]
                t1 = create_access_token(u1)
                t2 = create_access_token(u2)

                # User 1 creates project
                h1 = {"Authorization": f"Bearer {t1}"}
                create_res = client.post("/projects", json={"name": "User 1 Private Project"}, headers=h1)
                self.assertEqual(create_res.status_code, 201)
                project_id = create_res.json()["id"]

                # User 2 attempts to access User 1's project -> MUST return 404
                h2 = {"Authorization": f"Bearer {t2}"}
                access_res = client.get(f"/projects/{project_id}", headers=h2)
                self.assertEqual(access_res.status_code, 404)
                self.assertEqual(access_res.json()["detail"], "Project not found.")

                # Cleanup test project
                client.delete(f"/projects/{project_id}", headers=h1)
        finally:
            db.close()

if __name__ == "__main__":
    unittest.main()
