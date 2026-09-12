import asyncio
import os
import google.generativeai as genai

async def test():
    key = "AIzaSyCrHSIyq0mPNiovPqJfAjBT1g_0foPmp_0"
    genai.configure(api_key=key)
    
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        res = model.generate_content("hello")
        print("Success:", res.text)
    except Exception as e:
        print("Error calling generate_content:", e)
        print("Exception type:", type(e))

if __name__ == "__main__":
    asyncio.run(test())
