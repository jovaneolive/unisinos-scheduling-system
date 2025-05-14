import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert, Table, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import axios from 'axios';

const EmailScheduling = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [scheduledEmails, setScheduledEmails] = useState([]);
  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    type: 'student',
    emailSubject: '',
    emailContent: '',
    courseFilter: [],
    scheduledDate: '',
    sendImmediately: false
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch scheduled emails
      const emailsResponse = await axios.get('/api/admin/emails');
      setScheduledEmails(emailsResponse.data.data);

      // Fetch courses for filtering
      const coursesResponse = await axios.get('/api/admin/courses');
      setCourses(coursesResponse.data.data);
    } catch (error) {
      console.error('Error fetching email data:', error);
      setError('Ocorreu um erro ao carregar os dados. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked
    });
  };

  const handleCourseSelection = (e) => {
    const options = e.target.options;
    const selectedValues = [];
    
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(options[i].value);
      }
    }
    
    setFormData({
      ...formData,
      courseFilter: selectedValues
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name.trim()) {
      toast.warning('Por favor, informe um nome para o agendamento.');
      return;
    }
    
    if (!formData.emailSubject.trim()) {
      toast.warning('Por favor, informe o assunto do e-mail.');
      return;
    }
    
    if (!formData.emailContent.trim()) {
      toast.warning('Por favor, informe o conteúdo do e-mail.');
      return;
    }
    
    if (!formData.sendImmediately && !formData.scheduledDate) {
      toast.warning('Por favor, selecione uma data para o agendamento ou marque para enviar imediatamente.');
      return;
    }
    
    try {
      setSubmitting(true);
      setError('');
      
      // Prepare data for submission
      const data = {
        ...formData,
        scheduledDate: formData.sendImmediately ? new Date() : new Date(formData.scheduledDate)
      };
      
      // Submit email scheduling
      await axios.post('/api/admin/emails/schedule', data);
      
      toast.success('E-mail agendado com sucesso!');
      
      // Reset form
      setFormData({
        name: '',
        type: 'student',
        emailSubject: '',
        emailContent: '',
        courseFilter: [],
        scheduledDate: '',
        sendImmediately: false
      });
      
      // Refresh data
      await fetchData();
    } catch (error) {
      console.error('Error scheduling email:', error);
      setError('Ocorreu um erro ao agendar o e-mail. Por favor, tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'scheduled':
        return <Badge bg="warning" text="dark">Agendado</Badge>;
      case 'in_progress':
        return <Badge bg="info">Em Progresso</Badge>;
      case 'completed':
        return <Badge bg="success">Concluído</Badge>;
      case 'failed':
        return <Badge bg="danger">Falha</Badge>;
      default:
        return <Badge bg="secondary">Desconhecido</Badge>;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <h2>Agendamento de E-mails</h2>
          <p className="text-muted">
            Agende o envio de e-mails para alunos e professores para coletar informações sobre interesse em disciplinas e disponibilidade.
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
        <Col lg={5} className="mb-4 mb-lg-0">
          <Card>
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">Novo Agendamento</h4>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Nome do Agendamento</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ex: Coleta de Interesse - 2023/1"
                    disabled={submitting}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Tipo de Destinatário</Form.Label>
                  <Form.Select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    disabled={submitting}
                  >
                    <option value="student">Alunos</option>
                    <option value="professor">Professores</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Assunto do E-mail</Form.Label>
                  <Form.Control
                    type="text"
                    name="emailSubject"
                    value={formData.emailSubject}
                    onChange={handleInputChange}
                    placeholder="Assunto do e-mail"
                    disabled={submitting}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Conteúdo do E-mail</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={6}
                    name="emailContent"
                    value={formData.emailContent}
                    onChange={handleInputChange}
                    placeholder="Conteúdo do e-mail. Você pode usar {{nome}} para incluir o nome do destinatário."
                    disabled={submitting}
                  />
                  <Form.Text className="text-muted">
                    Use HTML para formatação. Tags permitidas: &lt;p&gt;, &lt;h1&gt;-&lt;h6&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;, &lt;ol&gt;, &lt;li&gt;, &lt;a&gt;
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Filtrar por Curso (opcional)</Form.Label>
                  <Form.Select
                    multiple
                    name="courseFilter"
                    value={formData.courseFilter}
                    onChange={handleCourseSelection}
                    disabled={submitting}
                  >
                    {courses.map(course => (
                      <option key={course._id} value={course._id}>
                        {course.name}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Segure Ctrl para selecionar múltiplos cursos. Deixe em branco para enviar para todos.
                  </Form.Text>
                </Form.Group>

                <Row className="mb-3">
                  <Col>
                    <Form.Group>
                      <Form.Label>Data de Envio</Form.Label>
                      <Form.Control
                        type="datetime-local"
                        name="scheduledDate"
                        value={formData.scheduledDate}
                        onChange={handleInputChange}
                        disabled={formData.sendImmediately || submitting}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Check
                    type="checkbox"
                    id="sendImmediately"
                    name="sendImmediately"
                    label="Enviar imediatamente"
                    checked={formData.sendImmediately}
                    onChange={handleCheckboxChange}
                    disabled={submitting}
                  />
                </Form.Group>

                <div className="d-grid">
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                        Agendando...
                      </>
                    ) : (
                      'Agendar E-mail'
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={7}>
          <Card>
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">E-mails Agendados</h4>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">Carregando e-mails agendados...</p>
                </div>
              ) : scheduledEmails.length === 0 ? (
                <Alert variant="info">
                  Não há e-mails agendados no momento.
                </Alert>
              ) : (
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Tipo</th>
                        <th>Data Agendada</th>
                        <th>Status</th>
                        <th>Enviados</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scheduledEmails.map(email => (
                        <tr key={email._id}>
                          <td>{email.name}</td>
                          <td>
                            {email.type === 'student' ? 'Alunos' : 'Professores'}
                          </td>
                          <td>{formatDate(email.scheduledDate)}</td>
                          <td>{getStatusBadge(email.status)}</td>
                          <td>
                            {email.sentCount > 0 ? (
                              <Badge bg="success">{email.sentCount}</Badge>
                            ) : (
                              <Badge bg="secondary">0</Badge>
                            )}
                            {email.errorCount > 0 && (
                              <Badge bg="danger" className="ms-1">{email.errorCount} falhas</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default EmailScheduling; 