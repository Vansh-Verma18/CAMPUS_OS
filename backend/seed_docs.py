import asyncio
import httpx
import os

API_URL = "http://localhost:8000/api/v1"

async def upload_document(client, token, file_content, file_name, doc_type, classification, dept=None, year=None):
    headers = {"Authorization": f"Bearer {token}"}
    
    from reportlab.pdfgen import canvas
    
    # Save temp PDF
    pdf_path = "temp.pdf"
    c = canvas.Canvas(pdf_path)
    textobject = c.beginText(40, 800)
    for line in file_content.split('\n'):
        textobject.textLine(line.strip())
    c.drawText(textobject)
    c.save()
        
    data = {
        "document_name": file_name,
        "document_type": doc_type,
        "access_classification": classification
    }
    if dept: data["department"] = dept
    if year: data["year"] = str(year)
    
    with open(pdf_path, "rb") as f:
        files = {"file": (file_name + ".pdf", f, "application/pdf")}
        resp = await client.post(f"{API_URL}/documents/upload", headers=headers, data=data, files=files, timeout=60.0)
        print(f"Uploaded {file_name}: {resp.status_code}")
        if resp.status_code != 201:
            print("Error:", resp.text)

async def seed_documents():
    async with httpx.AsyncClient() as client:
        # 1. Admin login
        resp = await client.post(f"{API_URL}/auth/login", json={"email": "admin@campus.edu", "password": "password123"})
        admin_token = resp.json()["access_token"]
        
        # 2. Faculty login
        resp = await client.post(f"{API_URL}/auth/login", json={"email": "prof.smith@campus.edu", "password": "password123"})
        faculty_token = resp.json()["access_token"]
        
        # 3. Organizer login
        resp = await client.post(f"{API_URL}/auth/login", json={"email": "organizer@campus.edu", "password": "password123"})
        org_token = resp.json()["access_token"]

        # PUBLIC DOC (Uploaded by Admin)
        public_doc = """
        Campus Rules and Regulations 2026:
        1. All students must carry their ID cards at all times.
        2. The library is open from 8:00 AM to 10:00 PM.
        3. Campus parking is strictly for registered vehicles.
        4. The annual tech fest 'TechNova 2026' will be held in November.
        """
        await upload_document(client, admin_token, public_doc, "Campus Rules 2026", "POLICY", "PUBLIC", year=2026)

        # ADMIN ONLY DOC (Uploaded by Admin)
        admin_doc = """
        Confidential Budget Report Q3 2026:
        Total University Budget allocated: $1,200,000.
        Department of Computer Science allocation: $400,000.
        Event sponsorships reserved: $50,000.
        Note: Do not share with students or faculty under any circumstances.
        """
        await upload_document(client, admin_token, admin_doc, "Budget Report Q3", "FINANCIAL", "ADMIN", year=2026)

        # FACULTY ONLY DOC (Uploaded by Faculty)
        faculty_doc = """
        CS101 Faculty Grading Guidelines:
        Final grades must be curved so that the average is a B-.
        Late submissions for assignments will incur a 10% penalty per day.
        Academic integrity violations must be reported directly to the Dean.
        """
        await upload_document(client, faculty_token, faculty_doc, "CS101 Grading Guide", "GUIDELINES", "DEPARTMENT", dept="CS", year=2026)

        # CLUB ORGANIZER DOC (Uploaded by Organizer)
        club_doc = """
        Robotics Club Strategic Plan 2026:
        Goal 1: Win the National Robotics Competition.
        Goal 2: Secure $5,000 in additional funding from sponsors.
        Weekly meetings will be moved to the Engineering Lab 3 on Thursdays at 6 PM.
        """
        await upload_document(client, org_token, club_doc, "Robotics Club Plan", "PLANNING", "CLUB", year=2026)
        
    try:
        os.remove("temp.txt")
    except:
        pass

if __name__ == "__main__":
    asyncio.run(seed_documents())
