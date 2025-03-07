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
UPLOAD_DIR = "Uploads"
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
        Based on the following image analysis (the image is a close-up portrait), create a prompt for an image generation model to generate a full-body outfit photo suitable for the individual's face shape and skin tone. The style should reflect that of an Asian university student, with a simple background. The prompt should include details about:
        1. Hat, clothing, pants, shoes, earrings, gestures, and necklace
        2. Overall outfit style and color scheme
        3. Lighting that enhances the outfit and complements the individual's features
        4. A simple and clean background setting
        
        Ensure the prompt is detailed and specific, optimized for image generation models.
        """
        
        outfit_response = model.generate_content([outfit_prompt, img_pil])
        print("\n=== Generated Image Prompt ===")
        print(outfit_response.text)
        print("===========================\n")

        # 返回分析結果和圖片URL
        return {
            "analysis": response.text,
            "colors": colors
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
            port=8081,
            reload=True
        )
    except Exception as e:
        print(f"啟動失敗: {e}")