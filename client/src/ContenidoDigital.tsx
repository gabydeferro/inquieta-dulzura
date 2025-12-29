import React, { useState, useEffect } from 'react';
import './ContenidoDigital.css';

interface Imagen {
    id: number;
    productoId: number;
    url: string;
    titulo: string;
    descripcion?: string;
    etiquetas: string[];
    fechaSubida: Date;
    tipo: 'imagen' | 'video';
}

export const ContenidoDigital: React.FC = () => {
    const [imagenes, setImagenes] = useState<Imagen[]>([]);
    const [filtroEtiqueta, setFiltroEtiqueta] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cargarImagenes();
    }, []);

    const cargarImagenes = async () => {
        try {
            const response = await fetch('/api/contenido-digital');
            const data = await response.json();
            setImagenes(data);
        } catch (error) {
            console.error('Error al cargar imágenes:', error);
        } finally {
            setLoading(false);
        }
    };

    const imagenesFiltradas = filtroEtiqueta
        ? imagenes.filter(img =>
            img.etiquetas.some(e => e.toLowerCase().includes(filtroEtiqueta.toLowerCase()))
        )
        : imagenes;

    const handleEliminar = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar esta imagen?')) return;

        try {
            await fetch(`/api/contenido-digital/${id}`, { method: 'DELETE' });
            setImagenes(imagenes.filter(img => img.id !== id));
        } catch (error) {
            console.error('Error al eliminar imagen:', error);
        }
    };

    if (loading) {
        return <div className="loading">Cargando contenido digital...</div>;
    }

    return (
        <div className="contenido-digital-container">
            <header className="contenido-digital-header">
                <h1>Contenido Digital</h1>
                <p>Gestión de fotos y videos de productos</p>
            </header>

            <div className="filtros">
                <input
                    type="text"
                    placeholder="Filtrar por etiqueta..."
                    value={filtroEtiqueta}
                    onChange={(e) => setFiltroEtiqueta(e.target.value)}
                    className="filtro-input"
                />
            </div>

            <div className="galeria">
                {imagenesFiltradas.length === 0 ? (
                    <p className="sin-resultados">No hay imágenes disponibles</p>
                ) : (
                    imagenesFiltradas.map(imagen => (
                        <div key={imagen.id} className="imagen-card">
                            <div className="imagen-preview">
                                {imagen.tipo === 'imagen' ? (
                                    <img src={imagen.url} alt={imagen.titulo} />
                                ) : (
                                    <video src={imagen.url} controls />
                                )}
                            </div>
                            <div className="imagen-info">
                                <h3>{imagen.titulo}</h3>
                                {imagen.descripcion && <p>{imagen.descripcion}</p>}
                                <div className="etiquetas">
                                    {imagen.etiquetas.map((etiqueta, idx) => (
                                        <span key={idx} className="etiqueta">{etiqueta}</span>
                                    ))}
                                </div>
                                <div className="imagen-acciones">
                                    <button className="btn-eliminar" onClick={() => handleEliminar(imagen.id)}>
                                        Eliminar
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

export default ContenidoDigital;
