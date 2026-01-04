
import os
import re
import json

data_dir = r"c:\Users\rapha\Documents\ChronoExplorer"
episodes = []

for filename in os.listdir(data_dir):
    match = re.match(r"data_episode_(\d+)_.*\.js", filename)
    if match:
        ep_id = int(match.group(1))
        if ep_id >= 81:
            with open(os.path.join(data_dir, filename), "r", encoding="utf-8") as f:
                content = f.read()
                # const episodeTitle_81 = "Title";
                title_match = re.search(r"const\s+episodeTitle_\d+\s*=\s*[\"'](.*?)[\"']", content)
                if title_match:
                    title = title_match.group(1)
                    episodes.append({"id": ep_id, "title": title, "filename": filename})

episodes.sort(key=lambda x: x["id"])
print(json.dumps(episodes, ensure_ascii=False, indent=2))
