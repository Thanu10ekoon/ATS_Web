const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const natural = require('natural');
const path = require('path');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// Initialize natural language processing tools
const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;

// Profession keywords and contexts
const professions = {
    'engineer': ['software', 'mechanical', 'electrical', 'civil', 'systems', 'data', 'network', 'cloud', 'devops', 'security', 'quality', 'test', 'automation'],
    'developer': ['software', 'web', 'frontend', 'backend', 'fullstack', 'mobile', 'game', 'application', 'python', 'java', 'javascript', 'react', 'angular', 'vue'],
    'manager': ['project', 'product', 'team', 'program', 'technical', 'development', 'engineering', 'quality', 'operations', 'business', 'it'],
    'designer': ['graphic', 'ui', 'ux', 'web', 'product', 'interaction', 'user interface', 'user experience', 'visual', 'creative'],
    'analyst': ['data', 'business', 'systems', 'financial', 'security', 'market', 'research', 'quality', 'process', 'business intelligence'],
    'consultant': ['it', 'business', 'management', 'technical', 'security', 'cloud', 'digital', 'strategy', 'process'],
    'scientist': ['data', 'research', 'computer', 'machine learning', 'artificial intelligence', 'ai', 'ml', 'research', 'quantitative'],
    'teacher': ['computer', 'science', 'mathematics', 'english', 'language', 'programming', 'technology', 'it'],
    'professor': ['assistant', 'associate', 'full', 'computer science', 'engineering', 'mathematics', 'physics'],
    'accountant': ['senior', 'junior', 'financial', 'tax', 'audit', 'cost', 'management'],
    'nurse': ['registered', 'practical', 'clinical', 'specialist', 'practitioner'],
    'doctor': ['medical', 'research', 'clinical', 'general', 'specialist', 'surgeon'],
    'technician': ['it', 'lab', 'technical', 'support', 'network', 'system', 'field', 'service'],
    'administrator': ['system', 'database', 'network', 'it', 'security', 'cloud', 'devops'],
    'specialist': ['it', 'security', 'network', 'support', 'cloud', 'devops', 'database', 'system'],
    'architect': ['software', 'solution', 'system', 'enterprise', 'technical', 'cloud', 'security'],
    'lead': ['technical', 'development', 'engineering', 'team', 'project', 'product'],
    'director': ['technical', 'engineering', 'development', 'it', 'digital', 'technology'],
    'officer': ['technical', 'security', 'information', 'technology', 'it', 'chief'],
    'executive': ['chief', 'technical', 'technology', 'information', 'it', 'digital']
};

// Common skills to look for
const commonSkills = [
    'python', 'java', 'javascript', 'typescript', 'html', 'css', 'react', 'angular', 'vue',
    'node.js', 'express', 'mongodb', 'sql', 'mysql', 'postgresql', 'aws', 'azure', 'gcp',
    'docker', 'kubernetes', 'git', 'ci/cd', 'agile', 'scrum', 'jira', 'linux', 'unix',
    'rest api', 'graphql', 'microservices', 'devops', 'machine learning', 'ai', 'data science',
    'excel', 'power bi', 'tableau', 'word', 'powerpoint', 'project management', 'leadership',
    'communication', 'problem solving', 'teamwork', 'analytical', 'critical thinking'
];

function extractName(text) {
    const lines = text.split('\n');
    const nonNameWords = new Set(['skills', 'experience', 'education', 'summary', 'profile', 'objective', 'career', 'work', 'professional', 'personal', 'contact', 'details', 'resume', 'cv', 'curriculum vitae']);
    
    // First try to find name in the first few lines
    for (let i = 0; i < Math.min(15, lines.length); i++) {
        const line = lines[i].trim();
        if (Array.from(nonNameWords).some(word => line.toLowerCase().includes(word))) continue;
        
        const nameMatch = line.match(/^(?:Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)(?:\s*[-–—]|\s*$)/);
        if (nameMatch && nameMatch[1]) {
            const potentialName = nameMatch[1];
            if (!Array.from(nonNameWords).some(word => potentialName.toLowerCase().includes(word))) {
                return potentialName;
            }
        }
    }
    
    // If no name found, try looking for common name patterns
    for (let i = 0; i < Math.min(20, lines.length); i++) {
        const line = lines[i].trim();
        const nameMatch = line.match(/(?:Name|Full Name|Candidate Name)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i);
        if (nameMatch && nameMatch[1]) {
            const potentialName = nameMatch[1];
            if (!Array.from(nonNameWords).some(word => potentialName.toLowerCase().includes(word))) {
                return potentialName;
            }
        }
    }
    
    return null;
}

function extractProfession(text) {
    const lines = text.split('\n');
    const headerText = lines.slice(0, 10).join(' ');
    
    for (const [prof, contexts] of Object.entries(professions)) {
        for (const context of contexts) {
            const patterns = [
                new RegExp(`\\b${context}\\s+${prof}\\b`, 'i'),
                new RegExp(`\\b${prof}\\s+${context}\\b`, 'i'),
                new RegExp(`\\b${prof}\\s*\\([^)]*${context}[^)]*\\)`, 'i'),
                new RegExp(`\\b${context}\\s*\\([^)]*${prof}[^)]*\\)`, 'i')
            ];
            
            for (const pattern of patterns) {
                if (pattern.test(headerText)) {
                    return `${context.charAt(0).toUpperCase() + context.slice(1)} ${prof.charAt(0).toUpperCase() + prof.slice(1)}`;
                }
            }
        }
    }
    
    return null;
}

function extractSkills(text) {
    const skills = new Set();
    
    // Look for skills section
    const skillSection = text.match(/Skills[\s:]*([\s\S]{0,300})/i);
    if (skillSection) {
        const possibleSkills = skillSection[1].match(/\b([A-Za-z\+\#]{2,})\b/g) || [];
        possibleSkills.forEach(skill => {
            if (!Object.keys(professions).includes(skill.toLowerCase())) {
                skills.add(skill.toLowerCase());
            }
        });
    }
    
    // Look for common skills
    commonSkills.forEach(skill => {
        if (new RegExp(`\\b${skill}\\b`, 'i').test(text)) {
            skills.add(skill.toLowerCase());
        }
    });
    
    return Array.from(skills);
}

function calculateATSScore(text) {
    let score = 100;
    const issues = [];
    
    // Check for columns/tables
    if (text.includes('|')) {
        score -= 20;
        issues.push('Contains table-like formatting (| character)');
    }
    
    // Check for images
    if (/\.[jJ][pP][eE]?[gG]|\.[pP][nN][gG]|\.[gG][iI][fF]/.test(text)) {
        score -= 20;
        issues.push('Mentions image files (possible use of images)');
    }
    
    // Check for unusual fonts/characters
    if (/[•●◆■★]/.test(text)) {
        score -= 10;
        issues.push('Uses special bullet characters');
    }
    
    // Check for phone numbers
    const phonePatterns = [
        /\+94[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{4}\b/,
        /\+94\d{9}\b/,
        /0\d{2}[-\s]?\d{3}[-\s]?\d{4}\b/,
        /\+\d{1,3}[-.\s]?\d{1,3}[-.\s]?\d{3,4}[-.\s]?\d{4}/,
        /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/,
        /\b\d{2}[-.\s]?\d{4}[-.\s]?\d{4}\b/,
        /\b\d{2}[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{3}\b/,
        /\b\d{2}[-.\s]?\d{2}[-.\s]?\d{2}[-.\s]?\d{2}[-.\s]?\d{2}\b/,
        /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{2}[-.\s]?\d{2}\b/,
        /\b\d{2}[-.\s]?\d{3}[-.\s]?\d{4}\b/,
        /\b\d{3}[-.\s]?\d{4}[-.\s]?\d{4}\b/,
        /\b\d{2}[-.\s]?\d{4}[-.\s]?\d{4}\b/,
        /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{3}\b/,
        /\b\d{4}[-.\s]?\d{3}[-.\s]?\d{3}\b/,
        /\b\d{3}[-.\s]?\d{4}[-.\s]?\d{4}\b/,
        /\b\d{2}[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{3}\b/,
        /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/,
        /\b\d{2}[-.\s]?\d{2}[-.\s]?\d{2}[-.\s]?\d{2}[-.\s]?\d{2}\b/
    ];
    
    const hasPhone = phonePatterns.some(pattern => pattern.test(text));
    if (!hasPhone) {
        score -= 10;
        issues.push('No phone number found');
    }
    
    // Check for email
    if (!/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/.test(text)) {
        score -= 10;
        issues.push('No email address found');
    }
    
    // Check length
    const wordCount = text.split(/\s+/).length;
    if (wordCount < 200) {
        score -= 10;
        issues.push('CV is very short (<200 words)');
    }
    if (wordCount > 1500) {
        score -= 10;
        issues.push('CV is very long (>1500 words)');
    }
    
    return {
        score: Math.max(score, 0),
        issues
    };
}

app.post('/api/analyze', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file uploaded' });
        }

        const data = await pdfParse(req.file.buffer);
        const text = data.text;

        const name = extractName(text);
        const profession = extractProfession(text);
        const skills = extractSkills(text);
        const { score, issues } = calculateATSScore(text);

        res.json({
            name,
            profession,
            skills,
            atsScore: score,
            issues,
            isATSFriendly: score >= 70
        });
    } catch (error) {
        console.error('Error processing PDF:', error);
        res.status(500).json({ error: 'Error processing PDF file' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 