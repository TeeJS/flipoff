# ---- Stage 1: Build dependencies ----
FROM python:3.13-alpine AS builder

RUN apk add --no-cache gcc musl-dev

COPY requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir --prefix=/install -r /tmp/requirements.txt

# ---- Stage 2: Runtime ----
FROM python:3.13-alpine

COPY --from=builder /install /usr/local

RUN adduser -D -u 1000 flipoff

WORKDIR /app

COPY server.py .
COPY index.html .
COPY admin.html .
COPY css/ css/
COPY js/ js/
COPY plugins/ plugins/

RUN mkdir -p /home/flipoff/.flipoff \
    && chown -R flipoff:flipoff /home/flipoff/.flipoff

USER flipoff

EXPOSE 8080
VOLUME ["/home/flipoff/.flipoff"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO /dev/null http://localhost:${PORT:-8080}/ || exit 1

STOPSIGNAL SIGTERM

CMD ["python", "server.py"]
