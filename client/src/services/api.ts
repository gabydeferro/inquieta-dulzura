import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Ingrediente } from '../types/Ingrediente';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiService {
  private api: AxiosInstance;
  private refreshing: boolean = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para agregar token a las peticiones
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Interceptor para manejar errores y refresh de tokens
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Normalize server error format: { success: false, error: string } → add message for component handlers
        if (error.response?.data?.success === false && error.response?.data?.error) {
          error.response.data.message = error.response.data.error;
        }

        const originalRequest = error.config;

        // Si el error es 403 (token expirado) y no hemos intentado refrescar
        if (error.response?.status === 403 && !originalRequest._retry) {
          if (this.refreshing) {
            // Si ya estamos refrescando, esperar
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(this.api(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.refreshing = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
              throw new Error('No refresh token');
            }

            const response = await axios.post(`${API_URL}/auth/refresh`, {
              refreshToken,
            });

            const { accessToken } = response.data;
            localStorage.setItem('accessToken', accessToken);

            // Notificar a las peticiones en espera
            this.refreshSubscribers.forEach((callback) => callback(accessToken));
            this.refreshSubscribers = [];

            // Reintentar la petición original
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            // Si falla el refresh, limpiar tokens y redirigir a login
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          } finally {
            this.refreshing = false;
          }
        }

        return Promise.reject(error);
      },
    );
  }

  // Métodos HTTP
  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.get<T>(url, config);
  }

  async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.api.post<T>(url, data, config);
  }

  async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.api.put<T>(url, data, config);
  }

  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.delete<T>(url, config);
  }

  // --- Métodos específicos de la API ---

  // Categorías
  async getCategorias<T = unknown>(): Promise<AxiosResponse<T>> {
    return this.get<T>('/categorias');
  }

  // Productos
  async getProductos<T = unknown>(): Promise<AxiosResponse<T>> {
    return this.get<T>('/productos');
  }

  async getProductosByCategoria<T = unknown>(categoriaId: number): Promise<AxiosResponse<T>> {
    return this.get<T>(`/productos/categoria/${categoriaId}`);
  }

  // Ingredientes
  async getIngredientes(): Promise<AxiosResponse<Ingrediente[]>> {
    return this.get<Ingrediente[]>('/ingredientes');
  }

  async getIngredienteById(id: number): Promise<AxiosResponse<Ingrediente>> {
    return this.get<Ingrediente>(`/ingredientes/${id}`);
  }

  async createIngrediente(
    ingrediente: Omit<Ingrediente, 'id'>,
  ): Promise<AxiosResponse<Ingrediente>> {
    return this.post<Ingrediente>('/ingredientes', ingrediente);
  }

  async updateIngrediente(
    id: number,
    ingrediente: Partial<Ingrediente>,
  ): Promise<AxiosResponse<Ingrediente>> {
    return this.put<Ingrediente>(`/ingredientes/${id}`, ingrediente);
  }

  async deleteIngrediente(id: number): Promise<AxiosResponse<void>> {
    return this.delete<void>(`/ingredientes/${id}`);
  }

  // Contenido Digital
  async getContenidoDigital<T = unknown>(): Promise<AxiosResponse<T>> {
    return this.get<T>('/contenido-digital');
  }

  async createContenidoDigital(data: FormData): Promise<AxiosResponse<void>> {
    return this.post<void>('/contenido-digital', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  async deleteContenidoDigital(id: number): Promise<AxiosResponse<void>> {
    return this.delete<void>(`/contenido-digital/${id}`);
  }

  // --- Instagram Integration ---
  async instagramUploadMedia(
    productId: number,
    imageUrl: string,
    caption: string,
  ): Promise<AxiosResponse<{ containerId: string }>> {
    return this.post('/instagram/upload-media', { productId, imageUrl, caption });
  }

  async instagramPublish(
    productId: number,
    containerId: string,
    caption: string,
  ): Promise<AxiosResponse<{ postId: string; status: string }>> {
    return this.post('/instagram/publish', { productId, containerId, caption });
  }

  async instagramGetPostStatus(productId: number): Promise<AxiosResponse> {
    return this.get(`/instagram/products/${productId}/post`);
  }

  async instagramGetMetrics(
    productId: number,
    period: string = '30d',
  ): Promise<AxiosResponse> {
    return this.get(`/instagram/products/${productId}/metrics?period=${period}`);
  }

  async instagramGetComments(postId: string): Promise<AxiosResponse> {
    return this.get(`/instagram/posts/${postId}/comments`);
  }

  async instagramReplyToComment(
    commentId: string,
    text: string,
  ): Promise<AxiosResponse> {
    return this.post(`/instagram/comments/${commentId}/reply`, { text });
  }

  async instagramHideComment(commentId: string): Promise<AxiosResponse> {
    return this.post(`/instagram/comments/${commentId}/hide`);
  }

  async instagramUnhideComment(commentId: string): Promise<AxiosResponse> {
    return this.post(`/instagram/comments/${commentId}/unhide`);
  }

  async instagramRefreshToken(): Promise<AxiosResponse> {
    return this.post('/instagram/auth/refresh');
  }

  // Método especial para subir archivos
  async uploadFile<T = unknown>(url: string, formData: FormData): Promise<AxiosResponse<T>> {
    return this.api.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
}

export default new ApiService();
