import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'
import config from './config'

function App() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.append('pdf', file)

    try {
      const response = await axios.post(`${config.apiUrl}/api/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      setResult(response.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Error analyzing PDF')
    } finally {
      setLoading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false
  })

  // Icon Components
  const DocumentIcon = () => (
    <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#667eea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 2V8H20" stroke="#667eea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 13H8" stroke="#764ba2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 17H8" stroke="#764ba2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 9H9H8" stroke="#764ba2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )

  const UploadIcon = () => (
    <svg className="w-20 h-20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="#667eea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17 8L12 3L7 8" stroke="#667eea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 3V15" stroke="#764ba2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-secondary-500 relative overflow-x-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-6xl">
        {/* Header Section */}
        <header className="text-center mb-12 animate-fade-in-down">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-white to-gray-100 rounded-2xl flex items-center justify-center shadow-2xl animate-bounce-slow">
            <DocumentIcon />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
            ATS Resume Checker
          </h1>
          <p className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto">
            Analyze your resume's compatibility with Applicant Tracking Systems and get instant feedback
          </p>
        </header>

        {/* Upload Section */}
        <div className="max-w-3xl mx-auto mb-8 animate-fade-in-up">
          <div
            {...getRootProps()}
            className={`
              border-3 border-dashed rounded-3xl p-12 cursor-pointer 
              transition-all duration-300 ease-in-out
              bg-white/5 backdrop-blur-sm
              ${isDragActive 
                ? 'border-secondary-400 bg-secondary-500/10 scale-105' 
                : 'border-primary-300 hover:border-secondary-400 hover:bg-secondary-500/5 hover:scale-102'
              }
            `}
          >
            <input {...getInputProps()} />
            {loading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
                <p className="text-white text-xl font-medium">Analyzing your resume...</p>
                <p className="text-white/70">This may take a few moments</p>
              </div>
            ) : (
              <div className="text-center">
                <div className="flex justify-center mb-4 animate-float">
                  <UploadIcon />
                </div>
                <p className="text-white text-xl font-medium mb-2">
                  {isDragActive
                    ? 'Drop your PDF resume here'
                    : 'Drag & drop your resume, or click to browse'}
                </p>
                <p className="text-white/70">Supports PDF files only • Max 10MB</p>
              </div>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="max-w-3xl mx-auto mb-8 animate-fade-in">
            <div className="bg-red-50 border-l-4 border-red-500 rounded-2xl p-4 flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <p className="text-red-800 font-medium">
                  <strong>Error:</strong> {error}
                </p>
              </div>
              <button 
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 text-xl font-bold"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden mb-8">
              {/* Result Header */}
              <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span>📊</span> Analysis Results
                </h2>
              </div>

              <div className="p-8">
                {/* Personal Info */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Name</div>
                    <div className="text-lg font-medium text-gray-900">{result.name || 'Not found'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Profession</div>
                    <div className="text-lg font-medium text-gray-900">{result.profession || 'Not found'}</div>
                  </div>
                </div>

                <hr className="opacity-10 mb-8" />

                {/* ATS Score */}
                <div className="mb-8">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                    ATS Compatibility Score
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <span className={`
                      inline-flex items-center gap-2 px-8 py-4 rounded-full text-2xl font-bold text-white shadow-lg
                      ${result.ats_score >= 70 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                        : 'bg-gradient-to-r from-red-500 to-rose-500'
                      }
                    `}>
                      {result.ats_score !== null ? `${result.ats_score}%` : 'N/A'}
                    </span>
                    <span className={`
                      px-6 py-3 rounded-xl text-base font-medium text-white
                      ${result.is_ats_friendly ? 'bg-green-500' : 'bg-red-500'}
                    `}>
                      {result.is_ats_friendly ? '✓ ATS Friendly' : '✗ Not ATS Friendly'}
                    </span>
                  </div>
                </div>

                {/* Issues */}
                {result.issues && result.issues.length > 0 && (
                  <div className="mb-8">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                      ⚠️ Issues Detected
                    </div>
                    <div className="space-y-3">
                      {result.issues.map((issue, index) => (
                        <div key={index} className="flex items-start gap-3 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl">
                          <span className="text-xl">🔴</span>
                          <span className="flex-1 text-gray-800">{issue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <hr className="opacity-10 mb-8" />

                {/* Contact Information */}
                <div className="mb-8">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                    📞 Contact Information
                  </div>
                  <div className="space-y-2">
                    {result.contact_info?.phone_numbers?.map((phone, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-primary-500">📱</span>
                        <span className="text-gray-800">{phone}</span>
                      </div>
                    ))}
                    {result.contact_info?.emails?.map((email, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-primary-500">✉️</span>
                        <span className="text-gray-800">{email}</span>
                      </div>
                    ))}
                    {result.contact_info?.linkedin_url && (
                      <div className="flex items-center gap-2">
                        <span className="text-primary-500">💼</span>
                        <a href={result.contact_info.linkedin_url} target="_blank" rel="noopener noreferrer" 
                           className="text-primary-600 hover:text-primary-700 hover:underline">
                          LinkedIn Profile
                        </a>
                      </div>
                    )}
                    {result.contact_info?.portfolio_url && (
                      <div className="flex items-center gap-2">
                        <span className="text-primary-500">🌐</span>
                        <a href={result.contact_info.portfolio_url} target="_blank" rel="noopener noreferrer"
                           className="text-primary-600 hover:text-primary-700 hover:underline">
                          Portfolio
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Education */}
                {result.education && result.education.length > 0 && (
                  <div className="mb-8">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                      🎓 Education
                    </div>
                    <div className="space-y-3">
                      {result.education?.slice(0, 3).map((edu, index) => (
                        <div key={index} className="p-4 bg-primary-50 rounded-xl border border-primary-100">
                          <div className="text-gray-800"><strong>Degree:</strong> {edu.degree || 'N/A'}</div>
                          <div className="text-gray-800"><strong>Field:</strong> {edu.field_of_study || 'N/A'}</div>
                          <div className="text-gray-800"><strong>Institution:</strong> {edu.institution || 'N/A'}</div>
                          <div className="text-gray-800"><strong>Year:</strong> {edu.graduation_year || 'N/A'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience Level */}
                <div className="mb-8">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                    💼 Experience Level
                  </div>
                  <span className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-medium text-base">
                    {result.experience_level || 'N/A'}
                  </span>
                </div>

                {/* Skills */}
                <div className="mb-8">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                    🛠️ Skills Analysis
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h6 className="text-primary-600 font-semibold mb-3">Technical Skills</h6>
                      <div className="flex flex-wrap gap-2">
                        {result.skills?.technical?.map((skill, index) => (
                          <span key={index} className="px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-full text-sm font-medium shadow-md hover:-translate-y-1 transition-transform">
                            {skill}
                          </span>
                        ))}
                        {(!result.skills?.technical || result.skills.technical.length === 0) && (
                          <span className="text-gray-400">No technical skills detected</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <h6 className="text-pink-600 font-semibold mb-3">Soft Skills</h6>
                      <div className="flex flex-wrap gap-2">
                        {result.skills?.soft?.map((skill, index) => (
                          <span key={index} className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full text-sm font-medium shadow-md hover:-translate-y-1 transition-transform">
                            {skill}
                          </span>
                        ))}
                        {(!result.skills?.soft || result.skills.soft.length === 0) && (
                          <span className="text-gray-400">No soft skills detected</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                {result.recommendations && result.recommendations.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                      💡 Recommendations
                    </div>
                    <div className="space-y-3">
                      {result.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start gap-3 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-xl">
                          <span className="text-xl">💡</span>
                          <span className="flex-1 text-gray-800">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tips Section */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8">
            <h5 className="text-2xl font-bold text-primary-600 mb-6 flex items-center gap-2">
              <span>💡</span> Tips for ATS-Friendly Resumes
            </h5>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-primary-500 mt-1">•</span>
                <span>Avoid using tables or complex formatting</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary-500 mt-1">•</span>
                <span>Use standard bullet points instead of special characters</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary-500 mt-1">•</span>
                <span>Include your contact information (phone and email)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary-500 mt-1">•</span>
                <span>Keep your resume between 200-1500 words</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary-500 mt-1">•</span>
                <span>Use standard fonts and formatting</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary-500 mt-1">•</span>
                <span>Include relevant keywords from the job description</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-white py-8">
          <p className="text-base">
            Made with ❤️ by{' '}
            <a 
              href="https://thanu10ekoon.github.io/web" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-semibold border-b-2 border-white/30 hover:border-white transition-colors"
            >
              Thanujaya Tennekoon
            </a>
          </p>
        </footer>
      </div>
    </div>
  )
}

export default App
