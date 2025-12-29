import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './Dashboard.css';

interface Stats {
    totalProductos: number;
    totalVentas: number;
    totalFotos: number;
    stockBajo: number;
}

export const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<Stats>({
        totalProductos: 0,
        totalVentas: 0,
        totalFotos: 0,
        stockBajo: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            // Cargar estadísticas (estos endpoints se implementarían después)
            const [fotosRes] = await Promise.all([
                api.get('/fotos/estadisticas')
            ]);

            setStats({
                totalProductos: 0, // Placeholder
                totalVentas: 0, // Placeholder
                totalFotos: fotosRes.data.total_fotos || 0,
                stockBajo: 0 // Placeholder
            });
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Cargando dashboard...</div>;
    }

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <h1>Bienvenido, {user?.nombre}! 👋</h1>
                <p>Panel de control de Inquieta Dulzura</p>
            </header>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">📦</div>
                    <div className="stat-content">
                        <h3>Productos</h3>
                        <p className="stat-number">{stats.totalProductos}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-content">
                        <h3>Ventas</h3>
                        <p className="stat-number">{stats.totalVentas}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">📸</div>
                    <div className="stat-content">
                        <h3>Fotos</h3>
                        <p className="stat-number">{stats.totalFotos}</p>
                    </div>
                </div>

                <div className="stat-card alert">
                    <div className="stat-icon">⚠️</div>
                    <div className="stat-content">
                        <h3>Stock Bajo</h3>
                        <p className="stat-number">{stats.stockBajo}</p>
                    </div>
                </div>
            </div>

            <div className="quick-actions">
                <h2>Accesos Rápidos</h2>
                <div className="actions-grid">
                    <Link to="/inventario" className="action-card">
                        <span className="action-icon">📋</span>
                        <h3>Gestionar Inventario</h3>
                        <p>Ver y actualizar productos</p>
                    </Link>

                    <Link to="/recetas" className="action-card">
                        <span className="action-icon">📖</span>
                        <h3>Ver Recetas</h3>
                        <p>Consultar recetas de productos</p>
                    </Link>

                    <Link to="/ventas" className="action-card">
                        <span className="action-icon">🛒</span>
                        <h3>Registrar Venta</h3>
                        <p>Nueva venta de productos</p>
                    </Link>

                    <Link to="/contenido-digital" className="action-card">
                        <span className="action-icon">🖼️</span>
                        <h3>Contenido Digital</h3>
                        <p>Gestionar fotos de productos</p>
                    </Link>

                    <Link to="/categorias" className="action-card">
                        <span className="action-icon">🏷️</span>
                        <h3>Categorías</h3>
                        <p>Organizar tipos de productos</p>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
