
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { users } from "../drizzle/schema";

const connectionString = "postgresql://postgres:BcmbCGrzWOtRIQtllvLVlVFhasLGlpvI@yamanote.proxy.rlwy.net:18111/railway";

async function main() {
    const pool = new pg.Pool({ connectionString, ssl: false }); // Proxy might not need SSL or might reject self-signed? checking. Usually proxy is plain TCP to us or handles SSL. Let's try default.
    const db = drizzle(pool);

    console.log("Inserting test user...");

    await db.insert(users).values({
        openId: "test-user-id",
        name: "Test User",
        email: "test@example.com",
        loginMethod: "test",
    }).onConflictDoUpdate({
        target: users.openId,
        set: { name: "Test User" } // Update just to ensure it exists
    });

    console.log("Test user inserted/updated successfully.");
    await pool.end();
}

main().catch(console.error);
