import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Spinner, Alert, ListGroup, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const StudentDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [interests, setInterests] = useState([]);
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

        // Fetch student interests
        const interestsResponse = await axios.get(`/api/students/interests?semester=${semesterStr}`);
        setInterests(interestsResponse.data.data);
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
          <h2>Dashboard do Aluno</h2>
          <p className="text-muted">
            Bem-vindo(a) ao Sistema de Agendamento de Disciplinas da UNISINOS.
            Aqui você pode verificar suas informações e interesses registrados.
          </p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col lg={4} className="mb-4 mb-lg-0">
          <Card>
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">Informações do Aluno</h4>
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
                      <span>Matrícula:</span>
                      <Badge bg="secondary">{userData.studentId || 'Não informado'}</Badge>
                    </ListGroup.Item>
                    <ListGroup.Item className="d-flex justify-content-between align-items-center">
                      <span>Curso:</span>
                      <span>{userData.courseName || 'Não informado'}</span>
                    </ListGroup.Item>
                    <ListGroup.Item className="d-flex justify-content-between align-items-center">
                      <span>Campus:</span>
                      <span>{userData.campus || 'Não informado'}</span>
                    </ListGroup.Item>
                    <ListGroup.Item className="d-flex justify-content-between align-items-center">
                      <span>Último acesso:</span>
                      <span>{userData.lastLogin ? new Date(userData.lastLogin).toLocaleDateString('pt-BR') : 'Primeiro acesso'}</span>
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
              <h4 className="mb-0">Interesses Registrados</h4>
              <Badge bg="light" text="dark">Semestre {currentSemester}</Badge>
            </Card.Header>
            <Card.Body>
              {interests.length > 0 ? (
                <>
                  <div className="mb-4">
                    <h5>Preferências de Horário</h5>
                    {interests[0].preferredShifts && (
                      <div className="mb-2">
                        <strong>Turnos:</strong>{' '}
                        {interests[0].preferredShifts.map(shift => (
                          <Badge key={shift} bg="info" className="me-1">{translateShift(shift)}</Badge>
                        ))}
                      </div>
                    )}
                    {interests[0].preferredDays && (
                      <div>
                        <strong>Dias:</strong>{' '}
                        {interests[0].preferredDays.map(day => (
                          <Badge key={day} bg="info" className="me-1">{translateDay(day)}</Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <h5>Disciplinas ({interests.length})</h5>
                  <ListGroup>
                    {interests.map(interest => (
                      <ListGroup.Item key={interest._id} className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{interest.subject.code}</strong> - {interest.subject.name}
                          {interest.subject.hasPrerequisites && (
                            <Badge bg="warning" text="dark" className="ms-2">Pré-requisitos</Badge>
                          )}
                        </div>
                        <Badge bg="primary">{interest.subject.credits} créditos</Badge>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </>
              ) : (
                <div className="text-center py-4">
                  <i className="bi bi-exclamation-circle text-warning" style={{ fontSize: '3rem' }}></i>
                  <h5 className="mt-3">Nenhum interesse registrado!</h5>
                  <p className="text-muted">
                    Você ainda não registrou interesse em disciplinas para este semestre.
                  </p>
                  <Button
                    as={Link}
                    to="/student/interests"
                    variant="primary"
                    className="mt-2"
                  >
                    Registrar Interesses
                  </Button>
                </div>
              )}
            </Card.Body>
            <Card.Footer className="bg-light">
              <div className="d-flex justify-content-end">
                <Button
                  as={Link}
                  to="/student/interests"
                  variant="outline-primary"
                >
                  {interests.length > 0 ? 'Editar Interesses' : 'Registrar Interesses'}
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
                  Você pode selecionar até 8 disciplinas de seu interesse para o próximo semestre.
                </ListGroup.Item>
                <ListGroup.Item>
                  <i className="bi bi-info-circle-fill text-primary me-2"></i>
                  Os interesses registrados serão considerados para a formação da grade horária.
                </ListGroup.Item>
                <ListGroup.Item>
                  <i className="bi bi-info-circle-fill text-primary me-2"></i>
                  Suas preferências de horário ajudam a universidade a organizar as turmas.
                </ListGroup.Item>
                <ListGroup.Item>
                  <i className="bi bi-info-circle-fill text-primary me-2"></i>
                  Verifique se você atende aos pré-requisitos das disciplinas selecionadas.
                </ListGroup.Item>
                <ListGroup.Item>
                  <i className="bi bi-info-circle-fill text-primary me-2"></i>
                  A grade de horários será divulgada com base nos interesses dos alunos e disponibilidade dos professores.
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default StudentDashboard; 