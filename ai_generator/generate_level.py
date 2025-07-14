# ai_generator/generate_level.py
import os
import requests
import random
import io
import json
import uuid
import google.generativeai as genai
import boto3
from PIL import Image, ImageDraw, ImageFont

# --- Configuration from Render Environment Variables ---
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
# Cloudflare R2
CLOUDFLARE_ACCOUNT_ID = os.environ.get('CLOUDFLARE_ACCOUNT_ID')
R2_BUCKET_NAME = os.environ.get('R2_BUCKET_NAME')
R2_ACCESS_KEY_ID = os.environ.get('R2_ACCESS_KEY_ID')
R2_SECRET_ACCESS_KEY = os.environ.get('R2_SECRET_ACCESS_KEY')
R2_PUBLIC_URL = os.environ.get('R2_PUBLIC_URL') # Your R2 public bucket URL
# Cloudflare Worker
WORKER_URL = os.environ.get('WORKER_URL') # e.g., https://level-api-worker.yourname.workers.dev
WORKER_SECRET_KEY = os.environ.get('WORKER_SECRET_KEY')

# Configure Gemini client
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def generate_creative_prompt_with_gemini():
    """Uses Gemini Pro to generate a creative prompt for an image."""
    print("Generating a creative prompt with Gemini Pro...")
    try:
        # CORRECTED: Use the stable 'gemini-1.0-pro' model name
        model = genai.GenerativeModel('gemini-1.0-pro')
        
        response = model.generate_content(
            "Generate a short, visually rich, SFW (safe for work) description for a 'spot the difference' game image. "
            "Focus on a single character with interesting details. "
            "Example: A beautiful anime-style girl on a sunny beach, digital art. "
            "Another example: A female cyberpunk warrior in a rainy neon city. "
            "Now, your turn:"
        )
        prompt_text = response.text.strip().replace("*", "") # Clean up markdown
        print(f"Generated Prompt: {prompt_text}")
        return prompt_text
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return "A cute cat wearing a wizard hat." # Fallback prompt

def create_placeholder_image(prompt_text):
    """Creates a placeholder image with the given text."""
    print("Creating a placeholder image...")
    img = Image.new('RGB', (1024, 1024), color = (73, 109, 137))
    d = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("arial.ttf", 40)
    except IOError:
        font = ImageFont.load_default()
    d.text((50,50), "Image Placeholder", font=font, fill=(255,255,0))
    y_text = 150
    lines = [prompt_text[i:i+50] for i in range(0, len(prompt_text), 50)]
    for line in lines:
        d.text((50, y_text), line, font=font, fill=(255, 255, 255))
        y_text += 50
    
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()

def create_difference(image_bytes):
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    modified_image = image.copy()
    draw = ImageDraw.Draw(modified_image)
    x, y, r = random.randint(200,800), random.randint(200,800), random.randint(20,30)
    draw.ellipse((x-r, y-r, x+r, y+r), fill=(73, 109, 137))
    
    buffer = io.BytesIO()
    modified_image.save(buffer, format="PNG")
    return buffer.getvalue(), [{"x": x, "y": y, "radius": r}]

def upload_to_r2(data, object_name, content_type):
    # Construct the correct endpoint URL using the Account ID
    endpoint_url = f"https://{CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com"
    print(f"Attempting to upload to endpoint: {endpoint_url}")
    
    r2_client = boto3.client(
        service_name='s3',
        endpoint_url=endpoint_url,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        region_name='auto',
    )
    r2_client.put_object(Bucket=R2_BUCKET_NAME, Key=object_name, Body=data, ContentType=content_type, ACL='public-read')
    print(f"Uploaded {object_name} to R2 bucket {R2_BUCKET_NAME}.")

def add_level_to_kv(level_id):
    headers = {'Content-Type': 'application/json', 'x-internal-api-key': WORKER_SECRET_KEY}
    payload = {'newLevelId': level_id}
    response = requests.post(f"{WORKER_URL}/levels", headers=headers, json=payload, timeout=10)
    response.raise_for_status()
    print(f"Successfully added level {level_id} to KV via worker.")

def main():
    print("Cron Job Started: Using Gemini to generate level concept.")
    level_id = str(uuid.uuid4())
    base_path = f"levels/{level_id}"
    
    try:
        creative_prompt = generate_creative_prompt_with_gemini()
        original_bytes = create_placeholder_image(creative_prompt)
        modified_bytes, differences = create_difference(original_bytes)
        metadata = json.dumps({"prompt": creative_prompt, "differences": differences}).encode('utf-8')
        
        upload_to_r2(original_bytes, f"{base_path}/original.png", 'image/png')
        upload_to_r2(modified_bytes, f"{base_path}/modified.png", 'image/png')
        upload_to_r2(metadata, f"{base_path}/metadata.json", 'application/json')
        
        add_level_to_kv(level_id)

        print("Cron Job Finished Successfully.")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()
