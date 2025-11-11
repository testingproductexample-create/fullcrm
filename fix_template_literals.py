#!/usr/bin/env python3
import os
import re

def fix_template_literals(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Fix ${/path} to /path  
        original_content = content
        content = re.sub(r'\$\{([/][^}]+)\}', r'\1', content)
        
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

# Find and fix all .tsx files
fixed_files = 0
for root, dirs, files in os.walk('/workspace/tailoring-management-platform/app'):
    for file in files:
        if file.endswith('.tsx'):
            file_path = os.path.join(root, file)
            if fix_template_literals(file_path):
                print(f'Fixed: {file_path}')
                fixed_files += 1

print(f'Fixed {fixed_files} files')