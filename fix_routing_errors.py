#!/usr/bin/env python3
import os
import re
import glob

def fix_routing_errors():
    """Fix all Next.js routing type errors by wrapping URL strings in template literals"""
    
    # Find all TypeScript files in the tailoring-management-platform
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
            
            # Pattern 1: Fix Link href with template literals that are not wrapped
            # Match: href={`/path/${variable}/path`} -> href={`${`/path/${variable}/path`}`}
            content = re.sub(
                r'href=\{`(/[^`]*\$\{[^}]*\}[^`]*)`\}',
                r'href={`${\1}`}',
                content
            )
            
            # Pattern 2: Fix Link href with string literals that need template wrapping
            # Match: href="/path" -> href={`/path`}
            content = re.sub(
                r'href="(/[^"]*)"',
                r'href={`${\1}`}',
                content
            )
            
            # Pattern 3: Fix router.push with string URLs
            # Match: router.push('/path') -> router.push(`${'/path'}`)
            content = re.sub(
                r"router\.push\('([^']+)'\)",
                r"router.push(`$\1`)",
                content
            )
            
            # Pattern 4: Fix router.push with template literals
            # Match: router.push(`/path/${variable}`) -> router.push(`${`/path/${variable}`}`)
            content = re.sub(
                r"router\.push\(`([^`]*\$\{[^}]*\}[^`]*)`\)",
                r"router.push(`$\1`)",
                content
            )
            
            # Write back if content changed
            if content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Fixed: {file_path}")
                fixed_count += 1
                
        except Exception as e:
            print(f"Error processing {file_path}: {e}")
    
    print(f"\nTotal files fixed: {fixed_count}")

if __name__ == "__main__":
    fix_routing_errors()