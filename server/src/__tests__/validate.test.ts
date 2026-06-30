import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';

const testSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.number().positive('Must be positive'),
});

describe('validate middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: ReturnType<typeof vi.fn>;
  let mockStatus: ReturnType<typeof vi.fn>;
  let mockJson: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockJson = vi.fn();
    mockStatus = vi.fn(() => ({ json: mockJson }));
    mockNext = vi.fn();
    mockReq = {
      body: {},
      params: {},
      query: {},
    };
    mockRes = {
      status: mockStatus,
      json: mockJson,
    };
  });

  it('should call next() when validation passes for body', () => {
    mockReq.body = { name: 'Test', age: 25 };
    const middleware = validate(testSchema, 'body');

    middleware(mockReq as Request, mockRes as Response, mockNext as NextFunction);

    expect(mockNext).toHaveBeenCalled();
    expect(mockStatus).not.toHaveBeenCalled();
  });

  it('should replace req.body with parsed data on success', () => {
    mockReq.body = { name: 'Test', age: '25' };
    const middleware = validate(
      z.object({
        name: z.string(),
        age: z.coerce.number(),
      }),
      'body',
    );

    middleware(mockReq as Request, mockRes as Response, mockNext as NextFunction);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.body).toEqual({ name: 'Test', age: 25 });
  });

  it('should return 400 with unified error format on validation failure', () => {
    mockReq.body = { age: -1 };
    const middleware = validate(testSchema, 'body');

    middleware(mockReq as Request, mockRes as Response, mockNext as NextFunction);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      error: 'Validation failed',
      details: expect.arrayContaining([
        expect.objectContaining({
          field: expect.any(String),
          message: expect.any(String),
        }),
      ]),
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should validate params source', () => {
    mockReq.params = { id: 'abc' };
    const idSchema = z.object({
      id: z.coerce.number().positive('Must be positive'),
    });
    const middleware = validate(idSchema, 'params');

    middleware(mockReq as Request, mockRes as Response, mockNext as NextFunction);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Validation failed',
        details: expect.any(Array),
      }),
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should validate query source', () => {
    mockReq.query = { page: 'not-a-number' };
    const querySchema = z.object({
      page: z.coerce.number().positive(),
    });
    const middleware = validate(querySchema, 'query');

    middleware(mockReq as Request, mockRes as Response, mockNext as NextFunction);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should accept valid params and call next()', () => {
    mockReq.params = { id: '5' };
    const idSchema = z.object({
      id: z.coerce.number().positive(),
    });
    const middleware = validate(idSchema, 'params');

    middleware(mockReq as Request, mockRes as Response, mockNext as NextFunction);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.params).toEqual({ id: 5 });
  });

  it('should default to body source', () => {
    mockReq.body = { name: 'Test', age: 25 };
    const middleware = validate(testSchema);

    middleware(mockReq as Request, mockRes as Response, mockNext as NextFunction);

    expect(mockNext).toHaveBeenCalled();
  });
});
