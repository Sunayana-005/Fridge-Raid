FROM ubuntu:22.04
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
CMD ["uvicorn", "backend:app", "--host", "0.0.0.0", "--port", "8000"]