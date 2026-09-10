import os
import glob

schema_dir = "app/schemas"
files = glob.glob(f"{schema_dir}/*.py")

for file in files:
    with open(file, "r") as f:
        content = f.read()
    
    if "from typing import" in content and "Optional" not in content and "Optional[" in content:
        content = content.replace("from typing import ", "from typing import Optional, ")
    elif "from typing import" not in content and "Optional[" in content:
        content = "from typing import Optional\n" + content

    with open(file, "w") as f:
        f.write(content)
