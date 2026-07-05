FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

# Train model at build time (requires TMDB_API_KEY build arg)
ARG TMDB_API_KEY
ENV TMDB_API_KEY=$TMDB_API_KEY
RUN python train.py || echo "⚠️  Training skipped (no API key at build time). Mount a pre-trained model."

EXPOSE 8000
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
