// Modern RAG Pipeline Visualizer

class RAGPipelineVisualizer {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.setupDragAndDrop();
        this.currentView = 'document';
        this.isProcessing = false;
        this.statusPollingInterval = null;
    }

    initializeElements() {
        // Control elements
        this.fileInput = document.getElementById('pdfFile');
        this.uploadArea = document.getElementById('uploadArea');
        this.uploadProgress = document.getElementById('uploadProgress');
        this.questionInput = document.getElementById('questionInput');
        this.askBtn = document.getElementById('askBtn');
        this.statusContainer = document.getElementById('statusContainer');
        this.statusMessage = document.getElementById('statusMessage');
        this.systemStatus = document.getElementById('systemStatus');

        // Pipeline elements
        this.documentPipeline = document.getElementById('documentPipeline');
        this.queryPipeline = document.getElementById('queryPipeline');
        this.queryViewBtn = document.getElementById('queryViewBtn');
        this.resultsPanel = document.getElementById('resultsPanel');
        this.processingDetails = document.getElementById('processingDetails');

        // View toggles
        this.viewToggles = document.querySelectorAll('.view-toggle');

        // Pipeline nodes
        this.nodes = {
            loading: document.getElementById('stage-loading'),
            splitting: document.getElementById('stage-splitting'),
            embedding: document.getElementById('stage-embedding'),
            vectorstore: document.getElementById('stage-vectorstore'),
            query: document.getElementById('stage-query'),
            retrieval: document.getElementById('stage-retrieval'),
            generation: document.getElementById('stage-generation')
        };

        // Result elements
        this.displayQuestion = document.getElementById('displayQuestion');
        this.displayAnswer = document.getElementById('displayAnswer');
        this.pagesCount = document.getElementById('pagesCount');
        this.chunksCount = document.getElementById('chunksCount');
    }

    bindEvents() {
        // File input
        this.fileInput.addEventListener('change', () => this.handleFileSelect());
        
        // Upload area click
        this.uploadArea.addEventListener('click', () => this.fileInput.click());

        // Question input
        this.questionInput.addEventListener('input', () => this.updateAskButton());
        this.questionInput.addEventListener('keydown', (e) => this.handleQuestionKeydown(e));

        // Ask button
        this.askBtn.addEventListener('click', () => this.askQuestion());

        // View toggles
        this.viewToggles.forEach(toggle => {
            toggle.addEventListener('click', () => this.switchView(toggle.dataset.view));
        });

        // Focus management
        this.questionInput.addEventListener('focus', () => this.handleInputFocus());
        this.questionInput.addEventListener('blur', () => this.handleInputBlur());
    }

    setupDragAndDrop() {
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.uploadArea.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });

        // Highlight drop area
        ['dragenter', 'dragover'].forEach(eventName => {
            this.uploadArea.addEventListener(eventName, () => this.highlightDropArea(), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.uploadArea.addEventListener(eventName, () => this.unhighlightDropArea(), false);
        });

        // Handle dropped files
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e), false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    highlightDropArea() {
        this.uploadArea.classList.add('dragover');
    }

    unhighlightDropArea() {
        this.uploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type === 'application/pdf') {
                this.uploadFile(file);
            } else {
                this.showStatus('Please drop a PDF file only.', 'error');
            }
        }
    }

    handleFileSelect() {
        const file = this.fileInput.files[0];
        if (file && file.type === 'application/pdf') {
            this.uploadFile(file);
        } else {
            this.showStatus('Please select a valid PDF file.', 'error');
        }
    }

    async uploadFile(file) {
        if (this.isProcessing) return;

        console.log('Starting upload for file:', file.name);
        this.isProcessing = true;
        this.showUploadProgress();
        this.resetPipeline();
        
        const formData = new FormData();
        formData.append('file', file);

        try {
            this.showStatus(`Uploading "${file.name}"...`, 'info');
            this.updateSystemStatus('Processing', 'warning');

            console.log('Sending upload request...');
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            console.log('Upload response status:', response.status);
            const result = await response.json();
            console.log('Upload result:', result);

            if (result.success) {
                this.showStatus(`File uploaded successfully! Processing document...`, 'success');
                this.startStatusPolling();
            } else {
                throw new Error(result.error || 'Upload failed');
            }

        } catch (error) {
            console.error('Upload error:', error);
            this.showStatus(`Upload failed: ${error.message}`, 'error');
            this.hideUploadProgress();
            this.isProcessing = false;
            this.updateSystemStatus('Error', 'error');
        }
    }

    startStatusPolling() {
        if (this.statusPollingInterval) {
            clearInterval(this.statusPollingInterval);
        }

        this.statusPollingInterval = setInterval(async () => {
            try {
                const response = await fetch('/get_status');
                const status = await response.json();
                
                this.updatePipelineStatus(status);
                
                if (status.stage === 'ready' || status.stage === 'error') {
                    clearInterval(this.statusPollingInterval);
                    this.statusPollingInterval = null;
                    this.isProcessing = false;
                    this.hideUploadProgress();
                    
                    if (status.stage === 'ready') {
                        this.enableQuestionInput();
                        this.updateSystemStatus('Ready', 'success');
                        this.showProcessingDetails(status);
                        this.enableQueryView();
                    } else {
                        this.updateSystemStatus('Error', 'error');
                    }
                }
            } catch (error) {
                console.error('Status polling error:', error);
                clearInterval(this.statusPollingInterval);
                this.statusPollingInterval = null;
                this.isProcessing = false;
                this.hideUploadProgress();
                this.updateSystemStatus('Error', 'error');
            }
        }, 500);
    }

    updatePipelineStatus(status) {
        const stageOrder = ['loading', 'splitting', 'embedding', 'vectorstore'];
        const currentStageIndex = stageOrder.indexOf(status.stage);
        
        // Reset all nodes
        Object.values(this.nodes).forEach(node => {
            if (node) {
                node.classList.remove('active', 'completed', 'error');
                this.updateNodeProgress(node, 0);
                this.updateNodeStatus(node, 'Ready');
            }
        });

        // Update nodes based on current stage
        stageOrder.forEach((stageName, index) => {
            const node = this.nodes[stageName];
            if (!node) return;

            if (index < currentStageIndex) {
                // Completed stages
                node.classList.add('completed');
                this.updateNodeProgress(node, 100);
                this.updateNodeStatus(node, 'Completed');
            } else if (index === currentStageIndex) {
                // Current active stage
                node.classList.add('active');
                this.updateNodeProgress(node, status.progress || 0);
                this.updateNodeStatus(node, 'Processing');
                this.activateConnection(stageName);
            }
        });

        // Handle ready state
        if (status.stage === 'ready') {
            stageOrder.forEach(stageName => {
                const node = this.nodes[stageName];
                if (node) {
                    node.classList.remove('active');
                    node.classList.add('completed');
                    this.updateNodeProgress(node, 100);
                    this.updateNodeStatus(node, 'Ready');
                }
            });
            this.activateAllConnections();
        }

        // Handle error state
        if (status.stage === 'error') {
            Object.values(this.nodes).forEach(node => {
                if (node && node.classList.contains('active')) {
                    node.classList.remove('active');
                    node.classList.add('error');
                    this.updateNodeStatus(node, 'Error');
                }
            });
        }

        this.showStatus(status.message, status.stage === 'error' ? 'error' : 'info');
    }

    updateNodeProgress(node, progress) {
        const progressFill = node.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
    }

    updateNodeStatus(node, status) {
        const statusElement = node.querySelector('.node-status');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }

    activateConnection(stageName) {
        // Activate specific connection based on stage
        const connectionMap = {
            'splitting': ['conn-1-2', 'particle-1'],
            'embedding': ['conn-2-3', 'particle-2'],
            'vectorstore': ['conn-3-4', 'particle-3']
        };

        if (connectionMap[stageName]) {
            const [connId, particleId] = connectionMap[stageName];
            this.activateConnectionById(connId, particleId);
        }
    }

    activateAllConnections() {
        const connections = [
            ['conn-1-2', 'particle-1'],
            ['conn-2-3', 'particle-2'],
            ['conn-3-4', 'particle-3']
        ];

        connections.forEach(([connId, particleId]) => {
            this.activateConnectionById(connId, particleId);
        });
    }

    activateConnectionById(connId, particleId) {
        const connection = document.getElementById(connId);
        const particle = document.getElementById(particleId);
        
        if (connection) {
            connection.classList.add('active');
        }
        
        if (particle) {
            // Restart animation
            const animateMotion = particle.querySelector('animateMotion');
            const animateOpacity = particle.querySelector('animate');
            
            if (animateMotion) animateMotion.beginElement();
            if (animateOpacity) animateOpacity.beginElement();
        }
    }

    enableQuestionInput() {
        this.questionInput.disabled = false;
        this.questionInput.placeholder = "Ask any question about your document...";
        this.questionInput.focus();
        this.updateAskButton();
    }

    enableQueryView() {
        this.queryViewBtn.disabled = false;
    }

    updateAskButton() {
        const hasText = this.questionInput.value.trim().length > 0;
        const isEnabled = !this.questionInput.disabled;
        this.askBtn.disabled = !(hasText && isEnabled);
    }

    handleQuestionKeydown(e) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !this.askBtn.disabled) {
            e.preventDefault();
            this.askQuestion();
        }
    }

    async askQuestion() {
        const question = this.questionInput.value.trim();
        if (!question || this.isProcessing) return;

        this.isProcessing = true;
        this.askBtn.disabled = true;
        this.switchView('query');
        this.updateSystemStatus('Thinking', 'warning');

        try {
            // Animate query pipeline
            await this.animateQueryPipeline();

            const response = await fetch('/ask_question', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ question })
            });

            const result = await response.json();

            if (result.success) {
                this.showResults(result.question, result.answer, result.document_stats);
                this.updateSystemStatus('Complete', 'success');
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            this.showStatus(`Error: ${error.message}`, 'error');
            this.updateSystemStatus('Error', 'error');
        } finally {
            this.isProcessing = false;
            this.askBtn.disabled = false;
            this.updateAskButton();
        }
    }

    async animateQueryPipeline() {
        const queryNodes = ['query', 'retrieval', 'generation'];
        
        console.log('Starting query pipeline animation');
        
        // Reset query nodes
        queryNodes.forEach(nodeName => {
            const node = this.nodes[nodeName];
            if (node) {
                node.classList.remove('active', 'completed', 'error');
                this.updateNodeProgress(node, 0);
                this.updateNodeStatus(node, 'Ready');
            }
        });

        // Reset connection lines
        document.querySelectorAll('.query-line').forEach(line => {
            line.classList.remove('active');
        });

        // Animate each stage with proper delays
        for (let i = 0; i < queryNodes.length; i++) {
            const nodeName = queryNodes[i];
            const node = this.nodes[nodeName];
            
            if (node) {
                console.log(`Animating stage: ${nodeName}`);
                
                // Activate current node with glow effect
                node.classList.add('active');
                this.updateNodeStatus(node, 'Processing');
                
                // Activate connection line before this node
                if (i > 0) {
                    const connectionId = `query-conn-${i}-${i + 1}`;
                    const connection = document.getElementById(connectionId);
                    if (connection) {
                        connection.classList.add('active');
                    }
                }
                
                // Activate particle animation
                if (i < queryNodes.length - 1) {
                    const particleId = `query-particle-${i + 1}`;
                    const particle = document.getElementById(particleId);
                    if (particle) {
                        const animateMotion = particle.querySelector('animateMotion');
                        const animateOpacity = particle.querySelector('animate');
                        if (animateMotion) animateMotion.beginElement();
                        if (animateOpacity) animateOpacity.beginElement();
                    }
                }
                
                // Animate progress smoothly
                await this.animateNodeProgress(node, 100, 1200);
                
                // Complete current node
                node.classList.remove('active');
                node.classList.add('completed');
                this.updateNodeStatus(node, 'Completed');
                
                // Wait before next stage for better visual flow
                if (i < queryNodes.length - 1) {
                    await this.sleep(500);
                }
            }
        }

        console.log('Query pipeline animation completed');
    }

    animateNodeProgress(node, targetProgress, duration) {
        return new Promise((resolve) => {
            const progressFill = node.querySelector('.progress-fill');
            if (!progressFill) {
                resolve();
                return;
            }

            const startTime = performance.now();
            const startProgress = 0;

            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min((elapsed / duration) * targetProgress, targetProgress);
                
                progressFill.style.width = `${progress}%`;

                if (elapsed < duration) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };

            requestAnimationFrame(animate);
        });
    }

    switchView(view) {
        this.currentView = view;
        
        // Update toggle buttons
        this.viewToggles.forEach(toggle => {
            toggle.classList.toggle('active', toggle.dataset.view === view);
        });

        // Switch pipeline views
        if (view === 'document') {
            this.documentPipeline.style.display = 'block';
            this.queryPipeline.style.display = 'none';
        } else if (view === 'query') {
            this.documentPipeline.style.display = 'none';
            this.queryPipeline.style.display = 'block';
        }
    }

    showResults(question, answer, documentStats = null) {
        this.displayQuestion.textContent = question;
        this.displayAnswer.textContent = answer;
        
        // Update document stats if provided
        if (documentStats) {
            const resultPagesCount = document.getElementById('resultPagesCount');
            const resultChunksCount = document.getElementById('resultChunksCount');
            const resultRetrievalCount = document.getElementById('resultRetrievalCount');
            
            if (resultPagesCount) resultPagesCount.textContent = documentStats.pages_count || '-';
            if (resultChunksCount) resultChunksCount.textContent = documentStats.chunks_count || '-';
            if (resultRetrievalCount) resultRetrievalCount.textContent = documentStats.retrieval_count || '3';
        }
        
        this.resultsPanel.style.display = 'block';
    }

    showProcessingDetails(status) {
        if (status.pages_count) this.pagesCount.textContent = status.pages_count;
        if (status.chunks_count) this.chunksCount.textContent = status.chunks_count;
        this.processingDetails.style.display = 'block';
    }

    showUploadProgress() {
        this.uploadArea.querySelector('.upload-content').style.display = 'none';
        this.uploadProgress.style.display = 'flex';
    }

    hideUploadProgress() {
        this.uploadArea.querySelector('.upload-content').style.display = 'block';
        this.uploadProgress.style.display = 'none';
    }

    resetPipeline() {
        // Reset all nodes
        Object.values(this.nodes).forEach(node => {
            if (node) {
                node.classList.remove('active', 'completed', 'error');
                this.updateNodeProgress(node, 0);
                this.updateNodeStatus(node, 'Ready');
            }
        });

        // Reset connections
        document.querySelectorAll('.pipeline-connection').forEach(conn => {
            conn.classList.remove('active');
        });

        // Reset UI state
        this.questionInput.disabled = true;
        this.questionInput.placeholder = "Upload a document first to start asking questions...";
        this.questionInput.value = '';
        this.askBtn.disabled = true;
        this.queryViewBtn.disabled = true;
        this.resultsPanel.style.display = 'none';
        this.processingDetails.style.display = 'none';
        
        this.switchView('document');
    }

    showStatus(message, type = 'info') {
        this.statusMessage.textContent = message;
        this.statusMessage.className = `status-message ${type}`;
        this.statusContainer.style.display = 'block';
        
        // Auto-hide success messages
        if (type === 'success') {
            setTimeout(() => {
                this.statusContainer.style.display = 'none';
            }, 3000);
        }
    }

    updateSystemStatus(status, type = 'info') {
        const statusSpan = this.systemStatus.querySelector('span');
        const statusIcon = this.systemStatus.querySelector('i');
        
        if (statusSpan) statusSpan.textContent = status;
        
        if (statusIcon) {
            statusIcon.className = 'fas fa-circle';
            statusIcon.style.color = type === 'success' ? '#10b981' : 
                                   type === 'warning' ? '#f59e0b' : 
                                   type === 'error' ? '#ef4444' : '#6366f1';
        }
    }

    handleInputFocus() {
        this.questionInput.style.borderColor = '#6366f1';
        this.questionInput.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
    }

    handleInputBlur() {
        this.questionInput.style.borderColor = '';
        this.questionInput.style.boxShadow = '';
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Global functions for HTML event handlers
function closeResults() {
    document.getElementById('resultsPanel').style.display = 'none';
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.ragVisualizer = new RAGPipelineVisualizer();
    
    // Add some visual flair
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// Add smooth page transitions
document.body.style.opacity = '0';
document.body.style.transition = 'opacity 0.3s ease';