import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Container, Navbar, Nav, Button, Dropdown, Offcanvas } from 'react-bootstrap';
import { toast } from 'react-toastify';
import authService from '../../services/authService';

const AdminLayout = () => {
  const [showSidebar, setShowSidebar] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authService.logout();
      toast.success('Logout realizado com sucesso!');
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error('Erro ao realizar logout');
    }
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  // Close sidebar when a link is clicked
  const handleLinkClick = () => {
    setShowSidebar(false);
  };

  // Check if a route is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="d-flex flex-column vh-100">
      {/* Navbar */}
      <Navbar bg="primary" variant="dark" expand="lg" className="px-3 shadow-sm">
        <Container fluid>
          <Navbar.Brand as={Link} to="/admin/dashboard">
            UNISINOS - Sistema de Agendamento
          </Navbar.Brand>
          
          <div className="d-flex align-items-center">
            {/* Mobile menu toggle */}
            <Button
              variant="outline-light"
              className="d-lg-none me-2"
              onClick={toggleSidebar}
            >
              <i className="bi bi-list"></i>
            </Button>
            
            {/* User dropdown */}
            <Dropdown align="end">
              <Dropdown.Toggle variant="outline-light" id="user-dropdown">
                <i className="bi bi-person-circle me-1"></i>
                Administrador
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item disabled>
                  <i className="bi bi-person me-2"></i>
                  Meu Perfil
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right me-2"></i>
                  Sair
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </Container>
      </Navbar>

      <div className="flex-grow-1 d-flex">
        {/* Sidebar for desktop */}
        <div className="bg-light d-none d-lg-flex flex-column border-end" style={{ width: '250px' }}>
          <Nav className="flex-column p-3">
            <Nav.Link
              as={Link}
              to="/admin/dashboard"
              className={`mb-2 ${isActive('/admin/dashboard') ? 'active bg-primary text-white' : ''}`}
            >
              <i className="bi bi-house-door me-2"></i>
              Dashboard
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/admin/subjects"
              className={`mb-2 ${isActive('/admin/subjects') ? 'active bg-primary text-white' : ''}`}
            >
              <i className="bi bi-book me-2"></i>
              Gerenciar Disciplinas
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/admin/emails"
              className={`mb-2 ${isActive('/admin/emails') ? 'active bg-primary text-white' : ''}`}
            >
              <i className="bi bi-envelope me-2"></i>
              Agendar E-mails
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/admin/schedules"
              className={`mb-2 ${isActive('/admin/schedules') ? 'active bg-primary text-white' : ''}`}
            >
              <i className="bi bi-calendar-week me-2"></i>
              Sugestões de Grade
            </Nav.Link>
            <hr />
            <Nav.Link onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-2"></i>
              Sair
            </Nav.Link>
          </Nav>
        </div>

        {/* Sidebar for mobile */}
        <Offcanvas show={showSidebar} onHide={() => setShowSidebar(false)} responsive="lg">
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>Menu do Administrador</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <Nav className="flex-column">
              <Nav.Link
                as={Link}
                to="/admin/dashboard"
                className={`mb-2 ${isActive('/admin/dashboard') ? 'active bg-primary text-white' : ''}`}
                onClick={handleLinkClick}
              >
                <i className="bi bi-house-door me-2"></i>
                Dashboard
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/admin/subjects"
                className={`mb-2 ${isActive('/admin/subjects') ? 'active bg-primary text-white' : ''}`}
                onClick={handleLinkClick}
              >
                <i className="bi bi-book me-2"></i>
                Gerenciar Disciplinas
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/admin/emails"
                className={`mb-2 ${isActive('/admin/emails') ? 'active bg-primary text-white' : ''}`}
                onClick={handleLinkClick}
              >
                <i className="bi bi-envelope me-2"></i>
                Agendar E-mails
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/admin/schedules"
                className={`mb-2 ${isActive('/admin/schedules') ? 'active bg-primary text-white' : ''}`}
                onClick={handleLinkClick}
              >
                <i className="bi bi-calendar-week me-2"></i>
                Sugestões de Grade
              </Nav.Link>
              <hr />
              <Nav.Link onClick={handleLogout}>
                <i className="bi bi-box-arrow-right me-2"></i>
                Sair
              </Nav.Link>
            </Nav>
          </Offcanvas.Body>
        </Offcanvas>

        {/* Main content area */}
        <div className="flex-grow-1 bg-light overflow-auto p-3">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout; 