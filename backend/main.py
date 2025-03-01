from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
import PIL.Image
import io

app = FastAPI()

# 設置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React 開發服務器的地址
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 配置Gemini API
genai.configure(api_key='AIzaSyC9Cja5yfOGMdk-yOpIjP5EE8O2AkTFPZ8')

@app.post("/analyze")
async def analyze_image(image: UploadFile = File(...)):
    # 讀取上傳的圖片
    contents = await image.read()
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
    
    return {"analysis": response.text} 