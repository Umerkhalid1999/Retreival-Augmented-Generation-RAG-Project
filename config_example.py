# Configuration Example
# Copy this file to config.py and add your actual values

import os

# OpenAI Configuration
OPENAI_API_KEY = "your_openai_api_key_here"

# Flask Configuration
SECRET_KEY = "your_secret_key_here"
UPLOAD_FOLDER = "uploads"
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB

# RAG Configuration
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50
EMBEDDING_MODEL = "BAAI/bge-small-en-v1.5"
LLM_MODEL = "gpt-3.5-turbo"
RETRIEVAL_K = 3  # Number of chunks to retrieve

# How to use:
# 1. Copy this file to config.py
# 2. Replace the placeholder values with your actual configuration
# 3. The app will automatically load from config.py if it exists