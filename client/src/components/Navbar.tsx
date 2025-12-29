import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-brand">
                    🍰 Inquieta Dulzura
                </Link>

                <ul className="navbar-menu">
                    {user ? (
                        <>
                            <li><Link to="/dashboard">Dashboard</Link></li>
                            <li><Link to="/inventario">Inventario</Link></li>
                            <li><Link to="/recetas">Recetas</Link></li>
                            <li><Link to="/ingredientes">Ingredientes</Link></li>
                            <li><Link to="/ventas">Ventas</Link></li>
                            <li><Link to="/contenido-digital">Contenido Digital</Link></li>
                        </>
                    ) : (
                        <>
                            <li><Link to="/catalogo">Catálogo</Link></li>
                        </>
                    )}
                </ul>

                <div className="navbar-auth">
                    {user ? (
                        <div className="navbar-user">
                            <span className="user-name">
                                <span className="user-icon">
                                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                    </svg>
                                </span>
                                {user.nombre}
                            </span>
                            {user.rol === 'admin' && <span className="badge">Admin</span>}
                            <button onClick={handleLogout} className="btn btn-logout">
                                Salir
                            </button>
                        </div>
                    ) : (
                        <div className="navbar-guest">
                            <Link to="/login" className="btn btn-login">Ingresar</Link>
                            <Link to="/register" className="btn btn-register">Registrarse</Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
