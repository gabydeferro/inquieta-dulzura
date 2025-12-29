export interface Usuario {
    id: number;
    email: string;
    password_hash: string;
    nombre: string;
    rol: 'admin' | 'usuario';
    activo: boolean;
    ultimo_login?: Date;
    created_at: Date;
    updated_at: Date;
}

export interface UsuarioSinPassword extends Omit<Usuario, 'password_hash'> { }

export interface RefreshToken {
    id: number;
    usuario_id: number;
    token: string;
    expires_at: Date;
    created_at: Date;
}

export interface JWTPayload {
    userId: number;
    email: string;
    rol: 'admin' | 'usuario';
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    nombre: string;
}
