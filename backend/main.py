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
import requests
import base64

# 載入環境變數
load_dotenv()

app = FastAPI()

# 設置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # React 開發服務器的地址
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 創建圖片儲存目錄
UPLOAD_DIR = "ImgBackup/Uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# 配置Gemini API
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

def save_image(contents):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{timestamp}.jpg"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(contents)

    print(f"圖片已保存到: {filepath}")
    return filepath

@app.post("/analyze")
async def analyze_image(
    image: UploadFile = File(...),
    colors: Optional[str] = Form(None)
):
    try:
        contents = await image.read()
        filepath = save_image(contents)
        
        # Convert uploaded image to base64
        face = base64.b64encode(contents).decode()

        img_pil = PIL.Image.open(io.BytesIO(contents))
        
        if colors:
            colors = json.loads(colors)
        else:
            colors = get_color(filepath)
            if colors.get("error"):
                return {
                    "error": colors.get("error")
                }

        analysis_prompt = f"""
        這是一張人物照片的個人色彩分析：
        - 頭髮顏色: {colors['頭髮']}
        - 膚色: {colors['膚色']}
        - 嘴唇顏色: {colors['嘴唇']}

        請以專業的韓式個人色彩顧問的角度，根據以上顏色資訊分析：
        1. 判斷其適合的個人色彩季節
        2. 推薦適合的彩妝色調
        3. 建議適合的服裝顏色搭配
        4. 提供髮色建議
        
        請用中文回答，並提供詳細的解釋。
        """
        
        # 使用Gemini API進行分析
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content([analysis_prompt, img_pil])
        
        # 根據分析結果生成穿搭照片的提示詞
        outfit_prompt = f"""
        Based on the following image analysis (the image is a close-up portrait), create a prompt for Stable Diffusion to generate a full-body outfit photo. Use only keywords and short phrases, separated by commas. Include:
        1. Main subject: "1girl, asian, university student, {response.text}"
        2. Outfit details: "casual wear, street fashion, korean style"
        3. Accessories: "hat, earrings, necklace"
        4. Pose and expression: "standing pose, natural smile"
        5. Lighting and background: "natural lighting, soft lighting, simple background, white background"
        6. Quality and style: "high quality, detailed, 8k uhd, masterpiece, best quality"
        
        Format the prompt as a single line of comma-separated keywords, optimized for Stable Diffusion.
        """
        
        outfit_response = model.generate_content([outfit_prompt, img_pil])
        print("\n=== Generated Image Prompt ===")
        print(outfit_response.text)
        print("===========================\n")

        outfit_image = await generate_image(outfit_response.text)
        outfit_image_change_face = await change_face(outfit_image, face)
        # 返回分析結果和圖片URL
        return {
            "analysis": response.text,
            "colors": colors,
            "image": outfit_image_change_face
        }

    except Exception as e:
        return {
            "error": f"處理圖片時發生錯誤，請確保上傳的是有效的圖片檔案。詳細錯誤：{str(e)}"
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




async def generate_image(prompt):
    try:
        WEBUI_URL = "http://140.116.154.71:7860/sdapi/v1/txt2img" 
        payload = {
            "prompt": prompt,
            "negative_prompt": "(normal quality), (low quality), (worst quality), bad-hands-5,  Deep_Negative",
            "seed": -1,
            "sampler_name": "DPM++ SDE",
            "scheduler": "Karras",
            "batch_size": 1,
            "n_iter": 1,
            "steps": 20,
            "cfg_scale": 7,
            "width": 512,
            "height": 768,
            "send_images": "true",
            "save_images": "false",
            "clip_skip": 2,
            "override_settings": {
                "sd_model_checkpoint": "ChilloutRealistic"
            }
        }
        response = requests.post(WEBUI_URL, json=payload, headers={'Content-Type': 'application/json'})
        if response.status_code != 200:
            return {"error": f"WebUI 請求失敗，狀態碼: {response.status_code}", "details": response.text}
        data = response.json()
        img_data = data["images"][0]
        decoded_img_data = base64.b64decode(img_data)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = f"ImgBackup/GenImg/output_{timestamp}.png"
        with open(output_path, "wb") as f:
            f.write(decoded_img_data)
        print("img saved", output_path)
        return img_data
    except Exception as e:
        return {"error": f"請求或解碼時發生錯誤: {str(e)}"}


async def change_face(image, face):
    try:
        WEBUI_URL = "http://140.116.154.71:7860/roop/image" 
        payload = {
            "source_image": face,
            "target_image": image,
            "face_index": [
                0
            ],
            "scale": 1,
            "upscale_visibility": 1,
            "face_restorer": "None",
            "restorer_visibility": 1,
            "model": "inswapper_128.onnx"
        }
        response = requests.post(WEBUI_URL, json=payload, headers={'Content-Type': 'application/json'})
        if response.status_code != 200:
            return {"error": f"WebUI 請求失敗，狀態碼: {response.status_code}", "details": response.text}
        data = response.json()
        
        img_data = data["image"]
        decoded_img_data = base64.b64decode(img_data)
        
        # Add timestamp to filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = f"ImgBackup/GenImg/output_changed_face_{timestamp}.png"
        with open(output_path, "wb") as f:
            f.write(decoded_img_data)
        print("img saved", output_path)
        return img_data
    except Exception as e:
        return {"error": f"請求或解碼時發生錯誤: {str(e)}"}