import React, { useState, useEffect, useCallback } from 'react';
import './GestorFotos.css';

interface Foto {
    id: number;
    producto_id: number;
    nombre_archivo: string;
    url_publica: string;
    tamano_bytes: number;
    ancho_px?: number;
    alto_px?: number;
    es_principal: boolean;
    orden: number;
}

interface Estadisticas {
    total_fotos: number;
    tamano_total_mb: number;
    promedio_kb: number;
}

interface Props {
    productoId: number;
}

export const GestorFotos: React.FC<Props> = ({ productoId }) => {
    const [fotos, setFotos] = useState<Foto[]>([]);
    const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
    const [cargando, setCargando] = useState(false);
    const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

    const API_URL = '/api/fotos';

    // Cargar fotos
    const cargarFotos = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/producto/${productoId}`);
            const data = await response.json();
            setFotos(data);
        } catch (error) {
            console.error('Error al cargar fotos:', error);
            mostrarMensaje('error', 'Error al cargar las fotos');
        }
    }, [productoId]);

    // Cargar estadísticas
    const cargarEstadisticas = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/estadisticas`);
            const data = await response.json();
            setEstadisticas(data);
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
        }
    }, []);

    useEffect(() => {
        cargarFotos();
        cargarEstadisticas();
    }, [cargarFotos, cargarEstadisticas]);

    // Subir foto
    const handleSubirFoto = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const form = e.currentTarget;
        const formData = new FormData(form);
        formData.append('producto_id', productoId.toString());

        setCargando(true);

        try {
            const response = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                body: formData
            });

            const resultado = await response.json();

            if (resultado.success) {
                mostrarMensaje('success', 'Foto subida exitosamente');
                cargarFotos();
                cargarEstadisticas();
                form.reset();
            } else {
                mostrarMensaje('error', resultado.message);
            }
        } catch (error) {
            console.error('Error al subir foto:', error);
            mostrarMensaje('error', 'Error al subir la foto');
        } finally {
            setCargando(false);
        }
    };

    // Establecer como principal
    const handleEstablecerPrincipal = async (fotoId: number) => {
        if (!confirm('¿Establecer esta foto como principal?')) return;

        try {
            const response = await fetch(`${API_URL}/${fotoId}/principal`, {
                method: 'PUT'
            });

            const resultado = await response.json();

            if (resultado.success) {
                mostrarMensaje('success', 'Foto principal actualizada');
                cargarFotos();
            } else {
                mostrarMensaje('error', resultado.message);
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarMensaje('error', 'Error al actualizar foto principal');
        }
    };

    // Eliminar foto
    const handleEliminarFoto = async (fotoId: number) => {
        if (!confirm('¿Estás seguro de eliminar esta foto? Esta acción no se puede deshacer.')) return;

        try {
            const response = await fetch(`${API_URL}/${fotoId}`, {
                method: 'DELETE'
            });

            const resultado = await response.json();

            if (resultado.success) {
                mostrarMensaje('success', 'Foto eliminada exitosamente');
                cargarFotos();
                cargarEstadisticas();
            } else {
                mostrarMensaje('error', resultado.message);
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarMensaje('error', 'Error al eliminar la foto');
        }
    };

    // Mostrar mensaje
    const mostrarMensaje = (tipo: 'success' | 'error', texto: string) => {
        setMensaje({ tipo, texto });
        setTimeout(() => setMensaje(null), 5000);
    };

    return (
        <div className="gestor-fotos">
            <h1>📸 Gestor de Fotos</h1>
            <p className="subtitle">Producto ID: {productoId}</p>

            {/* Alertas */}
            {mensaje && (
                <div className={`alert alert-${mensaje.tipo}`}>
                    {mensaje.texto}
                </div>
            )}

            {/* Estadísticas */}
            {estadisticas && (
                <div className="stats">
                    <div className="stat-card">
                        <div className="stat-value">{estadisticas.total_fotos}</div>
                        <div className="stat-label">Total de Fotos</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{estadisticas.tamano_total_mb.toFixed(2)} MB</div>
                        <div className="stat-label">Espacio Usado</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{estadisticas.promedio_kb.toFixed(2)} KB</div>
                        <div className="stat-label">Promedio por Foto</div>
                    </div>
                </div>
            )}

            {/* Formulario de subida */}
            <div className="upload-section">
                <form onSubmit={handleSubirFoto}>
                    <div className="upload-area">
                        <div className="upload-icon">📤</div>
                        <h3>Selecciona una imagen</h3>
                        <p>Formatos: JPG, PNG, WEBP, GIF (máx 5MB)</p>
                        <input
                            type="file"
                            name="foto"
                            accept="image/*"
                            required
                            disabled={cargando}
                        />
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                        <label>
                            <input type="checkbox" name="es_principal" value="1" />
                            Establecer como foto principal
                        </label>
                        <br />
                        <button type="submit" className="btn" disabled={cargando}>
                            {cargando ? 'Subiendo...' : 'Subir Foto'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Galería */}
            <h2>Galería de Fotos</h2>
            <div className="gallery">
                {fotos.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#999', gridColumn: '1/-1' }}>
                        No hay fotos aún. ¡Sube la primera!
                    </p>
                ) : (
                    fotos.map(foto => (
                        <div key={foto.id} className="photo-card">
                            <img src={foto.url_publica} alt={foto.nombre_archivo} />
                            {foto.es_principal && (
                                <div className="photo-badge">PRINCIPAL</div>
                            )}
                            <div className="photo-info">
                                <strong>{foto.nombre_archivo}</strong>
                                <p style={{ color: '#666', fontSize: '0.9em', marginTop: '5px' }}>
                                    {foto.ancho_px} × {foto.alto_px} px<br />
                                    {(foto.tamano_bytes / 1024 / 1024).toFixed(2)} MB
                                </p>
                                <div className="photo-actions">
                                    {!foto.es_principal && (
                                        <button
                                            className="btn-small btn-primary"
                                            onClick={() => handleEstablecerPrincipal(foto.id)}
                                        >
                                            ⭐ Principal
                                        </button>
                                    )}
                                    <button
                                        className="btn-small btn-danger"
                                        onClick={() => handleEliminarFoto(foto.id)}
                                    >
                                        🗑️ Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default GestorFotos;
