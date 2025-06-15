import PyPDF2
import nltk
import re
from rich.console import Console
from rich.table import Table

# Download all required NLTK data
nltk.download('punkt', quiet=True)
nltk.download('averaged_perceptron_tagger', quiet=True)
nltk.download('averaged_perceptron_tagger_eng', quiet=True)

console = Console()

def extract_text_from_pdf(file_name):
    try:
        with open(file_name, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ''
            for page in reader.pages:
                text += page.extract_text() + '\n'
        return text
    except Exception as e:
        console.print(f'[red]Error reading PDF: {e}[/red]')
        return None

def summarize_cv(text):
    # Extract name: look for capitalized words at the top with more specific patterns
    lines = text.split('\n')
    name = None
    
    # Common words that shouldn't be considered as names
    non_name_words = {'skills', 'experience', 'education', 'summary', 'profile', 'objective', 'career', 'work', 'professional', 'personal', 'contact', 'details', 'resume', 'cv', 'curriculum vitae'}
    
    # First try to find name in the first few lines
    for line in lines[:15]:  # Check first 15 lines
        line = line.strip()
        # Skip lines that are likely section headers
        if any(word.lower() in line.lower() for word in non_name_words):
            continue
            
        # Look for patterns like "John Doe" or "John A. Doe" at the start of lines
        # Also handle cases with titles like "Mr.", "Mrs.", "Dr.", etc.
        name_match = re.search(r'^(?:Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)(?:\s*[-–—]|\s*$)', line)
        if name_match:
            potential_name = name_match.group(1)
            # Verify that the potential name doesn't contain any non-name words
            if not any(word.lower() in potential_name.lower() for word in non_name_words):
                name = potential_name
                break
    
    # If no name found, try looking for common name patterns in the first 20 lines
    if not name:
        for line in lines[:20]:
            line = line.strip()
            # Look for patterns like "Name: John Doe" or "Full Name: John A. Doe"
            name_match = re.search(r'(?:Name|Full Name|Candidate Name)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)', line, re.IGNORECASE)
            if name_match:
                potential_name = name_match.group(1)
                if not any(word.lower() in potential_name.lower() for word in non_name_words):
                    name = potential_name
                    break
    
    # Extract profession: look for profession keywords with context
    professions = {
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
    }
    
    profession = None
    profession_score = 0
    
    # First look for profession in the first few lines (likely in title/header)
    header_text = ' '.join(lines[:10])  # Increased from 5 to 10 lines
    
    # Common words that might indicate a profession section
    profession_indicators = ['position', 'role', 'title', 'job', 'profession', 'career', 'occupation']
    
    # First try to find profession in the header
    for prof, contexts in professions.items():
        for context in contexts:
            # Look for patterns like "Software Engineer" or "Engineer (Software)"
            patterns = [
                rf'\b{context}\s+{prof}\b',
                rf'\b{prof}\s+{context}\b',
                rf'\b{prof}\s*\([^)]*{context}[^)]*\)',
                rf'\b{context}\s*\([^)]*{prof}[^)]*\)'
            ]
            for pattern in patterns:
                if re.search(pattern, header_text, re.IGNORECASE):
                    profession = f"{context.capitalize()} {prof.capitalize()}"
                    profession_score = 2
                    break
        if profession:
            break
    
    # If no profession found in header, look for profession indicators
    if not profession:
        for line in lines[:20]:
            line = line.strip()
            if any(indicator in line.lower() for indicator in profession_indicators):
                for prof, contexts in professions.items():
                    for context in contexts:
                        patterns = [
                            rf'\b{context}\s+{prof}\b',
                            rf'\b{prof}\s+{context}\b',
                            rf'\b{prof}\s*\([^)]*{context}[^)]*\)',
                            rf'\b{context}\s*\([^)]*{prof}[^)]*\)'
                        ]
                        for pattern in patterns:
                            if re.search(pattern, line, re.IGNORECASE):
                                profession = f"{context.capitalize()} {prof.capitalize()}"
                                profession_score = 1
                                break
                    if profession:
                        break
            if profession:
                break
    
    # If still no profession found, search entire text
    if not profession:
        for prof, contexts in professions.items():
            for context in contexts:
                patterns = [
                    rf'\b{context}\s+{prof}\b',
                    rf'\b{prof}\s+{context}\b',
                    rf'\b{prof}\s*\([^)]*{context}[^)]*\)',
                    rf'\b{context}\s*\([^)]*{prof}[^)]*\)'
                ]
                for pattern in patterns:
                    if re.search(pattern, text, re.IGNORECASE):
                        profession = f"{context.capitalize()} {prof.capitalize()}"
                        profession_score = 1
                        break
            if profession:
                break
    
    # Extract skills: look for 'Skills' section or common skills
    skills = set()
    skill_section = re.search(r'Skills[\s:]*([\s\S]{0,300})', text, re.IGNORECASE)
    if skill_section:
        possible_skills = re.findall(r'\b([A-Za-z\+\#]{2,})\b', skill_section.group(1))
        skills.update([s for s in possible_skills if s.lower() not in professions])
    
    common_skills = ['python', 'java', 'excel', 'sql', 'c++', 'c#', 'javascript', 'html', 'css', 'react', 'node', 'aws', 'azure', 'docker', 'linux', 'git']
    for skill in common_skills:
        # Escape special characters in the skill name
        escaped_skill = re.escape(skill)
        if re.search(r'\b' + escaped_skill + r'\b', text, re.IGNORECASE):
            skills.add(skill)
    
    return name, profession, list(skills)

def ats_score(text):
    score = 100
    issues = []
    
    # Check for columns/tables (bad for ATS)
    if re.search(r'\|', text):
        score -= 20
        issues.append('Contains table-like formatting (| character)')
    
    # Check for images (ATS can't read)
    if re.search(r'\.(jpg|png|jpeg|gif)', text, re.IGNORECASE):
        score -= 20
        issues.append('Mentions image files (possible use of images)')
    
    # Check for unusual fonts/characters
    if re.search(r'[•●◆■★]', text):
        score -= 10
        issues.append('Uses special bullet characters')
    
    # Check for phone numbers with various formats
    phone_patterns = [
        # Sri Lankan formats
        r'\+94[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{4}\b',  # +94 76 325 3332
        r'\+94\d{9}\b',                               # +94763253332
        r'0\d{2}[-\s]?\d{3}[-\s]?\d{4}\b',           # 076 325 3332
        # Other international formats
        r'\+\d{1,3}[-.\s]?\d{1,3}[-.\s]?\d{3,4}[-.\s]?\d{4}',  # International format
        r'\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b',                  # US/Canada format
        r'\b\d{2}[-.\s]?\d{4}[-.\s]?\d{4}\b',                  # UK format
        r'\b\d{2}[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{3}\b',      # Indian format
        r'\b\d{2}[-.\s]?\d{2}[-.\s]?\d{2}[-.\s]?\d{2}[-.\s]?\d{2}\b',  # French format
        r'\b\d{3}[-.\s]?\d{2}[-.\s]?\d{2}[-.\s]?\d{2}\b',      # Swedish format
        r'\b\d{2}[-.\s]?\d{3}[-.\s]?\d{4}\b',                  # Australian format
        r'\b\d{3}[-.\s]?\d{4}[-.\s]?\d{4}\b',                  # Japanese format
        r'\b\d{2}[-.\s]?\d{4}[-.\s]?\d{4}\b',                  # New Zealand format
        r'\b\d{3}[-.\s]?\d{3}[-.\s]?\d{3}\b',                  # Short format
        r'\b\d{4}[-.\s]?\d{3}[-.\s]?\d{3}\b',                  # Alternative format
        r'\b\d{3}[-.\s]?\d{4}[-.\s]?\d{4}\b',                  # Another common format
        r'\b\d{2}[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{3}\b',      # Long format
        r'\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b',                  # Standard format
        r'\b\d{2}[-.\s]?\d{2}[-.\s]?\d{2}[-.\s]?\d{2}[-.\s]?\d{2}\b'   # Extended format
    ]
    
    phone_found = False
    for pattern in phone_patterns:
        if re.search(pattern, text):
            phone_found = True
            break
    
    if not phone_found:
        score -= 10
        issues.append('No phone number found')
    
    # Check for email address
    if not re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b', text):
        score -= 10
        issues.append('No email address found')
    
    # Check for length
    if len(text.split()) < 200:
        score -= 10
        issues.append('CV is very short (<200 words)')
    if len(text.split()) > 1500:
        score -= 10
        issues.append('CV is very long (>1500 words)')
    
    return max(score, 0), issues

def print_summary(name, profession, skills, score, issues):
    console.print("[bold cyan]\n===== CV SUMMARY =====[/bold cyan]")
    table = Table(show_header=True, header_style="bold magenta")
    table.add_column("Field")
    table.add_column("Value")
    table.add_row("Name", name or "[red]Not found[/red]")
    table.add_row("Profession", profession or "[red]Not found[/red]")
    table.add_row("Skills", ", ".join(skills) if skills else "[red]Not found[/red]")
    console.print(table)
    console.print(f"\n[bold yellow]ATS Friendly:[/bold yellow] {'Yes' if score >= 70 else 'No'} (Score: {score}/100)")
    if issues:
        console.print("[bold red]\nMistakes / Issues Detected:[/bold red]")
        for issue in issues:
            console.print(f"- {issue}")
    else:
        console.print("[green]No major issues detected![/green]")

def main():
    file_name = input('Enter the PDF CV file name: ')
    text = extract_text_from_pdf(file_name)
    if not text:
        return
    name, profession, skills = summarize_cv(text)
    score, issues = ats_score(text)
    print_summary(name, profession, skills, score, issues)

if __name__ == "__main__":
    main() 