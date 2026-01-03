
import re
import os
import glob

# 1. Parse Master List to get ID -> Official Title mapping
master_list_path = r"c:\Users\rapha\Documents\Annecdote\master_episode_list.md"
title_map = {} # Year -> Title (Full String)

with open(master_list_path, 'r', encoding='utf-8') as f:
    for line in f:
        # Match: - [x] **-60 000** : Title (Px) without " (P"
        match = re.search(r"\*\*(.*?)\*\* : (.*?) \(", line)
        if match:
            date_str = match.group(1).strip()
            title = match.group(2).strip()
            
            # Clean date string for simple year mapping if needed, 
            # BUT here we rely on file matching logic.
            # Files are named data_episode_1_sortie_afrique.js
            # We don't have episode numbers in Master List explicitly.
            # Wait, the Master List is chronological.
            # The files are numbered: data_episode_X_...
            
            # Problem: How to map "Episode 1" to "-60 000" accurately?
            # Existing data files have "category: '-60 000 : Sortie d'Afrique'"
            # Maybe we can map by Year?
            
            year_clean = date_str.replace("av. J.-C.", "").strip()
            
            # Skip if not a date (e.g. headers like "##...")
            if not any(char.isdigit() for char in year_clean):
                continue
                
            if "-" in year_clean:
                 # "- 60 000" -> -60000
                 y = -int(year_clean.replace("-", "").replace(" ", ""))
            else:
                 y = int(year_clean.replace(" ", ""))
                 
            if "27 av." in date_str: y = -27 # Specific fix if needed, though replace covers it.
            
            if "27 av." in date_str: y = -27
            
            full_title = f"{date_str} : {title}"
            title_map[y] = full_title

# 2. Iterate data files
files = glob.glob(r"c:\Users\rapha\Documents\Annecdote\data_episode_*.js")
episodes_data = []

for file_path in files:
    filename = os.path.basename(file_path)
    # Extract ID from filename: data_episode_1_...
    match_id = re.search(r"data_episode_(\d+)_", filename)
    if not match_id:
        continue
    
    ep_id = int(match_id.group(1))
    
    # Read file content
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Find the current category/year in file to match with Master List
    # "category": "-60 000 : ..."
    match_cat = re.search(r'category:\s*["\'](.*?)["\']', content)
    official_title = f"Episode {ep_id}" # Fallback
    
    if match_cat:
        cat = match_cat.group(1)
        # Extract year
        match_year = re.search(r"(-?[\d\s]+)", cat)
        if match_year:
            try:
                y_str = match_year.group(1).strip()
                if " " in y_str and len(y_str) < 5: # e.g. "- 500" not "-60 000"?
                    pass 
                
                # Simple cleanup
                y_val = int(y_str.replace(" ", ""))
                
                # Find in title_map
                # Fuzzy match for existing year?
                if y_val in title_map:
                    official_title = title_map[y_val]
                else:
                    # Try neighboring years or manual overrides?
                    # -3300 matches Uruk and Otzi. Master List has both.
                    # We might have collision.
                    # Files: data_episode_5_ecriture_uruk, data_episode_10_otzi (wait, did I make Otzi?)
                    # Let's just use what we found or keep original if not found.
                    pass
            except:
                pass

    # INJECT TITLE at top of file
    # We want to replace or prepend.
    # Pattern: const data_ep1 = [
    # We will prepend: const episodeTitle = "OFFICIAL TITLE"; \n const data_ep...
    
    # Check if already injected
    if "const episodeTitle =" in content:
        # Regex replace
        content = re.sub(r'const episodeTitle = ".*?";\n', f'const episodeTitle = "{official_title}";\n', content)
    else:
        content = f'const episodeTitle = "{official_title}";\n' + content
        
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
        
    # Add to aggregator info
    var_name = f"data_ep{ep_id}"
    episodes_data.append({
        "id": ep_id,
        "var": var_name,
        "title": official_title
    })

# 3. Generate data_episodes.js
episodes_data.sort(key=lambda x: x["id"])

output_js = "// Aggregated Episodes Data\n"
output_js += "const episodesData = [\n"
for ep in episodes_data:
    # { id: 1, title: episodeTitle, cards: data_ep1 },
    # BUT wait, episodeTitle is a local const in each file.
    # We can't access it easily unless we export it or put it in global scope.
    # The files are loaded via <script>.
    # So `const episodeTitle` will conflict if they are all global!
    
    # CORRECT APPROACH:
    # In each file, we should probably add a property to the array?
    # Or rename the const to `title_ep1`?
    # User said: "donne le nom de chaque episode contenu au debut de chacune des database"
    # User implies explicit naming.
    # If I use `const episodeTitle_1 = ...` it works.
    pass

# REVISING STRATEGY:
# In file_X: `const episodeTitle_X = "..."`
# In data_episodes: `title: episodeTitle_X`

for file_path in files:
    filename = os.path.basename(file_path)
    match_id = re.search(r"data_episode_(\d+)_", filename)
    if not match_id: continue
    ep_id = int(match_id.group(1))
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Re-read to ensure we get the updated content if we modified it above
    # Actually I modified it above but with generic name. Let's fix loop.
    pass

# Redo Loop Correctly
episodes_list_str = []

for file_path in files:
    filename = os.path.basename(file_path)
    match_id = re.search(r"data_episode_(\d+)_", filename)
    if not match_id: continue
    ep_id = int(match_id.group(1))
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Determine Title (same logic)
    match_cat = re.search(r'category:\s*["\'](.*?)["\']', content)
    official_title = f"{ep_id}. Episode" # Default
    
    if match_cat:
        cat = match_cat.group(1)
        match_year = re.search(r"(-?[\d\s]+)", cat)
        if match_year:
            try:
                y_val = int(match_year.group(1).replace(" ", ""))
                if y_val in title_map:
                    official_title = title_map[y_val]
            except: pass

    # Use unique variable name
    title_var = f"episodeTitle_{ep_id}"
    
    # Inject unique const
    if "const episodeTitle" in content:
        # Remove old generic if exists
        content = re.sub(r'const episodeTitle.*?;\n', '', content)
    
    # Check if specific var exists
    if f"const {title_var} =" in content:
        content = re.sub(f'const {title_var} = ".*?";\n', f'const {title_var} = "{official_title}";\n', content)
    else:
        content = f'const {title_var} = "{official_title}";\n' + content

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
        
    episodes_list_str.append(f"    {{ id: {ep_id}, title: {title_var}, cards: data_ep{ep_id} }}")

# Write data_episodes.js
final_js = "const episodesData = [\n" + ",\n".join(episodes_list_str) + "\n];\n"
with open(r"c:\Users\rapha\Documents\Annecdote\data_episodes.js", 'w', encoding='utf-8') as f:
    f.write(final_js)

print(f"Processed {len(episodes_list_str)} episodes.")
