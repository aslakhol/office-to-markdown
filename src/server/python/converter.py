#!/usr/bin/env python3
import sys
import json
from pathlib import Path
from typing import Dict, Any
from markitdown import MarkItDown

def process_file(file_path: str) -> Dict[str, Any]:
    """
    Process a file and convert it to markdown using markitdown.
    
    Args:
        file_path: Path to the file to convert
        
    Returns:
        Dict containing the markdown content and metadata
    """
    try:
        # Initialize MarkItDown
        converter = MarkItDown()
        
        # Convert the file to markdown using the convert method
        result = converter.convert(file_path)
        
        # Get the markdown content from text_content attribute
        if hasattr(result, 'text_content'):
            return {
                "success": True,
                "markdown": result.text_content,
                "error": None
            }
        else:
            raise ValueError("Result object does not have text_content attribute")
            
    except Exception as e:
        print(f"Python error: {str(e)}", file=sys.stderr)
        return {
            "success": False,
            "markdown": None,
            "error": str(e)
        }

def main():
    """
    Main entry point. Expects a file path as the first argument.
    Returns JSON response to stdout.
    """
    if len(sys.argv) != 2:
        json.dump({
            "success": False,
            "markdown": None,
            "error": "Invalid number of arguments. Expected file path."
        }, sys.stdout)
        return

    file_path = sys.argv[1]
    
    if not Path(file_path).is_file():
        json.dump({
            "success": False,
            "markdown": None,
            "error": f"File not found: {file_path}"
        }, sys.stdout)
        return

    result = process_file(file_path)
    # Ensure stdout is flushed
    print(json.dumps(result), flush=True)

if __name__ == "__main__":
    main() 