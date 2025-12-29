import { Request } from 'express';
import { JWTPayload } from '../models/Usuario';

export interface AuthRequest extends Request {
    user?: JWTPayload;
}
