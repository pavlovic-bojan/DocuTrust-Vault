/**
 * DocuTrust Vault – Express app
 * Per docs/OpenAPI.yaml and docs/DocuTrust_Vault_HLD.md
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { parse as parseYaml } from 'yaml';
import swaggerUi from 'swagger-ui-express';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './interfaces/http/auth.routes.js';
import userRoutes from './interfaces/http/user.routes.js';
import documentRoutes from './interfaces/http/document.routes.js';
import reportBugRoutes from './interfaces/http/report-bug.routes.js';
import { env } from './config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const openApiPath = path.resolve(__dirname, '../../docs/OpenAPI.yaml');
const openApiSpec = parseYaml(fs.readFileSync(openApiPath, 'utf-8'));
// Override server URL for local dev
openApiSpec.servers = [{ url: `http://localhost:${env.PORT}/api/v1`, description: 'Local' }];

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

// API v1 – per OpenAPI
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/report-bug', reportBugRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

export { app };
