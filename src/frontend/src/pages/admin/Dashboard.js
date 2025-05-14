import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Badge, ListGroup, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    subjects: 0,
    students: 0,
    professors: 0,
    studentInterests: 0,
    professorAvailabilities: 0,
    scheduleSuggestions: 0,
    pendingEmails: 0
  });
  const [currentSemester, setCurrentSemester] = useState('');
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Generate current semester
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const semester = month < 6 ? 1 : 2;
        const semesterStr = `${year}/${semester}`;
        setCurrentSemester(semesterStr);

        // Fetch dashboard stats
        const dashboardResponse = await axios.get('/api/admin/dashboard/stats');
        setStats(dashboardResponse.data.data);

        // Fetch recent activity
        const activityResponse = await axios.get('/api/admin/dashboard/activity');
        setRecentActivity(activityResponse.data.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Ocorreu um erro ao carregar os dados do dashboard. Por favor, atualize a página.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'student_interest':
        return <i className="bi bi-journal-check text-success"></i>;
      case 'professor_availability':
        return <i className="bi bi-calendar-check text-primary"></i>;
      case 'email_scheduled':
        return <i className="bi bi-envelope text-warning"></i>;
      case 'email_sent':
        return <i className="bi bi-envelope-check text-success"></i>;
      case 'schedule_suggestion':
        return <i className="bi bi-calendar-week text-info"></i>;
      case 'subject_created':
        return <i className="bi bi-book text-primary"></i>;
      case 'user_login':
        return <i className="bi bi-person-check text-secondary"></i>;
      default:
        return <i className="bi bi-activity text-secondary"></i>;
    }
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Carregando dados do dashboard...</p>
      </Container>
    );
  }

  return (
    <Container fluid>
      {error && (
        <Row className="mb-4">
          <Col>
            <Alert variant="danger">{error}</Alert>
          </Col>
        </Row>
      )}

      <Row className="mb-4">
        <Col>
          <h2>Dashboard Administrativo</h2>
          <p className="text-muted">
            Bem-vindo ao painel de administração do Sistema de Agendamento de Disciplinas da UNISINOS.
            Aqui você pode gerenciar todas as funcionalidades do sistema.
          </p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col lg={3} md={6} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Body className="d-flex flex-column">
              <div className="d-flex align-items-center mb-3">
                <div className="rounded-circle bg-primary-subtle p-3 me-3">
                  <i className="bi bi-book text-primary" style={{ fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h6 className="mb-0 text-muted">Disciplinas</h6>
                  <h3 className="mb-0">{stats.subjects}</h3>
                </div>
              </div>
              <Button
                as={Link}
                to="/admin/subjects"
                variant="outline-primary"
                size="sm"
                className="mt-auto"
              >
                Gerenciar Disciplinas
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Body className="d-flex flex-column">
              <div className="d-flex align-items-center mb-3">
                <div className="rounded-circle bg-success-subtle p-3 me-3">
                  <i className="bi bi-journal-check text-success" style={{ fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h6 className="mb-0 text-muted">Interesses de Alunos</h6>
                  <h3 className="mb-0">{stats.studentInterests}</h3>
                </div>
              </div>
              <p className="text-muted small mb-0 mt-auto">
                Semestre {currentSemester}
              </p>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Body className="d-flex flex-column">
              <div className="d-flex align-items-center mb-3">
                <div className="rounded-circle bg-info-subtle p-3 me-3">
                  <i className="bi bi-calendar-check text-info" style={{ fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h6 className="mb-0 text-muted">Disponibilidades de Professores</h6>
                  <h3 className="mb-0">{stats.professorAvailabilities}</h3>
                </div>
              </div>
              <p className="text-muted small mb-0 mt-auto">
                Semestre {currentSemester}
              </p>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Body className="d-flex flex-column">
              <div className="d-flex align-items-center mb-3">
                <div className="rounded-circle bg-warning-subtle p-3 me-3">
                  <i className="bi bi-envelope text-warning" style={{ fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h6 className="mb-0 text-muted">E-mails Pendentes</h6>
                  <h3 className="mb-0">{stats.pendingEmails}</h3>
                </div>
              </div>
              <Button
                as={Link}
                to="/admin/emails"
                variant="outline-warning"
                size="sm"
                className="mt-auto"
              >
                Gerenciar E-mails
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col lg={8} className="mb-4 mb-lg-0">
          <Card className="h-100">
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">Atividades Recentes</h4>
            </Card.Header>
            <Card.Body>
              {recentActivity.length > 0 ? (
                <ListGroup variant="flush">
                  {recentActivity.map((activity, index) => (
                    <ListGroup.Item key={index} className="d-flex align-items-center py-3">
                      <div className="me-3">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-grow-1">
                        <p className="mb-0">{activity.description}</p>
                        <small className="text-muted">{formatDate(activity.timestamp)}</small>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <Alert variant="info">Nenhuma atividade recente registrada.</Alert>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="h-100">
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">Ações Rápidas</h4>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item action as={Link} to="/admin/subjects" className="py-3">
                  <i className="bi bi-plus-circle me-2 text-primary"></i>
                  Cadastrar Nova Disciplina
                </ListGroup.Item>
                <ListGroup.Item action as={Link} to="/admin/emails" className="py-3">
                  <i className="bi bi-envelope-plus me-2 text-primary"></i>
                  Agendar Novo E-mail
                </ListGroup.Item>
                <ListGroup.Item action as={Link} to="/admin/schedules" className="py-3">
                  <i className="bi bi-calendar-plus me-2 text-primary"></i>
                  Gerar Sugestão de Grade
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card>
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">Estatísticas do Sistema</h4>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={4} className="mb-4 mb-md-0">
                  <div className="text-center">
                    <div className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
                      <i className="bi bi-people text-primary" style={{ fontSize: '2rem' }}></i>
                    </div>
                    <h5>Usuários</h5>
                    <div className="d-flex justify-content-center mt-3">
                      <div className="text-center mx-2">
                        <h4>{stats.students}</h4>
                        <p className="text-muted mb-0">Alunos</p>
                      </div>
                      <div className="text-center mx-2">
                        <h4>{stats.professors}</h4>
                        <p className="text-muted mb-0">Professores</p>
                      </div>
                    </div>
                  </div>
                </Col>
                
                <Col md={4} className="mb-4 mb-md-0">
                  <div className="text-center">
                    <div className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
                      <i className="bi bi-calendar-week text-primary" style={{ fontSize: '2rem' }}></i>
                    </div>
                    <h5>Sugestões de Grade</h5>
                    <div className="mt-3">
                      <h4>{stats.scheduleSuggestions}</h4>
                      <p className="text-muted mb-0">Total gerado</p>
                    </div>
                  </div>
                </Col>
                
                <Col md={4}>
                  <div className="text-center">
                    <div className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
                      <i className="bi bi-graph-up text-primary" style={{ fontSize: '2rem' }}></i>
                    </div>
                    <h5>Atividade</h5>
                    <div className="d-flex justify-content-center mt-3">
                      <Button
                        as={Link}
                        to="/admin/schedules"
                        variant="primary"
                      >
                        Ver Relatórios
                      </Button>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminDashboard; 