/**
 * @jest-environment node
 */

/**
 * ============================================================================
 * INTEGRATION TEST: Login process — POST /api/auth/login
 * ============================================================================
 *
 * This tests the FULL login flow end-to-end through the real route handler:
 *
 *   1. Client sends email + password as JSON  →  NextRequest
 *   2. Route handler parses body              →  extracts { email, password }
 *   3. Finds user in the users array          →  case-insensitive email lookup
 *   4. bcrypt.compare(password, hash)         →  real password verification
 *   5. createSession(user)                    →  JWT creation + cookie set (mocked)
 *   6. Returns { user: SafeUser }             →  user object without password
 *
 * Credentials used:
 *   Email:    admin@gjirafanews.com
 *   Password: admin123
 *
 * This is an INTEGRATION test because it exercises the real route handler,
 * real bcrypt comparison, and real user data — only the session/cookie layer
 * is mocked (because it needs Next.js server context).
 */

// Using @jest-environment node (set above) so we have native Web APIs
// (Request, Response, Headers) available — required by NextRequest.
import { NextRequest } from "next/server";

// ─── Mock createSession ─────────────────────────────────────────────────────
// createSession uses Next.js cookies() which requires a server context.
// We mock the entire session module so the route handler can call createSession
// without crashing. The mock tracks what user data was passed to it.

// jest.fn() creates a tracked mock function that resolves immediately.
const mockCreateSession = jest.fn().mockResolvedValue(undefined);

// jest.mock replaces the real module with our mock.
// Every import of @/lib/session in the route handler will get this mock instead.
jest.mock("@/lib/session", () => ({
  createSession: (...args: unknown[]) => mockCreateSession(...args),
}));

// ─── Import the actual route handler ────────────────────────────────────────
// This is the real POST function from the login API route.
// It uses the real bcrypt library, real users array, and real validation logic.
import { POST } from "@/app/api/auth/login/route";

// ─── Helper: create a NextRequest with JSON body ────────────────────────────
// NextRequest is the real Next.js request class used by route handlers.
// We construct one with a JSON body to simulate what the browser sends.
function createLoginRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/auth/login", {
    // method: "POST" — matches the HTTP verb the route handler expects.
    method: "POST",
    // JSON.stringify converts the object to a JSON string for the request body.
    body: JSON.stringify(body),
    // Content-Type header tells the handler to parse the body as JSON.
    headers: { "Content-Type": "application/json" },
  });
}

// ─── Helper: parse the JSON response ────────────────────────────────────────
// The route handler returns Response.json(...). This helper extracts the
// JSON body and status code so we can assert on both.
async function parseResponse(response: Response) {
  // response.json() parses the response body as JSON.
  const data = await response.json();
  // response.status is the HTTP status code (200, 400, 401, etc.).
  return { data, status: response.status };
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe("POST /api/auth/login — integration test", () => {

  // Clear mock call history before each test so tests don't affect each other.
  beforeEach(() => {
    // mockClear resets call count and call arguments but keeps the mock behavior.
    mockCreateSession.mockClear();
  });

  // ─── SUCCESSFUL LOGIN ───────────────────────────────────────────────────

  test("should login successfully with correct admin credentials", async () => {
    // Create a request with the real admin credentials.
    // email: admin@gjirafanews.com — exists in the users array in lib/data.ts
    // password: admin123 — matches the bcrypt hash stored for this user
    const request = createLoginRequest({
      email: "admin@gjirafanews.com",
      password: "admin123",
    });

    // Call the real route handler — it will:
    // 1. Parse the JSON body
    // 2. Find the user by email in the users array
    // 3. Run bcrypt.compare("admin123", storedHash) — this is REAL bcrypt
    // 4. Call createSession (our mock) with user data
    // 5. Return the safe user object
    const response = await POST(request);
    const { data, status } = await parseResponse(response);

    // ── Assert: HTTP 200 OK ──
    // toEqual(200) checks the response status code.
    // 200 means the login was successful.
    expect(status).toEqual(200);

    // ── Assert: response contains user object ──
    // toBeDefined() ensures the user property exists in the response.
    expect(data.user).toBeDefined();

    // ── Assert: user has correct email ──
    // The returned user should have the same email we logged in with.
    expect(data.user.email).toEqual("admin@gjirafanews.com");

    // ── Assert: user has correct name ──
    expect(data.user.name).toEqual("Admin");

    // ── Assert: user has admin role ──
    // The admin user has role "admin" in the seed data.
    expect(data.user.role).toEqual("admin");

    // ── Assert: user has an ID ──
    // The ID follows the usr-{number} pattern.
    expect(data.user.id).toMatch(/^usr-\d+$/);

    // ── Assert: password is NOT included in response ──
    // The route handler strips the password: `const { password: _, ...safeUser } = user`
    // This is critical for security — passwords must never be sent to the client.
    // toBeUndefined() ensures the password field does not exist.
    expect(data.user.password).toBeUndefined();

    // ── Assert: createSession was called ──
    // toHaveBeenCalledTimes(1) verifies the mock was invoked exactly once.
    expect(mockCreateSession).toHaveBeenCalledTimes(1);

    // ── Assert: createSession received correct user data ──
    // toHaveBeenCalledWith checks the exact arguments passed to the mock.
    // The route handler passes { id, email, name, role } to createSession.
    expect(mockCreateSession).toHaveBeenCalledWith({
      id: "usr-1",
      email: "admin@gjirafanews.com",
      name: "Admin",
      role: "admin",
    });
  });

  test("should login successfully with UPPERCASE email (case-insensitive)", async () => {
    // The route handler uses .toLowerCase() for email comparison.
    // "ADMIN@GJIRAFANEWS.COM" should still find the admin user.
    const request = createLoginRequest({
      email: "ADMIN@GJIRAFANEWS.COM",
      password: "admin123",
    });

    const response = await POST(request);
    const { data, status } = await parseResponse(response);

    // ── Assert: still logs in successfully ──
    expect(status).toEqual(200);
    expect(data.user.email).toEqual("admin@gjirafanews.com");
    expect(data.user.role).toEqual("admin");
  });

  test("should login with mixed-case email", async () => {
    // "Admin@GjirafaNews.com" — mixed case should also work.
    const request = createLoginRequest({
      email: "Admin@GjirafaNews.com",
      password: "admin123",
    });

    const response = await POST(request);
    const { data, status } = await parseResponse(response);

    expect(status).toEqual(200);
    expect(data.user).toBeDefined();
  });

  // ─── WRONG PASSWORD ─────────────────────────────────────────────────────

  test("should reject login with wrong password", async () => {
    // Correct email, WRONG password.
    // bcrypt.compare("wrongpassword", hash) will return false.
    const request = createLoginRequest({
      email: "admin@gjirafanews.com",
      password: "wrongpassword",
    });

    const response = await POST(request);
    const { data, status } = await parseResponse(response);

    // ── Assert: HTTP 401 Unauthorized ──
    // 401 means authentication failed — bad credentials.
    expect(status).toEqual(401);

    // ── Assert: error message ──
    // The route handler returns a generic message to avoid leaking info
    // about whether the email or password was wrong.
    expect(data.error).toEqual("Invalid email or password");

    // ── Assert: no user in response ──
    // On failure, the response should NOT contain a user object.
    expect(data.user).toBeUndefined();

    // ── Assert: createSession was NOT called ──
    // Failed login must not create a session — that would be a security bug.
    // not.toHaveBeenCalled() verifies zero invocations.
    expect(mockCreateSession).not.toHaveBeenCalled();
  });

  test("should reject login with empty password", async () => {
    const request = createLoginRequest({
      email: "admin@gjirafanews.com",
      password: "",
    });

    const response = await POST(request);
    const { data, status } = await parseResponse(response);

    // ── Assert: HTTP 400 Bad Request ──
    // Empty password triggers the !password check, returning 400.
    expect(status).toEqual(400);
    expect(data.error).toEqual("Email and password are required");
    expect(mockCreateSession).not.toHaveBeenCalled();
  });

  // ─── WRONG EMAIL ────────────────────────────────────────────────────────

  test("should reject login with non-existent email", async () => {
    // This email doesn't exist in the users array.
    const request = createLoginRequest({
      email: "nobody@gjirafanews.com",
      password: "admin123",
    });

    const response = await POST(request);
    const { data, status } = await parseResponse(response);

    // ── Assert: HTTP 401 Unauthorized ──
    expect(status).toEqual(401);

    // ── Assert: same generic error message ──
    // The handler uses the same message for wrong email and wrong password
    // so attackers can't enumerate valid emails.
    expect(data.error).toEqual("Invalid email or password");
    expect(mockCreateSession).not.toHaveBeenCalled();
  });

  test("should reject login with empty email", async () => {
    const request = createLoginRequest({
      email: "",
      password: "admin123",
    });

    const response = await POST(request);
    const { data, status } = await parseResponse(response);

    // ── Assert: HTTP 400 ──
    // Empty email triggers the !email check.
    expect(status).toEqual(400);
    expect(data.error).toEqual("Email and password are required");
    expect(mockCreateSession).not.toHaveBeenCalled();
  });

  // ─── MISSING FIELDS ────────────────────────────────────────────────────

  test("should reject when both email and password are missing", async () => {
    // Send an empty JSON body — both fields are undefined.
    const request = createLoginRequest({});

    const response = await POST(request);
    const { data, status } = await parseResponse(response);

    // ── Assert: HTTP 400 Bad Request ──
    expect(status).toEqual(400);
    expect(data.error).toEqual("Email and password are required");
    expect(mockCreateSession).not.toHaveBeenCalled();
  });

  test("should reject when only email is provided (no password)", async () => {
    // Only email, no password field at all.
    const request = createLoginRequest({
      email: "admin@gjirafanews.com",
    });

    const response = await POST(request);
    const { data, status } = await parseResponse(response);

    expect(status).toEqual(400);
    expect(data.error).toEqual("Email and password are required");
    expect(mockCreateSession).not.toHaveBeenCalled();
  });

  test("should reject when only password is provided (no email)", async () => {
    const request = createLoginRequest({
      password: "admin123",
    });

    const response = await POST(request);
    const { data, status } = await parseResponse(response);

    expect(status).toEqual(400);
    expect(data.error).toEqual("Email and password are required");
    expect(mockCreateSession).not.toHaveBeenCalled();
  });

  // ─── RESPONSE SHAPE VALIDATION ─────────────────────────────────────────

  test("successful login response should have correct SafeUser shape", async () => {
    const request = createLoginRequest({
      email: "admin@gjirafanews.com",
      password: "admin123",
    });

    const response = await POST(request);
    const { data } = await parseResponse(response);

    // ── Assert: user object has all expected SafeUser fields ──
    // typeof checks ensure each field is the correct JavaScript type.
    expect(typeof data.user.id).toEqual("string");
    expect(typeof data.user.email).toEqual("string");
    expect(typeof data.user.name).toEqual("string");
    expect(typeof data.user.role).toEqual("string");
    expect(typeof data.user.createdAt).toEqual("string");

    // ── Assert: createdAt is a valid ISO date ──
    // toMatch validates the date format with a regex.
    expect(data.user.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    // ── Assert: role is one of the valid values ──
    // toContain on the array checks if role is "admin" or "user".
    expect(["admin", "user"]).toContain(data.user.role);

    // ── Assert: NO extra sensitive fields leaked ──
    // The password must never appear in the API response.
    expect(data.user.password).toBeUndefined();
    // Object.keys returns all property names — verify password is not among them.
    expect(Object.keys(data.user)).not.toContain("password");
  });

  // ─── BCRYPT VERIFICATION ───────────────────────────────────────────────

  test("bcrypt should correctly verify admin123 against the stored hash", async () => {
    // This test directly verifies that the bcrypt hash in the seed data
    // matches the password "admin123". If someone changes the hash or
    // password, this test will catch it.
    const bcrypt = await import("bcryptjs");
    const { users } = await import("@/lib/data");

    // Find the admin user.
    const admin = users.find((u) => u.email === "admin@gjirafanews.com");

    // toBeDefined ensures the admin user exists in the data.
    expect(admin).toBeDefined();

    // bcrypt.compare returns true if the plaintext matches the hash.
    const isMatch = await bcrypt.compare("admin123", admin!.password);
    // toBe(true) — strict boolean check.
    expect(isMatch).toBe(true);
  });

  test("bcrypt should reject wrong password against the stored hash", async () => {
    const bcrypt = await import("bcryptjs");
    const { users } = await import("@/lib/data");

    const admin = users.find((u) => u.email === "admin@gjirafanews.com");
    expect(admin).toBeDefined();

    // "wrongpassword" should NOT match the stored hash.
    const isMatch = await bcrypt.compare("wrongpassword", admin!.password);
    // toBe(false) — the password doesn't match.
    expect(isMatch).toBe(false);
  });

  // ─── SECURITY: BRUTE FORCE PATTERNS ─────────────────────────────────────

  test("should reject multiple wrong passwords for the same email", async () => {
    // Simulate an attacker trying several passwords.
    const wrongPasswords = ["password", "123456", "admin", "letmein", "qwerty"];

    for (const password of wrongPasswords) {
      const request = createLoginRequest({
        email: "admin@gjirafanews.com",
        password,
      });

      const response = await POST(request);
      const { status } = await parseResponse(response);

      // Every attempt should return 401.
      // Each iteration asserts independently.
      expect(status).toEqual(401);
    }

    // No session should have been created for any of the attempts.
    expect(mockCreateSession).not.toHaveBeenCalled();
  });

  test("should reject login attempts with SQL injection patterns", async () => {
    // These strings look like SQL injection attempts.
    // The handler uses array.find() (not SQL), so they just won't match any user.
    const maliciousEmails = [
      "' OR 1=1 --",
      "admin@gjirafanews.com' --",
      "'; DROP TABLE users; --",
    ];

    for (const email of maliciousEmails) {
      const request = createLoginRequest({
        email,
        password: "admin123",
      });

      const response = await POST(request);
      const { status } = await parseResponse(response);

      // All should be rejected — either 400 or 401.
      // toBeLessThanOrEqual(401) accepts both 400 and 401.
      expect(status).toBeGreaterThanOrEqual(400);
      expect(status).toBeLessThanOrEqual(401);
    }

    expect(mockCreateSession).not.toHaveBeenCalled();
  });
});
