import { Navigate, createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Facturacion from './components/Facturacion';
import NotasCredito from './components/NotasCredito';
import CajaControl from './components/CajaControl';
import Navbar from './components/Navbar';
import './App.css';

// Componente para verificar autenticación
function AuthCheck() {
  const token = localStorage.getItem('facdin_token');
  return token ? <Navigate to="/dashboard" replace /> : <Login />;
}

// Componente para rutas protegidas
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('facdin_token');
  return token ? children : <Navigate to="/login" replace />;
}

// Layout para rutas autenticadas
function AuthenticatedLayout() {
  return (
    <>
      <Navbar />
      <main className="main-content">
        <div className="page-container">
          <Outlet />
        </div>
      </main>
    </>
  );
}

// Define el router
const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />
  },
  {
    path: "/login",
    element: <AuthCheck />
  },
  {
    element: (
      <ProtectedRoute>
        <AuthenticatedLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "/dashboard", element: <Dashboard /> },
      { path: "/facturacion", element: <Facturacion /> },
      { path: "/notas", element: <NotasCredito /> },
      { path: "/caja", element: <CajaControl /> },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}