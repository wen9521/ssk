
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
    # Use an ellipse for the shape
    draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=color)
    return {"type": "add_shape", "x": x, "y": y, "radius": radius, "details": "A small shape was added."}

def change_color_area(image, width, height):
    """Applies a subtle color filter to a small circular area."""
    x = random.randint(int(width * 0.1), int(width * 0.9))
    y = random.randint(int(height * 0.1), int(height * 0.9))
    radius = random.randint(25, 50)

    # Create a mask
    mask = Image.new('L', image.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=255)

    # Apply a color change (e.g., sepia tone)
    colorized = Image.new('RGB', (radius * 2, radius * 2), (112, 66, 20)) # Sepia-like color
    
    # Paste the colorized area using the mask
    image.paste(colorized, (x-radius, y-radius), mask.crop((x-radius, y-radius, x+radius, y+radius)))

    return {"type": "color_change", "x": x, "y": y, "radius": radius, "details": "The color of an area was changed."}


def remove_small_detail(image, width, height):
    """Clones a nearby area to cover up a small detail."""
    # Find a good spot to remove something from
    x = random.randint(int(width * 0.2), int(width * 0.8))
    y = random.randint(int(height * 0.2), int(height * 0.8))
    radius = random.randint(15, 30)

    # Define source and destination boxes
    source_x = x + random.choice([-1, 1]) * radius * 3
    source_y = y + random.choice([-1, 1]) * radius * 3
    
    # Ensure source is within bounds
    source_x = max(radius, min(source_x, width - radius))
    source_y = max(radius, min(source_y, height - radius))

    source_box = (source_x - radius, source_y - radius, source_x + radius, source_y + radius)
    
    # Crop the source region
    region = image.crop(source_box)
    
    # Paste it over the target area
    image.paste(region, (x - radius, y - radius))
    
    return {"type": "removal", "x": x, "y": y, "radius": radius, "details": "A small detail was removed."}


# --- Main Logic ---

def process_all_images():
    """
    Processes all images in the source directory, generates modified versions,
    and creates a JSON file with level data.
    """
    levels_data = []
    
    # Get list of valid images
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
                
                # --- Create original copy ---
                original_copy_path = os.path.join(OUTPUT_DIR, f"{base_name}_original.png")
                img.save(original_copy_path, "PNG")

                # --- Create modified version ---
                modified_img = img.copy()
                draw = ImageDraw.Draw(modified_img)
                
                differences = []
                num_diffs = random.randint(4, 7) # Generate more differences
                
                # Make sure modification functions are suitable for the image size
                modification_functions = [add_small_shape, remove_small_detail]
                # change_color_area can be too obvious, use it less
                if random.random() > 0.5:
                    modification_functions.append(lambda i, w, h: change_color_area(i, w, h))


                for _ in range(num_diffs):
                    func = random.choice(modification_functions)
                    if func == add_small_shape:
                       diff = func(draw, width, height)
                    else:
                        # Pass the image for modifications like removal or color change
                       diff = func(modified_img, width, height)
                    differences.append(diff)

                modified_copy_path = os.path.join(OUTPUT_DIR, f"{base_name}_modified.png")
                modified_img.save(modified_copy_path, "PNG")

                # --- Add to level data ---
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

    # --- Write the JSON file ---
    with open(LEVELS_JSON_FILE, 'w') as f:
        json.dump(levels_data, f, indent=2)
    
    print(f"
Successfully generated {len(levels_data)} levels.")
    print(f"Level data saved to {LEVELS_JSON_FILE}")

if __name__ == "__main__":
    process_all_images()
