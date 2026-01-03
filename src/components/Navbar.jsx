// src/components/Navbar.jsx
import { useNavigate } from 'react-router-dom';
import './Navbar.css'; 

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('facdin_token');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <h1 className="navbar-title">Sistema FACDIN</h1>
        <div className="navbar-buttons">
          <button 
            onClick={() => navigate('/clientes')} 
            className="navbar-button"
          >
            Clientes
          </button>
          <button 
            onClick={() => navigate('/productos')} 
            className="navbar-button"
          >
            Productos
          </button>
          <button 
            onClick={() => navigate('/facturacion')} 
            className="navbar-button facturar"
          >
            Facturar
          </button>
          <button 
            onClick={() => navigate('/facturas')} 
            className="navbar-button consultar"
          >
            Consultar Facturas
          </button>
          <button 
            onClick={() => navigate('/notas')} 
            className="navbar-button notas"
          >
            Notas
          </button>
          <button 
            onClick={() => navigate('/caja')} 
            className="navbar-button caja"
          >
            Caja
          </button>
          <button onClick={() => navigate('/reporte-diario')}
            className="navbar-button reporte"
          >
            Reporte Diario
          </button>
          <button 
            onClick={handleLogout} 
            className="navbar-button logout"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </nav>
  );
}
