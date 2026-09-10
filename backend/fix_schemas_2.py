import os
import glob

schema_dir = "app/schemas"
files = glob.glob(f"{schema_dir}/*.py")

for file in files:
    if "core.py" in file or "token.py" in file:
        continue
    with open(file, "r") as f:
        content = f.read()
    
    if "from pydantic import ConfigDict" not in content and "ConfigDict" in content:
        content = "from pydantic import ConfigDict\n" + content
    elif "ConfigDict" not in content:
        content = "from pydantic import ConfigDict\n" + content
        lines = content.split('\n')
        new_lines = []
        for line in lines:
            new_lines.append(line)
            if "class " in line and "Base(" in line:
                new_lines.append("    model_config = ConfigDict(populate_by_name=True)")
        content = '\n'.join(new_lines)

    with open(file, "w") as f:
        f.write(content)
