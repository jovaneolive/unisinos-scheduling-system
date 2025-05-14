import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Spinner, Alert, ListGroup, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const ProfessorDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [availabilities, setAvailabilities] = useState([]);
  const [currentSemester, setCurrentSemester] = useState('');
  const [error, setError] = useState('');

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

        // Fetch user data
        const userResponse = await axios.get('/api/auth/verify');
        setUserData(userResponse.data.data);

        // Fetch assigned subjects
        const subjectsResponse = await axios.get('/api/professors/subjects/assigned');
        setAssignedSubjects(subjectsResponse.data.data);

        // Fetch availabilities
        const availabilitiesResponse = await axios.get(`/api/professors/availability?semester=${semesterStr}`);
        setAvailabilities(availabilitiesResponse.data.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Ocorreu um erro ao carregar os dados do dashboard. Por favor, atualize a página.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const translateShift = (shift) => {
    const translations = {
      morning: 'Manhã',
      afternoon: 'Tarde',
      evening: 'Noite'
    };
    return translations[shift] || shift;
  };

  const translateDay = (day) => {
    const translations = {
      monday: 'Segunda',
      tuesday: 'Terça',
      wednesday: 'Quarta',
      thursday: 'Quinta',
      friday: 'Sexta',
      saturday: 'Sábado'
    };
    return translations[day] || day;
  };

  const getAvailabilityStatus = (subjectId) => {
    const availability = availabilities.find(a => a.subject._id === subjectId);
    
    if (!availability) {
      return { status: 'pending', label: 'Pendente' };
    }
    
    if (availability.isWillingToTeach) {
      return { status: 'willing', label: 'Disponível' };
    } else {
      return { status: 'unavailable', label: 'Indisponível' };
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'willing':
        return <Badge bg="success">Disponível</Badge>;
      case 'unavailable':
        return <Badge bg="danger">Indisponível</Badge>;
      case 'pending':
      default:
        return <Badge bg="warning" text="dark">Pendente</Badge>;
    }
  };

  const getWillingSubjectsCount = () => {
    return availabilities.filter(a => a.isWillingToTeach).length;
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
          <h2>Dashboard do Professor</h2>
          <p className="text-muted">
            Bem-vindo(a) ao Sistema de Agendamento de Disciplinas da UNISINOS.
            Aqui você pode verificar suas disciplinas atribuídas e registrar sua disponibilidade.
          </p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col lg={4} className="mb-4 mb-lg-0">
          <Card>
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">Informações do Professor</h4>
            </Card.Header>
            <Card.Body>
              {userData ? (
                <div>
                  <div className="mb-3 text-center">
                    <div className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '100px', height: '100px' }}>
                      <i className="bi bi-person" style={{ fontSize: '3rem' }}></i>
                    </div>
                    <h5>{userData.name}</h5>
                    <p className="text-muted mb-0">{userData.email}</p>
                  </div>
                  
                  <ListGroup variant="flush">
                    <ListGroup.Item className="d-flex justify-content-between align-items-center">
                      <span>Departamento:</span>
                      <span>{userData.department || 'Não informado'}</span>
                    </ListGroup.Item>
                    <ListGroup.Item className="d-flex justify-content-between align-items-center">
                      <span>Titulação:</span>
                      <span>{userData.degree || 'Não informado'}</span>
                    </ListGroup.Item>
                    <ListGroup.Item className="d-flex justify-content-between align-items-center">
                      <span>Disciplinas atribuídas:</span>
                      <Badge bg="primary">{assignedSubjects.length}</Badge>
                    </ListGroup.Item>
                    <ListGroup.Item className="d-flex justify-content-between align-items-center">
                      <span>Disponibilidades registradas:</span>
                      <Badge bg="success">{getWillingSubjectsCount()} de {assignedSubjects.length}</Badge>
                    </ListGroup.Item>
                  </ListGroup>
                </div>
              ) : (
                <Alert variant="warning">Não foi possível carregar os dados do usuário.</Alert>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          <Card>
            <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Disciplinas Atribuídas</h4>
              <Badge bg="light" text="dark">Semestre {currentSemester}</Badge>
            </Card.Header>
            <Card.Body>
              {assignedSubjects.length > 0 ? (
                <ListGroup>
                  {assignedSubjects.map(subject => {
                    const availabilityStatus = getAvailabilityStatus(subject._id);
                    const availability = availabilities.find(a => a.subject._id === subject._id);
                    
                    return (
                      <ListGroup.Item key={subject._id}>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div>
                            <strong>{subject.code}</strong> - {subject.name}
                          </div>
                          <div>
                            <Badge bg="secondary" className="me-2">{subject.credits} créditos</Badge>
                            {getStatusBadge(availabilityStatus.status)}
                          </div>
                        </div>
                        
                        {availability && availability.isWillingToTeach && (
                          <div className="d-flex flex-wrap mt-2 small text-muted">
                            <div className="me-3">
                              <strong>Turnos:</strong>{' '}
                              {availability.preferredShifts.map(shift => (
                                <Badge key={shift} bg="info" className="me-1">{translateShift(shift)}</Badge>
                              ))}
                            </div>
                            <div>
                              <strong>Dias:</strong>{' '}
                              {availability.preferredDays.map(day => (
                                <Badge key={day} bg="info" className="me-1">{translateDay(day)}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </ListGroup.Item>
                    );
                  })}
                </ListGroup>
              ) : (
                <div className="text-center py-4">
                  <i className="bi bi-exclamation-circle text-warning" style={{ fontSize: '3rem' }}></i>
                  <h5 className="mt-3">Nenhuma disciplina atribuída!</h5>
                  <p className="text-muted">
                    Você ainda não possui disciplinas atribuídas para este semestre.
                  </p>
                </div>
              )}
            </Card.Body>
            <Card.Footer className="bg-light">
              <div className="d-flex justify-content-end">
                <Button
                  as={Link}
                  to="/professor/availability"
                  variant="outline-primary"
                >
                  {availabilities.length > 0 ? 'Editar Disponibilidade' : 'Registrar Disponibilidade'}
                </Button>
              </div>
            </Card.Footer>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card>
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">Dicas e Informações</h4>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <i className="bi bi-info-circle-fill text-primary me-2"></i>
                  Registre sua disponibilidade para as disciplinas que você está apto a ministrar.
                </ListGroup.Item>
                <ListGroup.Item>
                  <i className="bi bi-info-circle-fill text-primary me-2"></i>
                  Suas preferências de horário são importantes para a criação da grade.
                </ListGroup.Item>
                <ListGroup.Item>
                  <i className="bi bi-info-circle-fill text-primary me-2"></i>
                  É possível registrar observações específicas para cada disciplina.
                </ListGroup.Item>
                <ListGroup.Item>
                  <i className="bi bi-info-circle-fill text-primary me-2"></i>
                  A alocação de disciplinas leva em conta suas preferências e a demanda dos alunos.
                </ListGroup.Item>
                <ListGroup.Item>
                  <i className="bi bi-info-circle-fill text-primary me-2"></i>
                  As sugestões de grade serão enviadas por e-mail quando finalizadas.
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ProfessorDashboard; 