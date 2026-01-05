#!/bin/sh

# Wait for postgres to be ready
echo "Waiting for PostgreSQL to start..."
while ! nc -z $DATABASE_HOST $DATABASE_PORT; do
  sleep 0.1
done
echo "PostgreSQL started"

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Applying database migrations..."
python manage.py migrate

echo "Starting server..."
# Using exec to replace shell with gunicorn process
exec gunicorn core.wsgi:application --bind 0.0.0.0:8000
