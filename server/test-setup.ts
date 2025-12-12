import 'dotenv/config';
console.log('[Test Setup] Loading environment variables...');
if (!process.env.DATABASE_URL) {
    console.warn('[Test Setup] DATABASE_URL is not set!');
} else {
    console.log('[Test Setup] DATABASE_URL is set.');
}
