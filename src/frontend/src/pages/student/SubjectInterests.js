import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Form, Button, Alert, Badge, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import axios from 'axios';

const SubjectInterests = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [currentInterests, setCurrentInterests] = useState([]);
  const [semester, setSemester] = useState('');
  const [availableSemesters, setAvailableSemesters] = useState([]);
  const [preferredShifts, setPreferredShifts] = useState(['morning', 'afternoon', 'evening']);
  const [preferredDays, setPreferredDays] = useState(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
  const [error, setError] = useState('');

  // Maximum number of subjects a student can select
  const MAX_SUBJECTS = 8;

  useEffect(() => {
    // Generate available semesters (current and next)
    const generateSemesters = () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      
      // First half: January to June
      // Second half: July to December
      const currentSemester = currentMonth < 6 ? 1 : 2;
      
      const semesters = [];
      
      // Current semester
      semesters.push(`${currentYear}/${currentSemester}`);
      
      // Next semester
      if (currentSemester === 1) {
        semesters.push(`${currentYear}/2`);
      } else {
        semesters.push(`${currentYear + 1}/1`);
      }
      
      setAvailableSemesters(semesters);
      setSemester(semesters[0]); // Default to current semester
    };
    
    generateSemesters();
    fetchData();
  }, []);

  useEffect(() => {
    if (semester) {
      fetchData();
    }
  }, [semester]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch available subjects
      const subjectsResponse = await axios.get('/api/students/subjects/available');
      
      // Fetch current interests for the selected semester
      const interestsResponse = await axios.get(`/api/students/interests?semester=${semester}`);
      
      setSubjects(subjectsResponse.data.data);
      setCurrentInterests(interestsResponse.data.data);
      
      // Pre-select subjects based on current interests
      const preSelectedSubjects = interestsResponse.data.data.map(interest => interest.subject._id);
      setSelectedSubjects(preSelectedSubjects);
      
      // Set preferred shifts and days if already set
      if (interestsResponse.data.data.length > 0) {
        const firstInterest = interestsResponse.data.data[0];
        if (firstInterest.preferredShifts) {
          setPreferredShifts(firstInterest.preferredShifts);
        }
        if (firstInterest.preferredDays) {
          setPreferredDays(firstInterest.preferredDays);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Ocorreu um erro ao carregar as disciplinas disponíveis. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectSelection = (subjectId) => {
    setSelectedSubjects(prevSelected => {
      if (prevSelected.includes(subjectId)) {
        // Remove subject
        return prevSelected.filter(id => id !== subjectId);
      } else {
        // Add subject if limit not reached
        if (prevSelected.length < MAX_SUBJECTS) {
          return [...prevSelected, subjectId];
        } else {
          toast.warning(`Você só pode selecionar até ${MAX_SUBJECTS} disciplinas.`);
          return prevSelected;
        }
      }
    });
  };

  const handleShiftChange = (shift) => {
    setPreferredShifts(prevShifts => {
      if (prevShifts.includes(shift)) {
        // Remove shift if there's more than one selected
        if (prevShifts.length > 1) {
          return prevShifts.filter(s => s !== shift);
        } else {
          toast.warning('Você deve selecionar pelo menos um turno.');
          return prevShifts;
        }
      } else {
        // Add shift
        return [...prevShifts, shift];
      }
    });
  };

  const handleDayChange = (day) => {
    setPreferredDays(prevDays => {
      if (prevDays.includes(day)) {
        // Remove day if there's more than one selected
        if (prevDays.length > 1) {
          return prevDays.filter(d => d !== day);
        } else {
          toast.warning('Você deve selecionar pelo menos um dia da semana.');
          return prevDays;
        }
      } else {
        // Add day
        return [...prevDays, day];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedSubjects.length === 0) {
      toast.warning('Selecione pelo menos uma disciplina.');
      return;
    }
    
    try {
      setSubmitting(true);
      setError('');
      
      // Submit interests
      await axios.post('/api/students/interests', {
        semester,
        subjects: selectedSubjects,
        preferredShifts,
        preferredDays
      });
      
      toast.success('Seus interesses foram registrados com sucesso!');
      
      // Refresh data
      await fetchData();
    } catch (error) {
      console.error('Error submitting interests:', error);
      setError('Ocorreu um erro ao registrar seus interesses. Por favor, tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const getSubjectStatus = (subjectId) => {
    const interest = currentInterests.find(interest => interest.subject._id === subjectId);
    return interest ? 'Registrado' : '';
  };

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

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <h2>Registro de Interesse em Disciplinas</h2>
          <p className="text-muted">
            Selecione as disciplinas que você tem interesse em cursar no próximo semestre.
            Você pode selecionar até {MAX_SUBJECTS} disciplinas.
          </p>
        </Col>
      </Row>

      {error && (
        <Row className="mb-4">
          <Col>
            <Alert variant="danger">{error}</Alert>
          </Col>
        </Row>
      )}

      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">Preferências de Horário</h4>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Row className="mb-3">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Semestre</Form.Label>
                      <Form.Select
                        value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                        disabled={loading || submitting}
                      >
                        {availableSemesters.map((sem) => (
                          <option key={sem} value={sem}>{sem}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col>
                    <Form.Label>Turnos Preferidos</Form.Label>
                    <div className="d-flex gap-2 flex-wrap">
                      {['morning', 'afternoon', 'evening'].map((shift) => (
                        <Form.Check
                          key={shift}
                          type="checkbox"
                          id={`shift-${shift}`}
                          label={translateShift(shift)}
                          checked={preferredShifts.includes(shift)}
                          onChange={() => handleShiftChange(shift)}
                          disabled={loading || submitting}
                          className="me-3"
                        />
                      ))}
                    </div>
                  </Col>
                </Row>

                <Row className="mb-4">
                  <Col>
                    <Form.Label>Dias da Semana Preferidos</Form.Label>
                    <div className="d-flex gap-2 flex-wrap">
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map((day) => (
                        <Form.Check
                          key={day}
                          type="checkbox"
                          id={`day-${day}`}
                          label={translateDay(day)}
                          checked={preferredDays.includes(day)}
                          onChange={() => handleDayChange(day)}
                          disabled={loading || submitting}
                          className="me-3"
                        />
                      ))}
                    </div>
                  </Col>
                </Row>

                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <Badge bg="info" className="me-2">
                      {selectedSubjects.length} de {MAX_SUBJECTS} disciplinas selecionadas
                    </Badge>
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading || submitting}
                  >
                    {submitting ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar Interesses'
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card>
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">Disciplinas Disponíveis</h4>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">Carregando disciplinas...</p>
                </div>
              ) : subjects.length === 0 ? (
                <Alert variant="info">
                  Não há disciplinas disponíveis para o seu curso neste momento.
                </Alert>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}></th>
                      <th>Código</th>
                      <th>Disciplina</th>
                      <th>Créditos</th>
                      <th>Campus</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((subject) => (
                      <tr key={subject._id} className={selectedSubjects.includes(subject._id) ? 'table-primary' : ''}>
                        <td>
                          <Form.Check
                            type="checkbox"
                            id={`subject-${subject._id}`}
                            checked={selectedSubjects.includes(subject._id)}
                            onChange={() => handleSubjectSelection(subject._id)}
                            disabled={loading || submitting}
                          />
                        </td>
                        <td>{subject.code}</td>
                        <td>
                          {subject.name}
                          {subject.hasPrerequisites && (
                            <Badge bg="warning" text="dark" className="ms-2">Pré-requisitos</Badge>
                          )}
                        </td>
                        <td>{subject.credits}</td>
                        <td>{subject.campus}</td>
                        <td>
                          {getSubjectStatus(subject._id) && (
                            <Badge bg="success">Registrado</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default SubjectInterests; 