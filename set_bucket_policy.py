import json
import subprocess
import sys

# Ensure boto3 is installed
try:
    import boto3
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "boto3"])
    import boto3

from botocore.client import Config

s3 = boto3.client(
    's3',
    endpoint_url='http://localhost:9000',
    aws_access_key_id='onde-s3-user',
    aws_secret_access_key='onde-s3-password',
    config=Config(signature_version='s3v4'),
    region_name='ap-northeast-2'
)

# Bucket policy for public read (download)
bucket_name = 'onde-local'
policy = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicRead",
            "Effect": "Allow",
            "Principal": "*",
            "Action": ["s3:GetObject"],
            "Resource": [f"arn:aws:s3:::{bucket_name}/*"]
        }
    ]
}

policy_string = json.dumps(policy)

try:
    print(f"Setting public policy for bucket {bucket_name}...")
    s3.put_bucket_policy(Bucket=bucket_name, Policy=policy_string)
    print("Bucket policy set successfully!")
except Exception as e:
    print(f"Error setting bucket policy: {e}")
