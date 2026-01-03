
import re
import os
import glob
import sys

# Force utf-8 for stdout if possible
sys.stdout.reconfigure(encoding='utf-8')

master_list_path = r"c:\Users\rapha\Documents\Annecdote\master_episode_list.md"
title_map = {}

print("--- Parsing Master List ---")
with open(master_list_path, 'r', encoding='utf-8') as f:
    for line in f:
        match = re.search(r"\*\*(.*?)\*\* : (.*?) \(", line)
        if match:
            date_str = match.group(1).strip()
            title = match.group(2).strip()
            
            year_clean = date_str.replace("av. J.-C.", "").strip()
            if not any(char.isdigit() for char in year_clean): continue

            try:
                if "-" in year_clean:
                     y = -int(year_clean.replace("-", "").replace(" ", ""))
                else:
                     y = int(year_clean.replace(" ", ""))
                
                if "27 av." in date_str: y = -27
                
                full_title = f"{date_str} : {title}"
                if y not in title_map: title_map[y] = []
                title_map[y].append(full_title)
            except Exception as e:
                pass

print(f"Loaded {len(title_map)} years from Master List.")

files = glob.glob(r"c:\Users\rapha\Documents\Annecdote\data_episode_*.js")

updated_count = 0
for file_path in files:
    filename = os.path.basename(file_path)
    match_id = re.search(r"data_episode_(\d+)_", filename)
    if not match_id: continue
    ep_id = int(match_id.group(1))
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    match_cat = re.search(r'category:\s*["\'](.*?)["\']', content)
    official_title = None
    
    if match_cat:
        cat = match_cat.group(1)
        # Extract ALL numbers from category
        # Filter for the one that makes sense as a year
        # "Angleterre (1066)" -> [1066]
        # "-60 000 : ..." -> [-60000]
        
        # Regex for numbers including spaces and negative signs
        # We look for "-? \d+ (\s \d+)*"
        
        # normalized string for year extraction
        cat_norm = cat.replace(" ", "")
        # Find all integers
        numbers = re.findall(r"-?\d+", cat_norm)
        
        candidates_titles = []
        
        for num_str in numbers:
            y_val = int(num_str)
            if y_val in title_map:
                candidates_titles.extend(title_map[y_val])
        
        if candidates_titles:
            official_title = candidates_titles[0]
            if len(candidates_titles) > 1:
                 # Use filename as hint?
                 # "uruk" -> match "Uruk"
                 # "otzi" -> match "Ötzi"
                 pass 
        
        # Fallback for known hardcoded or fuzzy keywords if year not found clearly
        if not official_title:
             pass

    if official_title:
         # print(f"File {filename} (Cat: {cat}) -> Title: {official_title}")
         
         title_var = f"episodeTitle_{ep_id}"
         pattern = f'const {title_var} = ".*?";'
         replacement = f'const {title_var} = "{official_title}";'
         
         if re.search(pattern, content):
             new_content = re.sub(pattern, replacement, content)
             if new_content != content:
                 with open(file_path, 'w', encoding='utf-8') as f:
                     f.write(new_content)
                 updated_count += 1
    else:
        # print(f"Could not match year for {filename} (Cat: {cat})")
        pass

print(f"Updated {updated_count} files.")
