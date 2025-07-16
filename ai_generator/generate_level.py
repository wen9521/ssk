
import os
import sys
import json
import random
import boto3
from PIL import Image, ImageDraw

# --- Configuration from Environment Variables (GitHub Secrets) ---
try:
    S3_ENDPOINT_URL = os.environ['R2_ENDPOINT_URL']
    S3_ACCESS_KEY = os.environ['R2_ACCESS_KEY_ID']
    S3_SECRET_KEY = os.environ['R2_SECRET_KEY']
    S3_BUCKET_NAME = os.environ['R2_BUCKET_NAME']
    CF_PUBLIC_URL = os.environ['R2_PUBLIC_URL']
except KeyError as e:
    print(f"Error: Missing environment variable {e}. Please set it in GitHub Secrets.")
    sys.exit(1)

# Source directory for original images
SOURCE_IMAGE_DIR = "images_for_ai"

# --- S3 Client for Cloudflare R2 ---
s3 = boto3.client(
    service_name='s3',
    endpoint_url=S3_ENDPOINT_URL,
    aws_access_key_id=S3_ACCESS_KEY,
    aws_secret_access_key=S3_SECRET_KEY,
    region_name='auto',
)

# --- Image Modification Functions ---
def add_small_shape(draw, width, height):
    x = random.randint(int(width * 0.1), int(width * 0.9))
    y = random.randint(int(height * 0.1), int(height * 0.9))
    radius = random.randint(10, 25)
    color = (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255), 150)
    draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=color)
    return {"type": "add_shape", "x": x, "y": y, "radius": radius}

def remove_small_detail(image, width, height):
    x = random.randint(int(width * 0.2), int(width * 0.8))
    y = random.randint(int(height * 0.2), int(height * 0.8))
    radius = random.randint(15, 35)
    source_x = x + random.choice([-1, 1]) * radius * 3
    source_y = y + random.choice([-1, 1]) * radius * 3
    source_x = max(radius, min(source_x, width - radius))
    source_y = max(radius, min(source_y, height - radius))
    source_box = (source_x - radius, source_y - radius, source_x + radius, source_y + radius)
    region = image.crop(source_box)
    image.paste(region, (x - radius, y - radius))
    return {"type": "removal", "x": x, "y": y, "radius": radius}

# --- Main Logic ---

def upload_to_r2(local_path, remote_name):
    """Uploads a file to R2 and returns its public URL."""
    try:
        s3.upload_file(local_path, S3_BUCKET_NAME, remote_name, ExtraArgs={'ContentType': 'image/png'})
        public_url = f"{CF_PUBLIC_URL.rstrip('/')}/{remote_name}"
        print(f"  Successfully uploaded {local_path} to {public_url}")
        return public_url
    except Exception as e:
        print(f"  Error uploading {local_path}: {e}")
        return None

def main():
    """
    Processes all images, uploads them to R2, and creates a levels.json file.
    """
    print("Starting level generation process...")
    levels_data = []
    
    valid_extensions = ['.png', '.jpg', '.jpeg']
    try:
        source_files = [f for f in os.listdir(SOURCE_IMAGE_DIR) if os.path.splitext(f)[1].lower() in valid_extensions]
    except FileNotFoundError:
        print(f"Error: Source directory '{SOURCE_IMAGE_DIR}' not found.")
        sys.exit(1)

    if not source_files:
        print("No images found in the source directory. Exiting.")
        return

    print(f"Found {len(source_files)} images to process.")

    for filename in source_files:
        # This is the corrected, single-line print statement
        print(f"
Processing '{filename}'...")
        
        original_path = os.path.join(SOURCE_IMAGE_DIR, filename)
        base_name = os.path.splitext(filename)[0]

        try:
            with Image.open(original_path).convert("RGBA") as img:
                modified_img = img.copy()
                draw = ImageDraw.Draw(modified_img)
                width, height = img.size
                
                differences = []
                num_diffs = random.randint(4, 7)
                functions = [add_small_shape, remove_small_detail]
                
                for _ in range(num_diffs):
                    func = random.choice(functions)
                    if func == add_small_shape:
                        diff = func(draw, width, height)
                    else:
                        diff = func(modified_img, width, height)
                    differences.append(diff)
                
                modified_path = f"/tmp/{base_name}_modified.png"
                modified_img.save(modified_path, "PNG")

                remote_original_name = f"levels/{base_name}_original.png"
                remote_modified_name = f"levels/{base_name}_modified.png"
                
                original_url = upload_to_r2(original_path, remote_original_name)
                modified_url = upload_to_r2(modified_path, remote_modified_name)

                os.remove(modified_path)

                if not original_url or not modified_url:
                    print(f"Skipping level for '{filename}' due to upload error.")
                    continue

                levels_data.append({
                    "id": base_name.replace(" ", "_").lower(),
                    "name": base_name.replace("_", " ").title(),
                    "original": original_url,
                    "modified": modified_url,
                    "differences": differences
                })

        except Exception as e:
            print(f"Could not process image {filename}. Error: {e}")

    if levels_data:
        levels_json_path = "/tmp/levels.json"
        with open(levels_json_path, 'w') as f:
            json.dump(levels_data, f, indent=2)
        
        print("
Uploading final levels.json...")
        s3.upload_file(levels_json_path, S3_BUCKET_NAME, 'levels.json', ExtraArgs={'ContentType': 'application/json'})
        os.remove(levels_json_path)
        print("levels.json uploaded successfully.")
    else:
        print("
No levels were generated. Skipping levels.json upload.")

    print("
Level generation process complete.")

if __name__ == "__main__":
    main()
