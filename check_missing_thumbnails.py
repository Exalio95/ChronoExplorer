
import os
import re

directory = r"c:\Users\rapha\Documents\ChronoExplorer"
data_dir = os.path.join(directory, "data")
images_dir = os.path.join(directory, "images")
files = os.listdir(data_dir)
image_files = os.listdir(images_dir)

data_pattern = re.compile(r"data_episode_(\d+)_(.+)\.js")
missing = []

for f in files:
    match = data_pattern.match(f)
    if match:
        ep_id = int(match.group(1))
        # if ep_id >= 83: # Check all? or just recent? Let's check all to be safe or keep logic
        if ep_id >= 124: # User asked for 124+
            img_name = f"img_ep_{ep_id}.png"
            if img_name not in image_files:
                missing.append((ep_id, f))

missing.sort()
for ep_id, f in missing:
    print(f"{ep_id}|{f}")
