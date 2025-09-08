#!/usr/bin/env python3
"""
Script to clean up Solana MCP output by converting escaped characters to normal text
"""
import json
import sys

def clean_text(text):
    """Clean up escaped characters in text"""
    # Replace common escape sequences
    text = text.replace('\\n', '\n')
    text = text.replace('\\t', '\t')
    text = text.replace('\\r', '\r')
    text = text.replace('\\"', '"')
    text = text.replace('\\/', '/')
    text = text.replace('\\\\', '\\')
    
    # Replace Unicode escape sequences
    text = text.replace('\u2014', '—')  # em dash
    text = text.replace('\u2013', '–')  # en dash
    text = text.replace('\u2019', "'")  # right single quotation mark
    text = text.replace('\u201c', '"')  # left double quotation mark
    text = text.replace('\u201d', '"')  # right double quotation mark
    text = text.replace('\u2026', '...')  # horizontal ellipsis
    
    return text

def extract_and_clean_content(data):
    """Extract and clean content from the JSON structure"""
    output = []
    
    if isinstance(data, dict):
        if 'content' in data:
            for item in data['content']:
                if item.get('type') == 'document':
                    title = item.get('title', 'Untitled')
                    url = item.get('url', '')
                    
                    output.append(f"# {title}")
                    if url:
                        output.append(f"URL: {url}")
                    output.append("")
                    
                    # Extract text content
                    source_content = item.get('source', {}).get('content', [])
                    for content_item in source_content:
                        if content_item.get('type') == 'text':
                            text = content_item.get('text', '')
                            clean_content = clean_text(text)
                            output.append(clean_content)
                            output.append("")
    
    return '\n'.join(output)

def main():
    # Read the file
    try:
        with open('/Users/A200297810/Desktop/Repos/solcloak/file.txt', 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Parse JSON
        try:
            data = json.loads(content)
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON: {e}")
            # Try to extract just the text parts if JSON parsing fails
            cleaned = clean_text(content)
            with open('/Users/A200297810/Desktop/Repos/solcloak/cleaned_output.txt', 'w', encoding='utf-8') as f:
                f.write(cleaned)
            print("Cleaned content saved to cleaned_output.txt")
            return
        
        # Extract and clean content
        cleaned_content = extract_and_clean_content(data)
        
        # Save cleaned content
        with open('/Users/A200297810/Desktop/Repos/solcloak/cleaned_output.txt', 'w', encoding='utf-8') as f:
            f.write(cleaned_content)
        
        print("Successfully cleaned and saved content to cleaned_output.txt")
        print(f"Extracted {len(cleaned_content.split())} words from the Solana MCP output")
        
    except FileNotFoundError:
        print("Error: file.txt not found")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
