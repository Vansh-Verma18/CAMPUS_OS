import glob
import re

schemas = glob.glob('c:/Users/vansh/Desktop/CampusOS/backend/app/schemas/*.py')

for filepath in schemas:
    with open(filepath, 'r') as f:
        content = f.read()

    new_content = content
    
    # 1. Fix default_factory=PyObjectId
    if 'default_factory=PyObjectId' in new_content:
        # Add import for generate_object_id if not there
        if 'generate_object_id' not in new_content:
            new_content = new_content.replace('from app.schemas.core import PyObjectId', 'from app.schemas.core import PyObjectId, generate_object_id')
        new_content = new_content.replace('default_factory=PyObjectId', 'default_factory=generate_object_id')

    # 2. Fix Field("some_default") to Field(default="some_default")
    # We can use regex to find Field("...") and replace with Field(default="...")
    # e.g., Field("active", description="Status...") -> Field(default="active", description="Status...")
    # e.g., Field("active") -> Field(default="active")
    
    # Regex: Field( followed by quotes, capturing the string
    new_content = re.sub(r'Field\((["\'][^"\']+["\'])', r'Field(default=\1', new_content)

    if content != new_content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Fixed {filepath}")
