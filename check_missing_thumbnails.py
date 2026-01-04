
import os
import re

directory = r"c:\Users\rapha\Documents\ChronoExplorer"
files = os.listdir(directory)

data_pattern = re.compile(r"data_episode_(\d+)_(.+)\.js")
missing = []

for f in files:
    match = data_pattern.match(f)
    if match:
        ep_id = int(match.group(1))
        if ep_id >= 60:
            img_name = f"img_ep_{ep_id}.png"
            if img_name not in files:
                missing.append((ep_id, f))

missing.sort()
for ep_id, f in missing:
    print(f"{ep_id}|{f}")
