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

# --- Configuration ---
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
CLOUDFLARE_ACCOUNT_ID = os.environ.get('CLOUDFLARE_ACCOUNT_ID')
R2_BUCKET_NAME = os.environ.get('R2_BUCKET_NAME')
R2_ACCESS_KEY_ID = os.environ.get('R2_ACCESS_KEY_ID')
R2_SECRET_ACCESS_KEY = os.environ.get('R2_SECRET_ACCESS_KEY')
WORKER_URL = os.environ.get('WORKER_URL')
WORKER_SECRET_KEY = os.environ.get('WORKER_SECRET_KEY')

# --- Main Functions ---

def generate_creative_prompt_with_gemini():
    """Uses Gemini to generate a high-quality prompt for an image."""
    print("Generating a high-quality prompt with Gemini...")
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-1.5-flash-latest')
        
        theme = random.choice(['a beautiful woman', 'a stunning landscape'])
        style = random.choice(['photorealistic style', 'digital art', 'anime style', 'oil painting'])
        
        instruction = (
            f"Generate a short, SFW, visually-rich description for a 'spot the difference' game image. "
            f"The theme is '{theme}'. The style should be '{style}'. "
            f"Describe a single, clear scene with interesting details but avoid excessive complexity. "
            f"Example: A beautiful anime-style princess with long silver hair, standing in a moonlit forest. "
            f"Your turn:"
        )
        
        response = model.generate_content(instruction)
        
        # --- CORRECTED AND SIMPLIFIED STRING CLEANING ---
        clean_text = response.text
        clean_text = clean_text.strip()
        clean_text = clean_text.replace('*', '')
        clean_text = clean_text.replace('\n', ' ')
', ' ')
        
        print(f"Generated Prompt: {clean_text}")
        return clean_text
        
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return "A beautiful woman sitting by a window, enjoying a cup of coffee."

def create_placeholder_image(prompt_text):
    """Creates a more aesthetically pleasing placeholder image."""
    print("Creating a placeholder image...")
    width, height = 1024, 1024
    img = Image.new('RGB', (width, height), color = (25, 35, 60))
    d = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("arial.ttf", 35)
    except IOError:
        font = ImageFont.load_default()

    y_text = 50
    lines = [prompt_text[i:i+55] for i in range(0, len(prompt_text), 55)]
    for line in lines:
        d.text((50, y_text), line, font=font, fill=(255, 255, 255, 200))
        y_text += 50
    
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()

def create_difference(image_bytes):
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    modified_image = image.copy()
    x, y, r = random.randint(200,800), random.randint(200,800), random.randint(20,30)
    patch_source_x = x - 150 if x > 200 else x + 150
    patch = image.crop((patch_source_x, y, patch_source_x + (r*2), y + (r*2)))
    modified_image.paste(patch, (x, y))
    
    buffer = io.BytesIO()
    modified_image.save(buffer, format="PNG")
    return buffer.getvalue(), [{"x": x + r, "y": y + r, "radius": r}]

def upload_to_r2(data, object_name):
    endpoint_url = f"https://{CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com"
    r2_client = boto3.client('s3', endpoint_url=endpoint_url, aws_access_key_id=R2_ACCESS_KEY_ID, aws_secret_access_key=R2_SECRET_ACCESS_KEY, region_name='auto')
    r2_client.put_object(Bucket=R2_BUCKET_NAME, Key=object_name, Body=data, ContentType='image/png', ACL='public-read')
    print(f"Uploaded {object_name} to R2.")

def add_level_to_kv(level_id):
    headers = {'Content-Type': 'application/json', 'x-internal-api-key': WORKER_SECRET_KEY}
    payload = {'newLevelId': level_id}
    response = requests.post(WORKER_URL, headers=headers, json=payload, timeout=10)
    response.raise_for_status()
    print(f"Added level {level_id} to KV.")

def main():
    print("Cron Job Started: Generating new level.")
    level_id = str(uuid.uuid4())
    base_path = f"levels/{level_id}"
    try:
        prompt = generate_creative_prompt_with_gemini()
        original_bytes = create_placeholder_image(prompt)
        modified_bytes, differences = create_difference(original_bytes)
        metadata = json.dumps({"prompt": prompt, "differences": differences}).encode('utf-8')
        
        upload_to_r2(original_bytes, f"{base_path}/original.png")
        upload_to_r2(modified_bytes, f"{base_path}/modified.png")
        upload_to_r2(metadata, f"{base_path}/metadata.json")
        
        add_level_to_kv(level_id)
        print("Cron Job Finished Successfully.")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()
