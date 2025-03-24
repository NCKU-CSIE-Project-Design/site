import google.generativeai as genai
import os

genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-1.5-flash')

def get_analysis_result(colors, img_pil):
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
    
    analysis_response = model.generate_content([analysis_prompt, img_pil])
    return analysis_response.text


def get_gender(img_pil):
    gender_prompt = "What is the gender of the person in this picture?"
    gender_response = model.generate_content([gender_prompt, img_pil])
    return gender_response.text


def get_outfit_prompt(analysis_result, img_pil):
    outfit_prompt = f"""
    Based on the following image analysis (the image is a close-up portrait), create a prompt for Stable Diffusion to generate a full-body outfit photo. Use only keywords and short phrases, separated by commas. Include:
    1. Main subject: "asian, university student, {analysis_result}"
    2. Outfit details: "casual wear, street fashion, korean style"
    3. Accessories: "hat, earrings, necklace"
    4. Pose and expression: "standing pose, natural smile"
    5. Lighting and background: "natural lighting, soft lighting, simple background, white background"
    6. Quality and style: "high quality, detailed, 8k uhd, masterpiece, best quality"
    7. Gender: {get_gender(img_pil)}

    Format the prompt as a single line of comma-separated keywords, optimized for S｀table Diffusion.
    """
    
    outfit_response = model.generate_content([outfit_prompt, img_pil])
    return outfit_response.text
    