import os
import sys

# Add root folder to sys.path so app.py, ai_engine.py, etc. can be imported
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from app import app

# Vercel looks for the WSGI application object named 'app'
if __name__ == "__main__":
    app.run()
