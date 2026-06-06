FROM python:3.12-slim
WORKDIR /srv
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY schema.sql .
COPY app ./app
EXPOSE 4200
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "4200"]
