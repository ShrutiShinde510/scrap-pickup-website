#!/bin/sh

# Wait for database to be ready using Python
echo "Waiting for PostgreSQL..."
python << END
import socket
import time
import sys

def wait_for_db():
    for i in range(30):
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            sock.connect(('db', 5432))
            sock.close()
            print("PostgreSQL is ready!")
            return True
        except:
            time.sleep(1)
    print("Timeout waiting for PostgreSQL")
    sys.exit(1)

wait_for_db()
END

# Run migrations
echo "Running database migrations..."
python manage.py migrate --noinput

# Start server
echo "Starting Django development server..."
python manage.py runserver 0.0.0.0:8000
