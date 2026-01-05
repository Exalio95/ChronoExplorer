
import os
import shutil
import re

source_dir = r"c:\Users\rapha\.gemini\antigravity\brain\8a1bb335-49d4-471f-a7db-f037a8da6558"
target_dir = r"c:\Users\rapha\Documents\ChronoExplorer\images"

files = os.listdir(source_dir)
# Pattern to match img_ep_ID_TIMESTAMP.png or just img_ep_ID.png
# The tool output showed: img_ep_104_1767552739611.png
pattern = re.compile(r"(img_ep_(\d+))(_\d+)?\.png")

count = 0
for f in files:
    match = pattern.match(f)
    if match:
        base_name = match.group(1) # img_ep_104
        ep_id = match.group(2)     # 104
        # We want the final name to be img_ep_104.png
        new_name = f"{base_name}.png"
        
        src_path = os.path.join(source_dir, f)
        dst_path = os.path.join(target_dir, new_name)
        
        print(f"Copying {f} -> {dst_path}")
        shutil.copy2(src_path, dst_path)
        count += 1

print(f"Successfully transferred {count} images.")
