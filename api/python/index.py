from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import tempfile
from markitdown import MarkItDown
import logging
import traceback

logging.basicConfig(level=logging.ERROR)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

@app.route("/api/python/hello")
def hello_world():
    return "<p>Hello, World!</p>"

@app.route("/api/python/convert", methods=['POST'])
def convert():
    try:
        if 'file' not in request.files:
            return jsonify({
                "success": False,
                "markdown": None,
                "error": "No file provided"
            }), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({
                "success": False,
                "markdown": None,
                "error": "No file selected"
            }), 400

        with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
            file.save(tmp_file)
            tmp_path = tmp_file.name

        try:
            converter = MarkItDown()
            markdown = converter.convert(tmp_path)

            return jsonify({
                "success": True,
                "markdown": markdown.text_content,
                "error": None
            }), 200

        finally:
            os.unlink(tmp_path)

    except Exception as e:
        logger.error(f"Conversion error: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            "success": False,
            "markdown": None,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True)
