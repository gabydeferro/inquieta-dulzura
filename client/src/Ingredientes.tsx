import React, { useState, useEffect } from 'react';
import api from './services/api';
import { Ingrediente, UnidadMedidaIngrediente } from './types/Ingrediente';
import { useNotification } from './contexts/NotificationContext';
import { useConfirm } from './contexts/ConfirmContext';
import './Ingredientes.css';

const unidades: UnidadMedidaIngrediente[] = ['kg', 'litros', 'unidades', 'gramos', 'ml'];

const Ingredientes: React.FC = () => {
    const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
    const [editingIngrediente, setEditingIngrediente] = useState<Ingrediente | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { showNotification } = useNotification();
    const confirm = useConfirm();

    useEffect(() => {
        fetchIngredientes();
    }, []);

    const fetchIngredientes = async () => {
        try {
            const response = await api.getIngredientes();
            setIngredientes(response.data);
        } catch (error) {
            showNotification('Error al cargar ingredientes', 'error');
        }
    };

    const handleCreateEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingIngrediente) return;

        try {
            if (editingIngrediente.id) {
                // Update existing ingrediente
                await api.updateIngrediente(editingIngrediente.id, editingIngrediente);
                showNotification('Ingrediente actualizado con éxito', 'success');
            } else {
                // Create new ingrediente
                await api.createIngrediente(editingIngrediente);
                showNotification('Ingrediente creado con éxito', 'success');
            }
            setIsModalOpen(false);
            setEditingIngrediente(null);
            fetchIngredientes();
        } catch (error) {
            showNotification('Error al guardar ingrediente', 'error');
        }
    };

    const handleDelete = async (id: number) => {
        const result = await confirm({ message: '¿Estás seguro de que quieres eliminar este ingrediente?' });
        if (result) {
            try {
                await api.deleteIngrediente(id);
                showNotification('Ingrediente eliminado con éxito', 'success');
                fetchIngredientes();
            } catch (error) {
                showNotification('Error al eliminar ingrediente', 'error');
            }
        }
    };

    const openCreateModal = () => {
        setEditingIngrediente({
            nombre: '',
            descripcion: '',
            unidad_medida: 'unidades',
            costo_unitario: 0,
            activo: true, // Default to active
        });
        setIsModalOpen(true);
    };

    const openEditModal = (ingrediente: Ingrediente) => {
        setEditingIngrediente({ ...ingrediente });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingIngrediente(null);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setEditingIngrediente((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                [name]: type === 'number' ? parseFloat(value) : value,
            };
        });
    };

    return (
        <div className="inventario-container">
            <h2>Gestión de Ingredientes</h2>
            <button className="add-button" onClick={openCreateModal}>
                Agregar Ingrediente
            </button>

            <div className="table-responsive">
                <table className="inventario-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Descripción</th>
                            <th>Unidad de Medida</th>
                            <th>Costo Unitario</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ingredientes.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                                    No hay ingredientes cargados
                                </td>
                            </tr>
                        ) : (
                            ingredientes.map((ingrediente) => (
                                <tr key={ingrediente.id}>
                                    <td>{ingrediente.nombre}</td>
                                    <td>{ingrediente.descripcion}</td>
                                    <td>{ingrediente.unidad_medida}</td>
                                    <td>{ingrediente.costo_unitario ? `$${Number(ingrediente.costo_unitario).toFixed(2)}` : '$0.00'}</td>
                                    <td>
                                        <button className="edit-button" onClick={() => openEditModal(ingrediente)}>
                                            Editar
                                        </button>
                                        <button className="delete-button" onClick={() => handleDelete(ingrediente.id!)}>
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && editingIngrediente && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{editingIngrediente.id ? 'Editar Ingrediente' : 'Crear Ingrediente'}</h3>
                        <form onSubmit={handleCreateEdit}>
                            <div className="form-group">
                                <label>Nombre:</label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={editingIngrediente.nombre}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Descripción:</label>
                                <textarea
                                    name="descripcion"
                                    value={editingIngrediente.descripcion || ''}
                                    onChange={handleChange}
                                    rows={3}
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Unidad de Medida:</label>
                                    <select
                                        name="unidad_medida"
                                        value={editingIngrediente.unidad_medida}
                                        onChange={handleChange}
                                        required
                                    >
                                        {unidades.map((unit) => (
                                            <option key={unit} value={unit}>
                                                {unit}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Costo Unitario:</label>
                                    <input
                                        type="number"
                                        name="costo_unitario"
                                        value={editingIngrediente.costo_unitario || 0}
                                        onChange={handleChange}
                                        step="0.01"
                                    />
                                </div>
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="save-button">
                                    Guardar
                                </button>
                                <button type="button" className="cancel-button" onClick={closeModal}>
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Ingredientes;
