import { useNavigate } from 'react-router-dom';
import './Navbar.css'; // Asegúrate de importar tu archivo CSS

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
            onClick={() => navigate('/facturacion')} 
            className="navbar-button facturar"
          >
            Facturar
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