# ATS Resume Checker

A web application that analyzes resumes/CVs for ATS (Applicant Tracking System) compatibility and provides detailed feedback.

## Features

- PDF resume analysis
- Name and profession extraction
- Skills detection
- ATS compatibility scoring
- Issue detection and suggestions
- Modern, responsive UI
- Serverless deployment ready

## Project Structure

The project consists of two parts:

1. Backend (Node.js/Express)
2. Frontend (React)

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The backend server will run on http://localhost:3001

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The frontend application will run on http://localhost:3000

## Deployment

### Backend Deployment (Vercel)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy the backend:
   ```bash
   cd backend
   vercel
   ```

3. Note down the deployment URL provided by Vercel.

### Frontend Deployment (Vercel)

1. Create a `.env.production` file in the frontend directory with the backend URL:
   ```
   REACT_APP_API_URL=<your-backend-vercel-url>
   ```

2. Deploy the frontend:
   ```bash
   cd frontend
   vercel
   ```

## Environment Variables

### Backend
- `PORT`: Server port (default: 3001)

### Frontend
- `REACT_APP_API_URL`: Backend API URL (default: http://localhost:3001)

## Technologies Used

### Backend
- Node.js
- Express
- pdf-parse
- natural
- multer
- cors

### Frontend
- React
- Material-UI
- react-dropzone
- axios

## License

MIT 