import os
import glob
from pydantic import BaseModel, ConfigDict

schema_dir = "app/schemas"
files = glob.glob(f"{schema_dir}/*.py")

for file in files:
    if "core.py" in file or "token.py" in file:
        continue
    with open(file, "r") as f:
        content = f.read()
    
    # Make sure ConfigDict is imported if we are going to use it
    if "ConfigDict" not in content:
        content = content.replace("from pydantic import BaseModel, Field", "from pydantic import BaseModel, Field, ConfigDict")
        content = content.replace("from pydantic import BaseModel, Field, model_validator", "from pydantic import BaseModel, Field, model_validator, ConfigDict")
    
    # Add model_config to Base classes
    # A bit hacky but works for this structure
    lines = content.split('\n')
    new_lines = []
    for line in lines:
        new_lines.append(line)
        if "class " in line and "Base(" in line:
            new_lines.append("    model_config = ConfigDict(populate_by_name=True)")
            
        # Fix required fields that backend sets
        if "created_by: PyObjectId" in line and "=" not in line:
            new_lines[-1] = line.replace("created_by: PyObjectId", "created_by: Optional[PyObjectId] = None")
        if "user_id: PyObjectId" in line and "=" not in line:
            new_lines[-1] = line.replace("user_id: PyObjectId", "user_id: Optional[PyObjectId] = None")
        if "event_id: PyObjectId" in line and "=" not in line:
            new_lines[-1] = line.replace("event_id: PyObjectId", "event_id: Optional[PyObjectId] = None")
        if "recorded_by: PyObjectId" in line and "=" not in line:
            new_lines[-1] = line.replace("recorded_by: PyObjectId", "recorded_by: Optional[PyObjectId] = None")

    
    with open(file, "w") as f:
        f.write('\n'.join(new_lines))
