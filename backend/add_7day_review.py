import sys

# Read file
with open('brain_engine.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find line 62 (index 61) and insert after it
insert_index = 63  # After line 62 (0-indexed = 62, but insert after = 63)
new_lines = [
    "            if syllabus_percent > 20:\r\n",
    "                strategies.append((\"Revision\", \"7-Day Review\", 0.5))  # Medium retention\r\n"
]

# Insert
for i, line in enumerate(new_lines):
    lines.insert(insert_index + i, line)

# Write back
with open('brain_engine.py', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("✅ 7-day review added successfully!")
