// Loaded before each integration test file. Pulls .env.local so POSTGRES_URL
// and auth secrets are available, and sets harmless defaults for any auth
// vars not provided locally.
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = "integration-test-secret-please-override-locally";
}
if (!process.env.ADMIN_USERNAME) process.env.ADMIN_USERNAME = "tester";
if (!process.env.ADMIN_PASSWORD) process.env.ADMIN_PASSWORD = "tester-pass";
