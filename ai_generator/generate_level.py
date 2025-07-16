
import os
import json
import random
from PIL import Image, ImageDraw, ImageFilter

# --- Configuration ---
SOURCE_IMAGE_DIR = "images_for_ai"
OUTPUT_DIR = "frontend/public/generated_levels"
LEVELS_JSON_FILE = os.path.join(OUTPUT_DIR, "levels.json")

# --- Ensure output directory exists ---
os.makedirs(OUTPUT_DIR, exist_ok=True)

# --- Image Modification Functions ---

def add_small_shape(draw, width, height):
    """Adds a small, semi-transparent shape to the image."""
    x = random.randint(int(width * 0.1), int(width * 0.9))
    y = random.randint(int(height * 0.1), int(height * 0.9))
    radius = random.randint(8, 20)
    color = (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255), 128)
    draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=color)
    return {"type": "add_shape", "x": x, "y": y, "radius": radius, "details": "A small shape was added."}

def change_color_area(image, width, height):
    """Applies a subtle color filter to a small circular area."""
    x = random.randint(int(width * 0.1), int(width * 0.9))
    y = random.randint(int(height * 0.1), int(height * 0.9))
    radius = random.randint(25, 50)
    mask = Image.new('L', image.size, 0)
    draw_mask = ImageDraw.Draw(mask)
    draw_mask.ellipse((x - radius, y - radius, x + radius, y + radius), fill=255)
    colorized = Image.new('RGBA', image.size)
    draw_color = ImageDraw.Draw(colorized)
    draw_color.rectangle([0, 0, width, height], fill=(112, 66, 20, 30)) # Sepia-like tint
    image.paste(colorized, mask=mask)
    return {"type": "color_change", "x": x, "y": y, "radius": radius, "details": "The color of an area was changed."}


def remove_small_detail(image, width, height):
    """Clones a nearby area to cover up a small detail."""
    x = random.randint(int(width * 0.2), int(width * 0.8))
    y = random.randint(int(height * 0.2), int(height * 0.8))
    radius = random.randint(15, 30)
    source_x = x + random.choice([-1, 1]) * radius * 3
    source_y = y + random.choice([-1, 1]) * radius * 3
    source_x = max(radius, min(source_x, width - radius))
    source_y = max(radius, min(source_y, height - radius))
    source_box = (source_x - radius, source_y - radius, source_x + radius, source_y + radius)
    region = image.crop(source_box)
    image.paste(region, (x - radius, y - radius))
    return {"type": "removal", "x": x, "y": y, "radius": radius, "details": "A small detail was removed."}


# --- Main Logic ---

def process_all_images():
    """
    Processes all images in the source directory, generates modified versions,
    and creates a JSON file with level data.
    """
    levels_data = []
    valid_extensions = ['.png', '.jpg', '.jpeg']
    source_files = [f for f in os.listdir(SOURCE_IMAGE_DIR) if os.path.splitext(f)[1].lower() in valid_extensions]

    if not source_files:
        print("No images found in the source directory.")
        return

    print(f"Found {len(source_files)} images to process.")

    for filename in source_files:
        original_path = os.path.join(SOURCE_IMAGE_DIR, filename)
        base_name = os.path.splitext(filename)[0]

        try:
            with Image.open(original_path).convert("RGBA") as img:
                width, height = img.size
                original_copy_path = os.path.join(OUTPUT_DIR, f"{base_name}_original.png")
                img.save(original_copy_path, "PNG")

                modified_img = img.copy()
                draw = ImageDraw.Draw(modified_img)
                
                differences = []
                num_diffs = random.randint(4, 7)
                
                modification_functions = [add_small_shape, remove_small_detail, lambda i, w, h: change_color_area(i, w, h)]

                for _ in range(num_diffs):
                    func = random.choice(modification_functions)
                    if func == add_small_shape:
                       diff = func(draw, width, height)
                    else:
                       diff = func(modified_img, width, height)
                    differences.append(diff)

                modified_copy_path = os.path.join(OUTPUT_DIR, f"{base_name}_modified.png")
                modified_img.save(modified_copy_path, "PNG")

                level_id = base_name.replace(" ", "_").lower()
                levels_data.append({
                    "id": level_id,
                    "name": base_name.replace("_", " ").title(),
                    "original": f"/generated_levels/{os.path.basename(original_copy_path)}",
                    "modified": f"/generated_levels/{os.path.basename(modified_copy_path)}",
                    "differences": differences
                })
                
                print(f"Successfully processed '{filename}'")

        except Exception as e:
            print(f"Could not process image {filename}. Error: {e}")

    with open(LEVELS_JSON_FILE, 'w') as f:
        json.dump(levels_data, f, indent=2)
    
    # Corrected print statement
    print(f"
Successfully generated {len(levels_data)} levels.")
    print(f"Level data saved to {LEVELS_JSON_FILE}")

if __name__ == "__main__":
    process_all_images()
