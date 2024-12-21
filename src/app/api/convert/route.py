from http.server import BaseHTTPRequestHandler
import json
import os
import tempfile
from urllib.request import urlopen
from markitdown import convert_to_markdown

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        # Read the request body
        content_length = int(self.headers['Content-Length'])
        body = self.rfile.read(content_length)
        data = json.loads(body)
        
        file_url = data.get('fileUrl')
        if not file_url:
            self.send_error(400, "No file URL provided")
            return

        try:
            # Download the file
            response = urlopen(file_url)
            
            # Create a temporary file
            with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
                tmp_file.write(response.read())
                tmp_path = tmp_file.name

            try:
                # Convert the file
                markdown = convert_to_markdown(tmp_path)
                
                # Send response
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "success": True,
                    "markdown": markdown,
                    "error": None
                }).encode('utf-8'))
                
            finally:
                # Clean up
                os.unlink(tmp_path)
                
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": False,
                "markdown": None,
                "error": str(e)
            }).encode('utf-8')) 