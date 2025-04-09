#!/bin/bash
set -e

sessionName='mediatoad'
minioScriptName='start-minio-tmp.sh'
environment='development'
minioContainerName='minio'
minioRootUser='admin'
minioRootPassword='admin123'

echo "Starting MinIO..."
export NODE_ENV="${environment}"
echo "NODE_ENV=${environment}"

# Check if MinIO is already running
if [ -z "$(docker ps -q -f name=${minioContainerName})" ]; then
  echo "Starting MinIO Docker container..."
  docker run -d --name ${minioContainerName} \
    -p 9000:9000 -p 9001:9001 \
    -e "MINIO_ROOT_USER=${minioRootUser}" \
    -e "MINIO_ROOT_PASSWORD=${minioRootPassword}" \
    minio/minio server /data --console-address ":9001"
fi

# Wait until MinIO is ready
for i in {1..10}; do
  if curl -fs http://localhost:9000/minio/health/ready > /dev/null; then
    break
  fi
  echo "Waiting for MinIO to be ready..."
  sleep 2
done

export AWS_ACCESS_KEY_ID="${minioRootUser}"
export AWS_SECRET_ACCESS_KEY="${minioRootPassword}"
export S3_ENDPOINT_URL="http://localhost:9000"
export AWS_REGION="us-east-1"

docker exec ${minioContainerName} mc alias set myminio http://localhost:9000 ${minioRootUser} ${minioRootPassword} || true
docker exec ${minioContainerName} mc mb myminio/media-bucket --ignore-existing || true

echo "MinIO ready. Logs below:"
docker logs -f ${minioContainerName}
