import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import './LandingPage.css';

const LandingPage: React.FC = () => {
    const { isAuthenticated } = useAuth();

    return (
        <div className="landing-page">
            {/* Hero Section */}
            <section className="hero">
                <div className="container hero-wrapper">
                    <div className="hero-text">
                        <h2 className="hero-eyebrow script-text">Pastelería Boutique</h2>
                        <h1 className="hero-title">Inquieta Dulzura</h1>
                        <p className="hero-description">
                            Endulzando momentos, creando recuerdos.
                            Descubre nuestra selección de piezas únicas hechas con amor.
                        </p>
                        <div className="hero-buttons">
                            <Link to="/catalogo" className="btn btn-primary btn-large">
                                Ver Catálogo
                            </Link>
                            {!isAuthenticated && (
                                <Link to="/register" className="btn btn-secondary btn-large">
                                    Únete a nosotros
                                </Link>
                            )}
                        </div>
                    </div>
                    <div className="hero-image-container">
                        <img
                            src="/hero_pastel_cake.png"
                            alt="Luxury Pastel Cake"
                            className="hero-main-image"
                        />
                    </div>
                </div>
            </section>

            {/* Categorías Destacadas (Estilo Valu) */}
            <section className="categories-section">
                <div className="container">
                    <h2 className="section-title">Nuestras Especialidades</h2>
                    <div className="categories-grid">
                        <div className="category-card">
                            <div className="category-image pink">🎂</div>
                            <h3>Tortas</h3>
                        </div>
                        <div className="category-card">
                            <div className="category-image mint">🥖</div>
                            <h3>Panes</h3>
                        </div>
                        <div className="category-card">
                            <div className="category-image lavender">🍪</div>
                            <h3>Cookies</h3>
                        </div>
                        <div className="category-card">
                            <div className="category-image peach">🍮</div>
                            <h3>Postres</h3>
                        </div>
                    </div>
                </div>
            </section>

            {/* Info Bar (Estilo Trust Bar) */}
            <section className="info-bar">
                <div className="container info-wrapper">
                    <div className="info-item">
                        <span className="info-icon">🛵</span>
                        <div>
                            <h4>Envío a Domicilio</h4>
                            <p>Llegamos a toda la zona</p>
                        </div>
                    </div>
                    <div className="info-item">
                        <span className="info-icon">🛡️</span>
                        <div>
                            <h4>Compra Segura</h4>
                            <p>Tus datos siempre protegidos</p>
                        </div>
                    </div>
                    <div className="info-item">
                        <span className="info-icon">💳</span>
                        <div>
                            <h4>Medios de Pago</h4>
                            <p>Todas las tarjetas y efectivo</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-content">
                        <h2>¿Listo para comenzar?</h2>
                        <p>Únete a nuestra plataforma y gestiona tu pastelería de forma profesional</p>
                        {!isAuthenticated && (
                            <div className="cta-buttons">
                                <Link to="/register" className="btn btn-primary btn-large">
                                    Crear Cuenta Gratis
                                </Link>
                                <Link to="/login" className="btn btn-outline btn-large">
                                    Ya tengo cuenta
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="container footer-grid">
                    <div className="footer-section">
                        <h3 className="footer-logo">Inquieta Dulzura</h3>
                        <p>Pastelería artesanal desde 2024. Creamos momentos dulces para tus ocasiones más especiales.</p>
                    </div>
                    <div className="footer-section">
                        <h4>Navegación</h4>
                        <ul>
                            <li><Link to="/catalogo">Catálogo</Link></li>
                            <li><Link to="/login">Iniciar Sesión</Link></li>
                            <li><Link to="/register">Registrarse</Link></li>
                        </ul>
                    </div>
                    <div className="footer-section">
                        <h4>Contacto</h4>
                        <p>📍 Villa Ramallo, Buenos Aires</p>
                        <p>📞 (2477) 123456</p>
                        <p>📧 info@inquietadulzura.com</p>
                    </div>
                    <div className="footer-section">
                        <h4>Horarios</h4>
                        <p>Mar a Sáb: 09:00 - 20:00</p>
                        <p>Dom: 09:00 - 13:00</p>
                        <p>Lun: Cerrado</p>
                    </div>
                </div>
                <div className="footer-bottom">
                    <div className="container">
                        <p>&copy; 2024 Inquieta Dulzura. Todos los derechos reservados. | Diseñado con ❤️</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
