import re
import json

def parse_master_list(file_path):
    priority_map = {}
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            # Regex to match: - [x] **Year** : Title (PX)
            # Example: - [x] **-18 000** : La grotte de Lascaux (P1)
            match = re.search(r'\*\*([^\*]+)\*\*\s*:\s*(.+?)\s*\((P\d+)\)', line)
            if match:
                date_str = match.group(1).strip()
                title_str = match.group(2).strip()
                priority_str = match.group(3)
                priority_val = int(priority_str.replace('P', ''))
                
                # Construct key: "Year : Title" matches the app's format roughly
                # App format in data files: "Year : Title" (sometimes with spaces)
                
                # To be safe, let's normalize the title for matching
                # We will map "Normalized Title" -> Priority
                
                # Also store the full expected title for debugging
                full_key = f"{date_str} : {title_str}"
                priority_map[full_key] = priority_val

    return priority_map

priorities = parse_master_list(r'c:\Users\rapha\Documents\Annecdote\master_episode_list.md')

# Write to file to avoid console encoding issues
with open('priority_map.json', 'w', encoding='utf-8') as f:
    json.dump(priorities, f, indent=2, ensure_ascii=False)
print("Priorities saved to priority_map.json")
