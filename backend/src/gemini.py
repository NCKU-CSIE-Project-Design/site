import google.generativeai as genai
import os

genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-1.5-flash')

def get_analysis_result(colors, face):
    analysis_prompt = f"""
    This is a personal color analysis of a person's photo:
    - Hair color: {colors['頭髮']}
    - Skin tone: {colors['膚色']}
    - Lip color: {colors['嘴唇']}

    Please analyze the above color information from the perspective of a professional Korean personal color consultant:
    1. Determine the suitable personal color season
    2. Recommend suitable makeup shades
    3. Suggest suitable clothing color combinations
    4. Provide hair color suggestions

    Please respond in Traditional Chinese, avoid using Korean, and provide detailed explanations. Use Markdown.
    """
    
    analysis_response = model.generate_content([analysis_prompt, face]).text
    return analysis_response


def get_gender(face):
    gender_prompt = "What is the gender of the person in this picture? output ""Boy"" or ""Girl"""
    gender_response = model.generate_content([gender_prompt, face]).text
    return gender_response

def get_hair(face):
    hair_prompt = "What is the hair style and hair color of the person in this picture?"
    hair_response = model.generate_content([hair_prompt, face]).text
    return hair_response

def get_glasses(face):
    glasses_prompt = "What is the details of the glasses (shape, color, thickness) of the person in this picture?"
    glasses_response = model.generate_content([glasses_prompt, face]).text
    return glasses_response

def get_outfit_prompt(analysis_result, face, user_prompt):
    outfit_prompt = f"""
    Analyze the image to determine the suitable outfit for this person and convert this outfit into a prompt for stable diffusion. Use keywords and phrases, separated by commas. Include:

    1. Subject: "Asian, university student"
    2. {get_hair(face)}
    3. {get_glasses(face)}
    4. Outfit details: "casual wear, street fashion, Korean style, shoes"
    5. Lighting and background: "natural lighting, soft lighting, simple background, white background"
    6. Quality and style: "high quality, detailed, 8k UHD, masterpiece, best quality"

    Format the prompt as a single line of comma-separated keywords, optimized for Stable Diffusion.
    Finally, output only the prompt for stable diffusion in English. You don't need to output '\n'
    """

    outfit_response = f"(full body: 1.5), (1 {get_gender(face)}: 1.5), "
    outfit_response += model.generate_content([outfit_prompt, face]).text
    
    # add user prompt
    if user_prompt != "":
        user_prompt = translate_to_english(user_prompt)
        outfit_response += f", ({user_prompt}: 1.1)"

    return outfit_response


def translate_to_english(text):
    detect_prompt = f"Detect the language of the following text and return only the language name: {text}"
    detected_language = model.generate_content(detect_prompt).text.strip()
    if "Chinese" in detected_language:
        translate_prompt = f"Translate the following Traditional Chinese text into English: {text}"
        translation = model.generate_content(translate_prompt).text.strip()
        return translation

    # 若語言不是中文，直接回傳原文字
    return text
