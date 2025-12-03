# ATS Resume Checker - Frontend

A modern React + Vite application with Tailwind CSS for analyzing resume compatibility with Applicant Tracking Systems.

## 🚀 Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS 3** - Utility-first CSS framework
- **Axios** - HTTP client
- **React Dropzone** - File upload handling

## 📦 Installation

Install dependencies:

```bash
npm install
```

## 🛠️ Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🏗️ Build

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## 🎨 Features

- **Modern UI** - Clean, gradient design with glassmorphism effects
- **Responsive** - Works seamlessly on desktop and mobile
- **Drag & Drop** - Easy file upload with visual feedback
- **Real-time Analysis** - Instant feedback on resume compatibility
- **Tailwind CSS** - Utility-first styling for rapid development
- **Vite** - Lightning-fast hot module replacement

## 🔧 Configuration

Create a `.env` file in the frontend directory:

```bash
VITE_API_URL=http://localhost:3001
```

## 📁 Project Structure

```
frontend/
├── public/          # Static assets
├── src/
│   ├── App.jsx      # Main application component
│   ├── main.jsx     # Application entry point
│   ├── config.js    # Configuration
│   └── index.css    # Tailwind CSS imports
├── index.html       # HTML template
├── vite.config.js   # Vite configuration
├── tailwind.config.js  # Tailwind CSS configuration
└── package.json     # Dependencies and scripts
```

## 🎨 Tailwind Configuration

The project includes custom color schemes and animations:

- **Primary Colors** - Purple gradient (#667eea)
- **Secondary Colors** - Purple/Pink gradient (#764ba2)
- **Custom Animations** - Fade-in, float, bounce effects

## 📝 License

MIT
