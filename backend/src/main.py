from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import google.generativeai as genai
import PIL.Image
import io
import os
from datetime import datetime
from dotenv import load_dotenv
from color import get_color
from typing import Optional, List
import json
import base64
from gemini import get_analysis_result, get_outfit_prompt
from stable_diffusion import generate_image_from_sd, change_face_from_sd
from flux import generate_image_from_flux
from leffa import predict_virtual_tryon

load_dotenv()
LoRA = ["nolora", "cargopants3", "preppy-000003"]

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
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    filename = f"{timestamp}.jpg"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(contents)

    return filepath
    
@app.post("/analyze/text")
async def analyze_text(
    face_image: UploadFile = File(...),
    colors: Optional[str] = Form(None)
):
    try:
        face_image_contents = await face_image.read()
        face_path = save_image(face_image_contents)
        face = PIL.Image.open(io.BytesIO(face_image_contents))

        if colors:
            colors = json.loads(colors)
        else:
            colors = get_color(face_path)
            if colors.get("error"):
                raise HTTPException(status_code=500, detail=colors.get("error"))

        async def generate_stream():
            yield f"data: {json.dumps({'colors': colors})}\n\n"
            
            async for chunk in get_analysis_result(colors, face):
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
            

        return StreamingResponse(
            generate_stream(),
            media_type="text/event-stream"
        )

    except Exception as e:
        error = f"Error: {str(e)}"
        print(error)
        raise HTTPException(status_code=500, detail=error)

@app.post("/analyze/image")
async def analyze_image(
    face_image: UploadFile = File(...),
    user_prompt: Optional[str] = Form(None)
):
    try:
        face_image_contents = await face_image.read()
        face = PIL.Image.open(io.BytesIO(face_image_contents))
        face_base64 = base64.b64encode(face_image_contents).decode()

        if user_prompt:
            user_prompt_list = json.loads(user_prompt)
        else:
            user_prompt_list = None

        outfit_prompt = get_outfit_prompt(face, user_prompt_list)
        
        print(outfit_prompt)

        outfit_image =  await generate_image_from_flux(outfit_prompt)
        outfit_image += await generate_image_from_sd(outfit_prompt, LoRA)
        
        outfit_image_changed_face = await change_face_from_sd(outfit_image, face_base64)
        
        return {
            "images": outfit_image_changed_face
        }

    except Exception as e:
        error = f"Error: {str(e)}"
        print(error)
        raise HTTPException(status_code=500, detail=error)

@app.post("/virtual-tryon")
async def virtual_tryon(
    body_image: UploadFile = File(...),
    garment_image: UploadFile = File(...),
    garment_type: str = Form(...)
):
    try:
        body_image_contents = await body_image.read()
        body_path = save_image(body_image_contents)

        garment_image_contents = await garment_image.read()
        garment_path = save_image(garment_image_contents)
        
        result = predict_virtual_tryon(body_path, garment_path, garment_type)
        
        return {"result": result}

    except Exception as e:
        error = f"Error: {str(e)}"
        print(error)
        raise HTTPException(status_code=500, detail=error)
    
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
        print(f"Startup failed: {e}")

