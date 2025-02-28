# Simple Python Exec Container Demo

This project is a simple React application that allows you to execute Python code in a containerized environment. The application uses the Monaco Editor for code editing and communicates with a backend service to execute the Python code.

## Features

- Code editor with syntax highlighting and word wrap.
- Execute Python code and display the output.
- Highlight syntax errors and navigate to the error line in the editor.
- Save the code in local storage.

## Getting Started

### Prerequisites

- Node.js
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/raspbeep/python-exec-demo.git
cd python-exec-demo
```

2. Install the dependencies:

```bash
  yarn
```

### Running the Application

1. Start the development server:

```bash
  yarn dev
```

2. Open your browser and navigate to `http://localhost:3000`.

### Usage

1. Write or paste your Python code in the editor.
2. Click the "Submit" button to execute the code.
3. The output will be displayed in the output area below the editor.
4. If there is a syntax error, the editor will highlight the error line.

## Code Structure

- `src/App.tsx`: Main component of the application.
- `src/App.css`: Styles for the application.

## Execution environment

For development, local flask server can be started by `python container/main.py` after installing the requirements `pip install -r requirements.txt` and changing the fetch URL in App.tsx to `127.0.0.1:5000`. Otherwise, deployed container on Google Cloud Run can execute entered python code in a safe environment.

## Dependencies

- React
- Monaco Editor

## License

This project is licensed under the MIT License.
