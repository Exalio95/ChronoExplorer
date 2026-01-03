
import os
import glob
import re

# 1. Get all episode files
files = glob.glob(r"c:\Users\rapha\Documents\Annecdote\data_episode_*.js")
episode_files = []

for f in files:
    filename = os.path.basename(f)
    match = re.search(r"data_episode_(\d+)_", filename)
    if match:
        ep_id = int(match.group(1))
        episode_files.append((ep_id, filename))

# Sort by ID
episode_files.sort(key=lambda x: x[0])

# 2. Generate Script Tags
script_tags = []
for ep_id, filename in episode_files:
    script_tags.append(f'    <script src="{filename}"></script>')

scripts_block = "\n".join(script_tags)

# 3. Update explorer.html
html_path = r"c:\Users\rapha\Documents\ChronoExplorer\index.html"
with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# We need to replace the block of episode scripts.
# Pattern: from first <script src="data_episode_ to last one.
# Or better: Identify the start/end markers if likely.
# In Step 1694:
# Starts at line 119: <script src="data_episode_1_sortie_afrique.js"></script>
# Ends at line 211: <script src="data_episode_89_socrate.js"></script>

# Regex to replace all data_episode scripts
# We want to keep the headers/comments if possible, but simplest is to replace the chunk.
# Make sure we don't delete data_episodes.js or explorer.js

new_content = re.sub(
    r'(<script src="data_episode_\d+_[^"]+"><\/script>\s*)+', 
    scripts_block + "\n", 
    content,
    flags=re.DOTALL
)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Updated {len(episode_files)} script tags in explorer.html")
