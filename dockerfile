FROM ubuntu
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:$PORT"]