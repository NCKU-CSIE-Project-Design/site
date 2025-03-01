from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import google.generativeai as genai
import PIL.Image
import io
import os
from datetime import datetime
import uuid
from dotenv import load_dotenv

# 載入環境變數
load_dotenv()

app = FastAPI()

# 設置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React 開發服務器的地址
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 創建圖片儲存目錄
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# 掛載靜態文件目錄
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# 配置Gemini API
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

@app.post("/analyze")
async def analyze_image(image: UploadFile = File(...)):
    # 生成唯一的文件名
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    file_extension = os.path.splitext(image.filename)[1]
    filename = f"{timestamp}_{unique_id}{file_extension}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    # 讀取上傳的圖片
    contents = await image.read()
    
    # 保存圖片到本地
    with open(filepath, "wb") as f:
        f.write(contents)
    
    # 使用PIL打開圖片進行分析
    img = PIL.Image.open(io.BytesIO(contents))

    # 準備提示詞
    prompt = """
    請以專業的韓式個人色彩顧問的角度，分析這張照片中的人物：
    1. 判斷其適合的個人色彩季節
    2. 推薦適合的彩妝色調
    3. 建議適合的服裝顏色搭配
    4. 提供髮色建議
    請用中文回答，並提供詳細的解釋。
    """

    # 使用Gemini API進行分析
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content([prompt, img])
    
    # 返回分析結果和圖片URL
    return {
        "analysis": response.text,
        "image_url": f"/uploads/{filename}"  # 圖片的訪問URL
    }

# 可選：添加一個端點來獲取所有已上傳的圖片
@app.get("/images")
async def get_images():
    images = []
    for filename in os.listdir(UPLOAD_DIR):
        if filename.endswith(('.png', '.jpg', '.jpeg', '.gif')):
            images.append({
                "filename": filename,
                "url": f"/uploads/{filename}"
            })
    return images 