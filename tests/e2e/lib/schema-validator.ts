import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

/**
 * Validates response body against a JSON Schema (OpenAPI-compatible).
 * Returns { valid: true } or { valid: false, errors: [...] }.
 */
export function validateAgainstSchema(body: unknown, schema: object): { valid: boolean; errors?: string[] } {
  const validate = ajv.compile(schema);
  const valid = validate(body);

  if (valid) {
    return { valid: true };
  }

  const errors = (validate.errors ?? []).map(
    (e) => `${e.instancePath || '/'} ${e.message ?? ''}`.trim()
  );
  return { valid: false, errors };
}

/** JSON schemas aligned with backend/openapi.yaml for response validation */
export const schemas = {
  health: {
    type: 'object',
    required: ['status'],
    properties: { status: { type: 'string', const: 'ok' } },
  },
  authLogin: {
    type: 'object',
    required: ['user', 'token'],
    properties: {
      user: {
        type: 'object',
        required: ['userId', 'email', 'firstName', 'lastName', 'role'],
        properties: {
          userId: { type: 'string', format: 'uuid' },
          companyId: { type: 'string' },
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          role: { type: 'string' },
        },
      },
      token: { type: 'string' },
      expiresAt: { type: 'string' },
    },
  },
  usersList: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        email: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        role: { type: 'string' },
        status: { type: 'string' },
      },
    },
  },
  tenantsList: {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            code: { type: 'string' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },
  genericDataArray: {
    type: 'object',
    properties: {
      data: { type: 'array' },
    },
  },
  genericDataObject: {
    type: 'object',
    properties: {
      data: {},
    },
  },
  emptyBody: {},
} as const;
