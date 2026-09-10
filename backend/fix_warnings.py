import os
import glob

files_to_check = glob.glob('c:/Users/vansh/Desktop/CampusOS/backend/app/schemas/*.py') + \
                 glob.glob('c:/Users/vansh/Desktop/CampusOS/backend/tests/*.py') + \
                 ['c:/Users/vansh/Desktop/CampusOS/backend/app/repositories/base.py', 
                  'c:/Users/vansh/Desktop/CampusOS/backend/app/db/seed.py',
                  'c:/Users/vansh/Desktop/CampusOS/backend/app/core/config.py']

for filepath in files_to_check:
    with open(filepath, 'r') as f:
        content = f.read()

    new_content = content
    if 'datetime.utcnow' in new_content or 'datetime.utcnow()' in new_content or 'datetime.datetime.utcnow()' in new_content:
        new_content = new_content.replace('datetime.utcnow', 'lambda: datetime.now(timezone.utc)')
        new_content = new_content.replace('lambda: datetime.now(timezone.utc)()', 'datetime.now(timezone.utc)')
        new_content = new_content.replace('__import__("datetime").datetime.now(timezone.utc)', '__import__("datetime").datetime.now(__import__("datetime").timezone.utc)')
        if 'from datetime import datetime' in new_content and 'timezone' not in new_content:
            new_content = new_content.replace('from datetime import datetime', 'from datetime import datetime, timezone')
    
    # Fix Config -> ConfigDict
    if 'class Config:' in new_content and 'env_file' in new_content:
        new_content = new_content.replace('from pydantic_settings import BaseSettings', 'from pydantic_settings import BaseSettings, SettingsConfigDict')
        new_content = new_content.replace('class Config:\n        env_file = ".env"\n        case_sensitive = True', 'model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)')

    if content != new_content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f'Updated {filepath}')
