import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import authService from '../../services/authService';

/**
 * Login component that redirects users to SAML SSO login
 */
const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [isProcessingToken, setIsProcessingToken] = useState(false);

  // Get redirect URL from location state or query params
  const redirectUrl = location.state?.from || 
                     new URLSearchParams(location.search).get('redirectTo');

  useEffect(() => {
    // Check if there's a token in the URL (after SSO redirect)
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const errorParam = params.get('error');
    
    if (errorParam) {
      // Show error message
      setError(decodeURIComponent(errorParam));
    } else if (token) {
      setIsProcessingToken(true);
      
      try {
        // Login with token
        const auth = authService.loginWithToken(token);
        
        // Redirect based on user role
        if (auth?.user?.role) {
          let targetUrl;
          
          switch (auth.user.role) {
            case 'admin':
              targetUrl = '/admin/dashboard';
              break;
            case 'professor':
              targetUrl = '/professor/dashboard';
              break;
            case 'student':
              targetUrl = '/student/dashboard';
              break;
            default:
              targetUrl = '/';
          }
          
          // If there was a specific redirect URL, use that instead
          if (redirectUrl) {
            targetUrl = redirectUrl;
          }
          
          // Remove token from URL before redirecting
          navigate(targetUrl, { replace: true });
          toast.success('Login realizado com sucesso!');
        }
      } catch (error) {
        console.error('Error processing token:', error);
        setError('Token inválido ou expirado. Por favor, tente fazer login novamente.');
      } finally {
        setIsProcessingToken(false);
      }
    } else {
      // Check if already authenticated
      const auth = authService.initAuth();
      
      if (auth) {
        // Already logged in, redirect based on role
        let targetUrl;
        
        switch (auth.user.role) {
          case 'admin':
            targetUrl = '/admin/dashboard';
            break;
          case 'professor':
            targetUrl = '/professor/dashboard';
            break;
          case 'student':
            targetUrl = '/student/dashboard';
            break;
          default:
            targetUrl = '/';
        }
        
        navigate(targetUrl, { replace: true });
      }
    }
  }, [location, navigate, redirectUrl]);

  /**
   * Redirect to SAML login
   */
  const handleSSOLogin = () => {
    // Generate SAML login URL
    const loginUrl = authService.getSamlLoginUrl(redirectUrl);
    
    // Redirect to SSO login
    window.location.href = loginUrl;
  };

  // Show loading state while processing token
  if (isProcessingToken) {
    return (
      <Container className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Processando...</span>
          </div>
          <p>Processando seu login, por favor aguarde...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="d-flex justify-content-center align-items-center min-vh-100">
      <Row className="w-100">
        <Col lg={6} className="mx-auto">
          <Card className="shadow">
            <Card.Header className="bg-primary text-white text-center py-3">
              <h2>Sistema de Agendamento de Disciplinas</h2>
              <h4>Universidade do Vale do Rio dos Sinos</h4>
            </Card.Header>
            <Card.Body className="px-4 py-5">
              {error && (
                <Alert variant="danger" className="mb-4">
                  {error}
                </Alert>
              )}
              
              <div className="text-center mb-4">
                <p className="lead">
                  Faça login com seu e-mail institucional para acessar o sistema.
                </p>
                <p className="text-muted">
                  Use o mesmo usuário e senha que você utiliza para acessar os sistemas da universidade.
                </p>
              </div>
              
              <div className="d-grid gap-2">
                <Button 
                  variant="primary" 
                  size="lg" 
                  onClick={handleSSOLogin}
                  className="py-3"
                >
                  <i className="bi bi-person-circle me-2"></i>
                  Entrar com E-mail Institucional
                </Button>
              </div>
            </Card.Body>
            <Card.Footer className="text-center text-muted py-3">
              <p className="mb-0">
                Em caso de problemas, entre em contato com o suporte:
                <a href="mailto:suporte@unisinos.edu.br"> suporte@unisinos.edu.br</a>
              </p>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login; 