# ai_generator/generate_level.py
import os
import sys
import json
import random
import boto3
from PIL import Image, ImageDraw

# --- Configuration ---
# These will be set as environment variables in the Render service
S3_ENDPOINT_URL = os.environ.get("S3_ENDPOINT_URL") # e.g., https://<account_id>.r2.cloudflarestorage.com
S3_ACCESS_KEY = os.environ.get("S3_ACCESS_KEY")
S3_SECRET_KEY = os.environ.get("S3_SECRET_KEY")
S3_BUCKET_NAME = os.environ.get("S3_BUCKET_NAME")

# The public URL of your R2 bucket. Update this if you have a custom domain.
# This should be the same URL used by your frontend application.
CF_PUBLIC_URL = "https://pub-5a0d7fbdb4e94d9db5d2a074b6e346e4.r2.dev"


# S3-compatible client for Cloudflare R2
s3 = boto3.client(
    service_name='s3',
    endpoint_url=S3_ENDPOINT_URL,
    aws_access_key_id=S3_ACCESS_KEY,
    aws_secret_access_key=S3_SECRET_KEY,
    region_name='auto', # This can be 'auto' or a specific region
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
    try:
        s3.upload_file(local_path, S3_BUCKET_NAME, remote_name, ExtraArgs={'ContentType': 'image/png'})
        public_url = f"{CF_PUBLIC_URL}/{remote_name}"
        print(f"Successfully uploaded {local_path} to {public_url}")
        return public_url
    except Exception as e:
        print(f"Error uploading {local_path}: {e}")
        sys.exit(1)


def update_levels_json(new_level_data):
    """Downloads, updates, and re-uploads the levels.json file."""
    levels_key = 'levels.json'
    try:
        response = s3.get_object(Bucket=S3_BUCKET_NAME, Key=levels_key)
        levels = json.loads(response['Body'].read())
    except s3.exceptions.NoSuchKey:
        print(f"{levels_key} not found, creating a new one.")
        levels = []
    except Exception as e:
        print(f"Error downloading {levels_key}: {e}")
        sys.exit(1)

    levels.append(new_level_data)
    
    try:
        new_json_content = json.dumps(levels, indent=4)
        s3.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=levels_key,
            Body=new_json_content,
            ContentType='application/json'
        )
        print(f"{levels_key} updated successfully.")
    except Exception as e:
        print(f"Error uploading {levels_key}: {e}")
        sys.exit(1)


if __name__ == "__main__":
    # The cron job on Render will pass the path to the image.
    # We'll use a default for local testing.
    # In production, the startCommand will be like: "python generate_level.py ./images_for_ai/image1.png"
    if len(sys.argv) < 2:
        # Use a default image for testing if none is provided
        print("Usage: python generate_level.py <path_to_original_image>")
        print("Using default image: ../images_for_ai/image1.png")
        original_path = "../images_for_ai/image1.png"
    else:
        original_path = sys.argv[1]

    if not os.path.exists(original_path):
        print(f"Error: Original image not found at {original_path}")
        sys.exit(1)

    base_name = os.path.splitext(os.path.basename(original_path))[0]
    
    print(f"Processing {original_path}...")
    
    # 1. Generate differences and the modified image
    modified_path, differences = generate_differences(original_path)
    
    # 2. Upload both images to R2
    original_url = upload_to_r2(original_path, f"{base_name}_original.png")
    modified_url = upload_to_r2(modified_path, f"{base_name}_modified.png")
    
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

    # 5. Clean up local modified file
    os.remove(modified_path)
    
    print("Level generation complete.")
