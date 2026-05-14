import os
import uuid

import boto3
import requests
from botocore.config import Config
from dotenv import load_dotenv


load_dotenv()

AWS_REGION = os.getenv("AWS_REGION")
AWS_S3_BUCKET = os.getenv("AWS_S3_BUCKET")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")

# S3 클라이언트 생성
s3_client = boto3.client(
    "s3",
    region_name=AWS_REGION,
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    config=Config(signature_version="s3v4"),
)

# 테스트용 S3 경로
s3_key = f"profiles/test/{uuid.uuid4().hex}.txt"

# PUT 업로드용 URL 생성
put_url = s3_client.generate_presigned_url(
    ClientMethod="put_object",
    Params={
        "Bucket": AWS_S3_BUCKET,
        "Key": s3_key,
        "ContentType": "text/plain",
    },
    ExpiresIn=300,
    HttpMethod="PUT",
)

print("=== S3 Key ===")
print(s3_key)

print("\n=== PUT URL ===")
print(put_url)

# 업로드할 내용
content = b"hello studyquest s3"

# 실제 업로드 요청
response = requests.put(
    put_url,
    data=content,
    headers={
        "Content-Type": "text/plain",
    },
)

print("\n=== Upload Status ===")
print(response.status_code)

if response.status_code == 200:
    print("업로드 성공!")

    # 업로드 확인용 URL
    public_url = (
        f"https://{AWS_S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"
    )

    print("\n=== Uploaded File URL ===")
    print(public_url)

else:
    print("업로드 실패")
    print(response.text)