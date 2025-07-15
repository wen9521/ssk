# ai_generator/generate_level.py
import os
import sys
import json
import random
import boto3
from PIL import Image, ImageDraw

# --- Configuration ---
# These will be set as environment variables in the GitHub Action
CF_ACCOUNT_ID = os.environ.get("CF_ACCOUNT_ID")
CF_ACCESS_KEY_ID = os.environ.get("CF_ACCESS_KEY_ID")
CF_SECRET_ACCESS_KEY = os.environ.get("CF_SECRET_ACCESS_KEY")
CF_BUCKET_NAME = os.environ.get("CF_BUCKET_NAME")
CF_PUBLIC_URL = f"https://{CF_BUCKET_NAME}.{CF_ACCOUNT_ID}.r2.cloudflarestorage.com"

# S3-compatible client for Cloudflare R2
s3 = boto3.client(
    service_name='s3',
    endpoint_url=f'https://{CF_ACCOUNT_ID}.r2.cloudflarestorage.com',
    aws_access_key_id=CF_ACCESS_KEY_ID,
    aws_secret_access_key=CF_SECRET_ACCESS_KEY,
    region_name='auto',
)

# --- Image Modification Functions ---

def add_small_shape(draw, max_width, max_height):
    """Adds a small, semi-transparent shape to the image."""
    x = random.randint(50, max_width - 50)
    y = random.randint(50, max_height - 50)
    radius = random.randint(5, 15)
    color = (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255), 100)
    draw.ellipse((x-radius, y-radius, x+radius, y+radius), fill=color)
    return {"type": "add_shape", "x": x, "y": y, "radius": radius * 2}

def change_color_area(image, draw, max_width, max_height):
    """Changes the hue of a small area."""
    x = random.randint(50, max_width - 50)
    y = random.randint(50, max_height - 50)
    radius = random.randint(20, 40)
    
    # This is a simplified color change, a more advanced one would be better
    draw.rectangle((x-radius, y-radius, x+radius, y+radius), fill=(random.randint(0,50), 0, 0, 30))
    return {"type": "color_change", "x": x, "y": y, "radius": radius}

def remove_small_detail(image, draw, max_width, max_height):
    """Clones a nearby area to cover up a small detail."""
    x = random.randint(100, max_width - 100)
    y = random.randint(100, max_height - 100)
    radius = random.randint(10, 20)
    
    # Clone from just above
    source_box = (x - radius, y - radius - (radius*2), x + radius, y - radius)
    region = image.crop(source_box)
    
    # Paste over the original spot
    image.paste(region, (x - radius, y - radius))
    return {"type": "removal", "x": x, "y": y, "radius": radius * 1.5}

# --- Main Logic ---

def generate_differences(original_image_path):
    """
    Creates a modified version of an image with several differences and
    returns the details of those differences.
    """
    with Image.open(original_image_path).convert("RGBA") as img:
        modified_img = img.copy()
        draw = ImageDraw.Draw(modified_img)
        width, height = img.size
        
        differences = []
        num_diffs = random.randint(3, 5)
        
        modification_functions = [add_small_shape, change_color_area, remove_small_detail]
        
        for _ in range(num_diffs):
            func = random.choice(modification_functions)
            if func == remove_small_detail:
                diff = func(modified_img, draw, width, height)
            else:
                diff = func(draw, width, height)
            differences.append(diff)
            
        modified_image_path = "modified.png"
        modified_img.save(modified_image_path, "PNG")
        
        return modified_image_path, differences

def upload_to_r2(local_path, remote_name):
    """Uploads a file to Cloudflare R2 and returns its public URL."""
    s3.upload_file(local_path, CF_BUCKET_NAME, remote_name, ExtraArgs={'ContentType': 'image/png'})
    return f"{CF_PUBLIC_URL}/{remote_name}"

def update_levels_json(new_level_data):
    """Downloads, updates, and re-uploads the levels.json file."""
    try:
        response = s3.get_object(Bucket=CF_BUCKET_NAME, Key='levels.json')
        levels = json.loads(response['Body'].read())
    except s3.exceptions.NoSuchKey:
        print("levels.json not found, creating a new one.")
        levels = []
    
    levels.append(new_level_data)
    
    new_json_content = json.dumps(levels, indent=4)
    s3.put_object(
        Bucket=CF_BUCKET_NAME,
        Key='levels.json',
        Body=new_json_content,
        ContentType='application/json'
    )
    print("levels.json updated successfully.")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python generate_level.py <path_to_original_image>")
        sys.exit(1)
        
    original_path = sys.argv[1]
    base_name = os.path.splitext(os.path.basename(original_path))[0]
    
    print(f"Processing {original_path}...")
    
    # 1. Generate differences and the modified image
    modified_path, differences = generate_differences(original_path)
    
    # 2. Upload both images to R2
    original_url = upload_to_r2(original_path, f"images/{base_name}_orig.png")
    modified_url = upload_to_r2(modified_path, f"images/{base_name}_mod.png")
    
    print(f"Uploaded original to: {original_url}")
    print(f"Uploaded modified to: {modified_url}")
    
    # 3. Create the new level data structure
    new_level = {
        "id": base_name,
        "original": original_url,
        "modified": modified_url,
        "differences": differences
    }
    
    # 4. Update the central levels.json
    update_levels_json(new_level)
    
    print("Level generation complete.")
