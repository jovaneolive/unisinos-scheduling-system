import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Form, Button, Alert, Badge, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import axios from 'axios';

const SubjectAvailability = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [availabilities, setAvailabilities] = useState([]);
  const [semester, setSemester] = useState('');
  const [availableSemesters, setAvailableSemesters] = useState([]);
  const [availabilityData, setAvailabilityData] = useState({});
  const [error, setError] = useState('');

  // Days and shifts for availability
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const shifts = ['morning', 'afternoon', 'evening'];

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
      
      // Following semester
      if (currentSemester === 1) {
        semesters.push(`${currentYear + 1}/1`);
      } else {
        semesters.push(`${currentYear + 1}/2`);
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
      
      // Fetch assigned subjects
      const subjectsResponse = await axios.get('/api/professors/subjects/assigned');
      
      // Fetch current availabilities for the selected semester
      const availabilitiesResponse = await axios.get(`/api/professors/availability?semester=${semester}`);
      
      setSubjects(subjectsResponse.data.data);
      setAvailabilities(availabilitiesResponse.data.data);
      
      // Initialize availability data
      const initialData = {};
      
      subjectsResponse.data.data.forEach(subject => {
        const existingAvailability = availabilitiesResponse.data.data.find(
          a => a.subject._id === subject._id
        );
        
        if (existingAvailability) {
          initialData[subject._id] = {
            isWillingToTeach: existingAvailability.isWillingToTeach || false,
            preferredShifts: existingAvailability.preferredShifts || [],
            preferredDays: existingAvailability.preferredDays || [],
            availableTimes: existingAvailability.availableTimes || {},
            notes: existingAvailability.notes || ''
          };
        } else {
          initialData[subject._id] = {
            isWillingToTeach: false,
            preferredShifts: [],
            preferredDays: [],
            availableTimes: {},
            notes: ''
          };
        }
      });
      
      setAvailabilityData(initialData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Ocorreu um erro ao carregar as disciplinas atribuídas. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleWillingnessChange = (subjectId, isWilling) => {
    setAvailabilityData(prevData => ({
      ...prevData,
      [subjectId]: {
        ...prevData[subjectId],
        isWillingToTeach: isWilling
      }
    }));
  };

  const handleShiftChange = (subjectId, shift) => {
    setAvailabilityData(prevData => {
      const currentShifts = prevData[subjectId].preferredShifts || [];
      let newShifts;
      
      if (currentShifts.includes(shift)) {
        // Remove shift
        newShifts = currentShifts.filter(s => s !== shift);
      } else {
        // Add shift
        newShifts = [...currentShifts, shift];
      }
      
      return {
        ...prevData,
        [subjectId]: {
          ...prevData[subjectId],
          preferredShifts: newShifts
        }
      };
    });
  };

  const handleDayChange = (subjectId, day) => {
    setAvailabilityData(prevData => {
      const currentDays = prevData[subjectId].preferredDays || [];
      let newDays;
      
      if (currentDays.includes(day)) {
        // Remove day
        newDays = currentDays.filter(d => d !== day);
      } else {
        // Add day
        newDays = [...currentDays, day];
      }
      
      return {
        ...prevData,
        [subjectId]: {
          ...prevData[subjectId],
          preferredDays: newDays
        }
      };
    });
  };

  const handleNotesChange = (subjectId, notes) => {
    setAvailabilityData(prevData => ({
      ...prevData,
      [subjectId]: {
        ...prevData[subjectId],
        notes
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that willing subjects have preferred shifts and days
    const errors = [];
    Object.entries(availabilityData).forEach(([subjectId, data]) => {
      if (data.isWillingToTeach) {
        if (data.preferredShifts.length === 0) {
          errors.push(`Selecione pelo menos um turno para cada disciplina que você está disposto a ministrar.`);
        }
        if (data.preferredDays.length === 0) {
          errors.push(`Selecione pelo menos um dia da semana para cada disciplina que você está disposto a ministrar.`);
        }
      }
    });
    
    if (errors.length > 0) {
      toast.warning(errors[0]);
      return;
    }
    
    try {
      setSubmitting(true);
      setError('');
      
      // Prepare data for submission
      const availabilitiesToSubmit = Object.entries(availabilityData).map(([subjectId, data]) => ({
        subject: subjectId,
        semester,
        isWillingToTeach: data.isWillingToTeach,
        preferredShifts: data.preferredShifts,
        preferredDays: data.preferredDays,
        availableTimes: data.availableTimes,
        notes: data.notes
      }));
      
      // Submit availabilities
      await axios.post('/api/professors/availability', {
        semester,
        availabilities: availabilitiesToSubmit
      });
      
      toast.success('Sua disponibilidade foi registrada com sucesso!');
      
      // Refresh data
      await fetchData();
    } catch (error) {
      console.error('Error submitting availabilities:', error);
      setError('Ocorreu um erro ao registrar sua disponibilidade. Por favor, tente novamente.');
    } finally {
      setSubmitting(false);
    }
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
          <h2>Registro de Disponibilidade</h2>
          <p className="text-muted">
            Indique quais disciplinas você está disposto a ministrar e suas preferências de horário.
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
              <h4 className="mb-0">Preferências de Semestre</h4>
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
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Carregando disciplinas...</p>
        </div>
      ) : subjects.length === 0 ? (
        <Alert variant="info">
          Não há disciplinas atribuídas a você neste momento.
        </Alert>
      ) : (
        <Form onSubmit={handleSubmit}>
          {subjects.map((subject) => (
            <Row key={subject._id} className="mb-4">
              <Col>
                <Card>
                  <Card.Header className={`${availabilityData[subject._id]?.isWillingToTeach ? 'bg-primary' : 'bg-secondary'} text-white d-flex justify-content-between align-items-center`}>
                    <h5 className="mb-0">
                      {subject.code} - {subject.name}
                    </h5>
                    <Badge bg="light" text="dark">
                      {subject.credits} créditos
                    </Badge>
                  </Card.Header>
                  <Card.Body>
                    <Form.Check
                      type="switch"
                      id={`willing-${subject._id}`}
                      label={<span className="fw-bold">Estou disposto a ministrar esta disciplina no semestre {semester}</span>}
                      checked={availabilityData[subject._id]?.isWillingToTeach || false}
                      onChange={(e) => handleWillingnessChange(subject._id, e.target.checked)}
                      className="mb-3"
                    />

                    {availabilityData[subject._id]?.isWillingToTeach && (
                      <>
                        <Row className="mb-3">
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label>Turnos Preferidos</Form.Label>
                              <div className="d-flex gap-2 flex-wrap">
                                {shifts.map((shift) => (
                                  <Form.Check
                                    key={shift}
                                    type="checkbox"
                                    id={`shift-${subject._id}-${shift}`}
                                    label={translateShift(shift)}
                                    checked={(availabilityData[subject._id]?.preferredShifts || []).includes(shift)}
                                    onChange={() => handleShiftChange(subject._id, shift)}
                                    disabled={submitting}
                                    className="me-3"
                                  />
                                ))}
                              </div>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label>Dias Preferidos</Form.Label>
                              <div className="d-flex gap-2 flex-wrap">
                                {days.map((day) => (
                                  <Form.Check
                                    key={day}
                                    type="checkbox"
                                    id={`day-${subject._id}-${day}`}
                                    label={translateDay(day)}
                                    checked={(availabilityData[subject._id]?.preferredDays || []).includes(day)}
                                    onChange={() => handleDayChange(subject._id, day)}
                                    disabled={submitting}
                                    className="me-3"
                                  />
                                ))}
                              </div>
                            </Form.Group>
                          </Col>
                        </Row>

                        <Form.Group className="mb-0">
                          <Form.Label>Observações (opcional)</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={2}
                            placeholder="Adicione informações adicionais sobre sua disponibilidade para esta disciplina"
                            value={availabilityData[subject._id]?.notes || ''}
                            onChange={(e) => handleNotesChange(subject._id, e.target.value)}
                            disabled={submitting}
                          />
                        </Form.Group>
                      </>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          ))}

          <Row className="mb-4">
            <Col className="d-flex justify-content-end">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading || submitting}
              >
                {submitting ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Disponibilidade'
                )}
              </Button>
            </Col>
          </Row>
        </Form>
      )}
    </Container>
  );
};

export default SubjectAvailability; 