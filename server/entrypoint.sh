#!/bin/sh

# Wait for postgres if needed (optional, but good practice if not using depends_on condition)
# But for now, just migrations and start

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Applying database migrations..."
python manage.py migrate

echo "Starting server..."
# Using exec to replace shell with gunicorn process
exec gunicorn core.wsgi:application --bind 0.0.0.0:8000
