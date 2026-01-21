
import os
from PIL import Image

def optimize_images(directory="images"):
    if not os.path.exists(directory):
        print(f"Directory {directory} not found.")
        return

    files = [f for f in os.listdir(directory) if f.lower().endswith('.png')]
    total_saved = 0
    count = 0

    print(f"Found {len(files)} PNG images to process in '{directory}'...")

    for filename in files:
        filepath = os.path.join(directory, filename)
        new_filename = os.path.splitext(filename)[0] + ".webp"
        new_filepath = os.path.join(directory, new_filename)

        try:
            with Image.open(filepath) as img:
                # Resize if width > 800
                if img.width > 800:
                    ratio = 800 / img.width
                    new_height = int(img.height * ratio)
                    img = img.resize((800, new_height), Image.Resampling.LANCZOS)
                
                # Save as WebP
                img.save(new_filepath, "WEBP", quality=80)
                
                # Stats
                original_size = os.path.getsize(filepath)
                new_size = os.path.getsize(new_filepath)
                saved = original_size - new_size
                total_saved += saved
                count += 1
                
                print(f"Converted {filename}: {original_size/1024:.1f}KB -> {new_size/1024:.1f}KB (Saved {saved/1024:.1f}KB)")

        except Exception as e:
            print(f"Error processing {filename}: {e}")

    print(f"\nProcessing complete!")
    print(f"Converted {count} images.")
    print(f"Total space saved: {total_saved / (1024*1024):.2f} MB")

if __name__ == "__main__":
    optimize_images()
