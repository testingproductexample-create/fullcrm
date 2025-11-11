#!/usr/bin/env python3
import os
import re
import glob

def fix_routing_errors_corrected():
    """Fix all Next.js routing type errors correctly"""
    
    app_dir = "/workspace/tailoring-management-platform"
    files = glob.glob(f"{app_dir}/app/**/*.tsx", recursive=True) + \
            glob.glob(f"{app_dir}/app/**/*.ts", recursive=True) + \
            glob.glob(f"{app_dir}/components/**/*.tsx", recursive=True) + \
            glob.glob(f"{app_dir}/components/**/*.ts", recursive=True)
    
    fixed_count = 0
    
    for file_path in files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            
            # Fix malformed URLs from previous script
            # Fix: ${/path} -> /path
            content = re.sub(r'\{\$\{(/[^{}]+)\}\}', r'\1', content)
            
            # Pattern 1: Fix Link href="/path" -> href={`/path`}
            content = re.sub(
                r'href="(/[^"]*)"',
                r'href={`\1`}',
                content
            )
            
            # Pattern 2: Fix Link href={`/path/${variable}`} -> href={`/path/${variable}`} (already correct)
            # But need to ensure template literals are properly formed
            
            # Pattern 3: Fix router.push('/path') -> router.push(`\1`)
            content = re.sub(
                r"router\.push\('([^']+)'\)",
                r"router.push(`\1`)",
                content
            )
            
            # Pattern 4: Fix router.push(`/path`) -> router.push(`/path`) (already correct)
            
            # Write back if content changed
            if content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Fixed: {file_path}")
                fixed_count += 1
                
        except Exception as e:
            print(f"Error processing {file_path}: {e}")
    
    print(f"\nTotal files corrected: {fixed_count}")

if __name__ == "__main__":
    fix_routing_errors_corrected()