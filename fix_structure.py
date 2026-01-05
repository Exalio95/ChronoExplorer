
import os
import shutil

root = r"c:\Users\rapha\Documents\ChronoExplorer"
data_file_col = os.path.join(root, "data")
images_file_col = os.path.join(root, "images")

# Restore corrupted filenames if they exist as files
if os.path.exists(data_file_col) and os.path.isfile(data_file_col):
    print("Restoring data file...")
    shutil.move(data_file_col, os.path.join(root, "data_episodes.js"))

if os.path.exists(images_file_col) and os.path.isfile(images_file_col):
    print("Restoring images file...")
    # We assume it's img_ep_1.png based on size logic, but let's just rename it to a temp name and inspect or just trust logic?
    # Actually, if I moved img_*.png to images/, it likely took the first one. 
    # img_ep_1.png comes first alphabetically? No, img_ep_100.png might come before img_ep_1.png in ASCII?
    # Let's check what img_ep_1.png size was. 907595.
    # What about img_ep_100.png? 1044665.
    # So it was likely img_ep_1.png.
    # Wait, if img_ep_1.png still exists in the list?
    # In the file list from Step 63: 
    # "img_ep_1.png" IS MISSING! "img_ep_100.png" is present.
    # "img_ep_101.png" is present.
    # "img_ep_1.png" is NOT in the list.
    # So "images" IS "img_ep_1.png".
    shutil.move(images_file_col, os.path.join(root, "img_ep_1.png"))

# Create directories
os.makedirs(os.path.join(root, "data"), exist_ok=True)
os.makedirs(os.path.join(root, "images"), exist_ok=True)

# Move files
files = os.listdir(root)
for f in files:
    src = os.path.join(root, f)
    if os.path.isfile(src):
        if f.startswith("data_episode_") or f == "data_episodes.js" or f == "generated_priorities.js":
            dst = os.path.join(root, "data", f)
            print(f"Moving {f} to data/")
            shutil.move(src, dst)
        elif f.startswith("img_") and f.endswith(".png"):
            dst = os.path.join(root, "images", f)
            print(f"Moving {f} to images/")
            shutil.move(src, dst)

print("Restoration and restructuring complete.")
