# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose the port the app runs on (default is 5000 for Flask)
EXPOSE 5000

# Define environment variable for Flask app
ENV FLASK_APP=main.py

# Run the Flask app
CMD ["python", "main.py"]