import ast
import multiprocessing
import importlib
import sys
import io
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)

ALLOWED_IMPORTS = {"numpy"}  # Define allowed modules

def restricted_import(name, globals=None, locals=None, fromlist=(), level=0):
    """Custom import function that only allows whitelisted modules."""
    if name in ALLOWED_IMPORTS:
        return importlib.import_module(name)
    raise ImportError(f"Import of module '{name}' is not allowed.")

def is_safe_code(source: str) -> bool:
    """Check if the provided Python source code is safe to execute."""
    try:
        tree = ast.parse(source)
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    if alias.name not in ALLOWED_IMPORTS:
                        return False  # Disallow non-whitelisted imports
            elif isinstance(node, ast.ImportFrom):
                if node.module not in ALLOWED_IMPORTS:
                    return False  # Disallow non-whitelisted imports
            elif isinstance(node, ast.Call):
                if isinstance(node.func, ast.Name) and node.func.id in {"exec", "eval", "compile", "open", "input"}:
                    return False  # Block dangerous functions
        return True
    except Exception as e:
        if isinstance(e, SyntaxError):
            raise e
        return False

def execute_safe_code(source: str, output_queue):
    """Runs the user code in a separate process and sends stdout back."""
    try:
        if not is_safe_code(source):
            output_queue.put(("Unsafe code detected!", 403))
            return
    except SyntaxError as e:
        output_queue.put((f"Syntax error: {e}", 400))
        return

    # Redirect stdout
    output_buffer = io.StringIO()
    sys.stdout = output_buffer

    # Restricted execution environment
    safe_globals = {
        "__builtins__": {
            "print": print,  # Allow print
            "range": range,
            "len": len,
            "min": min,
            "max": max,
            "sum": sum,
            "int": int,
            "float": float,
            "str": str,
            "list": list,
            "tuple": tuple,
            "dict": dict,
            "set": set,
            "bool": bool,
            "abs": abs,
            "bin": bin,
            "hex": hex,
            "oct": oct,
            "ord": ord,
            "chr": chr,
            "divmod": divmod,
            "pow": pow,
            "round": round,
            "sorted": sorted,
            "reversed": reversed,
            "zip": zip,
            "enumerate": enumerate,
            "filter": filter,
            "map": map,
            "__import__": restricted_import  # Safe import function
        }
    }

    try:
        exec(source, safe_globals)
    except Exception as e:
        output_queue.put((f"Error during execution: {e}", 400))
        return
    finally:
        sys.stdout = sys.__stdout__  # Restore stdout

    # Send the output back
    output_queue.put((output_buffer.getvalue().strip(), 200))

def execute_with_stdout(source: str, timeout: float = 2.0):
    """Runs code in a separate process with a time limit."""
    output_queue = multiprocessing.Queue()
    process = multiprocessing.Process(target=execute_safe_code, args=(source, output_queue))
    
    process.start()
    process.join(timeout)  # Wait for it to finish within the time limit

    if process.is_alive():
        process.terminate()  # Kill the process if it exceeds timeout
        process.join()
        return ("Execution timed out!", 402)

    return output_queue.get() if not output_queue.empty() else ""


CORS(app)  # Enable CORS for all routes

@app.route('/execute', methods=['POST'])
def execute_code():
    """Endpoint to execute Python code received in the POST request body."""
    try:
        code = request.data.decode('utf-8')  # Get the Python code from the request body as plain text
        if not code:
            return jsonify({"error": "No code provided"}), 400
        
        # Execute the code and capture the output
        output = execute_with_stdout(code, timeout=2.0)

        return jsonify({"output": output[0] or ""}), output[1] if len(output) > 1 else 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 400

def run():
    app.run(host='0.0.0.0', debug=False)

if __name__ == '__main__':
    run()
