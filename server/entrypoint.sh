#!/bin/sh

# Wait for postgres to be ready
echo "Waiting for PostgreSQL to start..."
while ! python -c "import socket, os; s = socket.socket(socket.AF_INET, socket.SOCK_STREAM); s.settimeout(1); exit(s.connect_ex((os.environ['DATABASE_HOST'], int(os.environ['DATABASE_PORT']))))"; do
  sleep 1
done
echo "PostgreSQL started"

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Applying database migrations..."
python manage.py makemigrations
python manage.py migrate

echo "Starting server..."
# Using exec to replace shell with gunicorn process
exec gunicorn core.wsgi:application --bind 0.0.0.0:8000
