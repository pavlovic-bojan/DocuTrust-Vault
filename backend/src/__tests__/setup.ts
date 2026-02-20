process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/doctrust_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-minimum-32-characters-long';
process.env.UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads-test';
process.env.BUG_REPORT_EMAIL = process.env.BUG_REPORT_EMAIL || 'admin@test.local';
