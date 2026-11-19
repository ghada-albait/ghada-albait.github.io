# Tests (not part of the app)
- `e2e/run.py`: Playwright + Chrome with an in-memory mock of the Firebase SDK (`e2e/mock/`, with a tiny emulation of the member-join rule). Scenario: create house, add people, shared + personal PIN login, role switch, maid adds item, link device, message a person, turn off shared PINs, delete a person. Screenshots go to /tmp/e2e_*.png.
  Run: `python3 tests/e2e/run.py`
- `notify/`: mock firebase-admin that counts Firestore reads for tools/notify.mjs.
  Run: from tests/notify, build notify_t.mjs with sed (see project brief), then `FIREBASE_SA='{}' node run.mjs quiet|busy|notoken`.
Firestore rules cannot be emulated here (emulator download is blocked) — review them by hand.
