# ai_generator/generate_level.py
# This script runs on a schedule to generate "Spot the Difference" game levels.
# It creates a pair of images and a metadata file, then uploads them to a cloud storage bucket.

import os
import random
import io
import json
import uuid
import openai
import boto3
from PIL import Image, ImageDraw
from botocore.exceptions import NoCredentialsError

# --- Configuration loaded from Render's Environment Variables ---
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
S3_BUCKET_NAME = os.environ.get('S3_BUCKET_NAME')
S3_ACCESS_KEY = os.environ.get('S3_ACCESS_KEY')
S3_SECRET_KEY = os.environ.get('S3_SECRET_KEY')
S3_ENDPOINT_URL = os.environ.get('S3_ENDPOINT_URL') # e.g., https://<region>.digitaloceanspaces.com for DigitalOcean

# Configure OpenAI client
if OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY

def generate_image_with_dalle(prompt):
    """Generates an image using DALL-E 3 and returns its content in bytes."""
    print(f"Generating image with prompt: {prompt}")
    try:
        response = openai.Image.create(
            model="dall-e-3",
            prompt=prompt,
            n=1,
            size="1024x1024",
            response_format="b64_json"
        )
        import base64
        image_data = base64.b64decode(response['data'][0]['b64_json'])
        return image_data
    except Exception as e:
        print(f"Error calling DALL-E API: {e}")
        raise

def create_difference(image_bytes):
    """Creates a difference on the image and returns the modified image and difference data."""
    original_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    modified_image = original_image.copy()
    draw = ImageDraw.Draw(modified_image)
    
    x = random.randint(200, 800)
    y = random.randint(200, 800)
    radius = random.randint(25, 35)
    
    # Example logic: copy a patch from another part of the image to cover a spot
    patch_source_x = x - 150 if x > 200 else x + 150
    patch = original_image.crop((patch_source_x, y, patch_source_x + (radius*2), y + (radius*2)))
    modified_image.paste(patch, (x, y))
    
    print(f"Created a difference at (x={x}, y={y}) with radius={radius}")
    
    buffer = io.BytesIO()
    modified_image.save(buffer, format="PNG")
    modified_bytes = buffer.getvalue()
    
    difference_data = [{"x": x + radius, "y": y + radius, "radius": radius}]
    return modified_bytes, difference_data

def upload_to_storage(data, bucket, object_name, content_type='image/png'):
    """Uploads data to an S3-compatible storage and returns the public URL."""
    s3_client = boto3.client(
        's3',
        endpoint_url=S3_ENDPOINT_URL,
        aws_access_key_id=S3_ACCESS_KEY,
        aws_secret_access_key=S3_SECRET_KEY
    )
    try:
        s3_client.put_object(Body=data, Bucket=bucket, Key=object_name, ContentType=content_type, ACL='public-read')
        # Construct the URL. This format may vary based on your S3 provider.
        url = f"{S3_ENDPOINT_URL}/{bucket}/{object_name}"
        print(f"Successfully uploaded: {url}")
        return url
    except Exception as e:
        print(f"Storage upload failed: {e}")
        return None

def main():
    """Main function for the cron job."""
    print("Cron Job Started: Generating a new level and uploading to storage.")
    
    if not all([OPENAI_API_KEY, S3_BUCKET_NAME, S3_ACCESS_KEY, S3_SECRET_KEY, S3_ENDPOINT_URL]):
        print("Error: Missing one or more required environment variables.")
        return

    prompts = [
        "A beautiful anime-style girl on a sunny beach, digital art",
        "A female cyberpunk warrior in a rainy neon city, detailed illustration",
        "A classic portrait of a woman reading in a garden, oil painting style",
        "A female astronaut on the moon, with Earth in the background, realistic"
    ]
    prompt = random.choice(prompts)
    
    try:
        # 1. Generate original image
        original_image_bytes = generate_image_with_dalle(prompt)
        
        # 2. Create modified image and get difference data
        modified_image_bytes, differences = create_difference(original_image_bytes)
        
        # 3. Prepare metadata and folder structure
        level_id = str(uuid.uuid4())
        base_path = f"spot-the-difference/{level_id}"
        
        metadata = {
            "level_id": level_id,
            "prompt": prompt,
            "differences": differences,
            "original_image": "original.png",
            "modified_image": "modified.png"
        }
        metadata_bytes = json.dumps(metadata, indent=2).encode('utf-8')

        # 4. Upload all assets to the cloud storage
        print(f"Uploading assets for level {level_id} to folder {base_path}...")
        upload_to_storage(original_image_bytes, S3_BUCKET_NAME, f"{base_path}/original.png")
        upload_to_storage(modified_image_bytes, S3_BUCKET_NAME, f"{base_path}/modified.png")
        upload_to_storage(metadata_bytes, S3_BUCKET_NAME, f"{base_path}/metadata.json", content_type='application/json')
        
        print(f"Successfully created and uploaded level {level_id}.")
        print("Cron Job Finished Successfully.")
        
    except Exception as e:
        print(f"An error occurred in the main process: {e}")

if __name__ == "__main__":
    main()
