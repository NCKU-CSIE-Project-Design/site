from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import google.generativeai as genai
import PIL.Image
import io
import os
from datetime import datetime
import uuid
from dotenv import load_dotenv
import cv2
import dlib
import numpy as np
from sklearn.cluster import KMeans

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
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# 掛載靜態文件目錄
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# 配置Gemini API
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

# 新增 color.py 的函數
def get_dominant_color(img, mask=None):
    if mask is not None:
        img = cv2.bitwise_and(img, img, mask=mask)
    pixels = img.reshape(-1, 3)
    if mask is not None:
        pixels = pixels[pixels.sum(axis=1) > 0]
    if len(pixels) == 0:
        return np.array([0, 0, 0])
    kmeans = KMeans(n_clusters=1, n_init=10)
    kmeans.fit(pixels)
    dominant_color = kmeans.cluster_centers_[0]
    return np.uint8(dominant_color)

def get_hair_color(img, face):
    face_top = face.top()
    face_width = face.right() - face.left()
    hair_height = face_width // 2
    hair_top = max(0, face_top - hair_height)
    hair_region = img[hair_top:face_top, face.left():face.right()]
    hsv_hair = cv2.cvtColor(hair_region, cv2.COLOR_RGB2HSV)
    lower_hair = np.array([0, 0, 0])
    upper_hair = np.array([180, 255, 100])
    mask = cv2.inRange(hsv_hair, lower_hair, upper_hair)
    dominant_color = get_dominant_color(hair_region, mask)
    return rgb_to_hex(dominant_color)

def get_skin_color(img, face):
    face_region = img[face.top():face.bottom(), face.left():face.right()]
    hsv_face = cv2.cvtColor(face_region, cv2.COLOR_RGB2HSV)
    lower_skin = np.array([0, 20, 70])
    upper_skin = np.array([20, 255, 255])
    mask = cv2.inRange(hsv_face, lower_skin, upper_skin)
    dominant_color = get_dominant_color(face_region, mask)
    return rgb_to_hex(dominant_color)

def get_lip_color(img, landmarks):
    # 創建一個與原圖相同大小的遮罩（初始為全黑）
    mask = np.zeros(img.shape[:2], dtype=np.uint8)
    
    # 獲取外嘴唇輪廓點（不考慮內嘴唇）
    outer_lip = []
    for i in range(48, 60):
        outer_lip.append([landmarks.part(i).x, landmarks.part(i).y])
    
    # 轉換為 numpy 陣列
    outer_lip = np.array([outer_lip], dtype=np.int32)
    cv2.fillPoly(mask, outer_lip, 255)

    # 獲取嘴唇的邊界框，用於提取 ROI
    x_coords = outer_lip[0][:, 0]
    y_coords = outer_lip[0][:, 1]
    x1, x2 = min(x_coords), max(x_coords)
    y1, y2 = min(y_coords), max(y_coords)

    # 提取 ROI（嘴唇區域）
    padding = 5  # 可根據需要調整
    roi = img[max(0, y1-padding):min(img.shape[0], y2+padding),
              max(0, x1-padding):min(img.shape[1], x2+padding)]
    mask_roi = mask[max(0, y1-padding):min(img.shape[0], y2+padding),
                    max(0, x1-padding):min(img.shape[1], x2+padding)]

    # 獲取嘴唇的主要顏色
    dominant_color = get_dominant_color(roi, mask_roi)
    
    return rgb_to_hex(dominant_color)

def rgb_to_hex(rgb):
    return '#{:02x}{:02x}{:02x}'.format(int(rgb[0]), int(rgb[1]), int(rgb[2]))

def visualize_facial_regions(img, face, landmarks, save_path='facial_regions.jpg'):
    img_copy = img.copy()
    cv2.rectangle(img_copy, 
                 (face.left(), face.top()),
                 (face.right(), face.bottom()),
                 (0, 255, 0), 2)
    
    face_width = face.right() - face.left()
    hair_height = face_width // 2
    hair_top = max(0, face.top() - hair_height)
    cv2.rectangle(img_copy,
                 (face.left(), hair_top),
                 (face.right(), face.top()),
                 (255, 0, 0), 2)
    
    lips = []
    for i in range(48, 60):
        lips.append((landmarks.part(i).x, landmarks.part(i).y))
        cv2.circle(img_copy, (landmarks.part(i).x, landmarks.part(i).y), 2, (0, 255, 0), -1)
    
    x_coords = [x for x, y in lips]
    y_coords = [y for x, y in lips]
    x1, x2 = min(x_coords), max(x_coords)
    y1, y2 = min(y_coords), max(y_coords)
    padding = 5
    
    cv2.rectangle(img_copy,
                 (x1 - padding, y1 - padding),
                 (x2 + padding, y2 + padding),
                 (255, 255, 0), 2)
    
    font = cv2.FONT_HERSHEY_SIMPLEX
    cv2.putText(img_copy, 'Hair', (face.left(), hair_top - 10), font, 0.5, (255, 0, 0), 2)
    cv2.putText(img_copy, 'Face', (face.left(), face.top() - 10), font, 0.5, (0, 255, 0), 2)
    cv2.putText(img_copy, 'Lips', (x1 - padding, y1 - padding - 10), font, 0.5, (255, 255, 0), 2)
    
    img_bgr = cv2.cvtColor(img_copy, cv2.COLOR_RGB2BGR)
    cv2.imwrite(save_path, img_bgr)

@app.post("/analyze")
async def analyze_image(image: UploadFile = File(...)):
    try:
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
        img_pil = PIL.Image.open(io.BytesIO(contents))
        
        # 使用OpenCV讀取圖片進行顏色分析
        img_cv = cv2.imdecode(np.frombuffer(contents, np.uint8), cv2.IMREAD_COLOR)
        img_cv = cv2.cvtColor(img_cv, cv2.COLOR_BGR2RGB)
        
        # 初始化人臉檢測器和特徵點檢測器
        detector = dlib.get_frontal_face_detector()
        predictor = dlib.shape_predictor('shape_predictor_68_face_landmarks.dat')
        
        # 檢測人臉
        faces = detector(img_cv)
        if len(faces) == 0:
            return {
                "error": "無法偵測到人臉，請上傳一張正面且清晰的人臉照片。"
            }
        
        face = faces[0]
        landmarks = predictor(img_cv, face)
        
        # 分析顏色（加入錯誤檢查）
        try:
            colors = {
                '頭髮': get_hair_color(img_cv, face),
                '膚色': get_skin_color(img_cv, face),
                '嘴唇': get_lip_color(img_cv, landmarks)
            }
        except Exception as e:
            return {
                "error": "無法正確分析臉部特徵，請確保照片中的臉部清晰可見。"
            }
        
        # 生成視覺化圖片
        vis_filename = f"vis_{filename}"
        vis_filepath = os.path.join(UPLOAD_DIR, vis_filename)
        visualize_facial_regions(img_cv, face, landmarks, vis_filepath)

        # 準備個人色彩分析的提示詞
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
        Based on the following personal color analysis, create a prompt for an image generation model to create a fashion outfit photo.
        Analysis: {response.text}
        
        Create a detailed prompt that includes:
        1. Outfit colors that match their seasonal color palette
        2. Style and type of clothing
        3. Lighting and mood that complements their coloring
        4. Background setting
        
        Make the prompt detailed and specific, optimized for image generation models.
        """
        
        outfit_response = model.generate_content(outfit_prompt)
        print("\n=== Generated Image Prompt ===")
        print(outfit_response.text)
        print("===========================\n")

        # 返回分析結果和圖片URL
        return {
            "analysis": response.text,
            "image_url": f"/uploads/{filename}",
            "visualization_url": f"/uploads/{vis_filename}",
            "colors": colors
        }

    except Exception as e:
        return {
            "error": f"處理圖片時發生錯誤，請確保上傳的是有效的圖片檔案。詳細錯誤：{str(e)}"
        }

@app.post("/analyze_colors")
async def analyze_colors(request: dict):
    try:
        colors = request.get("colors")
        if not colors:
            raise HTTPException(status_code=400, detail="未提供顏色資訊")

        # 準備提示詞
        prompt = f"""
        這是一組自定義的個人色彩分析：
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

        # 使用 Gemini API 進行分析
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        
        return {
            "analysis": response.text,
            "colors": colors
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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