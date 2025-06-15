import React, { useState } from 'react';
import { Container, Row, Col, Card, Alert, Spinner, Badge } from 'react-bootstrap';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import config from './config';

function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await axios.post(`${config.apiUrl}/api/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error analyzing PDF');
    } finally {
      setLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false
  });

  return (
    <Container className="py-5">
      <Row className="justify-content-center mb-4">
        <Col md={8}>
          <h1 className="text-center mb-4">ATS Resume Checker</h1>
          <p className="text-center text-muted mb-4">
            Upload your resume to check its compatibility with Applicant Tracking Systems
          </p>
        </Col>
      </Row>

      <Row className="justify-content-center mb-4">
        <Col md={8}>
          <Card
            {...getRootProps()}
            className={`text-center p-5 cursor-pointer ${
              isDragActive ? 'border-primary bg-light' : ''
            }`}
            style={{
              border: '2px dashed',
              borderColor: isDragActive ? '#0d6efd' : '#dee2e6',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            <input {...getInputProps()} />
            {loading ? (
              <div className="d-flex flex-column align-items-center">
                <Spinner animation="border" role="status" className="mb-3">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
                <p className="mb-0">Analyzing your resume...</p>
              </div>
            ) : (
              <div>
                <i className="bi bi-cloud-upload fs-1 mb-3"></i>
                <p className="mb-0">
                  {isDragActive
                    ? 'Drop your PDF resume here'
                    : 'Drag and drop your PDF resume here, or click to select'}
                </p>
                <small className="text-muted">Only PDF files are accepted</small>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {error && (
        <Row className="justify-content-center mb-4">
          <Col md={8}>
            <Alert variant="danger" onClose={() => setError(null)} dismissible>
              {error}
            </Alert>
          </Col>
        </Row>
      )}

      {result && (
        <Row className="justify-content-center">
          <Col md={8}>
            <Card className="mb-4">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">Analysis Results</h5>
              </Card.Header>
              <Card.Body>
                <Row className="mb-3">
                  <Col md={6}>
                    <h6 className="text-muted mb-2">Name</h6>
                    <p className="mb-0">{result.name || 'Not found'}</p>
                  </Col>
                  <Col md={6}>
                    <h6 className="text-muted mb-2">Profession</h6>
                    <p className="mb-0">{result.profession || 'Not found'}</p>
                  </Col>
                </Row>

                <div className="mb-3">
                  <h6 className="text-muted mb-2">Skills</h6>
                  <div className="d-flex flex-wrap gap-2">
                    {result.skills.map((skill, index) => (
                      <Badge key={index} bg="secondary" className="px-3 py-2">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <h6 className="text-muted mb-2">ATS Score</h6>
                  <div className="d-flex align-items-center gap-2">
                    <h4 className={`mb-0 ${result.isATSFriendly ? 'text-success' : 'text-danger'}`}>
                      {result.atsScore}/100
                    </h4>
                    <Badge bg={result.isATSFriendly ? 'success' : 'danger'} className="px-3 py-2">
                      {result.isATSFriendly ? 'ATS Friendly' : 'Not ATS Friendly'}
                    </Badge>
                  </div>
                </div>

                {result.issues.length > 0 && (
                  <div>
                    <h6 className="text-muted mb-2">Issues Found</h6>
                    <div className="list-group">
                      {result.issues.map((issue, index) => (
                        <div
                          key={index}
                          className="list-group-item list-group-item-danger d-flex align-items-center"
                        >
                          <i className="bi bi-exclamation-triangle-fill me-2"></i>
                          {issue}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <Row className="justify-content-center mt-4">
        <Col md={8}>
          <Card className="bg-light">
            <Card.Body>
              <h5 className="mb-3">Tips for ATS-Friendly Resumes</h5>
              <ul className="mb-0">
                <li>Avoid using tables or complex formatting</li>
                <li>Use standard bullet points instead of special characters</li>
                <li>Include your contact information (phone and email)</li>
                <li>Keep your resume between 200-1500 words</li>
                <li>Use standard fonts and formatting</li>
                <li>Include relevant keywords from the job description</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default App;
