// DOM Elements
const elements = {
    form: document.getElementById('workflow-form'),
    generateBtn: document.getElementById('generate-btn'),
    loadingState: document.getElementById('loading-state'),
    resultSection: document.getElementById('result-section'),
    workflowContent: document.getElementById('workflow-content'),
    resetBtn: document.getElementById('reset-btn'),
    progressBar: document.querySelector('.progress-bar'),
    
    // Inputs
    industryInput: document.getElementById('industry'),
    roleInput: document.getElementById('role'),
    goalInput: document.getElementById('goal'),
};

// Initialize
function init() {
    setupEventListeners();
}

function setupEventListeners() {
    // Generate
    elements.generateBtn.addEventListener('click', handleGenerate);
    
    // Reset
    elements.resetBtn.addEventListener('click', resetForm);
}

async function handleGenerate() {
    const industry = elements.industryInput.value.trim();
    const role = elements.roleInput.value.trim();
    const goal = elements.goalInput.value.trim();

    if (!industry || !role || !goal) {
        alert("Please fill in all fields (Industry, Role, Goal).");
        return;
    }

    // UI Updates
    elements.form.style.display = 'none';
    elements.loadingState.classList.remove('hidden');
    elements.resultSection.classList.add('hidden');
    
    // Progress bar animation
    elements.progressBar.style.width = '0%';
    setTimeout(() => elements.progressBar.style.width = '40%', 500);
    setTimeout(() => elements.progressBar.style.width = '80%', 2000);

    try {
        const workflow = await callSecureAPI(industry, role, goal);
        
        elements.progressBar.style.width = '100%';
        
        setTimeout(() => {
            elements.loadingState.classList.add('hidden');
            elements.resultSection.classList.remove('hidden');
            
            // Parse Markdown and inject
            elements.workflowContent.innerHTML = marked.parse(workflow);
            
            // Add copy buttons to code blocks
            setupCopyButtons();
            
            elements.resultSection.scrollIntoView({behavior: 'smooth', block: 'start'});
        }, 500);

    } catch (error) {
        alert("Error generating workflow: " + error.message);
        elements.loadingState.classList.add('hidden');
        elements.form.style.display = 'grid';
    }
}

async function callSecureAPI(industry, role, goal) {
    // Call our secure backend endpoint instead of the direct Gemini API
    const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ industry, role, goal })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to call backend API");
    }

    const data = await response.json();
    return data.result;
}

function setupCopyButtons() {
    const codeBlocks = elements.workflowContent.querySelectorAll('pre');
    
    codeBlocks.forEach(block => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-secondary';
        btn.innerHTML = '<i data-lucide="copy" style="width:16px;height:16px;"></i> Copy Prompt';
        btn.style.position = 'absolute';
        btn.style.top = '16px';
        btn.style.right = '16px';
        btn.style.padding = '6px 12px';
        btn.style.fontSize = '12px';
        
        btn.addEventListener('click', () => {
            const code = block.querySelector('code').innerText;
            navigator.clipboard.writeText(code);
            btn.innerHTML = '<i data-lucide="check" style="width:16px;height:16px;color:#10b981;"></i> Copied!';
            lucide.createIcons();
            setTimeout(() => {
                btn.innerHTML = '<i data-lucide="copy" style="width:16px;height:16px;"></i> Copy Prompt';
                lucide.createIcons();
            }, 2000);
        });

        block.appendChild(btn);
    });
    lucide.createIcons();
}

function resetForm() {
    elements.resultSection.classList.add('hidden');
    elements.form.style.display = 'grid';
    elements.industryInput.value = '';
    elements.roleInput.value = '';
    elements.goalInput.value = '';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Start
init();
