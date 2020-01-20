FROM python:3.7-alpine

# Set environment varibles
ENV PYTHONUNBUFFERED 1

RUN pip install --upgrade pip
RUN pip install django==2.2

COPY . /code/
WORKDIR /code/

RUN addgroup -S app && adduser -S app -G app
RUN chown -R app /code
USER app

ENV AUTOINSIGHT_BACKEND_HOST http://169.56.84.222:5001/api/

EXPOSE 8000
ENTRYPOINT ["python", "manage.py", "runserver", "0:8000"]
