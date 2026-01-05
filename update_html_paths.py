
import re

html_path = r"c:\Users\rapha\Documents\ChronoExplorer\index.html"

with open(html_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace src="data_episode_..." with src="data/data_episode_..."
new_content = re.sub(r'src="data_episode_', r'src="data/data_episode_', content)
new_content = re.sub(r'src="data_episodes.js"', r'src="data/data_episodes.js"', new_content)
new_content = re.sub(r'src="generated_priorities.js"', r'src="data/generated_priorities.js"', new_content)

with open(html_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Updated index.html")
