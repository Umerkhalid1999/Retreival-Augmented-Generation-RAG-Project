#!/usr/bin/env python3
"""
Demo Runner for Animated RAG Pipeline
"""
import os
import sys
import subprocess
from pathlib import Path

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        return False
    print(f"✅ Python {sys.version.split()[0]} detected")
    return True

def check_openai_key():
    """Check if OpenAI API key is set"""
    if not os.getenv('OPENAI_API_KEY'):
        print("⚠️  WARNING: OPENAI_API_KEY environment variable not set")
        print("   The application will not work without an OpenAI API key")
        print("   Set it with: set OPENAI_API_KEY=your_key_here")
        return False
    print("✅ OpenAI API key detected")
    return True

def install_requirements():
    """Install required packages"""
    print("📦 Installing requirements...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], 
                      check=True, capture_output=True)
        print("✅ Requirements installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install requirements: {e}")
        return False

def create_directories():
    """Create necessary directories"""
    directories = ['uploads', 'templates', 'static/css', 'static/js']
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
    print("✅ Directories created")

def run_application():
    """Run the Flask application"""
    print("\n🚀 Starting Animated RAG Pipeline Demo...")
    print("   Open your browser and go to: http://localhost:5000")
    print("   Press Ctrl+C to stop the application\n")
    
    try:
        subprocess.run([sys.executable, "app.py"])
    except KeyboardInterrupt:
        print("\n👋 Application stopped")

def main():
    print("🎯 Animated RAG Pipeline - Demo Setup")
    print("=" * 50)
    
    # Check prerequisites
    if not check_python_version():
        return
    
    # Create directories
    create_directories()
    
    # Install requirements
    if not install_requirements():
        return
    
    # Check API key
    has_key = check_openai_key()
    
    print("\n" + "=" * 50)
    print("🎉 Setup Complete!")
    
    if not has_key:
        print("\n⚠️  IMPORTANT: Set your OpenAI API key before running:")
        print("   Windows: set OPENAI_API_KEY=your_key_here")
        print("   Mac/Linux: export OPENAI_API_KEY=your_key_here")
        print("\n   Then run: python app.py")
    else:
        response = input("\nStart the demo now? (y/n): ")
        if response.lower() in ['y', 'yes']:
            run_application()

if __name__ == "__main__":
    main()