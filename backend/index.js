require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;
const stemmer = natural.PorterStemmer;
// const { GoogleGenerativeAI } = require('@google/generative-ai'); // No longer needed for AI parts

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

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
    'technician': [/^it$/i, 'lab', 'technical', 'support', 'network', 'system', 'field', 'service'], // Added regex for exact 'it' match
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

// Educational qualifications and their corresponding professions
const educationalQualifications = {
  'engineering': {
    patterns: [
      /B\.Sc\.?\s*(?:\(Eng\)|Engineering|Eng\.?)/i,
      /Bachelor\s+of\s+Engineering/i,
      /B\.E\./i,
      /B\.Tech\./i,
      /M\.Sc\.?\s*(?:\(Eng\)|Engineering|Eng\.?)/i,
      /Master\s+of\s+Engineering/i,
      /M\.E\./i,
      /M\.Tech\./i,
      /Ph\.D\.?\s*(?:in\s+)?Engineering/i
    ],
    profession: 'Engineer'
  },
  'computer_science': {
    patterns: [
      /B\.Sc\.?\s*(?:\(CS\)|Computer\s+Science|CS\.?)/i,
      /Bachelor\s+of\s+Computer\s+Science/i,
      /B\.CS\./i,
      /M\.Sc\.?\s*(?:\(CS\)|Computer\s+Science|CS\.?)/i,
      /Master\s+of\s+Computer\s+Science/i,
      /M\.CS\./i,
      /Ph\.D\.?\s*(?:in\s+)?Computer\s+Science/i
    ],
    profession: 'Software Engineer'
  },
  'business': {
    patterns: [
      /B\.B\.A\./i,
      /Bachelor\s+of\s+Business\s+Administration/i,
      /M\.B\.A\./i,
      /Master\s+of\s+Business\s+Administration/i,
      /B\.Com\./i,
      /Bachelor\s+of\s+Commerce/i,
      /M\.Com\./i,
      /Master\s+of\s+Commerce/i
    ],
    profession: 'Business Professional'
  },
  'medicine': {
    patterns: [
      /M\.B\.B\.S\./i,
      /Bachelor\s+of\s+Medicine/i,
      /M\.D\./i,
      /Doctor\s+of\s+Medicine/i
    ],
    profession: 'Doctor'
  },
  'law': {
    patterns: [
      /LL\.B\./i,
      /Bachelor\s+of\s+Law/i,
      /LL\.M\./i,
      /Master\s+of\s+Law/i
    ],
    profession: 'Lawyer'
  },
  'accounting': {
    patterns: [
      /B\.Acc\./i,
      /Bachelor\s+of\s+Accounting/i,
      /M\.Acc\./i,
      /Master\s+of\s+Accounting/i,
      /ACCA/i,
      /CIMA/i,
      /CPA/i
    ],
    profession: 'Accountant'
  },
  'architecture': {
    patterns: [
      /B\.Arch\./i,
      /Bachelor\s+of\s+Architecture/i,
      /M\.Arch\./i,
      /Master\s+of\s+Architecture/i
    ],
    profession: 'Architect'
  },
  'design': {
    patterns: [
      /B\.Des\./i,
      /Bachelor\s+of\s+Design/i,
      /M\.Des\./i,
      /Master\s+of\s+Design/i
    ],
    profession: 'Designer'
  },
  'education': {
    patterns: [
      /B\.Ed\./i,
      /Bachelor\s+of\s+Education/i,
      /M\.Ed\./i,
      /Master\s+of\s+Education/i
    ],
    profession: 'Teacher'
  },
  'nursing': {
    patterns: [
      /B\.N\./i,
      /Bachelor\s+of\s+Nursing/i,
      /M\.N\./i,
      /Master\s+of\s+Nursing/i
    ],
    profession: 'Nurse'
  }
};

// Specializations within fields
const specializations = {
  'engineering': {
    'software': ['computer', 'software', 'it', 'information technology', 'computing'],
    'mechanical': ['mechanical', 'mechatronics', 'robotics'],
    'electrical': ['electrical', 'electronics', 'power', 'telecommunications'],
    'civil': ['civil', 'structural', 'construction'],
    'chemical': ['chemical', 'process', 'petroleum'],
    'industrial': ['industrial', 'manufacturing', 'production'],
    'biomedical': ['biomedical', 'bioengineering', 'medical devices'],
    'environmental': ['environmental', 'sustainable', 'green']
  },
  'computer_science': {
    'software': ['software', 'development', 'programming'],
    'data': ['data', 'analytics', 'big data', 'machine learning', 'ai'],
    'security': ['security', 'cybersecurity', 'information security'],
    'networks': ['networks', 'networking', 'systems'],
    'web': ['web', 'frontend', 'backend', 'fullstack']
  }
};

// Enhanced skills categorization with NLP support
const skillsCategories = {
    technical: {
        programming: ['python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'ruby', 'php', 'swift', 'kotlin', 'go', 'rust'],
        web: ['html', 'css', 'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring', 'asp.net'],
        database: ['sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'oracle', 'sql server', 'dynamodb'],
        cloud: ['aws', 'azure', 'gcp', 'cloud', 'serverless', 'lambda', 'ec2', 's3', 'rds'],
        devops: ['docker', 'kubernetes', 'jenkins', 'git', 'ci/cd', 'terraform', 'ansible', 'puppet'],
        ai_ml: ['machine learning', 'ai', 'tensorflow', 'pytorch', 'scikit-learn', 'deep learning', 'nlp', 'computer vision'],
        security: ['cybersecurity', 'security', 'penetration testing', 'ethical hacking', 'network security', 'information security'],
        mobile: ['android', 'ios', 'react native', 'flutter', 'mobile development', 'swift', 'kotlin']
    },
    soft: {
        communication: ['communication', 'presentation', 'public speaking', 'writing', 'documentation'],
        leadership: ['leadership', 'team management', 'project management', 'mentoring', 'coaching'],
        problem_solving: ['problem solving', 'critical thinking', 'analytical', 'troubleshooting', 'debugging'],
        collaboration: ['teamwork', 'collaboration', 'cross-functional', 'stakeholder management'],
        adaptability: ['adaptability', 'flexibility', 'learning', 'innovation', 'creativity']
    }
};

// Educational patterns with NLP support
const educationPatterns = {
    degree: [
        /bachelor'?s?\s+(?:of|in)\s+(?:science|engineering|arts|technology|computer science|information technology)/i,
        /master'?s?\s+(?:of|in)\s+(?:science|engineering|arts|technology|computer science|information technology)/i,
        /ph\.?d\.?\s+(?:in|of)\s+(?:science|engineering|arts|technology|computer science|information technology)/i,
        /b\.?sc\.?\s*(?:\(eng\)|engineering|eng\.?)/i,
        /m\.?sc\.?\s*(?:\(eng\)|engineering|eng\.?)/i,
        /b\.?e\.?/i,
        /m\.?e\.?/i,
        /b\.?tech\.?/i,
        /m\.?tech\.?/i
    ],
    institution: [
        /university\s+of\s+[a-z\s]+/i,
        /[a-z\s]+university/i,
        /[a-z\s]+institute\s+of\s+technology/i,
        /[a-z\s]+college/i
    ],
    year: [
        /\b(?:19|20)\d{2}\b/,
        /\b(?:graduated|completed|obtained)\s+(?:in|on)\s+(?:19|20)\d{2}\b/i
    ]
};

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
    const headerText = lines.slice(0, 20).join(' ');
    
    // Create TF-IDF instance for better keyword matching
    const tfidf = new TfIdf();
    tfidf.addDocument(headerText);
    
    let bestMatch = null;
    let highestScore = 0;
    
    // First, try to find profession based on educational qualifications and specializations
    for (const [field, data] of Object.entries(educationalQualifications)) {
        for (const pattern of data.patterns) {
            if (pattern.test(headerText)) {
                // If we found a qualification, look for specializations
                if (specializations[field]) {
                    for (const [spec, keywords] of Object.entries(specializations[field])) {
                        if (keywords.some(keyword => new RegExp(`\\b${keyword}\\b`, 'i').test(headerText))) {
                            return `${spec.charAt(0).toUpperCase() + spec.slice(1)} ${data.profession}`;
                        }
                    }
                }
                return data.profession;
            }
        }
    }

    // Check for profession based on keywords and context
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
                    const score = tfidf.tfidf(context, 0) + tfidf.tfidf(prof, 0);
                    if (score > highestScore) {
                        highestScore = score;
                        bestMatch = `${context.charAt(0).toUpperCase() + context.slice(1)} ${prof.charAt(0).toUpperCase() + prof.slice(1)}`;
                    }
                }
            }
        }
    }
    
    return bestMatch;
}

function extractSkills(text) {
    const skills = {
        technical: new Set(),
        soft: new Set()
    };
    
    // Use natural's tokenizer for better word matching
    const tokens = tokenizer.tokenize(text.toLowerCase());
    
    // Create TF-IDF instance for better keyword matching
    const tfidf = new TfIdf();
    tfidf.addDocument(text);
    
    // Check for technical skills
    for (const category in skillsCategories.technical) {
        for (const skill of skillsCategories.technical[category]) {
            const stemmedSkill = stemmer.stem(skill.toLowerCase());
            if (skill.includes(' ')) {
                // For multi-word skills, check if the phrase exists or if all stemmed words exist
                if (text.toLowerCase().includes(skill.toLowerCase())) {
                    skills.technical.add(skill);
                } else if (skill.split(' ').every(word => tokens.map(token => stemmer.stem(token)).includes(stemmer.stem(word)))) {
                    skills.technical.add(skill);
                }
            } else if (tokens.map(token => stemmer.stem(token)).includes(stemmedSkill)) {
                skills.technical.add(skill);
            }
        }
    }
    
    // Check for soft skills
    for (const category in skillsCategories.soft) {
        for (const skill of skillsCategories.soft[category]) {
            const stemmedSkill = stemmer.stem(skill.toLowerCase());
            if (skill.includes(' ')) {
                // For multi-word skills, check if the phrase exists or if all stemmed words exist
                if (text.toLowerCase().includes(skill.toLowerCase())) {
                    skills.soft.add(skill);
                } else if (skill.split(' ').every(word => tokens.map(token => stemmer.stem(token)).includes(stemmer.stem(word)))) {
                    skills.soft.add(skill);
                }
            } else if (tokens.map(token => stemmer.stem(token)).includes(stemmedSkill)) {
                skills.soft.add(skill);
            }
        }
    }
    
    return {
        technical: Array.from(skills.technical),
        soft: Array.from(skills.soft)
    };
}

function extractEducation(text) {
    const education = [];
    const lines = text.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        
        // Look for degree patterns
        const degreeMatch = educationPatterns.degree.find(pattern => pattern.test(line));
        if (degreeMatch) {
            let educationEntry = {
                degree: line.trim(),
                field_of_study: null,
                institution: null,
                graduation_year: null
            };
            
            let foundDetails = false; // Flag to track if sufficient details are found

            // Look for field of study in the same line or next line
            const fieldMatch = line.match(/(?:in|of)\s+([a-z\s]+)(?:engineering|science|arts|technology)?/i);
            if (fieldMatch && fieldMatch[1]) {
                educationEntry.field_of_study = fieldMatch[1].trim();
                foundDetails = true;
            }
            
            // Look for institution in surrounding lines
            for (let j = Math.max(0, i - 2); j <= Math.min(lines.length - 1, i + 2); j++) {
                const institutionMatch = educationPatterns.institution.find(pattern => pattern.test(lines[j]));
                if (institutionMatch) {
                    educationEntry.institution = lines[j].trim();
                    foundDetails = true;
                    break;
                }
            }
            
            // Look for year in surrounding lines
            for (let j = Math.max(0, i - 2); j <= Math.min(lines.length - 1, i + 2); j++) {
                const yearMatch = educationPatterns.year.find(pattern => pattern.test(lines[j]));
                if (yearMatch) {
                    educationEntry.graduation_year = lines[j].match(/\b(?:19|20)\d{2}\b/)[0];
                    foundDetails = true;
                    break;
                }
            }
            
            // Only push the entry if at least one detail (field, institution, or year) is found in addition to the degree
            if (foundDetails) {
                education.push(educationEntry);
            }
        }
    }
    
    return education;
}

function extractContactInfo(text) {
    const contactInfo = {
        phone_numbers: [],
        emails: [],
        linkedin_url: null,
        portfolio_url: null
    };
    
    // Phone number patterns
    const phonePatterns = [
        /\+94[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{4}\b/,
        /\+94\d{9}\b/,
        /0\d{2}[-\s]?\d{3}[-\s]?\d{4}\b/,
        /\+\d{1,3}[-.\s]?\d{1,3}[-.\s]?\d{3,4}[-.\s]?\d{4}/,
        /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/
    ];
    
    // Extract phone numbers
    phonePatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
            contactInfo.phone_numbers.push(...matches);
        }
    });
    
    // Extract email addresses
    const emailMatches = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g);
    if (emailMatches) {
        contactInfo.emails.push(...emailMatches);
    }
    
    // Extract LinkedIn URL
    const linkedinMatch = text.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_.-]+\/?/);
    if (linkedinMatch) {
        contactInfo.linkedin_url = linkedinMatch[0];
    }
    
    // Extract portfolio URL
    const portfolioMatch = text.match(/https?:\/\/(?:www\.)?(?:github\.com|portfolio\.|behance\.net|dribbble\.com)\/[a-zA-Z0-9-]+/);
    if (portfolioMatch) {
        contactInfo.portfolio_url = portfolioMatch[0];
    }
    
    return contactInfo;
}

function calculateATSScore(text) {
    let score = 50; // Start with a base score, allowing positive contributions
    const issues = [];

    // Common action verbs for bullet points
    const actionVerbs = [
        'managed', 'developed', 'implemented', 'led', 'created', 'designed', 'optimized',
        'improved', 'analyzed', 'coordinated', 'collaborated', ' Oversaw', 'spearheaded',
        'pioneered', 'launched', 'generated', 'increased', 'decreased', 'reduced',
        'achieved', 'exceeded', 'streamlined', 'facilitated', 'mentored', 'trained',
        'presented', 'researched', 'configured', 'automated', 'built', 'coded', 'customized',
        'diagnosed', 'engineered', 'fixed', 'integrated', 'maintained', 'monitored',
        'performed', 'programmed', 'provided', 'resolved', 'supported', 'tested', 'upgraded',
        'administrated', 'advised', 'audited', 'budgeted', 'consulted', 'distributed',
        'evaluated', 'executed', 'forecasted', 'inspected', 'marketed', 'negotiated',
        'planned', 'processed', 'recruited', 'regulated', 'scheduled', 'supervised',
        'surveyed', 'validated', 'verified', 'wrote'
    ];

    // Basic ATS checks (reduced penalties)
    if (text.includes('|')) {
        score -= 5;
        issues.push('Contains table-like formatting (| character)');
    }
    
    if (/\.[jJ][pP][eE]?[gG]|\.[pP][nN][gG]|\.[gG][iI][fF]/.test(text)) {
        score -= 5;
        issues.push('Mentions image files (possible use of images)');
    }
    
    if (/[•●◆■★]/.test(text)) {
        score -= 5;
        issues.push('Uses special bullet characters');
    }
    
    // Contact information checks (reduced penalties)
    const contactInfo = extractContactInfo(text);
    if (contactInfo.phone_numbers.length === 0) {
        score -= 5;
        issues.push('No phone number found');
    }
    
    if (contactInfo.emails.length === 0) {
        score -= 5;
        issues.push('No email address found');
    }

    if (!contactInfo.linkedin_url && !contactInfo.portfolio_url) {
        score -= 5;
        issues.push('No LinkedIn or portfolio URL found');
    }
    
    // Length checks (reduced penalties)
    const wordCount = text.split(/\s+/).length;
    if (wordCount < 150) {
        score -= 5;
        issues.push('CV is very short (<150 words)');
    }
    if (wordCount > 1000) {
        score -= 5;
        issues.push('CV is very long (>1000 words)');
    }
    
    // Skills analysis (positive contributions and penalties)
    const skills = extractSkills(text);
    if (skills.technical.length < 5) {
        score -= 10;
        issues.push('Limited technical skills mentioned');
    } else {
        score += Math.min(skills.technical.length * 2, 20); // More points for technical skills, max 20 points
    }
    
    if (skills.soft.length < 3) {
        score -= 5;
        issues.push('Limited soft skills mentioned');
    } else {
        score += Math.min(skills.soft.length * 2, 10); // More points for soft skills, max 10 points
    }

    // Check for common skills that might not be categorized but are important
    commonSkills.forEach(skill => {
        if (new RegExp(`\\b${skill}\\b`, 'i').test(text)) {
            score += 0.5; // Small bonus for each common skill found, less impactful
        }
    });
    
    // Education check (positive contribution and penalty)
    const education = extractEducation(text);
    if (education.length === 0) {
        score -= 15;
        issues.push('No educational qualifications found');
    } else {
        score += Math.min(education.length * 5, 20); // More points for each educational entry, max 20 points
    }

    // Check for presence of key sections (positive contributions)
    if (/\bexperience\b/i.test(text)) {
        score += 5;
    }
    if (/\beducation\b/i.test(text)) {
        score += 5;
    }
    if (/\bskills\b/i.test(text)) {
        score += 5;
    }
    if (/\bsummary|objective|profile\b/i.test(text)) {
        score += 5;
    }

    // Check for action verbs
    let actionVerbCount = 0;
    actionVerbs.forEach(verb => {
        if (new RegExp(`\\b${verb}\\b`, 'i').test(text)) {
            actionVerbCount++;
        }
    });

    if (actionVerbCount < 10) {
        score -= 5;
        issues.push('Limited use of strong action verbs');
    } else {
        score += Math.min(actionVerbCount * 0.5, 10); // Max 10 points for action verbs
    }

    // Keyword density (simple approximation)
    const profession = extractProfession(text);
    if (profession) {
        const professionKeywords = profession.toLowerCase().split(' ');
        let keywordMatches = 0;
        professionKeywords.forEach(keyword => {
            if (text.toLowerCase().includes(keyword)) {
                keywordMatches++;
            }
        });
        score += Math.min(keywordMatches * 3, 15); // Add points based on profession keyword matches, max 15
    }

    // Quantifiable achievements (hard to fully automate, but can give a small boost if numbers are present near verbs)
    const quantifiablePattern = /\b\d+%|\$\d+|\d+K|\d+\s+(?:million|billion)|increased\s+by\s+\d+|reduced\s+by\s+\d+/i;
    if (quantifiablePattern.test(text)) {
        score += 5;
        // issues.push('Consider adding more quantifiable achievements'); // This is a recommendation, not necessarily an issue to penalize hard
    }

    // Recommendations will be handled in analyzeResume

    // Ensure score doesn't exceed 100
    return {
        score: Math.min(Math.max(score, 0), 100),
        issues
    };
}

function analyzeResume(text) {
    const name = extractName(text);
    const profession = extractProfession(text);
    const skills = extractSkills(text);
    const education = extractEducation(text);
    const contactInfo = extractContactInfo(text);
    const { score, issues } = calculateATSScore(text);
    
    // Determine experience level based on content analysis
    let experienceLevel = 'Junior';
    const wordCount = text.split(/\s+/).length;
    const skillsCount = skills.technical.length + skills.soft.length;
    
    if (wordCount > 1000 && skillsCount > 15) {
        experienceLevel = 'Senior';
    } else if (wordCount > 500 && skillsCount > 10) {
        experienceLevel = 'Mid-level';
    }
    
    return {
        name,
        profession,
        skills,
        education,
        contact_info: contactInfo,
        experience_level: experienceLevel,
        ats_score: score,
        issues,
        is_ats_friendly: score >= 70,
        recommendations: [
            'Use standard bullet points instead of special characters',
            'Include relevant keywords from the job description',
            'Keep formatting simple and consistent',
            'Ensure all contact information is clearly visible',
            'Highlight key achievements and skills',
            'Quantify your achievements with numbers, percentages, or monetary values',
            'Use strong action verbs at the beginning of your bullet points',
            'Ensure your resume includes clear sections for Experience, Education, and Skills',
            'Tailor your resume keywords to the specific job description',
            'Review for any unnecessary images or complex formatting that might hinder ATS parsing'
        ]
    };
}

app.post('/api/analyze', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file uploaded' });
        }

        const data = await pdfParse(req.file.buffer);
        const text = data.text;
        
        const analysis = analyzeResume(text);
        res.json(analysis);
    } catch (error) {
        console.error('Error processing PDF:', error);
        res.status(500).json({ error: 'Error processing PDF file' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 