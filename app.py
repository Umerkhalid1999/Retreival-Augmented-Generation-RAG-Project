from flask import Flask, render_template, request, jsonify, session
import os
import time
from werkzeug.utils import secure_filename
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_openai import ChatOpenAI
from langchain.chains import RetrievalQA
import warnings
import shutil
import tempfile
from pathlib import Path

warnings.filterwarnings('ignore')

app = Flask(__name__)
app.secret_key = 'your-secret-key-change-this'
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Global variables to store the QA chain and processing status
qa_chain = None
processing_status = {}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file selected'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if file and file.filename.lower().endswith('.pdf'):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Store filepath in session
        session['uploaded_file'] = filepath
        
        # Automatically start processing
        return process_document_internal(filepath)
    
    return jsonify({'error': 'Please upload a PDF file'}), 400

def process_document_internal(filepath):
    """Internal function to process document"""
    global qa_chain, processing_status
    
    try:
        # Initialize processing status
        processing_status = {
            'stage': 'loading',
            'progress': 0,
            'message': 'Loading PDF document...',
            'chunks': [],
            'embeddings_created': False,
            'vectorstore_ready': False
        }
        
        # Stage 1: Load PDF
        time.sleep(1)  # Simulate processing time for animation
        loader = PyPDFLoader(filepath)
        pages = loader.load()
        
        processing_status.update({
            'stage': 'splitting',
            'progress': 25,
            'message': f'Splitting document into chunks... Found {len(pages)} pages',
            'pages_count': len(pages)
        })
        
        # Stage 2: Split into chunks
        time.sleep(1)
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=50,
        )
        splits = text_splitter.split_documents(pages)
        
        processing_status.update({
            'stage': 'embedding',
            'progress': 50,
            'message': f'Creating embeddings for {len(splits)} chunks...',
            'chunks_count': len(splits),
            'chunks': [doc.page_content[:100] + "..." for doc in splits[:5]]  # Preview first 5 chunks
        })
        
        # Stage 3: Create embeddings and vector store
        time.sleep(2)
        embeddings = OpenAIEmbeddings()
        
        # Create a temporary directory for the vector store
        temp_dir = tempfile.mkdtemp()
        vectorstore = Chroma.from_documents(splits, embeddings, persist_directory=temp_dir)
        
        processing_status.update({
            'stage': 'initializing',
            'progress': 75,
            'message': 'Initializing Q&A system...',
            'embeddings_created': True,
            'vectorstore_ready': True
        })
        
        # Stage 4: Initialize LLM and QA chain
        time.sleep(1)
        
        # Check if OpenAI API key is set
        if not os.getenv('OPENAI_API_KEY'):
            return jsonify({'error': 'OpenAI API key not found. Please set OPENAI_API_KEY environment variable.'}), 400
        
        llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
        retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
        
        qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",
            retriever=retriever
        )
        
        processing_status.update({
            'stage': 'ready',
            'progress': 100,
            'message': 'RAG system ready! You can now ask questions.',
            'system_ready': True
        })
        
        return jsonify({
            'success': True, 
            'filename': os.path.basename(filepath),
            'status': processing_status,
            'auto_processed': True
        })
        
    except Exception as e:
        processing_status.update({
            'stage': 'error',
            'progress': 0,
            'message': f'Error processing document: {str(e)}'
        })
        return jsonify({'error': str(e)}), 500

@app.route('/process_document', methods=['POST'])
def process_document():
    """Legacy endpoint for manual processing"""
    global qa_chain, processing_status
    
    if 'uploaded_file' not in session:
        return jsonify({'error': 'No file uploaded'}), 400
    
    filepath = session['uploaded_file']
    return process_document_internal(filepath)

@app.route('/get_status')
def get_status():
    return jsonify(processing_status)

@app.route('/ask_question', methods=['POST'])
def ask_question():
    global qa_chain
    
    if qa_chain is None:
        return jsonify({'error': 'Please process a document first'}), 400
    
    data = request.get_json()
    question = data.get('question', '').strip()
    
    if not question:
        return jsonify({'error': 'Please enter a question'}), 400
    
    try:
        # Simulate query processing stages for animation
        query_status = {
            'stage': 'processing_query',
            'message': 'Processing your question...'
        }
        
        # Stage 1: Query processing
        time.sleep(0.5)
        query_status.update({
            'stage': 'retrieving',
            'message': 'Searching for relevant document chunks...'
        })
        
        # Stage 2: Retrieval
        time.sleep(1)
        query_status.update({
            'stage': 'generating',
            'message': 'Generating answer using AI...'
        })
        
        # Stage 3: Generation
        response = qa_chain.invoke(question)
        
        query_status.update({
            'stage': 'complete',
            'message': 'Answer generated successfully!',
            'answer': response['result']
        })
        
        # Get document statistics
        document_stats = {
            'chunks_count': processing_status.get('chunks_count', 0),
            'pages_count': processing_status.get('pages_count', 0),
            'retrieval_count': 3  # Number of chunks retrieved for this query
        }
        
        return jsonify({
            'success': True,
            'answer': response['result'],
            'question': question,
            'status': query_status,
            'document_stats': document_stats
        })
        
    except Exception as e:
        return jsonify({'error': f'Error processing question: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True)