import sys
from pathlib import Path

# Ensure backend directory is in sys.path
backend_path = Path(__file__).resolve().parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.services.answer import ask

TESTS = [
    # (question, should_be_found, expected_source_id)
    ("Why did users get 401 errors during JWT refresh?", True, "issue_101"),
    ("What is the weather today?", False, None),
    ("What changed in the JWT token auth handler?", True, "commit_a1b2c3"),
    ("How did we fix the database connection drops?", True, "commit_d4e5f6"),
    ("Which file was modified to handle token refresh race conditions?", True, "commit_a1b2c3"),
    ("What library or mechanism was added for database retries?", True, "commit_d4e5f6"),
    ("Is there an issue tracking the JWT session drop?", True, "issue_101"),
    ("What middleware files are associated with the authentication fix?", True, "commit_a1b2c3"),
    ("Who won the recent cricket match?", False, None),
    ("How do I configure Docker containers on Windows?", False, None),
    ("What is the company's vacation policy?", False, None),
    ("Why did we adopt PostgreSQL?", True, "adr_001")
]

passed = 0
for q, should_find, expected in TESTS:
    r = ask(q)
    ids = {s["id"] for s in r["sources"]}
    ok = (r["found"] == should_find) and (expected is None or expected in ids)
    passed += ok
    print("PASS" if ok else "FAIL", "|", q, "| found:", r["found"], "| sources:", ids)
print(f"\n{passed}/{len(TESTS)} passed")
