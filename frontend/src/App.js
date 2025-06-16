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
    <div className="App"> {/* Added this wrapper div */}
      <Container className="py-5">
        <Row className="justify-content-center mb-4">
          <Col md={8}>
            <h1 className="text-center mb-4">Thanu's ATS Resume & CV Checker</h1>
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

                  {/* ATS Analysis (Updated for local processing) */}
                  <hr />
                  <h5 className="mb-3">ATS Analysis</h5>
                  
                  <div className="mb-4">
                    <h6 className="text-muted mb-2">ATS Score</h6>
                    <Badge bg={result.ats_score >= 70 ? "success" : "danger"} className="px-3 py-2">
                      {result.ats_score !== null ? `${result.ats_score}%` : 'N/A'}
                    </Badge>
                  </div>

                  <div className="mb-4">
                    <h6 className="text-muted mb-2">ATS Friendly Status</h6>
                    <Badge bg={result.is_ats_friendly ? "success" : "danger"} className="px-3 py-2">
                      {result.is_ats_friendly ? 'ATS Friendly' : 'Not ATS Friendly'}
                    </Badge>
                  </div>

                  {result.issues && result.issues.length > 0 && (
                    <div className="mb-4">
                      <h6 className="text-muted mb-2">Identified Issues</h6>
                      <ul className="list-unstyled">
                        {result.issues.map((issue, index) => (
                          <li key={index} className="mb-2">
                            <i className="bi bi-exclamation-triangle-fill text-danger me-2"></i>
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Display other extracted information directly from result */}
                  <hr />
                  <h5 className="mb-3">Extracted Details</h5>

                  <div className="mb-4">
                      <h6 className="text-muted mb-2">Contact Information</h6>
                      <ul className="list-unstyled mb-0">
                        {result.contact_info?.phone_numbers?.map((phone, index) => (
                          <li key={index}><i className="bi bi-telephone-fill me-2"></i>{phone}</li>
                        ))}
                        {result.contact_info?.emails?.map((email, index) => (
                          <li key={index}><i className="bi bi-envelope-fill me-2"></i>{email}</li>
                        ))}
                        {result.contact_info?.linkedin_url && (
                          <li><i className="bi bi-linkedin me-2"></i><a href={result.contact_info.linkedin_url} target="_blank" rel="noopener noreferrer">LinkedIn Profile</a></li>
                        )}
                        {result.contact_info?.portfolio_url && (
                          <li><i className="bi bi-box-arrow-up-right me-2"></i><a href={result.contact_info.portfolio_url} target="_blank" rel="noopener noreferrer">Portfolio</a></li>
                        )}
                      </ul>
                  </div>

                  <div className="mb-4">
                      <h6 className="text-muted mb-2">Educational Details</h6>
                      {result.education?.slice(0, 3).map((edu, index) => (
                        <Card key={index} className="mb-2 p-2 bg-light">
                          <p className="mb-0"><strong>Degree:</strong> {edu.degree || 'N/A'}</p>
                          <p className="mb-0"><strong>Field:</strong> {edu.field_of_study || 'N/A'}</p>
                          <p className="mb-0"><strong>Institution:</strong> {edu.institution || 'N/A'}</p>
                          <p className="mb-0"><strong>Year:</strong> {edu.graduation_year || 'N/A'}</p>
                        </Card>
                      ))}
                  </div>

                  <div className="mb-4">
                      <h6 className="text-muted mb-2">Experience Level</h6>
                      <Badge bg="info" className="px-3 py-2">
                        {result.experience_level || 'N/A'}
                      </Badge>
                  </div>

                  <div className="mb-4">
                      <h6 className="text-muted mb-2">Skills Analysis</h6>
                      <Row>
                        <Col md={6}>
                          <h6>Technical Skills</h6>
                          <div className="d-flex flex-wrap gap-2">
                            {result.skills?.technical?.map((skill, index) => (
                              <Badge key={index} bg="primary" className="px-3 py-2">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </Col>
                        <Col md={6}>
                          <h6>Soft Skills</h6>
                          <div className="d-flex flex-wrap gap-2">
                            {result.skills?.soft?.map((skill, index) => (
                              <Badge key={index} bg="success" className="px-3 py-2">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </Col>
                      </Row>
                  </div>

                  {result.recommendations && result.recommendations.length > 0 && (
                    <div className="mb-4">
                      <h6 className="text-muted mb-2">Recommendations</h6>
                      <div className="list-group">
                        {result.recommendations.map((rec, index) => (
                          <div key={index} className="list-group-item">
                            <i className="bi bi-lightbulb-fill text-warning me-2"></i>
                            {rec}
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

        <footer className="app-footer">
          <p>
            Made by <a href="https://thanu10ekoon.github.io/web" target="_blank" rel="noopener noreferrer">Thanujaya Tennekoon</a>
          </p>
        </footer>
      </Container>
    </div> /* Closing the wrapper div */
  );
}

export default App;
