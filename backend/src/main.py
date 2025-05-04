from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
import PIL.Image
import io
import os
from datetime import datetime
from dotenv import load_dotenv
from color import get_color
from typing import Optional
import json

import base64
from gemini import *
from stable_diffusion import generate_image_from_sd, change_face_from_sd
from flux import generate_image_from_flux

load_dotenv()
LoRA = ["nolora", "japan4"]

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "ImgBackup/Uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

def save_image(contents):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{timestamp}.jpg"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(contents)

    return filepath
    
@app.post("/analyze")
async def analyze_image(
    image: UploadFile = File(...),
    colors: Optional[str] = Form(None),
    user_prompt:str = Form("")
):
    try:
        contents = await image.read()
        filepath = save_image(contents)
        
        face = base64.b64encode(contents).decode()
        img_pil = PIL.Image.open(io.BytesIO(contents))
        
        if colors:
            colors = json.loads(colors)
        else:
            colors = get_color(filepath)
            if colors.get("error"):
                return { "error": colors.get("error") }

        analysis_result = get_analysis_result(colors, img_pil)
        outfit_prompt = get_outfit_prompt(analysis_result, img_pil, user_prompt)
        # outfit_image = await generate_image_from_sd(outfit_prompt, LoRA)
        outfit_image = await generate_image_from_flux(outfit_prompt, LoRA)
        outfit_image_changed_face = await change_face_from_sd(outfit_image, face)
        
        return {
            "analysis": analysis_result,
            "colors": colors,
            "image": outfit_image_changed_face
        }

    except Exception as e:
        return {
            "error": f"Error：{str(e)}"
        }

if __name__ == "__main__":
    import uvicorn
    try:
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=3001,
            reload=True
        )
    except Exception as e:
        print(f"啟動失敗: {e}")

