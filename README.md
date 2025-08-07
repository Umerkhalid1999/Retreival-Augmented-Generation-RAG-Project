# Animated RAG Pipeline - Portfolio Demo

An interactive Flask web application that visualizes the Retrieval Augmented Generation (RAG) pipeline with beautiful animations. Perfect for demonstrating your understanding of RAG systems to potential clients on Upwork!

## 🚀 Features

- **Interactive Document Upload**: Upload PDF documents through a clean web interface
- **Animated Pipeline Visualization**: Watch the RAG pipeline process your document step-by-step
- **Real-time Progress Tracking**: See progress bars and animations for each stage
- **Question Answering**: Ask questions and see the retrieval and generation process animated
- **Beautiful UI**: Modern, responsive design with smooth animations
- **Educational**: Perfect for explaining RAG concepts to clients

## 🎯 RAG Pipeline Stages Visualized

### Document Processing
1. **Document Loading** - PDF parsing and text extraction
2. **Text Chunking** - Splitting text into manageable pieces
3. **Embedding Creation** - Converting text to vector representations
4. **Vector Store** - Building searchable index

### Query Processing
1. **Query Processing** - Understanding the user's question
2. **Document Retrieval** - Finding relevant text chunks
3. **Answer Generation** - AI-powered response creation

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.8+
- OpenAI API Key

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd RAG-Systems
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Mac/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   # Windows
   set OPENAI_API_KEY=your_openai_api_key_here
   
   # Mac/Linux
   export OPENAI_API_KEY=your_openai_api_key_here
   ```

5. **Run the application**
   ```bash
   python app.py
   ```

6. **Open your browser**
   ```
   http://localhost:5000
   ```

## 📖 How to Use

1. **Upload a PDF**: Click "Choose File" and select a PDF document
2. **Process Document**: Click "Process Document" and watch the pipeline animation
3. **Ask Questions**: Once processing is complete, type your question and click "Ask Question"
4. **Watch the Magic**: See the query pipeline animate as it finds and generates your answer

## 🎨 Visual Features

- **Smooth Animations**: CSS animations for each pipeline stage
- **Progress Bars**: Real-time progress tracking
- **Color-coded States**: Visual feedback for active, completed, and error states
- **Responsive Design**: Works on desktop and mobile devices
- **Interactive Elements**: Hover effects and smooth transitions

## 🔧 Technical Details

- **Backend**: Flask with LangChain for RAG implementation
- **Frontend**: Bootstrap 5 with custom CSS animations
- **Embeddings**: HuggingFace BGE model (free alternative to OpenAI)
- **Vector Store**: ChromaDB for similarity search
- **LLM**: OpenAI GPT-3.5-turbo for answer generation

## 💼 Portfolio Impact

This project demonstrates:
- **Technical Expertise**: Knowledge of RAG, LLMs, and web development
- **Visual Communication**: Ability to explain complex concepts through animation
- **Full-Stack Skills**: Backend AI integration with frontend visualization
- **User Experience**: Clean, intuitive interface design
- **Industry Knowledge**: Understanding of modern AI/ML workflows

## 🎯 Perfect For

- **Upwork Portfolio**: Show clients you understand AI systems
- **Client Demos**: Explain RAG concepts visually
- **Educational Content**: Teaching tool for RAG workflows
- **Proof of Concept**: Demonstrate technical capabilities

## 🚀 Customization Ideas

- Add different embedding models
- Support multiple document formats
- Implement chat history
- Add document comparison features
- Create custom themes
- Add export functionality

## 📝 License

This project is open source and available under the MIT License.

---

**Ready to impress your clients with this animated RAG demo? Star this repo and add it to your portfolio!** ⭐